import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import FormB from "@/models/FormB";
import { sendFormBToCRM } from "@/lib/sendFormBToCRM";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    await connectDB();
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const doc = await FormB.findOne({ token });
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Re-send the EXISTING document (same _id) — no new record, no duplicate.
    // Await it here so the admin sees the real result, instead of fire-and-forget.
    await sendFormBToCRM(doc._id);

    // Read back the updated status the helper just wrote
    const updated = await FormB.findById(doc._id).lean();
    return NextResponse.json({
      success: updated.externalApiStatus === "success",
      status: updated.externalApiStatus,
      message: updated.externalApiErrorMessage || null,
      response: updated.externalApiResponse || null,
    });
  } catch (err) {
    console.error("Retry CRM error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}