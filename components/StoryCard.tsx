import Link from "next/link";
import { preview, type Story } from "@/lib/types";

export default function StoryCard({ story, showAuthor = false, returnTo = "/stories/all" }: { story: Story; showAuthor?: boolean; returnTo?: string }) {
  return (
    <article className="story-card">
      <div className="story-meta">
        {showAuthor && <strong>{story.profiles?.display_name?.trim().split(/\s+/)[0] || "Community member"}</strong>}
        <span>{new Date(story.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
      </div>
      <p>{preview(story.body)}</p>
      <Link className="text-link" href={`/stories/${story.id}?returnTo=${encodeURIComponent(returnTo)}`}>Read the full story <span aria-hidden="true">→</span></Link>
    </article>
  );
}
