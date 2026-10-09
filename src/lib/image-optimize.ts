// Shrinks photos in the browser before they go to storage: a 3 MB phone photo used
// as a blog cover becomes ~150 kB, which is what visitors (and Google's page-speed
// score) feel. GIF/SVG and anything already small enough are left untouched.

const MAX_WIDTH = 1600;
const QUALITY = 0.82;
const SKIP_TYPES = new Set(["image/gif", "image/svg+xml"]);

function toBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));
}

export async function optimizeImage(file: File, maxWidth = MAX_WIDTH): Promise<File> {
  if (SKIP_TYPES.has(file.type) || typeof createImageBitmap !== "function") return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file; // Not a format the browser can decode — upload as is.
  }
  const scale = Math.min(1, maxWidth / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return file;
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // WebP where the browser can encode it (older Safari falls back to PNG — use JPEG then).
  let blob = await toBlob(canvas, "image/webp");
  if (!blob || blob.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg");
  if (!blob || blob.size >= file.size) return file;

  const extension = blob.type === "image/webp" ? "webp" : "jpg";
  const name = `${file.name.replace(/\.[^.]+$/, "") || "obraz"}.${extension}`;
  return new File([blob], name, { type: blob.type });
}
