import Link from "next/link";
export default function NotFound() {
  return <div className="auth-card"><h1>Page not found</h1><p>This story may have been removed, or the link may be out of date.</p><div className="page-actions"><Link className="button" href="/stories/all">Browse stories</Link><Link className="button secondary" href="/dashboard">Go home</Link></div></div>;
}
