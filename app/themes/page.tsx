import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { experiences, isExperience } from "@/lib/experiences";
import { themes, themeFor } from "@/lib/themes";
import type { Story } from "@/lib/types";
import StoryCard from "@/components/StoryCard";

import StorySearch from "@/components/StorySearch";
import { normalizeStorySearch, storyListUrl } from "@/lib/story-search";

export default async function CommunityThemes({ searchParams }: {
  searchParams: Promise<{ experience?: string; theme?: string; page?: string; q?: string }>;
}) {
  await requireUser();
  const params = await searchParams;
  const search = normalizeStorySearch(params.q);
  const experience = isExperience(params.experience) ? params.experience : null;
  const selected = themeFor(params.theme);
  const supabase = await createClient();
  function url(theme?: string, page = 1, collection = experience) {
    const query = new URLSearchParams();
    if (collection) query.set("experience", collection);
    if (theme) query.set("theme", theme);
    if (theme && search) query.set("q", search);
    if (page > 1) query.set("page", String(page));
    return `/themes?${query}`;
  }
  const filters = <nav className="cloud-filters" aria-label="Theme story collection">
    <Link className="button secondary" href={url(selected?.id, 1, null)} aria-current={!experience ? "page" : undefined}>All</Link>
    {experiences.map(option => <Link className="button secondary" key={option} href={url(selected?.id, 1, option)} aria-current={experience === option ? "page" : undefined}>{option}</Link>)}
  </nav>;
  if (selected) {
    const parsed = Number(params.page);
    const page = Number.isSafeInteger(parsed) && parsed > 0 ? Math.min(parsed, 100000) : 1;
    let query = supabase.from("stories").select("*, profiles(display_name, email)", { count: "exact" }).eq("theme", selected.id);
    if (experience) query = query.eq("experience", experience);
    if (search) query = query.eq("story_code", search);
    const { data, count, error } = await query.order("created_at", { ascending: false }).order("id").range((page - 1) * 20, page * 20 - 1);
    if (error) throw new Error("Theme stories could not be loaded. Please try again.");
    const stories = (data ?? []) as Story[];
    return <>
      <Link className="text-link" href={url()}>← All community themes</Link>
      <p className="eyebrow">Community Themes · {experience || "All stories"}</p>
      <h1>{selected.label}</h1><p className="lead">{selected.description}</p>
      {filters}<StorySearch action="/themes" search={search} filters={{ theme: selected.id, experience }} /><p>{count ?? 0} {(count ?? 0) === 1 ? "story" : "stories"}</p>
      {stories.length ? <div className="story-list">{stories.map(story => <StoryCard key={story.id} story={story} showAuthor returnTo={url(selected.id, page)} />)}</div> : <div className="empty">{search ? "No matching story in this theme and collection." : "No stories to display here yet."}</div>}
      <div className="page-actions">
        {page > 1 && <Link className="button secondary" href={url(selected.id, page - 1)}>Previous</Link>}
        {page * 20 < (count ?? 0) && <Link className="button secondary" href={url(selected.id, page + 1)}>Next</Link>}
      </div>
    </>;
  }
  const cards = await Promise.all(themes.map(async theme => {
    let query = supabase.from("stories").select("id", { count: "exact", head: true }).eq("theme", theme.id);
    if (experience) query = query.eq("experience", experience);
    const { count, error } = await query;
    if (error) throw new Error("Community themes could not be loaded. Please try again.");
    return { ...theme, count: count ?? 0 };
  }));
  return <>
    <p className="eyebrow">Community Themes · {experience || "All stories"}</p>
    <h1>What happened or changed?</h1>
    <p className="lead">Explore the primary themes chosen by story authors. Choose a theme to read its stories.</p>
    {filters}
    <div className="dashboard-grid">{cards.map(theme => <Link className="action-card" key={theme.id} href={url(theme.id)}>
      <h2>{theme.label}</h2><p>{theme.description}</p>
      <strong>{theme.count} {theme.count === 1 ? "story" : "stories"}</strong>
      <p className="text-link">Read stories →</p>
    </Link>)}</div>
  </>;
}
