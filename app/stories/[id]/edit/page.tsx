import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateStory } from "@/app/actions";
import type { Story } from "@/lib/types";
import StoryForm from "@/components/StoryForm";
import Notice from "@/components/Notice";

export default async function EditStory({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("stories").select("*").eq("id", id).single();
  if (!data) notFound();
  const story = data as Story;
  if (story.user_id !== user.id) redirect(`/stories/${id}`);
  return <><p className="eyebrow">Edit</p><h1>Update your connection story</h1><Notice {...await searchParams} /><StoryForm action={updateStory} initial={story.body} experience={story.experience} theme={story.theme} id={story.id} /></>;
}
