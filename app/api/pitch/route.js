import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

import { connectDB } from "../../../lib/mongodb";
import Pitch from "../../../models/Pitch";

import { sendPitchToExternalAPI } from "../../../services/externalPitchService";

export async function POST(req) {
    try {
        const formData = await req.formData();

        const name = formData.get("p_name");
        const email = formData.get("p_email");
        const company = formData.get("p_company");

        const rawCode = formData.get("p_code");
        const pCode = rawCode?.split("|")[1];

        const phone = formData.get("p_phone");
        const overview = formData.get("p_overview");
        const file = formData.get("deck");

        //VALIDATION
        if (
            !name ||
            !email ||
            !company ||
            !pCode ||
            !phone ||
            !overview ||
            !file
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Missing fields",
                },
                { status: 400 }
            );
        }

        //FILE VALIDATION
        const allowedTypes = [
            "application/pdf",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ];

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({
                success: false,
                message: "Invalid file type"
            });
        }

        if (file.size > 20 * 1024 * 1024) {
            return NextResponse.json({
                success: false,
                message: "File too large"
            });
        }

        //FILE SAVE
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const fileName = `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}-${file.name.replace(/\s/g, "_")}`;

        const filePath = path.join(
            process.cwd(),
            "public/uploads",
            fileName
        );

        await writeFile(filePath, buffer);

        const fileUrl = `/uploads/${fileName}`;

        //DB CONNECT
        await connectDB();

        //SAVE TO DB
        const savedPitch = await Pitch.create({
            name,
            email,
            company,
            phone: `+${pCode} ${phone}`,
            overview,
            fileUrl,
        });

        //CALL EXTERNAL API
        await sendPitchToExternalAPI(savedPitch);

        //RESPONSE
        return NextResponse.json({
            success: true,
            message: "Pitch submitted successfully",
        });

    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                success: false,
                message: "Server error",
            },
            { status: 500 }
        );
    }
}