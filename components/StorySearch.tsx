import Link from "next/link";
import { storyListUrl } from "@/lib/story-search";

export default function StorySearch({ action, search, filters = {} }: {
  action: string; search: string; filters?: Record<string, string | null | undefined>;
}) {
  return <form action={action} method="get" className="story-search">
    {Object.entries(filters).map(([name, value]) => value ? <input key={name} type="hidden" name={name} value={value} /> : null)}
    <label htmlFor="story-id-search">Find a story by its ID</label>
    <div className="page-actions">
      <input id="story-id-search" name="q" defaultValue={search} placeholder="For example, C0001" maxLength={64} />
      <button className="button" type="submit">Search</button>
      {search && <Link className="button secondary" href={storyListUrl(action, filters)}>Clear search</Link>}
    </div>
    <p className="field-help">Searches this list only. Enter the full ID; upper- or lowercase works.</p>
  </form>;
}
