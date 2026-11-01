import { headers } from "next/headers";
import BotProtectedSubmit from "@/components/BotProtectedSubmit";

export default async function AuthSubmit({ children, pendingText }: { children: React.ReactNode; pendingText: string }) {
  return <BotProtectedSubmit siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} nonce={(await headers()).get("x-nonce") ?? undefined} pendingText={pendingText}>{children}</BotProtectedSubmit>;
}
