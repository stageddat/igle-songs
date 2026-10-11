import fs from "node:fs/promises";
import path from "node:path";
import { safeJoin } from "@/modules/shared/safePath";

export async function deleteReviewSong(songName: string) {
  const pngsDir = path.join(process.cwd(), "/data/pngs");
  const songDir = safeJoin(pngsDir, songName);
  if (!songDir) {
    throw new Error(`invalid song name "${songName}"`);
  }

  try {
    await fs.access(songDir);

    await fs.rm(songDir, { recursive: true, force: true });

    console.log(`successfully deleted review song folder: ${songDir}`);

    return {
      songName,
      deletedPath: songDir,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "ENOENT") {
      throw new Error(`review song folder "${songName}" not found`);
    }
    throw new Error(
      `failed to delete review song "${songName}": ${
        error instanceof Error ? error.message : "unknown error"
      }`
    );
  }
}
