import { updatePassword } from "@/app/actions";
import Notice from "@/components/Notice";

export default async function ResetPassword({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return <div className="auth-card">
    <p className="eyebrow">Choose a new password</p><h1>Reset password</h1>
    <Notice {...await searchParams} />
    <form action={updatePassword}>
      <div className="field"><label htmlFor="password">New password</label><input id="password" name="password" type="password" minLength={8} required /></div>
      <div className="field"><label htmlFor="confirm">Confirm new password</label><input id="confirm" name="confirm" type="password" minLength={8} required /></div>
      <button className="button">Save new password</button>
    </form>
  </div>;
}
