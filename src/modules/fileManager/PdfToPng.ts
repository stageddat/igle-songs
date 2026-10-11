import path from "path";
import fs from "fs";
import { execCmd } from "../shared/execCmd";

export async function convertPdfToPng(
  pdfPath: string,
  outputDir: string,
  prefix = "slide"
) {
  try {
    const baseName = path.parse(pdfPath).name;

    console.log(`converting ${baseName}.pdf to png...`);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPrefix = path.join(outputDir, prefix);
    await execCmd("pdftoppm", ["-png", pdfPath, outputPrefix]);

    const pngFiles = fs
      .readdirSync(outputDir)
      .filter((file) => file.endsWith(".png"))
      .sort()
      .map((file) => path.join(outputDir, file));

    console.log(`${pngFiles.length} images exported to: ${outputDir}`);
    return pngFiles;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("failed converting pdf to png:", error.message);
    } else {
      console.error("failed converting pdf to png:", error);
    }
    return [];
  }
}
