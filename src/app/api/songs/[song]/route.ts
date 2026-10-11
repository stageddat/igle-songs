import { NextResponse } from "next/server";
import { getSongsDb } from "@/modules/db/songsDb";

export async function GET(
  request: Request,
  context: { params: Promise<{ song: string }> }
) {
  try {
    const { song } = await context.params;
    const songName = decodeURIComponent(song);
    const db = await getSongsDb();

    const songData = db.songs[songName];

    if (!songData) {
      return new NextResponse("song not found", { status: 404 });
    }

    return NextResponse.json(songData.links);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("failed to get song:", error.message);
      return new NextResponse("Internal Server Error", { status: 500 });
    }
    console.error("failed to get song:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
