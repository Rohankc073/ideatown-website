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

const FormBSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true, index: true },
    contact: {
      name: String, role: String, email: String, phone: String, linkedin: String,
      intermediaryId: String,
    },
    founders: [{
      name: String, email: String, phone: String, linkedin: String,
      age: String, place: String, edu: String, exp: String, fam: String,
    }],
    company: {
      name: String, website: String, sector: String, stage: String, location: String,
    },
    business: {
      idea: String, problem: String, solution: String,
      tam: String,                    // Total Addressable Market
      sam: String,                    // ← added: Serviceable Addressable Market
      som: String,                    // ← added: Serviceable Obtainable Market
      why: String, competitors: String, usp: String,
    },
    traction: {
      current: String, revenue: String, pl_monthly: String, pl_annual: String,
      yr1: String, yr2: String, yr3: String, milestones: String,
      // Legacy — kept so submissions made before unit economics moved out
      // still read back correctly. New submissions do NOT write here.
      unit_economics: { ltvcac: String, payback: String, retention: String },
    },
    // ─── Unit Economics — now its own top-level section ───
    unit_economics: {
      summary: String,                // plain-English "one sale" explanation
      ltvcac: String,
      payback: String,
      retention: String,
    },
    investment: {
      swot_s: String, swot_w: String, swot_o: String, swot_t: String, acquirers: String,
    },
    funding: {
      raised: String,
      raised_currency: String,        // ← added: AED | USD | INR
      lead: String,
      amount: String,
      amount_currency: String,        // ← added: AED | USD | INR
      valuation: String,              // Step 6 "Proposed Valuation"
      valuation_currency: String,     // ← added: AED | USD | INR
      stage: String,
      use_of_funds: String,
    },
    documents: {
      pitch_deck: [FileRefSchema],
      business_plan: [FileRefSchema],
      support: [FileRefSchema],
      projections: [FileRefSchema],
      description: String,
    },
    submitted_at: { type: Date, default: Date.now },

    // ─── CRM forwarding tracking ───
    externalApiStatus: {
      type: String,
      enum: ["pending", "success", "failed", null],
      default: null,
    },
    externalApiResponse: { type: mongoose.Schema.Types.Mixed, default: null },
    externalApiErrorMessage: { type: String, default: null },
    externalApiCalledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Recompile on hot-reload in dev; reuse the cached model in production.
if (process.env.NODE_ENV !== "production") delete mongoose.models.FormB;
export default mongoose.models.FormB || mongoose.model("FormB", FormBSchema);