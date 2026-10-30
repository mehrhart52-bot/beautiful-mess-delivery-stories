import Link from "next/link";
import { requireUser } from "@/lib/auth";

const choices = [
  ["1", "Create a connection story", "Share a recent CarePortal, ministry, or other experience in 300 words or fewer.", "/stories/new"],
  ["2", "View my connection stories", "Read and edit the stories you have shared.", "/stories/mine"],
  ["3", "View all connection stories", "Celebrate the experiences shared by the whole community.", "/stories/all"],
  ["4", "View the current word cloud", "See the words and themes appearing across every story.", "/word-cloud"],
  ["5", "Explore Community Themes", "Discover what happened or changed, and read the stories behind each theme.", "/themes"],
];

export default async function Dashboard() {
  const user = await requireUser();
  return <>
    <p className="eyebrow">Welcome, {user.display_name}</p>
    <h1>Connection Stories</h1>
    <p className="lead">Share the moments of care and hope that bring people together.</p>
    <div className="dashboard-grid">{choices.map(([number, title, copy, href]) => <Link className="action-card" href={href} key={number}><span className="action-number">{number}</span><h2>{title}</h2><p>{copy}</p><span className="text-link">Open <span aria-hidden="true">→</span></span></Link>)}</div>
  </>;
}
