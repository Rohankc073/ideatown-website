import Pitch from "@/models/Pitch";
import { mirrorToNewCrm } from "@/lib/mirrorToNewCrm";

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

        // Same body to the rebuilt CRM. Never throws, so it cannot affect
        // the forward below.
        await mirrorToNewCrm("websiteLead", payload);

        const configured = (process.env.EXTERNAL_API_URL_LEAD || "").trim();

        // "disabled" turns the legacy forward off for this environment
        // without unsetting the variable, which would fall through to the
        // line below and post the lead to PRODUCTION. Unlike the other four
        // forms, this one has no safe default, so the opt-out has to be
        // explicit. Staging sets it; production sets a real URL.
        if (configured.toLowerCase() === "disabled") {
            console.warn("[CRM] EXTERNAL_API_URL_LEAD=disabled — skipping the legacy forward");
            return;
        }

        const legacyUrl =
            configured || process.env.EXTERNAL_API_URL + "/website_lead_ingest.php";

        const response = await fetch(
            legacyUrl,
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