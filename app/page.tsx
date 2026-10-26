import { redirect } from "next/navigation";
import { currentProfile } from "@/lib/auth";

export default async function Home() {
  let profile = null;
  try { profile = await currentProfile(); } catch { redirect("/setup"); }
  redirect(profile ? "/dashboard" : "/login");
}
