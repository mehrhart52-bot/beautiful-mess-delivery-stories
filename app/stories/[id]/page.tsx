import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Story } from "@/lib/types";
import Notice from "@/components/Notice";
import DeleteStoryButton from "@/components/DeleteStoryButton";

export default async function StoryPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ message?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("stories").select("*, profiles(display_name, email)").eq("id", id).single();
  if (!data) notFound();
  const story = data as Story;
  const canDelete = story.user_id === user.id || user.role === "admin";
  return <><p className="eyebrow">Delivery story</p><h1>A moment of care</h1><Notice {...await searchParams} /><div className="story-meta"><strong>{story.profiles?.display_name || "Community member"}</strong><span>{new Date(story.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span></div><article className="panel story-full" style={{ padding: 30 }}>{story.body}</article><div className="page-actions">{story.user_id === user.id && <Link className="button" href={`/stories/${story.id}/edit`}>Edit my story</Link>}{canDelete && <DeleteStoryButton id={story.id} />}<Link className="button secondary" href="/stories/all">Back to all stories</Link></div></>;
}
