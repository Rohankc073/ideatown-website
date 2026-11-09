import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { connectDB } from "@/lib/mongodb";
import Distress from "@/models/Distress";
import { sendDistressFormToCRM } from "@/lib/Senddistressformtocrm";

export const runtime = "nodejs";

// Distress files live in their OWN directory, separate from FormB's UPLOAD_DIR.
const UPLOAD_DIR = process.env.UPLOAD_DIR_DISTRESS || "./uploads-distress";

// Same limits the form enforces in the browser — checked again here so a
// request sent straight to the API can't bypass them.
const MAX_FILE_SIZE = 25 * 1024 * 1024;    // 25MB per file
const MAX_TOTAL_SIZE = 95 * 1024 * 1024;   // 95MB per submission (keeps the request under a 100MB proxy cap)
const MAX_ADDITIONAL_FILES = 10;
const FILE_FIELDS = [
  "financial_statements",
  "asset_list",
  "debt_schedule",
  "company_profile",
  "legal_documents",
  "additional_documents",
];

// Tokens are UUIDs (or a letters/digits/hyphens fallback). Anything else —
// "..", slashes — could point the upload folder outside UPLOAD_DIR.
const TOKEN_RE = /^[A-Za-z0-9-]{8,64}$/;

function validateFiles(formData) {
  let total = 0;
  const oversized = [];
  for (const field of FILE_FIELDS) {
    for (const file of formData.getAll(field)) {
      if (file && typeof file === "object" && typeof file.size === "number") {
        if (file.size > MAX_FILE_SIZE) oversized.push(file.name);
        total += file.size;
      }
    }
  }
  if (oversized.length) {
    return `File(s) exceed the ${MAX_FILE_SIZE / 1024 / 1024}MB limit: ${oversized.join(", ")}`;
  }
  if (total > MAX_TOTAL_SIZE) {
    return `Total upload size exceeds the ${MAX_TOTAL_SIZE / 1024 / 1024}MB limit for this submission.`;
  }
  if (formData.getAll("additional_documents").length > MAX_ADDITIONAL_FILES) {
    return `You can attach up to ${MAX_ADDITIONAL_FILES} additional documents.`;
  }
  return null;
}

// Save one file to disk + return its metadata with URL
async function saveFile(file, token, category) {
  const folder = path.join(UPLOAD_DIR, token, category);
  await mkdir(folder, { recursive: true });

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${Date.now()}_${safeName}`;
  const fullPath = path.join(folder, filename);
  const relativePath = path.join(token, category, filename);

  const bytes = await file.arrayBuffer();
  await writeFile(fullPath, Buffer.from(bytes));

  // Note the "/distress" segment — it routes to the file handler that reads
  // UPLOAD_DIR_DISTRESS, keeping these separate from FormB's files (which
  // live under UPLOAD_DIR and are served from /api/files/<token>/...).
  // Otherwise the same shape as FormB: relative path, no domain, no ?key=.
  const url = `/api/files/distress/${encodeURIComponent(token)}/${encodeURIComponent(category)}/${encodeURIComponent(filename)}`;

  return {
    url,
    relativePath,
    originalName: file.name,
    size: file.size,
    mimeType: file.type,
  };
}

// Save all files of one category
async function saveCategory(formData, fieldName, token) {
  const files = formData.getAll(fieldName);
  const saved = [];
  for (const file of files) {
    if (file && typeof file === "object" && file.size > 0) {
      saved.push(await saveFile(file, token, fieldName));
    }
  }
  return saved;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const rawData = formData.get("data");

    if (!rawData) {
      return NextResponse.json({ error: "Missing form data" }, { status: 400 });
    }

    const data = JSON.parse(rawData);
    const { token } = data;

    if (typeof token !== "string" || !TOKEN_RE.test(token)) {
      return NextResponse.json({ error: "Invalid or missing token" }, { status: 400 });
    }

    // Enforce size limits before anything touches disk
    const fileError = validateFiles(formData);
    if (fileError) {
      return NextResponse.json({ error: fileError }, { status: 413 });
    }

    await connectDB();

    // Reject duplicates BEFORE uploading any files (saves work)
    const existing = await Distress.findOne({ token });
    if (existing) {
      return NextResponse.json(
        { error: "A submission with this token already exists." },
        { status: 409 }
      );
    }

    // Save files to disk
    const [
      financial_statements,
      asset_list,
      debt_schedule,
      company_profile,
      legal_documents,
      additional_documents,
    ] = await Promise.all([
      saveCategory(formData, "financial_statements", token),
      saveCategory(formData, "asset_list", token),
      saveCategory(formData, "debt_schedule", token),
      saveCategory(formData, "company_profile", token),
      saveCategory(formData, "legal_documents", token),
      saveCategory(formData, "additional_documents", token),
    ]);

    // Save document to MongoDB
    const application = await Distress.create({
      token,
      contact: data.contact,
      company: data.company,
      overview: data.overview,
      distress: data.distress,
      financials: data.financials,
      assets: data.assets,
      deal: data.deal,
      documents: {
        financial_statements,
        asset_list,
        debt_schedule,
        company_profile,
        legal_documents,
        additional_documents,
      },
      submitted_at: data.submitted_at || new Date(),
    });

    // ─── Fire-and-forget CRM forwarding ───
    sendDistressFormToCRM(application._id).catch((err) => {
      console.error("[CRM] Unexpected error in Distress forwarding:", err);
    });

    return NextResponse.json(
      { success: true, id: application._id, token: application.token },
      { status: 201 }
    );
  } catch (err) {
    console.error("Distress submission error:", err);
    if (err.code === 11000) {
      return NextResponse.json(
        { error: "A submission with this token already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Server error. Please try again." },
      { status: 500 }
    );
  }
}