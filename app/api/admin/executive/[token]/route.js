import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Executive from "@/models/Executive";

export const runtime = "nodejs";

// GET — fetch one Executive submission by token
export async function GET(request, { params }) {
  try {
    await connectDB();
    const { token } = await params;

    const data = await Executive.findOne({ token }).lean();
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("Admin Executive detail error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}