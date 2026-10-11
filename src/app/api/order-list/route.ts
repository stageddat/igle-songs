import { validateAdminPassword } from "@/middleware/auth";
import { updateSongsDb } from "@/modules/db/songsDb";

export async function POST(req: Request) {
  const authResult = validateAdminPassword(req);
  if (!authResult.isValid) {
    return new Response(
      JSON.stringify({ message: authResult.error || "Unauthorized" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const newJson = await updateSongsDb("chore(songs): sort by pinyin", (db) => {
      // ordenar por pinyin
      const keys = Object.keys(db.songs);
      const sortedKeys = [...keys].sort((a, b) =>
        a.localeCompare(b, "zh-Hans-u-co-pinyin")
      );

      // si ya está ordenado no hace falta commit
      if (sortedKeys.every((key, i) => key === keys[i])) {
        return null;
      }

      const sortedSongs: typeof db.songs = {};
      for (const key of sortedKeys) {
        sortedSongs[key] = db.songs[key];
      }

      return { ...db, songs: sortedSongs };
    });

    return new Response(JSON.stringify(newJson), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("error in /order.list", error);
    return new Response(
      JSON.stringify({ error: "failed to read or write songs db" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
