import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import WordCloudGraphic from "@/components/WordCloud";
import Link from "next/link";
import { experiences, isExperience } from "@/lib/experiences";

const stopWords = new Set("a an and are as at be been but by for from had has have he her hers him his i in is it its me my of on or our ours she that the their them they this to was we were with you your then there when where who what into after before just very so not out up down about over again also can could would should did do does some any each more most other such no nor only own same than too will".split(" "));

function cloud(text: string) {
  const counts = new Map<string, number>();
  for (const raw of text.toLowerCase().match(/[a-z']+/g) ?? []) {
    const word = raw.replace(/^'|'$/g, "");
    if (word.length < 3 || stopWords.has(word) || word === "careportal" || word === "careportal's") continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  const words = [...counts].filter(([, count]) => count >= 5).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 12);
  const max = words[0]?.[1] ?? 1;
  return words.map(([word, count]) => ({ word, count, size: Math.round(16 + (count / max) * 42) }));
}

export default async function WordCloud({ searchParams }: { searchParams: Promise<{ experience?: string }> }) {
  await requireUser();
  const requested = (await searchParams).experience;
  const selected = isExperience(requested) ? requested : null;
  const supabase = await createClient();
  let query = supabase.from("stories").select("body");
  if (selected) query = query.eq("experience", selected);
  const { data, error } = await query;
  if (error) throw new Error("Stories could not be loaded. Please try again.");
  const words = cloud((data ?? []).map(row => row.body).join(" "));
  return <><p className="eyebrow">Shared themes</p><h1>Current word cloud</h1><p className="lead">The 12 most frequent words used at least five times in the selected collection appear here. The most frequent words are larger and placed toward the center. The cloud updates whenever a story is saved.</p><nav className="cloud-filters" aria-label="Story collection"><Link className="button secondary" href="/word-cloud" aria-current={!selected ? "page" : undefined}>All stories</Link>{experiences.map(option => <Link key={option} className="button secondary" href={`/word-cloud?experience=${encodeURIComponent(option)}`} aria-current={selected === option ? "page" : undefined}>{option}</Link>)}</nav><p>Showing: <strong>{selected || "All stories"}</strong></p>{words.length ? <WordCloudGraphic words={words} /> : <div className="empty"><h2>No words have reached five appearances yet</h2><p>As more stories are shared, words used five times or more will appear here.</p></div>}</>;
}
