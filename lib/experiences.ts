export const experiences = ["CarePortal", "Beautiful Mess Ministries", "Other"] as const;
export type Experience = typeof experiences[number];
export function isExperience(value: unknown): value is Experience {
  return experiences.some(experience => experience === value);
}
