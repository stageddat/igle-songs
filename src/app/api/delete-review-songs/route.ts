import { deleteReviewSong } from "@/modules/fileManager/deleteReviewSong";
import { validateAdminPassword } from "@/middleware/auth";
import { isSafeName } from "@/modules/shared/safePath";

export async function DELETE(req: Request) {
  try {
    const authResult = validateAdminPassword(req);

    if (!authResult.isValid) {
      return new Response(
        JSON.stringify({
          message: authResult.error || "Unauthorized",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json();
    const { song } = body;

    if (!isSafeName(song)) {
      return new Response(
        JSON.stringify({ message: "valid song name is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    await deleteReviewSong(song);

    return new Response(
      JSON.stringify({
        message: "review song deleted successfully",
        songName: song,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("error deleting review song:", error);
    return new Response(
      JSON.stringify({
        message:
          error instanceof Error ? error.message : "internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
