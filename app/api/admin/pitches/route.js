import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import { cookies } from "next/headers";
import Pitch from "../../../../models/Pitch";

export async function GET() {
    try {

        const token = cookies().get("admin_token");

        if (!token) {
            return NextResponse.json({ success: false }, { status: 401 });
        }
        
        await connectDB();

        const data = await Pitch.find().sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json({ success: false });
    }
}