import Link from "next/link";
import AuthSubmit from "@/components/AuthSubmit";
import Notice from "@/components/Notice";
import { resendConfirmation } from "@/app/actions";

export default async function VerifyEmail({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  return <div className="auth-card">
    <p className="eyebrow">One more step</p><h1>Check your email</h1>
    <Notice {...await searchParams} />
    <p>Open the confirmation email and select its link. For the smoothest experience, open it in the same browser where you created your account. After confirming, you can share your story without waiting for approval.</p>
    <p>Already confirmed? Log in with your email and password. You only need to confirm your email once.</p>
    <h2>Need a new link?</h2><p>Check your spam folder first. If the link expired, enter your email below and use the newest email we send.</p>
    <form action={resendConfirmation}>
      <div className="field"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
      <AuthSubmit pendingText="Sending…">Resend confirmation email</AuthSubmit>
    </form>
    <div className="auth-links"><Link href="/login">Back to login</Link><Link href="/forgot-password">Reset password</Link><Link href="/signup">Create an account</Link></div>
  </div>;
}
