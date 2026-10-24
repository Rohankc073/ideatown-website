import mongoose from "mongoose";


const FileRefSchema = new mongoose.Schema(
  {
    fileDomain: { type: String, default: process.env.NEXT_PUBLIC_SITE_URL },
    url: String,
    relativePath: String,
    originalName: String,
    size: Number,
    mimeType: String,
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);



const IntermediarySchema = new mongoose.Schema(
  {
    ref: { type: String, required: true, unique: true, index: true },

    // Personal
    name: String,
    org: String,                       // optional
    designation: String,
    country_code: String,              // e.g. "AE"
    dial: String,                      // e.g. "+971"
    mobile: String,                    // national number
    phone: String,                     // combined "+971 50 123 4567"
    email: { type: String, index: true },
    country: String,
    city: String,

    // Professional
    category: String,
    categoryOther: String,             // filled only when category is "Other..."
    experience: String,
    expertise: String,
    industries: String,

    // Agreement
    agreedToTerms: { type: Boolean, default: false },
    signedAgreement: FileRefSchema,

    // Admin workflow
    status: {
      type: String,
      enum: ["New", "Under Review", "Verified", "Approved", "Rejected"],
      default: "New",
      index: true,
    },

    externalApiStatus: { type: String, default: null },        // "pending" | "success" | "failed"
externalApiResponse: { type: Object, default: null },
externalApiErrorMessage: { type: String, default: null },
externalApiCalledAt: { type: Date, default: null },

    submitted_at: { type: Date, default: Date.now },

    meetingDone: { type: Boolean, default: false },
meetingDoneAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Delete cached model in development so schema changes take effect immediately
delete mongoose.models.Intermediary;
export default mongoose.model("Intermediary", IntermediarySchema);