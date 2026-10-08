// Node resolve hook for tests: "@/lib/x" → src/lib/x.ts (the app's Vite alias).
import { statSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SRC = new URL("../../src/", import.meta.url);
const isFile = (url) => {
  try {
    return statSync(fileURLToPath(url)).isFile();
  } catch {
    return false;
  }
};

export async function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) {
    const base = new URL(specifier.slice(2), SRC).href;
    for (const ext of ["", ".ts", ".tsx"]) {
      if (isFile(new URL(base + ext))) return next(base + ext, context);
    }
  }
  return next(specifier, context);
}
