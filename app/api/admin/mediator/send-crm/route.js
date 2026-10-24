// app/api/admin/mediator/send-crm/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Intermediary from "@/models/Mediator";
import { sendMediatorToCRM } from "@/lib/sendMediatorToCRM";

export const runtime = "nodejs";

// POST { ref } — (re)send an existing mediator submission to the CRM.
// Awaits the result (unlike the fire-and-forget on first submit) so the
// admin sees the real outcome. Reuses the same _id, so the CRM won't
// create a duplicate — it inserts if missing, or reports already-exists.
export async function POST(request) {
  try {
    await connectDB();

    const { ref } = await request.json();
    if (!ref) {
      return NextResponse.json({ error: "Ref required" }, { status: 400 });
    }

    const doc = await Intermediary.findOne({ ref });
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const result = await sendMediatorToCRM(doc._id);

    // Re-read to return the freshly-written status fields
    const updated = await Intermediary.findById(doc._id).lean();

    return NextResponse.json({
      success: result?.ok ?? false,
      result,
      status: updated?.externalApiStatus,
      message: updated?.externalApiErrorMessage,
    });
  } catch (err) {
    console.error("Manual CRM send error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}