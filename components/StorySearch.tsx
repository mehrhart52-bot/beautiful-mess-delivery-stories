import Link from "next/link";
import { storyListUrl } from "@/lib/story-search";

export default function StorySearch({ action, search, filters = {} }: {
  action: string; search: string; filters?: Record<string, string | null | undefined>;
}) {
  return <form action={action} method="get" className="story-search" role="search" aria-label="Find a story by ID">
    {Object.entries(filters).map(([name, value]) => value ? <input key={name} type="hidden" name={name} value={value} /> : null)}
    <div className="story-search-control">
      <input id="story-id-search" name="q" defaultValue={search} aria-label="Story ID" title="Enter a story ID, such as C0001" maxLength={64} />
      <button type="submit" aria-label="Search by story ID" title="Search by story ID">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" />
        </svg>
      </button>
    </div>
    {search && <Link className="story-search-clear" href={storyListUrl(action, filters)}>Clear search</Link>}
  </form>;
}
