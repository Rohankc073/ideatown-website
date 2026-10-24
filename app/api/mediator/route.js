import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { connectDB } from "@/lib/mongodb";
import Intermediary from "@/models/Mediator";
import Counter from "@/models/Counter";
import { sendMediatorToCRM } from "@/lib/sendMediatorToCRM";

export const runtime = "nodejs";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads/intermediary";
const OTHER = "Other Authorized Intermediary";

async function saveFile(file, token, category) {
  const folder = path.join(UPLOAD_DIR, token, category);
  await mkdir(folder, { recursive: true });

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${Date.now()}_${safeName}`;
  const fullPath = path.join(folder, filename);
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

// Atomically increment the "intermediary" counter and format as IBA-001, IBA-002, ...
async function nextRef() {
  const c = await Counter.findOneAndUpdate(
    { _id: "intermediary" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return "IBA-" + String(c.seq).padStart(3, "0");
}

export async function POST(request) {
  try {
    await connectDB();

    const formData = await request.formData();
    const get = (k) => {
      const v = formData.get(k);
      return typeof v === "string" ? v.trim() : v;
    };

    const data = {
      name: get("name"),
      org: get("org"),
      designation: get("designation"),
      country_code: get("country_code"),
      dial: get("dial"),
      mobile: get("mobile"),
      phone: get("phone"),
      email: get("email"),
      country: get("country"),
      city: get("city"),
      category: get("category"),
      categoryOther: get("categoryOther"),
      experience: get("experience"),
      expertise: get("expertise"),
      industries: get("industries"),
    };
    const agreedToTerms = get("agreedToTerms") === "true";

    // ─── Server-side validation (mirrors the form) ───
    const required = [
      "name", "designation", "mobile", "email",
      "country", "city", "category", "experience", "expertise",
    ];
    for (const f of required) {
      if (!data[f]) {
        return NextResponse.json({ message: `Missing required field: ${f}` }, { status: 400 });
      }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return NextResponse.json({ message: "Invalid email address." }, { status: 400 });
    }
    const digits = (data.mobile || "").replace(/\D/g, "");
    if (digits.length < 6 || digits.length > 14) {
      return NextResponse.json({ message: "Invalid phone number." }, { status: 400 });
    }
    if (data.category === OTHER && !data.categoryOther) {
      return NextResponse.json({ message: "Please specify your category." }, { status: 400 });
    }
    if (!agreedToTerms) {
      return NextResponse.json({ message: "You must agree to the terms and conditions." }, { status: 400 });
    }

    const signedFile = formData.get("signedAgreement");
    if (!signedFile || typeof signedFile !== "object" || signedFile.size === 0) {
      return NextResponse.json({ message: "The signed agreement is required." }, { status: 400 });
    }

    // ─── Sequential ref, save file, store document ───
    let doc = null;
    for (let attempt = 0; attempt < 5 && !doc; attempt++) {
      const ref = await nextRef();
      try {
        const signedAgreement = await saveFile(signedFile, ref, "signed_agreement");
        doc = await Intermediary.create({ ...data, agreedToTerms, signedAgreement, ref });
      } catch (e) {
        if (e.code === 11000) continue; // ref already used — take the next number
        throw e;
      }
    }
    if (!doc) {
      return NextResponse.json({ message: "Could not generate a reference. Please try again." }, { status: 500 });
    }

    // ─── Forward to CRM in the background (fire-and-forget) ───
    sendMediatorToCRM(doc._id).catch((err) =>
      console.error("[CRM] Background mediator send failed:", err)
    );

    return NextResponse.json(
      { success: true, id: doc._id, ref: doc.ref },
      { status: 201 }
    );
  } catch (err) {
    console.error("Intermediary submission error:", err);
    return NextResponse.json({ message: "Server error. Please try again." }, { status: 500 });
  }
}