import { promises as fs } from "fs";
import path from "path";

export async function POST() {
  try {
    const filePath = path.resolve(process.cwd(), "data/songs.json");

    const data = await fs.readFile(filePath, "utf-8");
    const json = JSON.parse(data) as {
      updateDate: string;
      songs: Record<string, unknown>;
    };

    // ordenar por pinyin
    const sortedKeys = Object.keys(json.songs).sort((a, b) =>
      a.localeCompare(b, "zh-Hans-u-co-pinyin")
    );

    const sortedSongs: Record<string, unknown> = {};
    for (const key of sortedKeys) {
      sortedSongs[key] = json.songs[key];
    }

    // rescribir base de datos
    const newJson = {
      ...json,
      songs: sortedSongs,
    };

    await fs.writeFile(filePath, JSON.stringify(newJson, null, 2), "utf-8");

    return new Response(JSON.stringify(newJson), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("error in /order.list", error);
    return new Response(
      JSON.stringify({ error: "failed to read or write songs.json" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
