import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import Pitch from "../../../../models/Pitch";

export async function POST(req) {
    try {
        const { id, status } = await req.json();

        await connectDB();

        await Pitch.findByIdAndUpdate(id, { status });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false });
    }
}