import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";
import AdminUser from "@/models/AdminUser";

export async function POST(req) {
    try {
        await connectDB();

        const { email, password } = await req.json();

        const user = await AdminUser.findOne({ email, password });

        if (!user) {
            return NextResponse.json({ success: false, message: "Invalid credentials" });
        }

        // const isMatch = await bcrypt.compare(password, user.password);

        // if (!isMatch) {
        //     return NextResponse.json({ success: false, message: "Invalid credentials" });
        // }

        //Create JWT
        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET || "secret123",
            { expiresIn: "1d" }
        );

        //Send user info to frontend
        const res = NextResponse.json({
            success: true,
            user: {
                name: user.name,
                email: user.email
            }
        });

        //Set cookie
        res.cookies.set("admin_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "PRODUCTION",
            sameSite: "strict", // or "lax"
            path: "/",
            maxAge: 60 * 60 * 24, // 1 day
        });

        return res;

    } catch (err) {
        return NextResponse.json({ success: false, message: "Server error" });
    }
}