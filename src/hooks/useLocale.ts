"use server";

import { cookies, headers } from "next/headers";
import { Locale, defaultLocale, isLocale } from "@/i18n/config";

const COOKIE_NAME = "NEXT_LOCALE";

// antes el chino se guardaba como "ch"; mantener las cookies antiguas
const LEGACY_LOCALES: Record<string, Locale> = { ch: "zh" };

function normalizeLocale(value: string | undefined): Locale | null {
  if (!value) return null;
  const locale = LEGACY_LOCALES[value] ?? value;
  return isLocale(locale) ? locale : null;
}

// "ca-ES,ca;q=0.9,es;q=0.8" -> primer idioma soportado por orden de preferencia
function detectFromAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;

  const preferred = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { lang: tag.split("-")[0].toLowerCase(), q: q ? Number(q.trim().slice(2)) : 1 };
    })
    .filter(({ lang, q }) => lang && q > 0)
    .sort((a, b) => b.q - a.q);

  return preferred.map(({ lang }) => normalizeLocale(lang)).find(Boolean) ?? null;
}

export async function getUserLocale(): Promise<Locale> {
  const fromCookie = normalizeLocale((await cookies()).get(COOKIE_NAME)?.value);
  if (fromCookie) return fromCookie;

  return detectFromAcceptLanguage((await headers()).get("accept-language")) ?? defaultLocale;
}

export async function setUserLocale(locale: Locale) {
  // es una server action: el valor llega del cliente y hay que validarlo
  if (!isLocale(locale)) return;

  (await cookies()).set(COOKIE_NAME, locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
}
