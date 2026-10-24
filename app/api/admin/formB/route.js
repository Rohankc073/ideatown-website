import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import FormB from "@/models/FormB";

export const runtime = "nodejs";

// GET — list all submissions (newest first)
export async function GET() {
  try {
    await connectDB();
    const data = await FormB.find({})
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ data });
  } catch (err) {
    console.error("Admin list error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE — remove a submission (with files on disk)
export async function DELETE(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    // Delete the disk folder for this token
    const path = (await import("path")).default;
    const { rm } = await import("fs/promises");
    const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
    const folder = path.join(UPLOAD_DIR, token);

    try {
      await rm(folder, { recursive: true, force: true });
    } catch (e) {
      console.warn("Could not delete folder:", e.message);
    }

    const deleted = await FormB.findOneAndDelete({ token });
    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}