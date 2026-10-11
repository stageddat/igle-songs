// búsqueda de canciones compartida entre servidor y cliente (sin pinyin-pro, que pesa mucho)

export type SongListItem = {
  name: string;
  // pinyin completo sin tonos ni espacios: "yesulingwo"
  pinyin: string;
  // iniciales: "yslw"
  initials: string;
};

// minúsculas, sin tonos ni espacios/puntuación; ü se escribe v como en los teclados de pinyin
export function normalizeSearch(text: string) {
  return text
    .toLowerCase()
    .replace(/ü/g, "v")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[\s\-_.,，。·'"]/g, "");
}

// `query` ya normalizada con normalizeSearch
export function matchesSong(song: SongListItem, query: string) {
  if (!query) return true;
  return (
    normalizeSearch(song.name).includes(query) ||
    song.pinyin.includes(query) ||
    song.initials.includes(query)
  );
}
