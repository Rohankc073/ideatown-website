import mongoose from "mongoose";

const PitchSchema = new mongoose.Schema(
    {
        name: String,

        email: String,

        company: String,

        phone: String,

        overview: String,

        fileUrl: String,

        status: {
            type: String,
            default: "pending",
        },

        //EXTERNAL API TRACKING
        externalApiStatus: {
            type: String,
            enum: ["pending", "success", "failed"],
            default: "pending",
        },

        externalApiResponse: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },

        externalApiCalledAt: {
            type: Date,
            default: null,
        },

        externalApiRetryCount: {
            type: Number,
            default: 0,
        },

        externalApiErrorMessage: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.Pitch || mongoose.model("Pitch", PitchSchema);