import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { connectDB } from "@/lib/mongodb";
import FormB from "@/models/FormB";
import { sendFormBToCRM } from "@/lib/sendFormBToCRM";

export const runtime = "nodejs";

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "./uploads");

const MAX_FILE_SIZE = 25 * 1024 * 1024;    // 25MB per file
const MAX_TOTAL_SIZE = 100 * 1024 * 1024;  // 100MB per submission, across every upload field
const MAX_SUPPORT_FILES = 10;              // "Additional Documents" on the form

// File types each upload field accepts. Mirrors the `accept` lists on the
// form (app/application/[token]/page.js), which only filter the picker.
const ALLOWED_TYPES = {
  pitch_deck: ["pdf", "ppt", "pptx", "doc", "docx"],
  projections: ["pdf", "xls", "xlsx", "doc", "docx"],
  business_plan: ["pdf", "doc", "docx"],
  support: ["pdf", "ppt", "pptx", "doc", "docx", "xls", "xlsx"],
};
const FIELD_LABELS = {
  pitch_deck: "Pitch Deck",
  projections: "Financial Projections",
  business_plan: "Business Plan",
  support: "Additional Documents",
};

// Matches crypto.randomUUID() output, or the "app-<timestamp>-<random>"
// fallback from makeToken(). Anything else is rejected outright.
const TOKEN_RE = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|app-\d+-[a-z0-9]+)$/i;

function isValidToken(token) {
  return typeof token === "string" && TOKEN_RE.test(token);
}

function validateFileSizes(formData, fieldNames) {
  let total = 0;
  const oversized = [];

  for (const field of fieldNames) {
    for (const file of formData.getAll(field)) {
      if (file && typeof file === "object" && typeof file.size === "number") {
        if (file.size > MAX_FILE_SIZE) oversized.push(file.name);
        total += file.size;
      }
    }
  }

  if (oversized.length) {
    return {
      ok: false,
      status: 413,
      error: `File(s) exceed the ${MAX_FILE_SIZE / 1024 / 1024}MB limit: ${oversized.join(", ")}`,
    };
  }
  if (total > MAX_TOTAL_SIZE) {
    return {
      ok: false,
      status: 413,
      error: `Total upload size exceeds the ${MAX_TOTAL_SIZE / 1024 / 1024}MB limit for this submission.`,
    };
  }
  return { ok: true };
}

function validateFileTypes(formData) {
  const rejected = [];
  for (const [field, exts] of Object.entries(ALLOWED_TYPES)) {
    for (const file of formData.getAll(field)) {
      if (file && typeof file === "object" && file.size > 0) {
        const ext = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "";
        if (!exts.includes(ext)) {
          rejected.push(`${file.name} (${FIELD_LABELS[field]} accepts ${exts.join(", ").toUpperCase()})`);
        }
      }
    }
  }
  if (rejected.length) {
    return {
      ok: false,
      status: 415,
      error: `File type not accepted: ${rejected.join("; ")}.`,
    };
  }
  return { ok: true };
}

async function saveFile(file, token, category) {
  const folder = path.join(UPLOAD_DIR, token, category);

  // Defense in depth: even with a validated token, confirm the resolved
  // path can't have escaped UPLOAD_DIR before we create/write anything.
  const resolvedFolder = path.resolve(folder);
  if (
    resolvedFolder !== UPLOAD_DIR &&
    !resolvedFolder.startsWith(UPLOAD_DIR + path.sep)
  ) {
    throw new Error("Resolved upload path escapes the upload directory");
  }

  await mkdir(resolvedFolder, { recursive: true });

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${Date.now()}_${safeName}`;
  const fullPath = path.join(resolvedFolder, filename);
  const relativePath = path.join(token, category, filename);

  const bytes = await file.arrayBuffer();
  await writeFile(fullPath, Buffer.from(bytes));

  const fileDomain = process.env.NEXT_PUBLIC_SITE_URL || "";
  const fileUrl = `/api/files/${encodeURIComponent(token)}/${encodeURIComponent(category)}/${encodeURIComponent(filename)}`;

  return {
    fileDomain,
    url: fileUrl,
    relativePath,
    originalName: file.name,
    size: file.size,
    mimeType: file.type,
  };
}

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
    await connectDB();

    const formData = await request.formData();
    const rawData = formData.get("data");
    if (!rawData) {
      return NextResponse.json({ error: "Missing form data" }, { status: 400 });
    }

    const data = JSON.parse(rawData);
    const { token } = data;

    if (!isValidToken(token)) {
      return NextResponse.json({ error: "Invalid or missing token" }, { status: 400 });
    }

    // Reject duplicates
    const existing = await FormB.findOne({ token });
    if (existing) {
      return NextResponse.json(
        { error: "An application with this token already exists." },
        { status: 409 }
      );
    }

    // Enforce size limits before anything touches disk
    const fileCheck = validateFileSizes(formData, [
      "pitch_deck",
      "business_plan",
      "support",
      "projections",
    ]);
    if (!fileCheck.ok) {
      return NextResponse.json({ error: fileCheck.error }, { status: fileCheck.status });
    }
    const typeCheck = validateFileTypes(formData);
    if (!typeCheck.ok) {
      return NextResponse.json({ error: typeCheck.error }, { status: typeCheck.status });
    }
    if (formData.getAll("support").length > MAX_SUPPORT_FILES) {
      return NextResponse.json(
        { error: `Please attach no more than ${MAX_SUPPORT_FILES} additional documents.` },
        { status: 400 }
      );
    }

    // Save files to disk
    const [pitch_deck, business_plan, support, projections] = await Promise.all([
      saveCategory(formData, "pitch_deck", token),
      saveCategory(formData, "business_plan", token),
      saveCategory(formData, "support", token),
      saveCategory(formData, "projections", token),
    ]);

    // Save document to MongoDB
    const application = await FormB.create({
      token,
      contact: data.contact,
      founders: data.founders,
      company: data.company,
      business: data.business,
      traction: data.traction,
      unit_economics: data.unit_economics, // ← added: own top-level section
      investment: data.investment,
      funding: data.funding,
      documents: {
        pitch_deck,
        business_plan,
        support,
        projections,
        description: data.documents?.description || "",
      },
      submitted_at: data.submitted_at || new Date(),
    });

    sendFormBToCRM(application._id).catch((err) => {
      console.error("[CRM] Unexpected error in forwarding:", err);
    });

    return NextResponse.json(
      { success: true, id: application._id, token: application.token },
      { status: 201 }
    );
  } catch (err) {
    console.error("Submission error:", err);
    if (err.code === 11000) {
      return NextResponse.json(
        { error: "An application with this token already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Server error. Please try again." },
      { status: 500 }
    );
  }
}