import Intermediary from "@/models/Mediator";

/**
 * Forwards a Mediator/Intermediary submission to the CRM endpoint.
 * Fire-and-forget — does not block the user's submission response.
 * Updates the Mediator document with the CRM result.
 *
 * @param {string} mediatorId - the MongoDB _id of the saved Mediator document
 */
export async function sendMediatorToCRM(mediatorId) {
  const apiUrl = process.env.EXTERNAL_API_URL_MEDIATOR;
  const apiToken = process.env.EXTERNAL_API_TOKEN;

  if (!apiUrl || !apiToken) {
    console.warn("[CRM] EXTERNAL_API_URL_MEDIATOR or EXTERNAL_API_TOKEN not set — skipping forward");
    return;
  }

  let doc;
  try {
    doc = await Intermediary.findById(mediatorId);
    if (!doc) {
      console.error("[CRM] Mediator doc not found:", mediatorId);
      return;
    }
  } catch (err) {
    console.error("[CRM] Error loading Mediator doc:", err);
    return;
  }

  // Mark as "calling CRM now"
  await Intermediary.findByIdAndUpdate(mediatorId, {
    externalApiCalledAt: new Date(),
    externalApiStatus: "pending",
  });

  // Build payload — matches the CRM's expected extended-JSON shape.
  const plain = doc.toObject();
  const toDate = (d) => (d ? { $date: new Date(d).toISOString() } : null);

  const payload = {
    _id: { $oid: plain._id.toString() },   // ← becomes source_oid in CRM
    ref: plain.ref,
    name: plain.name,
    org: plain.org,
    designation: plain.designation,
    country_code: plain.country_code,
    dial: plain.dial,
    mobile: plain.mobile,
    phone: plain.phone,
    email: plain.email,
    country: plain.country,
    city: plain.city,
    category: plain.category,
    categoryOther: plain.categoryOther || "",
    experience: plain.experience,
    expertise: plain.expertise,
    industries: plain.industries,
    agreedToTerms: !!plain.agreedToTerms,
    signedAgreement: plain.signedAgreement
      ? {
          fileDomain: plain.signedAgreement.fileDomain,
          url: plain.signedAgreement.url,
          relativePath: plain.signedAgreement.relativePath,
          originalName: plain.signedAgreement.originalName,
          size: plain.signedAgreement.size,
          mimeType: plain.signedAgreement.mimeType,
          uploadedAt: toDate(plain.signedAgreement.uploadedAt),
        }
      : null,
    status: plain.status || "New",
    meetingDone: !!plain.meetingDone,
    meetingDoneAt: toDate(plain.meetingDoneAt),
    submitted_at: toDate(plain.submitted_at || plain.createdAt),
    createdAt: toDate(plain.createdAt),
    updatedAt: toDate(plain.updatedAt),
    __v: plain.__v ?? 0,
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

    const httpOk = res.ok;
    const looksLikeRealApiResponse = isJson && typeof responseData === "object" && "ok" in responseData;
    const businessOk = looksLikeRealApiResponse && responseData.ok === true;

    if (httpOk && businessOk) {
      console.log(
        "[CRM] Successfully forwarded mediator:",
        plain.ref,
        responseData.duplicate ? "(duplicate)" : `(id=${responseData.id})`
      );
      await Intermediary.findByIdAndUpdate(mediatorId, {
        externalApiStatus: "success",
        externalApiResponse: responseData,
        externalApiErrorMessage: null,
      });
    } else if (httpOk && !looksLikeRealApiResponse) {
      console.error(
        "[CRM] Forward failed — wrong endpoint (got HTML, expected JSON). Check EXTERNAL_API_URL2."
      );
      await Intermediary.findByIdAndUpdate(mediatorId, {
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
      await Intermediary.findByIdAndUpdate(mediatorId, {
        externalApiStatus: "failed",
        externalApiResponse: responseData,
        externalApiErrorMessage: errorMsg,
      });
    }
  } catch (err) {
    console.error("[CRM] Network error:", err);
    await Intermediary.findByIdAndUpdate(mediatorId, {
      externalApiStatus: "failed",
      externalApiResponse: null,
      externalApiErrorMessage: err.message || "Network error",
    });
  }
}