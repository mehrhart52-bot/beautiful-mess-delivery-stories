"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, requireUser } from "@/lib/auth";
import { wordCount } from "@/lib/types";
import { isExperience } from "@/lib/experiences";
import { storyReturn } from "@/lib/story-navigation";
import { isThemeId } from "@/lib/themes";

const message = (path: string, text: string, error = false) =>
  `${path}?${error ? "error" : "message"}=${encodeURIComponent(text)}`;

// Supabase verifies tokens server-side when CAPTCHA protection is enabled there.
function captchaOptions(formData: FormData, path: string) {
  const token = formData.get("captchaToken");
  if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (typeof token !== "string" || !token || token.length > 2048)) {
    redirect(message(path, "Please complete the security check and try again.", true));
  }
  return typeof token === "string" && token ? { captchaToken: token } : {};
}
function authFailure(code: string | undefined, fallback: string) {
  if (code === "captcha_failed") return "The security check expired or could not be verified. Please complete a new check and try again.";
  if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit") return "Too many attempts. Please wait a few minutes before trying again.";
  return fallback;
}
function confirmationUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${siteUrl.replace(/\/$/, "")}/auth/callback?next=/dashboard`;
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password, options: captchaOptions(formData, "/login") });
  if (error) {
    const explanation = error.code === "email_not_confirmed"
      ? "Please confirm your email before logging in. Use the link in your inbox, or choose Resend confirmation email below."
      : error.code === "invalid_credentials"
        ? "Email or password was not recognized. Check your password with Show, or choose Forgot your password."
        : "Login is temporarily unavailable. Please try again shortly.";
    redirect(message("/login", authFailure(error.code, explanation), true));
  }
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("display_name") ?? "").trim();
  if (!displayName || displayName.length > 100) redirect(message("/signup", "Please enter a name of up to 100 characters.", true));
  if (password.length < 8) redirect(message("/signup", "Use at least 8 characters for your password.", true));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      ...captchaOptions(formData, "/signup"),
      data: { display_name: displayName },
      emailRedirectTo: confirmationUrl(),
    },
  });
  if (error) redirect(message("/signup", authFailure(error.code, "We could not create this account. Try signing in or resetting your password if you already registered, or try again later."), true));
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }
  redirect(message("/verify-email", "Check your inbox for your confirmation email."));
}

export async function resendConfirmation(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup", email,
    options: { ...captchaOptions(formData, "/verify-email"), emailRedirectTo: confirmationUrl() },
  });
  if (error) redirect(message("/verify-email", authFailure(error.code, "We could not send the email right now. Please try again shortly."), true));
  redirect(message("/verify-email", "If this address has an account awaiting confirmation, a new link is on its way. If you already confirmed, you can log in."));
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function requestReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    ...captchaOptions(formData, "/forgot-password"),
    redirectTo: `${siteUrl.replace(/\/$/, "")}/auth/callback?next=/reset-password`,
  });
  if (error) redirect(message("/forgot-password", authFailure(error.code, "We could not send a reset link right now. Please try again shortly."), true));
  redirect(message("/forgot-password", "If that email is registered, a reset link is on its way."));
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) redirect(message("/reset-password", "Use at least 8 characters.", true));
  if (password !== confirm) redirect(message("/reset-password", "The passwords do not match.", true));
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(message("/reset-password", "The reset link may have expired. Please request a new one.", true));
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect(message("/login", "Your password was changed. You can sign in now."));
}

function validateStory(body: string) {
  if (body.length > 10000) return "Please shorten your story to 10,000 characters or fewer.";
  const count = wordCount(body);
  if (!body.trim()) return "Please enter your connection story.";
  if (count > 300) return `Please shorten your story by ${count - 300} word${count - 300 === 1 ? "" : "s"}.`;
  return null;
}

export async function createStory(formData: FormData) {
  const user = await requireUser();
  const theme = formData.get("theme");
  if (!isThemeId(theme)) return { error: "Please select one theme." };
  const experience = formData.get("experience");
  if (!isExperience(experience)) return { error: "Please select an experience." };
  const body = String(formData.get("body") ?? "").trim();
  const validation = validateStory(body);
  if (validation) return { error: validation };
  const supabase = await createClient();
  const { error } = await supabase.from("stories").insert({ body, experience, theme, user_id: user.id });
  if (error?.message === "story_too_soon") return { error: "Please wait 30 seconds between new stories. Your text is still here; try saving again shortly." };
  if (error?.message === "story_daily_limit") return { error: "You have reached 20 new stories in 24 hours. Your text is still here; please copy it somewhere safe and return later." };
  if (error) return { error: "Your story could not be saved. Your text is still here; please try again." };
  revalidatePath("/stories");
  redirect(message("/stories/mine", "Your connection story was saved."));
}

export async function updateStory(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const theme = formData.get("theme");
  if (!isThemeId(theme)) return { error: "Please select one theme." };
  const experience = formData.get("experience");
  if (!isExperience(experience)) return { error: "Please select an experience." };
  const body = String(formData.get("body") ?? "").trim();
  const validation = validateStory(body);
  if (validation) return { error: validation };
  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("stories")
    .update({ body, experience, theme, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id).select("id").maybeSingle();
  if (error) return { error: "Your story could not be saved. Your text is still here; please try again." };
  revalidatePath("/stories");
  if (!updated) return { error: "This story is no longer available to edit." };
  const back = storyReturn(formData.get("returnTo"));
  redirect(`/stories/${id}?returnTo=${encodeURIComponent(back.href)}&message=${encodeURIComponent("Your changes were saved.")}`);
}

export async function deleteStory(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  const { data: story } = await supabase
    .from("stories")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!story) redirect(message("/stories/all", "That story could not be found.", true));
  if (story.user_id !== user.id && user.role !== "admin")
    redirect(message(`/stories/${id}`, "You do not have permission to delete this story.", true));

  const { data: deleted, error } = await supabase.from("stories").delete().eq("id", id).select("id").maybeSingle();
  if (error || !deleted) redirect(message(`/stories/${id}`, "The story could not be deleted. It may already have been removed.", true));

  revalidatePath("/stories");
  revalidatePath("/word-cloud");
  const destination = user.role === "admin" && story.user_id !== user.id
    ? "/stories/all"
    : "/stories/mine";
  redirect(message(destination, "The connection story was deleted."));
}

export async function updateAccess(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id === admin.id && formData.get("active") !== "on") redirect(message("/admin", "You cannot deactivate your own account.", true));
  const role = formData.get("role") === "admin" ? "admin" : "user";
  const active = formData.get("active") === "on";
  if (id === admin.id && role !== "admin") redirect(message("/admin", "Ask another administrator to change your role. You cannot remove your own admin access.", true));
  const supabase = await createClient();
  const { data: updated, error } = await supabase.from("profiles").update({ role, active }).eq("id", id).select("id").maybeSingle();
  if (error || !updated) redirect(message("/admin", "Access could not be updated. The account may no longer be available.", true));
  revalidatePath("/admin");
  redirect(message("/admin", "User access was updated."));
}
