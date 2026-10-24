import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { connectDB } from "@/lib/mongodb";
import Executive from "@/models/Executive";
import { sendExecutiveToCRM } from "@/lib/sendExecutiveToCRM";

export const runtime = "nodejs";

// Executive files live in their OWN directory, separate from FormB's
// UPLOAD_DIR and from Distress's UPLOAD_DIR_DISTRESS.
const UPLOAD_DIR = process.env.UPLOAD_DIR_EXECUTIVE || "./uploads-executive";

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

  // The "/executive" segment routes to the file handler that reads
  // UPLOAD_DIR_EXECUTIVE. Relative path, no domain, no ?key= — same
  // shape as FormB otherwise.
  const url = `/api/files/executive/${encodeURIComponent(token)}/${encodeURIComponent(category)}/${encodeURIComponent(filename)}`;

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
    await connectDB();

    const formData = await request.formData();
    const rawData = formData.get("data");

    if (!rawData) {
      return NextResponse.json({ error: "Missing form data" }, { status: 400 });
    }

    const data = JSON.parse(rawData);
    const { token } = data;

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    // Reject duplicates BEFORE uploading any files (saves work)
    const existing = await Executive.findOne({ token });
    if (existing) {
      return NextResponse.json(
        { error: "A submission with this token already exists." },
        { status: 409 }
      );
    }

    // Save files to disk
    const [
      pitch_deck,
      financial_projection,
      business_plan,
      supporting_material,
      additional_documents,
    ] = await Promise.all([
      saveCategory(formData, "pitch_deck", token),
      saveCategory(formData, "financial_projection", token),
      saveCategory(formData, "business_plan", token),
      saveCategory(formData, "supporting_material", token),
      saveCategory(formData, "additional_documents", token),
    ]);

    // Both of these are required on the form
    if (pitch_deck.length === 0 || financial_projection.length === 0) {
      return NextResponse.json(
        { error: "Pitch deck and financial projection are both required." },
        { status: 400 }
      );
    }

    // Save document to MongoDB
    const application = await Executive.create({
      token,
      about: data.about,
      experience: data.experience,
      idea: data.idea,
      readiness: data.readiness,
      deep_dive: data.deep_dive,
      marketing: data.marketing,
      funding: data.funding,
      support: data.support,
      documents: {
        pitch_deck,
        financial_projection,
        business_plan,
        supporting_material,
        additional_documents,
      },
      submitted_at: data.submitted_at || new Date(),
    });

    // ─── Fire-and-forget CRM forwarding ───
    sendExecutiveToCRM(application._id).catch((err) => {
      console.error("[CRM] Unexpected error in Executive forwarding:", err);
    });

    return NextResponse.json(
      { success: true, id: application._id, token: application.token },
      { status: 201 }
    );
  } catch (err) {
    console.error("Executive submission error:", err);
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