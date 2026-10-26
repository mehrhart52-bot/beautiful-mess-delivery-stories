import Link from "next/link";
import { signup } from "@/app/actions";
import Notice from "@/components/Notice";

export default async function Signup({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return <div className="auth-card">
    <p className="eyebrow">New account</p><h1>Join the story</h1>
    <p>Your email address will be your username.</p>
    <Notice {...await searchParams} />
    <form action={signup}>
      <div className="field"><label htmlFor="display_name">Your name</label><input id="display_name" name="display_name" autoComplete="name" required /></div>
      <div className="field"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
      <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required /><p className="field-help">Use at least 8 characters.</p></div>
      <button className="button" type="submit">Create account</button>
    </form>
    <div className="auth-links"><Link href="/login">Back to login</Link></div>
  </div>;
}
