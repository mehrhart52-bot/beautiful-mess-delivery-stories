"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <div className="auth-card"><h1>We couldn’t load this page</h1><p>Please try again. If the problem continues, contact your administrator.</p><div className="page-actions"><button className="button" onClick={reset}>Try again</button><Link className="button secondary" href="/dashboard">Go home</Link></div></div>;
}
