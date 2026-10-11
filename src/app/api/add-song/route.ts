import { NextRequest, NextResponse } from "next/server";
import { processFiles } from "@/modules/fileManager/fileManager";
import { validateAdminPassword } from "@/middleware/auth";
import { isSafeName } from "@/modules/shared/safePath";
import fs from "node:fs/promises";
import path from "node:path";

const pptxsDir = path.join(process.cwd(), "/data/pptxs");
const pngsDir = path.join(process.cwd(), "/data/pngs");

let isProcessing = false;

function isValidFile(file: File, mode: "pptx" | "images"): boolean {
  if (mode === "pptx") {
    return (
      file.type ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    );
  } else {
    return ["image/png", "image/jpeg", "image/jpg"].includes(file.type);
  }
}

async function ensureDirectoryExists(dirPath: string) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error);
    throw error;
  }
}

// limpiar nombres. "_" se reserva para separar dos canciones en un mismo
// pptx (ver filterSongs), asi que no puede aparecer en el titulo
function sanitizeTitle(title: string): string {
  return title
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/[_\s]+/g, " ")
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const authResult = validateAdminPassword(request);

    if (!authResult.isValid) {
      return NextResponse.json(
        { message: authResult.error || "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    const title = formData.get("title") as string;
    const mode = formData.get("mode") as "pptx" | "images";
    const files = formData.getAll("files") as File[];

    if (!title?.trim()) {
      return NextResponse.json(
        { message: "Title is required" },
        { status: 400 }
      );
    }

    if (!mode || !["pptx", "images"].includes(mode)) {
      return NextResponse.json({ message: "Invalid mode" }, { status: 400 });
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { message: "No files provided" },
        { status: 400 }
      );
    }

    for (const file of files) {
      if (!isValidFile(file, mode)) {
        const expectedTypes =
          mode === "pptx" ? "PowerPoint (.pptx)" : "images (.png, .jpg, .jpeg)";
        return NextResponse.json(
          { message: `Invalid file type. Expected: ${expectedTypes}` },
          { status: 400 }
        );
      }
    }

    if (mode === "pptx" && files.length > 1) {
      return NextResponse.json(
        { message: "Only one PPTX file is allowed" },
        { status: 400 }
      );
    }

    await ensureDirectoryExists(pptxsDir);
    await ensureDirectoryExists(pngsDir);

    const sanitizedTitle = sanitizeTitle(title);
    if (!isSafeName(sanitizedTitle)) {
      return NextResponse.json({ message: "Invalid title" }, { status: 400 });
    }

    if (mode === "pptx") {
      const file = files[0];
      const fileName = `${sanitizedTitle}.pptx`;
      const filePath = path.join(pptxsDir, fileName);
      try {
        await fs.access(filePath);
        return NextResponse.json(
          { message: "A file with this title already exists" },
          { status: 409 }
        );
      } catch {}

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.writeFile(filePath, buffer);

      console.log(`PPTX file saved: ${fileName}`);
    } else {
      const songDir = path.join(pngsDir, sanitizedTitle);
      try {
        await fs.access(songDir);
        return NextResponse.json(
          { message: "A song with this title already exists" },
          { status: 409 }
        );
      } catch {}

      await ensureDirectoryExists(songDir);
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExtension = path.extname(file.name).toLowerCase();
        const fileName = `slide-${i}${fileExtension}`;
        const filePath = path.join(songDir, fileName);

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await fs.writeFile(filePath, buffer);

        console.log(`Image saved: ${sanitizedTitle}/${fileName}`);
      }
    }

    if (!isProcessing) {
      isProcessing = true;
      processFiles()
        .catch((error) => {
          console.error("Error in processFiles:", error);
        })
        .finally(() => {
          isProcessing = false;
        });
    }

    return NextResponse.json({
      message: "Files uploaded successfully and processing started",
      title: sanitizedTitle,
      mode,
      filesCount: files.length,
    });
  } catch (error) {
    console.error("Error in POST handler:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
