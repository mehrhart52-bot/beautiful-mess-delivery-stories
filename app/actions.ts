"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, requireUser } from "@/lib/auth";
import { wordCount } from "@/lib/types";
import { isExperience } from "@/lib/experiences";
import { isThemeId } from "@/lib/themes";

const message = (path: string, text: string, error = false) =>
  `${path}?${error ? "error" : "message"}=${encodeURIComponent(text)}`;

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const explanation = error.code === "email_not_confirmed"
      ? "Your email has not been confirmed. Please use the confirmation email or contact the administrator for help."
      : error.code === "invalid_credentials"
        ? "Email or password was not recognized. Check your password with Show, or choose Forgot your password."
        : "Login is temporarily unavailable. Please try again shortly.";
    redirect(message("/login", explanation, true));
  }
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("display_name") ?? "").trim();
  if (!displayName) redirect(message("/signup", "Please enter your name.", true));
  if (password.length < 8) redirect(message("/signup", "Use at least 8 characters for your password.", true));
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${siteUrl.replace(/\/$/, "")}/auth/callback?next=/dashboard`,
    },
  });
  if (error) redirect(message("/signup", error.message, true));
  if (data.session) redirect("/dashboard");
  redirect(message("/login", "Check your email for a confirmation link before signing in."));
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl.replace(/\/$/, "")}/auth/callback?next=/reset-password`,
  });
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
  redirect(message("/login", "Your password was changed. You can sign in now."));
}

function validateStory(body: string) {
  const count = wordCount(body);
  if (!body.trim()) return "Please enter your connection story.";
  if (count > 300) return `Please shorten your story by ${count - 300} word${count - 300 === 1 ? "" : "s"}.`;
  return null;
}

export async function createStory(formData: FormData) {
  const user = await requireUser();
  const theme = formData.get("theme");
  if (!isThemeId(theme)) redirect(message("/stories/new", "Please select one theme.", true));
  const experience = formData.get("experience");
  if (!isExperience(experience)) redirect(message("/stories/new", "Please select an experience.", true));
  const body = String(formData.get("body") ?? "").trim();
  const validation = validateStory(body);
  if (validation) redirect(message("/stories/new", validation, true));
  const supabase = await createClient();
  const { error } = await supabase.from("stories").insert({ body, experience, theme, user_id: user.id });
  if (error) redirect(message("/stories/new", "Your story could not be saved. Please try again.", true));
  revalidatePath("/stories");
  redirect(message("/stories/mine", "Your connection story was saved."));
}

export async function updateStory(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const theme = formData.get("theme");
  if (!isThemeId(theme)) redirect(message(`/stories/${id}/edit`, "Please select one theme.", true));
  const experience = formData.get("experience");
  if (!isExperience(experience)) redirect(message(`/stories/${id}/edit`, "Please select an experience.", true));
  const body = String(formData.get("body") ?? "").trim();
  const validation = validateStory(body);
  if (validation) redirect(message(`/stories/${id}/edit`, validation, true));
  const supabase = await createClient();
  const { error } = await supabase
    .from("stories")
    .update({ body, experience, theme, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) redirect(message(`/stories/${id}/edit`, "Your changes could not be saved.", true));
  revalidatePath("/stories");
  redirect(message(`/stories/${id}`, "Your changes were saved."));
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

  const { error } = await supabase.from("stories").delete().eq("id", id);
  if (error) redirect(message(`/stories/${id}`, "The story could not be deleted.", true));

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
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role, active }).eq("id", id);
  if (error) redirect(message("/admin", "Access could not be updated.", true));
  revalidatePath("/admin");
  redirect(message("/admin", "User access was updated."));
}
