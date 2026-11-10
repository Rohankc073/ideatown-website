/**
 * Sends a copy of a submission to the rebuilt CRM, alongside the existing
 * forward to the legacy PHP one.
 *
 * Deliberately a mirror rather than a switch. The old CRM keeps receiving
 * every submission exactly as before, so a rejected payload or an unreachable
 * host during the changeover costs nothing — the worst case is a missing copy,
 * never a lost founder. When the new CRM has been running alongside long
 * enough, the old call is the one to delete.
 *
 * Inert until configured: with NEW_CRM_URL unset this does nothing and
 * returns immediately, so the staging site behaves exactly as it does today
 * until someone points it somewhere.
 */

/** Form name -> the route that receives it on the new CRM. */
const ENDPOINTS = {
  startup: "/api/ingest/startup-application",
  distress: "/api/ingest/distress-application",
  executive: "/api/ingest/executive-application",
  introducer: "/api/ingest/introducer",
  websiteLead: "/api/ingest/website-lead",
};

const TIMEOUT_MS = 15000;

/**
 * @param {keyof typeof ENDPOINTS} form  which submission this is
 * @param {object} payload               the same body sent to the old CRM
 * @returns {Promise<{ok: boolean, skipped?: boolean, status?: number, body?: unknown, error?: string}>}
 */
export async function mirrorToNewCrm(form, payload) {
  const base = (process.env.NEW_CRM_URL || "").trim().replace(/\/+$/, "");
  const token = (process.env.NEW_CRM_INGEST_TOKEN || "").trim();
  const path = ENDPOINTS[form];

  if (!base || !token) {
    /*
     * Say so. This used to return silently, so a site with the mirror
     * unconfigured looked exactly like a site whose submissions were being
     * refused: nothing in the new CRM and nothing in the log to explain it.
     * One line per submission is cheap, and it is the first thing anyone
     * asks for when "nothing is landing".
     */
    console.warn(
      `[new-crm] ${form} not sent — ${!base ? "NEW_CRM_URL" : "NEW_CRM_INGEST_TOKEN"} is not set`,
    );
    return { ok: false, skipped: true };
  }
  if (!path) {
    console.error(`[new-crm] no endpoint for "${form}" — nothing sent`);
    return { ok: false, error: `unknown form "${form}"` };
  }

  const url = base + path;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CRM-INGEST-TOKEN": token,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const text = await response.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      // An HTML body here almost always means NEW_CRM_URL points at a page
      // rather than the API — worth saying plainly rather than logging a blob.
      console.error(`[new-crm] ${form}: expected JSON from ${url}, got ${text.slice(0, 80)}`);
      return { ok: false, status: response.status, error: "non-JSON response" };
    }

    if (response.ok && body && body.ok === true) {
      console.log(`[new-crm] ${form} accepted${body.duplicate ? " (duplicate)" : ""}`);
      return { ok: true, status: response.status, body };
    }

    console.error(
      `[new-crm] ${form} rejected: HTTP ${response.status} ${body?.message ?? ""}`.trim(),
    );
    return { ok: false, status: response.status, body };
  } catch (error) {
    // Never rethrow: the mirror must not be able to fail a submission that the
    // old CRM already accepted.
    console.error(`[new-crm] ${form} could not be reached:`, error?.message ?? error);
    return { ok: false, error: error?.message ?? String(error) };
  }
}
