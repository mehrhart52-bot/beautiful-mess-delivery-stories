import Link from "next/link";
import { requestReset } from "@/app/actions";
import Notice from "@/components/Notice";

export default async function ForgotPassword({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  return <div className="auth-card">
    <p className="eyebrow">Password help</p><h1>Reset your password</h1>
    <p>Enter your email address and we will send you a secure reset link.</p>
    <Notice {...await searchParams} />
    <form action={requestReset}><div className="field"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" required /></div><button className="button">Send reset link</button></form>
    <div className="auth-links"><Link href="/login">Back to login</Link></div>
  </div>;
}
