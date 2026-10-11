export type Locale = (typeof locales)[number];

export const locales = ["es", "en", "ca", "zh"] as const;
export const defaultLocale: Locale = "zh";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}
