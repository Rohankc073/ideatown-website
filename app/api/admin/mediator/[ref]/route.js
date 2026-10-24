import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Mediator from "@/models/Mediator";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { ref } = await params;
    const data = await Mediator.findOne({ ref }).lean();
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data });
  } catch (err) {
    console.error("Admin intermediary detail error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const { ref } = await params;
    const { meetingDone } = await request.json();

    const updated = await Mediator.findOneAndUpdate(
      { ref },
      { meetingDone: !!meetingDone, meetingDoneAt: meetingDone ? new Date() : null },
      { returnDocument: "after" }
    ).lean();

    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("Meeting done update error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}