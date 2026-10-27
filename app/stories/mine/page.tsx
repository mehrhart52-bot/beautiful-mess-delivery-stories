import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Story } from "@/lib/types";
import StoryCard from "@/components/StoryCard";
import Notice from "@/components/Notice";

export default async function MyStories({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase.from("stories").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  const stories = (data ?? []) as Story[];
  return <><p className="eyebrow">My stories</p><h1>Your connection stories</h1><p className="lead">Open any story to read it or make changes.</p><Notice {...await searchParams} />{stories.length ? <div className="story-list">{stories.map(story => <StoryCard story={story} key={story.id} returnTo="/stories/mine" />)}</div> : <div className="empty"><h2>No stories yet</h2><p>Your first connection story can be as short as a few sentences.</p><Link className="button" href="/stories/new">Create a story</Link></div>}</>;
}
