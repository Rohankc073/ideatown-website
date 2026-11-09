import Distress from "@/models/Distress";
import { mirrorToNewCrm } from "@/lib/mirrorToNewCrm";

/**
 * Forwards a Distress form submission to the CRM endpoint.
 * Fire-and-forget — does not block the user's submission response.
 * Updates the Distress document with the CRM result.
 *
 * @param {string} distressId - the MongoDB _id of the saved Distress document
 */
export async function sendDistressFormToCRM(distressId) {
  const apiUrl = process.env.EXTERNAL_API_URL2;
  const apiToken = process.env.EXTERNAL_API_TOKEN1;


  let doc;
  try {
    doc = await Distress.findById(distressId);
    if (!doc) {
      console.error("[CRM] Distress doc not found:", distressId);
      return;
    }
  } catch (err) {
    console.error("[CRM] Error loading Distress doc:", err);
    return;
  }

  // Mark as "calling CRM now"
  await Distress.findByIdAndUpdate(distressId, {
    externalApiCalledAt: new Date(),
    externalApiStatus: "pending",
  });

  // Build payload — same structure as the saved doc, minus Mongo internals
  const plain = doc.toObject();
  const payload = {
    id: plain._id.toString(),    // ← CRITICAL: this becomes source_oid in CRM
    token: plain.token,
    contact: plain.contact,
    company: plain.company,
    overview: plain.overview,
    distress: plain.distress,
    financials: plain.financials,
    assets: plain.assets,
    deal: plain.deal,
    documents: plain.documents,
    submitted_at: plain.submitted_at,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };

  try {
    // Same body to the rebuilt CRM. Awaited but never thrown from, so a
    // failure here cannot affect the forward below.
    await mirrorToNewCrm("distress", payload);

    if (!apiUrl || !apiToken) {
      console.warn("[CRM] EXTERNAL_API_URL2 or EXTERNAL_API_TOKEN1 not set — skipping the legacy forward");
      return;
    }

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CRM-INGEST-TOKEN": apiToken,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await res.text();
    let responseData;
    let isJson = true;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
      isJson = false;
    }

    // Verify response is what we expect — HTTP 2xx AND valid JSON AND { ok: true }
    const httpOk = res.ok;
    const looksLikeRealApiResponse = isJson && typeof responseData === "object" && "ok" in responseData;
    const businessOk = looksLikeRealApiResponse && responseData.ok === true;

    if (httpOk && businessOk) {
      console.log(
        "[CRM] Successfully forwarded:",
        plain.token,
        responseData.duplicate ? "(duplicate)" : `(id=${responseData.id})`
      );
      await Distress.findByIdAndUpdate(distressId, {
        externalApiStatus: "success",
        externalApiResponse: responseData,
        externalApiErrorMessage: null,
      });
    } else if (httpOk && !looksLikeRealApiResponse) {
      console.error(
        "[CRM] Forward failed — wrong endpoint (got HTML, expected JSON). Check EXTERNAL_API_URL2."
      );
      await Distress.findByIdAndUpdate(distressId, {
        externalApiStatus: "failed",
        externalApiResponse: responseData,
        externalApiErrorMessage:
          "Got HTML response instead of JSON. EXTERNAL_API_URL2 likely points to the wrong endpoint.",
      });
    } else {
      const errorMsg = looksLikeRealApiResponse
        ? responseData.message || `CRM rejected: HTTP ${res.status}`
        : `HTTP ${res.status}: ${responseText.slice(0, 500)}`;
      console.error("[CRM] Forward failed:", res.status, errorMsg);
      await Distress.findByIdAndUpdate(distressId, {
        externalApiStatus: "failed",
        externalApiResponse: responseData,
        externalApiErrorMessage: errorMsg,
      });
    }
  } catch (err) {
    console.error("[CRM] Network error:", err);
    await Distress.findByIdAndUpdate(distressId, {
      externalApiStatus: "failed",
      externalApiResponse: null,
      externalApiErrorMessage: err.message || "Network error",
    });
  }
}