import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Story } from "@/lib/types";

// Only first names are shared. Full profiles remain private to owners and admins.
export async function withStoryAuthors(stories: Story[]): Promise<Story[]> {
  if (!stories.length) return stories;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("story_authors", {
    author_ids: [...new Set(stories.map(story => story.user_id))],
  });
  if (error) throw new Error("Story authors could not be loaded. Please check that the database updates have been applied.");
  const authors = new Map<string, string>((data ?? []).map((author: { id: string; display_name: string }) => [author.id, author.display_name]));
  return stories.map(story => ({ ...story, profiles: { display_name: authors.get(story.user_id) || "Community member" } }));
}
