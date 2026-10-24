import { redirect } from "next/navigation";
import crypto from "crypto";

// Never cached — every visit to /executive mints a brand-new token.
export const dynamic = "force-dynamic";

export default function Page() {
  const token = crypto.randomUUID();
  redirect(`/executive/${token}`);
}