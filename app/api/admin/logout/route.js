import { NextResponse } from "next/server";

export async function POST() {
    try {
        const res = NextResponse.json({
            success: true,
            message: "Logged out successfully",
        });

        //Clear cookie
        res.cookies.set("admin_token", "", {
            httpOnly: true,
            expires: new Date(0), // expire immediately
            path: "/",
        });

        return res;
    } catch (err) {
        return NextResponse.json({
            success: false,
            message: "Logout failed",
        });
    }
}