// base de datos de canciones: data/songs.json del propio repo, leído y escrito con la api de github
// cada cambio es un commit, así queda historial y no depende del servidor

export type Song = {
  links: string[];
  uploadDate?: string;
};

export type SongsDb = {
  updateDate: string;
  songs: Record<string, Song>;
};

type Snapshot = {
  db: SongsDb;
  sha: string;
  etag: string | null;
  fetchedAt: number;
};

const GITHUB_API = "https://api.github.com";
const CACHE_TTL_MS = 30_000;
const MAX_WRITE_ATTEMPTS = 5;

// estado en globalThis para que todas las rutas compartan caché y cola de escritura
const state = globalThis as typeof globalThis & {
  __songsDbCache?: Snapshot | null;
  __songsDbQueue?: Promise<unknown>;
};

function getConfig() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_DB_REPO;
  const branch = process.env.GITHUB_DB_BRANCH || "main";
  const filePath = process.env.GITHUB_DB_PATH || "data/songs.json";

  if (!token || !repo) {
    throw new Error("GITHUB_TOKEN and GITHUB_DB_REPO must be set");
  }

  const encodedPath = filePath.split("/").map(encodeURIComponent).join("/");
  return {
    token,
    branch,
    url: `${GITHUB_API}/repos/${repo}/contents/${encodedPath}`,
  };
}

function githubHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "igle-songs",
  };
}

// validar antes de usar: nunca escribir encima de algo que no entendemos
function parseDb(raw: string): SongsDb {
  const data = JSON.parse(raw);

  if (!data || typeof data !== "object" || typeof data.songs !== "object" || data.songs === null) {
    throw new Error("invalid songs db: missing songs object");
  }

  for (const [name, song] of Object.entries(data.songs as Record<string, Song>)) {
    if (!song || !Array.isArray(song.links) || !song.links.every((l) => typeof l === "string")) {
      throw new Error(`invalid songs db: bad entry for "${name}"`);
    }
  }

  return data as SongsDb;
}

async function fetchSnapshot(): Promise<Snapshot> {
  const { token, branch, url } = getConfig();
  const cached = state.__songsDbCache;

  const headers = githubHeaders(token);
  // si no ha cambiado github responde 304 y no gasta límite de peticiones
  if (cached?.etag) headers["If-None-Match"] = cached.etag;

  const res = await fetch(`${url}?ref=${encodeURIComponent(branch)}`, {
    headers,
    cache: "no-store",
  });

  if (res.status === 304 && cached) {
    state.__songsDbCache = { ...cached, fetchedAt: Date.now() };
    return state.__songsDbCache;
  }

  if (!res.ok) {
    throw new Error(`github read failed: ${res.status} ${await res.text()}`);
  }

  const body = (await res.json()) as { content?: string; encoding?: string; sha: string };
  if (body.encoding !== "base64" || !body.content) {
    // la api de contents solo devuelve el contenido hasta 1MB
    throw new Error("unexpected github response, songs db may be over 1MB");
  }

  const snapshot: Snapshot = {
    db: parseDb(Buffer.from(body.content, "base64").toString("utf-8")),
    sha: body.sha,
    etag: res.headers.get("etag"),
    fetchedAt: Date.now(),
  };
  state.__songsDbCache = snapshot;
  return snapshot;
}

export async function getSongsDb(): Promise<SongsDb> {
  const cached = state.__songsDbCache;
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.db;
  }

  try {
    return (await fetchSnapshot()).db;
  } catch (error) {
    // si github falla, mejor servir la última copia que nada
    if (cached) {
      console.error("failed to refresh songs db, serving cached copy:", error);
      return cached.db;
    }
    throw error;
  }
}

// las escrituras van de una en una dentro del proceso
function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const queue = state.__songsDbQueue ?? Promise.resolve();
  const run = queue.then(task, task);
  state.__songsDbQueue = run.catch(() => {});
  return run;
}

function assertNoSongsLost(before: SongsDb, after: SongsDb) {
  const lost = Object.keys(before.songs).filter((name) => !after.songs[name]);
  if (lost.length > 0) {
    throw new Error(`refusing to write songs db, songs would be lost: ${lost.join(", ")}`);
  }
}

/**
 * Aplica un cambio a la base de datos y lo guarda como commit.
 *
 * Se intenta primero con la copia en memoria. Si está desactualizada (otro proceso escribió,
 * o github devolvió una lectura vieja), github rechaza el commit con 409 porque el sha no
 * coincide; entonces se vuelve a leer y se aplica el cambio otra vez sobre la versión nueva.
 * Así una lectura vieja nunca puede pisar datos, como mucho cuesta un reintento.
 * Devolver null significa que no hay nada que guardar.
 */
export function updateSongsDb(
  message: string,
  change: (db: SongsDb) => SongsDb | null
): Promise<SongsDb> {
  return enqueue(async () => {
    const { token, branch, url } = getConfig();
    let current = state.__songsDbCache ?? (await fetchSnapshot());

    for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt++) {
      const next = change(structuredClone(current.db));
      if (!next) return current.db;

      assertNoSongsLost(current.db, next);
      next.updateDate = new Date().toISOString();

      const res = await fetch(url, {
        method: "PUT",
        headers: { ...githubHeaders(token), "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          branch,
          sha: current.sha,
          content: Buffer.from(JSON.stringify(next, null, 2) + "\n", "utf-8").toString("base64"),
        }),
        cache: "no-store",
      });

      if (res.status === 409) {
        // copia desactualizada: esperar (0.5s, 1s, 2s...) y releer
        console.warn(`songs db conflict, retrying (${attempt}/${MAX_WRITE_ATTEMPTS})`);
        await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** (attempt - 1)));
        current = await fetchSnapshot();
        continue;
      }

      if (!res.ok) {
        throw new Error(`github write failed: ${res.status} ${await res.text()}`);
      }

      const body = (await res.json()) as { content: { sha: string } };
      state.__songsDbCache = { db: next, sha: body.content.sha, etag: null, fetchedAt: Date.now() };
      return next;
    }

    throw new Error("github write failed: too many conflicts");
  });
}
