import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Story } from "@/lib/types";
import StoryCard from "@/components/StoryCard";
import { isExperience } from "@/lib/experiences";

export default async function AllStories({ searchParams }: { searchParams: Promise<{ experience?: string }> }) {
  await requireUser();
  const requested = (await searchParams).experience;
  const selected = isExperience(requested) ? requested : null;
  const supabase = await createClient();
  let query = supabase.from("stories").select("*, profiles(display_name, email)").order("created_at", { ascending: false });
  if (selected) query = query.eq("experience", selected);
  const { data, error } = await query;
  if (error) throw new Error("Stories could not be loaded. Please try again.");
  const stories = (data ?? []) as Story[];
  return <><p className="eyebrow">Community</p><h1>{selected ? `${selected} stories` : "All connection stories"}</h1><p className="lead">See how connections are making a difference throughout our community.</p>{stories.length ? <div className="story-list">{stories.map(story => <StoryCard story={story} showAuthor key={story.id} returnTo={selected ? `/stories/all?experience=${encodeURIComponent(selected)}` : "/stories/all"} />)}</div> : <div className="empty"><h2>No stories have been shared {selected ? "in this category " : ""}yet</h2><p>The first story will appear here after it is saved.</p></div>}</>;
}
