export type Profile = {
  id: string;
  email: string;
  display_name: string;
  role: "user" | "admin";
  active: boolean;
  created_at: string;
};

export type Story = {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  profiles?: { display_name: string; email: string } | null;
};

export function wordCount(value: string) {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

export function preview(value: string, length = 210) {
  if (value.length <= length) return value;
  const shortened = value.slice(0, length);
  return `${shortened.slice(0, shortened.lastIndexOf(" "))}…`;
}
