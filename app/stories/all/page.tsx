import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Story } from "@/lib/types";
import StoryCard from "@/components/StoryCard";

export default async function AllStories() {
  await requireUser();
  const supabase = await createClient();
  const { data } = await supabase.from("stories").select("*, profiles(display_name, email)").order("created_at", { ascending: false });
  const stories = (data ?? []) as Story[];
  return <><p className="eyebrow">Community</p><h1>All delivery stories</h1><p className="lead">See how deliveries are making a difference throughout our community.</p>{stories.length ? <div className="story-list">{stories.map(story => <StoryCard story={story} showAuthor key={story.id} />)}</div> : <div className="empty"><h2>No stories have been shared yet</h2><p>The first story will appear here after it is saved.</p></div>}</>;
}
