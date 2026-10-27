import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Story } from "@/lib/types";
import StoryCard from "@/components/StoryCard";
import Notice from "@/components/Notice";

import StorySearch from "@/components/StorySearch";
import { normalizeStorySearch, storyListUrl } from "@/lib/story-search";

export default async function MyStories({ searchParams }: { searchParams: Promise<{ message?: string; q?: string }> }) {
  const user = await requireUser();
  const search = normalizeStorySearch((await searchParams).q);
  const returnTo = storyListUrl("/stories/mine", { q: search });
  const supabase = await createClient();
  let query = supabase.from("stories").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  if (search) query = query.eq("story_code", search);
  const { data, error } = await query;
  if (error) throw new Error("Stories could not be loaded. Please try again.");
  const stories = (data ?? []) as Story[];
  return <><p className="eyebrow">My stories</p><h1>Your connection stories</h1><p className="lead">Open any story to read it or make changes.</p><Notice {...await searchParams} /><StorySearch action="/stories/mine" search={search} />{stories.length ? <div className="story-list">{stories.map(story => <StoryCard story={story} key={story.id} returnTo={returnTo} />)}</div> : <div className="empty"><h2>{search ? "No matching story in My Stories" : "No stories yet"}</h2><p>Your first connection story can be as short as a few sentences.</p><Link className="button" href="/stories/new">Create a story</Link></div>}</>;
}
