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

const ExecutiveSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true, index: true },

    about: {
      full_name: String,
      designation: String,
      organization: String,
      email: String,
      phone_code: String,
      phone: String,
      linkedin: String,
    },

    experience: {
      years: String,
      summary: String,
      achievement: String,
    },

    idea: {
      brief: String,
      problem: String,
      solution: String,
      market: String,
    },

    readiness: {
      stage: String,
      revenue_model: String,
      progress: String,
    },

    deep_dive: {
      product_details: String,
      revenue_projection: String,
      confidence: String,
      past_experience: String,
      other_points: String,
    },

    marketing: {
      target_market: String,
      marketing_plan: String,
    },

    funding: {
      amount: String,
      currency: String,
      use_of_funds: String,
    },

    support: {
      support_needed: String,
      network: String,
    },

    documents: {
      pitch_deck: [FileRefSchema],
      financial_projection: [FileRefSchema],
      business_plan: [FileRefSchema],
      supporting_material: [FileRefSchema],
      additional_documents: [FileRefSchema],
    },

    submitted_at: { type: Date, default: Date.now },

    // ── CRM forwarding tracking (same pattern as FormB) ──
    externalApiStatus: {
      type: String,
      enum: ["pending", "success", "failed", null],
      default: null,
    },
    externalApiResponse: { type: mongoose.Schema.Types.Mixed, default: null },
    externalApiErrorMessage: { type: String, default: null },
    externalApiCalledAt: { type: Date, default: null },
    externalApiRetryCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

delete mongoose.models.Executive;
export default mongoose.model("Executive", ExecutiveSchema);