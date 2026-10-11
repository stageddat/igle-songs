import path from "path";
import { execCmd } from "../shared/execCmd";

export async function convertPptxToPdf(pptxPath: string, outputDir: string) {
  try {
    const baseName = path.parse(pptxPath).name;
    const pdfPath = path.join(outputDir, baseName + ".pdf");

    console.log(`converting ${path.basename(pptxPath)} to pdf...`);

    await execCmd("soffice", [
      "--headless",
      "--convert-to",
      "pdf",
      "--outdir",
      outputDir,
      pptxPath,
    ]);

    console.log(`pdf generated: ${pdfPath}`);
    return pdfPath;
  } catch (e) {
    console.error(`failed to convert ${pptxPath} to pdf:`, e);
    return "";
  }
}
