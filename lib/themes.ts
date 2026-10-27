export const themes = [
  { id: "ongoing_relationship", label: "A first encounter became an ongoing relationship", description: "Contact continued beyond the first encounter, such as another visit or regular conversations." },
  { id: "practical_obstacle", label: "Someone received help overcoming a practical obstacle", description: "A specific barrier to an everyday task was removed, such as transportation or completing a necessary step." },
  { id: "spiritual_growth", label: "This connection led to spiritual growth", description: "The story describes a change in faith, spiritual understanding, or spiritual practice." },
  { id: "family_safety", label: "Safety for a family member was improved", description: "A specific risk was reduced or a family member's surroundings became safer." },
  { id: "community_connection", label: "Connection to the community was improved", description: "Someone became connected to a community group, activity, or wider support network." },
  { id: "no_clear_theme", label: "No clear theme yet", description: "There is not enough detail to choose one of these outcomes, or none fits the story." },
] as const;
export type ThemeId = typeof themes[number]["id"];
export function isThemeId(value: unknown): value is ThemeId {
  return themes.some(theme => theme.id === value);
}
export function themeFor(value: unknown) {
  return themes.find(theme => theme.id === value);
}
