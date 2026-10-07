// Raw-pixel helpers on top of ffmpeg, so the generator needs no npm image libraries.
import { execFileSync } from "node:child_process";

const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { maxBuffer: 1 << 30, ...opts });

/** Size of an image or video (first video stream). */
export function probe(file) {
  const out = run("ffprobe", [
    "-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=width,height", "-of", "csv=p=0", file,
  ]);
  const [w, h] = out.toString().trim().split(",").map(Number);
  return { w, h };
}

/** Decodes an image — or one frame of a video, `at` seconds in — to packed RGB. */
export function readImage(file, { at } = {}) {
  const { w, h } = probe(file);
  const seek = at != null ? ["-ss", String(at)] : [];
  const data = run("ffmpeg", [
    "-v", "error", ...seek, "-i", file,
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-",
  ]);
  return { w, h, data };
}

export function writeImage({ w, h, data }, file) {
  run("ffmpeg", ["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${w}x${h}`, "-i", "-", file], {
    input: data,
  });
}

export function cropRows({ w, data }, y0, y1) {
  return { w, h: y1 - y0, data: Buffer.from(data.subarray(y0 * w * 3, y1 * w * 3)) };
}

// Nationale-Nederlanden's template: logo top-left, "Materiał marketingowy" top-right,
// and a speech-bubble frame whose solid #F7941D bar runs down the left edge.
// Coordinates are for a 1080 px wide graphic; `k` scales them to other widths.
export function nnMarks(k = 1) {
  const s = (r) => r.map((v) => Math.round(v * k));
  return { logo: s([40, 40, 152, 152]), label: s([870, 24, 1050, 102]) };
}

const isFrameOrange = (r, g, b) => r > 215 && g > 105 && g < 185 && b < 95 && r - b > 150;

/** Top edge of NN's orange frame — everything above it is clean photo. Null when there is no frame. */
export function findFrameTop({ w, h, data }) {
  const k = w / 1080;
  const x0 = Math.round(30 * k);
  const x1 = Math.round(170 * k);
  const need = Math.round(25 * k);
  const hits = (y) => {
    let count = 0;
    for (let x = x0; x < x1; x++) {
      const i = (y * w + x) * 3;
      if (isFrameOrange(data[i], data[i + 1], data[i + 2])) count++;
    }
    return count;
  };
  // The bar must hold for 20 rows, so a stray orange object in the photo doesn't count.
  for (let y = Math.round(200 * k); y < h - 20; y++) {
    let run = 0;
    while (run < 20 && hits(y + run) >= need) run++;
    if (run === 20) return y;
  }
  return null;
}

/**
 * Paints over rectangles with a smooth blend of their surroundings (Coons patch),
 * so no trace of NN's logo/label survives even where our own tabs don't reach.
 */
export function fillRects({ w, h, data }, rects) {
  const at = (x, y, c) => data[(y * w + x) * 3 + c];
  // Average a 3 px band just outside the edge — softens texture in the fill.
  const band = (x, y, dx, dy, c) => {
    let sum = 0;
    let n = 0;
    for (let t = 1; t <= 3; t++) {
      const xx = x + dx * t;
      const yy = y + dy * t;
      if (xx >= 0 && xx < w && yy >= 0 && yy < h) {
        sum += at(xx, yy, c);
        n++;
      }
    }
    return n ? sum / n : at(x, y, c);
  };
  for (const r of rects) {
    const x0 = Math.max(1, r[0]);
    const y0 = Math.max(1, r[1]);
    const x1 = Math.min(w - 2, r[2]);
    const y1 = Math.min(h - 2, r[3]);
    const W = x1 - x0;
    const H = y1 - y0;
    if (W < 2 || H < 2) continue;
    for (let c = 0; c < 3; c++) {
      const T = [];
      const B = [];
      const L = [];
      const R = [];
      for (let i = 0; i <= W; i++) {
        T[i] = band(x0 + i, y0, 0, -1, c);
        B[i] = band(x0 + i, y1, 0, 1, c);
      }
      for (let j = 0; j <= H; j++) {
        L[j] = band(x0, y0 + j, -1, 0, c);
        R[j] = band(x1, y0 + j, 1, 0, c);
      }
      for (let j = 0; j <= H; j++) {
        for (let i = 0; i <= W; i++) {
          const u = i / W;
          const v = j / H;
          const value =
            (1 - v) * T[i] + v * B[i] + (1 - u) * L[j] + u * R[j] -
            ((1 - u) * (1 - v) * T[0] + u * (1 - v) * T[W] + (1 - u) * v * B[0] + u * v * B[W]);
          data[((y0 + j) * w + x0 + i) * 3 + c] = Math.max(0, Math.min(255, Math.round(value)));
        }
      }
    }
  }
}
