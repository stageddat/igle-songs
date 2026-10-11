import { NextResponse } from "next/server";
import { getSongsDb } from "@/modules/db/songsDb";

export async function GET() {
  try {
    const db = await getSongsDb();
    return NextResponse.json(Object.keys(db.songs));
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("error reading songs db:", error.message);
      return new NextResponse("Internal Server Error", { status: 500 });
    }
    console.error("error reading songs db:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
