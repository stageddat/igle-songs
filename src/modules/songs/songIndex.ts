import { pinyin } from "pinyin-pro";
import { normalizeSearch, type SongListItem } from "@/lib/songSearch";

const collator = new Intl.Collator("zh-Hans-u-co-pinyin");

// el pinyin de un nombre no cambia: calcularlo una vez por canción
const cache = new Map<string, SongListItem>();

function toSongListItem(name: string): SongListItem {
  const cached = cache.get(name);
  if (cached) return cached;

  const options = { toneType: "none", type: "array", nonZh: "consecutive", v: true } as const;
  const item: SongListItem = {
    name,
    pinyin: normalizeSearch(pinyin(name, options).join("")),
    initials: normalizeSearch(pinyin(name, { ...options, pattern: "first" }).join("")),
  };
  cache.set(name, item);
  return item;
}

// lista ordenada por pinyin con las claves de búsqueda
export function buildSongIndex(names: string[]): SongListItem[] {
  return [...names].sort(collator.compare).map(toSongListItem);
}
