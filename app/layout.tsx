import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { currentProfile } from "@/lib/auth";
import { logout } from "@/app/actions";
import StoriesMenu from "@/components/StoriesMenu";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Connection Stories · Beautiful Mess Ministries", template: "%s · Beautiful Mess Ministries" },
  description: "Share and celebrate CarePortal and Beautiful Mess Ministries connection stories.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let profile = null;
  try { profile = await currentProfile(); } catch { /* Setup pages remain usable before Supabase is connected. */ }
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <div className="topline" />
        <header className="site-header">
          <div className="header-inner">
            <Link href={profile ? "/dashboard" : "/login"} aria-label="Beautiful Mess Ministries connection stories">
              <Image className="logo" src="/beautiful-mess-logo.jpg" alt="Beautiful Mess Ministries" width={693} height={233} preload unoptimized />
            </Link>
            <nav aria-label="Main navigation">
              {profile ? <>
                <Link href="/dashboard">Home</Link>
                <Link href="/stories/new">Create Story</Link>
                <Link href="/stories/mine">My Stories</Link>
                <StoriesMenu />
                <Link href="/word-cloud">Word Cloud</Link>
                {profile.role === "admin" && <Link href="/admin">Admin</Link>}
                <form className="nav-form" action={logout}><button className="nav-button">Log out</button></form>
              </> : <Link href="/login">Log in</Link>}
            </nav>
          </div>
        </header>
        <main id="main" className="container">{children}</main>
        <footer><div className="footer-inner"><strong>Beautiful Mess Ministries</strong><p>Every delivery has a story worth sharing.</p></div></footer>
      </body>
    </html>
  );
}
