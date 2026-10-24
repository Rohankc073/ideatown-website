import FormB from "@/models/FormB";

/**
 * Forwards a FormB submission to the CRM endpoint.
 * Fire-and-forget — does not block the user's submission response.
 * Updates the FormB document with the CRM result.
 *
 * @param {string} formBId - the MongoDB _id of the saved FormB document
 */
export async function sendFormBToCRM(formBId) {
  const apiUrl = process.env.EXTERNAL_API_URL1;
  const apiToken = process.env.EXTERNAL_API_TOKEN;

  if (!apiUrl || !apiToken) {
    console.warn("[CRM] EXTERNAL_API_URL1 or EXTERNAL_API_TOKEN not set — skipping forward");
    return;
  }

  let doc;
  try {
    doc = await FormB.findById(formBId);
    if (!doc) {
      console.error("[CRM] FormB doc not found:", formBId);
      return;
    }
  } catch (err) {
    console.error("[CRM] Error loading FormB doc:", err);
    return;
  }

  // Mark as "calling CRM now"
  await FormB.findByIdAndUpdate(formBId, {
    externalApiCalledAt: new Date(),
    externalApiStatus: "pending",
  });

  // Build payload — same structure as the saved doc, minus Mongo internals
  const plain = doc.toObject();
  const payload = {
    id: plain._id.toString(),    // ← CRITICAL: this becomes source_oid in CRM
    token: plain.token,
    contact: plain.contact,
    founders: (plain.founders || []).map(({ _id, ...rest }) => rest),
    company: plain.company,
    business: plain.business,
    traction: plain.traction,
    unit_economics: plain.unit_economics, // ← added: own top-level section
    investment: plain.investment,
    funding: plain.funding,
    documents: plain.documents,
    submitted_at: plain.submitted_at,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };

  try {
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
      await FormB.findByIdAndUpdate(formBId, {
        externalApiStatus: "success",
        externalApiResponse: responseData,
        externalApiErrorMessage: null,
      });
    } else if (httpOk && !looksLikeRealApiResponse) {
      console.error(
        "[CRM] Forward failed — wrong endpoint (got HTML, expected JSON). Check EXTERNAL_API_URL1."
      );
      await FormB.findByIdAndUpdate(formBId, {
        externalApiStatus: "failed",
        externalApiResponse: responseData,
        externalApiErrorMessage:
          "Got HTML response instead of JSON. EXTERNAL_API_URL1 likely points to the wrong endpoint.",
      });
    } else {
      const errorMsg = looksLikeRealApiResponse
        ? responseData.message || `CRM rejected: HTTP ${res.status}`
        : `HTTP ${res.status}: ${responseText.slice(0, 500)}`;
      console.error("[CRM] Forward failed:", res.status, errorMsg);
      await FormB.findByIdAndUpdate(formBId, {
        externalApiStatus: "failed",
        externalApiResponse: responseData,
        externalApiErrorMessage: errorMsg,
      });
    }
  } catch (err) {
    console.error("[CRM] Network error:", err);
    await FormB.findByIdAndUpdate(formBId, {
      externalApiStatus: "failed",
      externalApiResponse: null,
      externalApiErrorMessage: err.message || "Network error",
    });
  }
}