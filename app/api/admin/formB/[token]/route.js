import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import FormB from "@/models/FormB";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { token } = await params;
    const data = await FormB.findOne({ token }).lean();
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ data });
  } catch (err) {
    console.error("Admin detail error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}