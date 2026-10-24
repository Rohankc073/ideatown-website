import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Distress from "@/models/Distress";

export const runtime = "nodejs";

// GET — fetch one Distress submission by token
export async function GET(request, { params }) {
  try {
    await connectDB();
    const { token } = await params;

    const data = await Distress.findOne({ token }).lean();
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("Admin Distress detail error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}