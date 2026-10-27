import Link from "next/link";
import { redirect } from "next/navigation";
import { currentProfile } from "@/lib/auth";
import { login } from "@/app/actions";
import Notice from "@/components/Notice";
import PasswordInput from "@/components/PasswordInput";

export default async function Login({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  let profile = null;
  try { profile = await currentProfile(); } catch { redirect("/setup"); }
  if (profile) redirect("/dashboard");
  const params = await searchParams;
  return <div className="auth-card">
    <p className="eyebrow">Connection Stories</p>
    <h1>Welcome back</h1>
    <p>Log in with your email address to share and read connection stories.</p>
    <Notice {...params} />
    <form action={login}>
      <div className="field"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
      <div className="field"><label htmlFor="password">Password</label><PasswordInput /></div>
      <button className="button" type="submit">Log in</button>
    </form>
    <div className="auth-links"><Link href="/forgot-password">Forgot your password?</Link><Link href="/signup">Create an account</Link></div>
  </div>;
}
