import { redirect } from "next/navigation";
import crypto from "crypto";

// Force this route to run on every request (never cached/prerendered),
// so each visit or refresh of /distress mints a brand-new token.
export const dynamic = 'force-dynamic';

// Visiting /distress generates a unique token and redirects to
// /distress/<uuid>, exactly like FormB's /application entry point.
export default function DistressRoot() {
  const token = crypto.randomUUID();
  redirect(`/business/${token}`);
}