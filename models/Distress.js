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

const DistressSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true, index: true },

    contact: {
      full_name: String,
      role: String,
      email: String,
      // phone stored split: country code + national number
      phone_code: String,
      phone: String,
      linkedin: String,
    },

    company: {
      name: String,
      website: String,
      industry: String,
      stage: String,
      location: String,
      year_incorporation: String,
      employee_count: String,
    },

    overview: {
      description: String,
      core_products: String,
      customer_base: String,
      operating_status: String,
      active_parts: String,
    },

    distress: {
      reason: String,
      start: String,
      defaulted: String,
      offer: String,
      resolution: String,
    },

    financials: {
      revenue: String,
      revenue_currency: String,
      profit_loss: String,
      profit_loss_currency: String,
      outstanding_debt: String,
      outstanding_debt_currency: String,
      monthly_burn: String,
      monthly_burn_currency: String,
    },

    assets: {
      major_assets: String,
      asset_value: String,
      asset_value_currency: String,
      pledged: String,
      ip_patents: String,
    },

    deal: {
      valuation: String,
      valuation_currency: String,
      min_price: String,
      min_price_currency: String,
      stake_percent: String,
      structure: String,
      urgency: String,
    },

    documents: {
      financial_statements: [FileRefSchema],
      asset_list: [FileRefSchema],
      debt_schedule: [FileRefSchema],
      company_profile: [FileRefSchema],
      legal_documents: [FileRefSchema],
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

// Delete cached model in development so schema changes take effect immediately
delete mongoose.models.Distress;
export default mongoose.model("Distress", DistressSchema);