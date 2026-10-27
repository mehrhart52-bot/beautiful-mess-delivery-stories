import { requireUser } from "@/lib/auth";
import { createStory } from "@/app/actions";
import StoryForm from "@/components/StoryForm";
import Notice from "@/components/Notice";

export default async function NewStory({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireUser();
  return <><p className="eyebrow">Create</p><h1>Share a connection story</h1><p className="lead">A simple story can help others see the care behind each connection.</p><Notice {...await searchParams} /><StoryForm action={createStory} /></>;
}
