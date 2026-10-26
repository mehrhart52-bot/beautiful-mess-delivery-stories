import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const stopWords = new Set("a an and are as at be been but by for from had has have he her hers him his i in is it its me my of on or our ours she that the their them they this to was we were with you your then there when where who what into after before just very so not out up down about over again also can could would should did do does some any each more most other such no nor only own same than too will".split(" "));

function cloud(text: string) {
  const counts = new Map<string, number>();
  for (const raw of text.toLowerCase().match(/[a-z']+/g) ?? []) {
    const word = raw.replace(/^'|'$/g, "");
    if (word.length < 3 || stopWords.has(word)) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  const words = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 70);
  const max = words[0]?.[1] ?? 1;
  return words.map(([word, count]) => ({ word, count, size: Math.round(16 + (count / max) * 42) }));
}

export default async function WordCloud() {
  await requireUser();
  const supabase = await createClient();
  const { data } = await supabase.from("stories").select("body");
  const words = cloud((data ?? []).map(row => row.body).join(" "));
  return <><p className="eyebrow">Shared themes</p><h1>Current word cloud</h1><p className="lead">Larger words appear more often across all saved delivery stories. The cloud updates whenever a story is saved.</p>{words.length ? <div className="word-cloud" aria-label="Word cloud">{words.map(({ word, count, size }) => <span className="cloud-word" style={{ fontSize: size }} title={`${count} appearance${count === 1 ? "" : "s"}`} key={word}>{word}</span>)}</div> : <div className="empty"><h2>The word cloud is waiting for stories</h2><p>Words will appear here after the first delivery story is saved.</p></div>}</>;
}
