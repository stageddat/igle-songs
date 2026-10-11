import path from "node:path";

// nombre de un solo segmento: sin separadores, sin "." ni ".."
export function isSafeName(name: unknown): name is string {
  return (
    typeof name === "string" &&
    name.length > 0 &&
    name !== "." &&
    name !== ".." &&
    !/[/\\\0]/.test(name)
  );
}

// unir nombres a baseDir sin permitir salir de ella (path traversal)
export function safeJoin(baseDir: string, ...names: string[]): string | null {
  if (!names.every(isSafeName)) return null;
  return path.join(baseDir, ...names);
}
