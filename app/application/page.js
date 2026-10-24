import { redirect } from "next/navigation";
import crypto from "crypto";

export const dynamic = 'force-dynamic';

export default function Page() {
  const token = crypto.randomUUID();
  redirect(`/application/${token}`);
}