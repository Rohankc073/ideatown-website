import Pitch from "@/models/Pitch";

export async function sendPitchToExternalAPI(pitch) {
    try {
        const payload = {
            id: pitch._id,
            name: pitch.name,
            email: pitch.email,
            company: pitch.company,
            phone: pitch.phone,
            overview: pitch.overview,
            fileDomain: process.env.NEXT_PUBLIC_SITE_URL,
            fileUrl: pitch.fileUrl,
            status: "pending",
            createdAt: pitch.createdAt,
            updatedAt: pitch.updatedAt
        };

        console.log("payload:", JSON.stringify(payload));
        
        const response = await fetch(
            process.env.EXTERNAL_API_URL + "/website_lead_ingest.php",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CRM-INGEST-TOKEN": process.env.EXTERNAL_API_TOKEN,
                },
                body: JSON.stringify(payload),

                //timeout
                signal: AbortSignal.timeout(15000),
            }
        );

        let responseData = null;

        try {
            responseData = await response.json();
        } catch {
            responseData = {
                message: "Invalid JSON response",
            };
        }

        //SUCCESS RESPONSE
        if (response.ok) {
            await Pitch.findByIdAndUpdate(pitch._id, {
                externalApiStatus: "success",
                externalApiResponse: responseData,
                externalApiCalledAt: new Date(),
                externalApiErrorMessage: null,
            });

            return {
                success: true,
                data: responseData,
            };
        }

        //FAILED RESPONSE
        await Pitch.findByIdAndUpdate(pitch._id, {
            externalApiStatus: "failed",
            externalApiResponse: responseData,
            externalApiCalledAt: new Date(),

            externalApiErrorMessage:
                responseData?.message ||
                `HTTP ${response.status}`,

            $inc: {
                externalApiRetryCount: 1,
            },
        });

        return {
            success: false,
            data: responseData,
        };
    } catch (error) {
        console.error("External API Error:", error);

        //NETWORK / SERVER FAILURE
        await Pitch.findByIdAndUpdate(pitch._id, {
            externalApiStatus: "failed",

            externalApiResponse: {
                message: error.message,
            },

            externalApiCalledAt: new Date(),

            externalApiErrorMessage: error.message,

            $inc: {
                externalApiRetryCount: 1,
            },
        });

        return {
            success: false,
            error: error.message,
        };
    }
}