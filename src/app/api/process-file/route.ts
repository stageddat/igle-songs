import { NextResponse } from "next/server";
import { processFiles } from "@/modules/fileManager/fileManager";
import { validateAdminPassword } from "@/middleware/auth";

let isProcessing = false;

export async function GET(req: Request) {
  const authResult = validateAdminPassword(req);
  if (!authResult.isValid) {
    return NextResponse.json(
      { message: authResult.error || "Unauthorized" },
      { status: 401 }
    );
  }

  if (isProcessing) {
    return NextResponse.json({ message: "Processing already in progress" });
  }

  isProcessing = true;

  // Lanzar el proceso en segundo plano sin esperar a que termine
  processFiles()
    .catch(console.error)
    .finally(() => {
      isProcessing = false;
    });

  // Retornar respuesta inmediata
  return NextResponse.json({ message: "Processing started" });
}
