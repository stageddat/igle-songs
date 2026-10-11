import { NextRequest, NextResponse } from "next/server";

function getAllowedOrigin() {
  try {
    return new URL(process.env.R2_PUBLIC_URL ?? "").origin;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return NextResponse.json({ error: "Missing image URL" }, { status: 400 });
  }

  // solo permitir imagenes del bucket publico de r2 (evitar ssrf)
  const allowedOrigin = getAllowedOrigin();
  if (!allowedOrigin) {
    console.error("R2_PUBLIC_URL not configured in environment variables");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(imageUrl);
  } catch {
    return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
  }

  if (parsedUrl.origin !== allowedOrigin) {
    return NextResponse.json({ error: "URL not allowed" }, { status: 403 });
  }

  try {
    const response = await fetch(parsedUrl, {
      headers: {
        Accept: "image/*",
      },
      // no seguir redirecciones fuera del dominio permitido
      redirect: "error",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "image/png";
    if (!contentType.startsWith("image/")) {
      throw new Error(`Unexpected content type: ${contentType}`);
    }

    const imageBuffer = await response.arrayBuffer();

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Image proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 500 }
    );
  }
}
