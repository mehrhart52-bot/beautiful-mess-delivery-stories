export function normalizeStorySearch(value: unknown) {
  return typeof value === "string" ? value.trim().toUpperCase().slice(0, 64) : "";
}
export function storyListUrl(path: string, filters: Record<string, string | null | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
  return path + (params.size ? "?" + params.toString() : "");
}
