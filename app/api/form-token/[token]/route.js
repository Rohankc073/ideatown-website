import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

/**
 * Has this application link already been used?
 *
 * A Form B link carries a token that names the lead it was sent to, so it is
 * good for exactly one application. Reopening a link that has already been
 * filled in — a forwarded email, a bookmark, a second founder at the same
 * company — used to present a blank form that could be submitted again, and
 * the CRM then had to refuse the duplicate after the fact, leaving the
 * applicant thinking they had applied. Better to say so before they type.
 *
 * The check is a token lookup against the three submission collections. Each
 * model declares `token` unique, so a token present in one of them has been
 * submitted; nothing else needs to be consulted, and in particular the CRM
 * does not, so this keeps working whether or not it is reachable.
 *
 * A token that is in none of them is open — that is the normal state of a
 * fresh link, and also of the one the site mints for a visitor who arrives at
 * /application directly, with no email behind them.
 */
const COLLECTIONS = {
  startup: "formbs",
  distress: "distresses",
  executive: "executives",
};

/**
 * The gate stands between a founder and the form, so it answers quickly or it
 * gets out of the way. Everything past this point is on a clock.
 */
const DEADLINE_MS = 3500;

async function lookup(token) {
  await connectDB();
  const db = mongoose.connection.db;

  // All three at once. Serially this was three round trips to find out that a
  // token is in none of them, which is the common case for a fresh link.
  const hits = await Promise.all(
    Object.entries(COLLECTIONS).map(async ([form, collection]) => {
      const hit = await db
        .collection(collection)
        .findOne({ token }, { projection: { _id: 1, submitted_at: 1 } });
      return hit ? { form, submittedAt: hit.submitted_at ?? null } : null;
    }),
  );

  return hits.find(Boolean) ?? null;
}

export async function GET(_request, { params }) {
  const token = (params?.token ?? "").trim();

  // The demo link is a permanent sample, never a real invitation.
  if (!token || token === "demo") {
    return NextResponse.json({ used: false, form: null });
  }

  try {
    // Fail open on *slow*, not only on *error*. The route already said it
    // would never lock anyone out, but with Mongoose's 30s server-selection
    // default an unreachable database meant half a minute of
    // "CHECKING YOUR LINK..." before that promise could be kept. A deadline
    // is what makes it true.
    const used = await Promise.race([
      lookup(token),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("form-token lookup timed out")), DEADLINE_MS),
      ),
    ]);

    return used
      ? NextResponse.json({ used: true, form: used.form, submittedAt: used.submittedAt })
      : NextResponse.json({ used: false, form: null });
  } catch (error) {
    // The CRM still refuses a duplicate token, so the worst case here is the
    // old behaviour rather than a founder who cannot apply at all.
    console.error("[form-token] lookup failed", error);
    return NextResponse.json({ used: false, form: null, error: true });
  }
}
