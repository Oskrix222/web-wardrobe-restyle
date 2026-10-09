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

// Vite replaces import.meta.env at build time; under Node it doesn't exist. Point it at
// process.env so modules like src/lib/seo.ts can be imported (tests set VITE_* there).
export async function load(url, context, next) {
  const result = await next(url, context);
  if (!url.startsWith(SRC.href) || result.source == null) return result;
  const source = String(result.source);
  if (!source.includes("import.meta.env")) return result;
  return { ...result, source: source.replaceAll("import.meta.env", "process.env") };
}
