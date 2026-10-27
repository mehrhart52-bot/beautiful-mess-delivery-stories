export function storyReturn(value: unknown) {
  const fallback = { href: "/stories/all", label: "Back to all stories" };
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return fallback;
  try {
    const url = new URL(value, "https://stories.local");
    if (url.origin !== "https://stories.local") return fallback;
    const labels: Record<string, string> = {
      "/stories/mine": "Back to my stories",
      "/stories/all": url.searchParams.has("experience") ? "Back to stories" : "Back to all stories",
      "/themes": "Back to community themes",
    };
    const label = labels[url.pathname];
    return label ? { href: url.pathname + url.search, label } : fallback;
  } catch { return fallback; }
}
