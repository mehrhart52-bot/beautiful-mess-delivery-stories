import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requested = url.searchParams.get("next") || "/dashboard";
  const next = ["/dashboard", "/reset-password"].includes(requested)
    ? requested
    : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      revalidatePath("/", "layout");
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  return NextResponse.redirect(
    new URL(next === "/reset-password"
      ? "/forgot-password?error=This+reset+link+could+not+be+used.+Please+request+a+new+link+and+open+it+in+the+same+browser."
      : "/verify-email?error=This+link+may+have+expired,+already+been+used,+or+opened+in+a+different+browser.+Try+logging+in+if+you+already+confirmed,+or+request+a+new+link.", url.origin),
  );
}
