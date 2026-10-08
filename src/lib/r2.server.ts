// Cloudflare R2 (S3-compatible storage, 10 GB free) for reel videos — too big for
// Supabase Free (50 MB per file). The browser uploads straight to R2 with a
// short-lived presigned URL; Instagram/Facebook download from the public URL;
// the publisher deletes the file once the reel is out. Server-only.
//
// Worker settings: R2_ACCOUNT_ID, R2_BUCKET, R2_PUBLIC_URL (e.g. https://pub-….r2.dev)
// and secrets R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY (R2 → Manage API tokens).

const env = (name: string) => process.env[name] ?? "";

export const r2Configured = () =>
  ["R2_ACCOUNT_ID", "R2_BUCKET", "R2_PUBLIC_URL", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"].every(
    (name) => Boolean(env(name)),
  );

const encoder = new TextEncoder();
const hex = (buf: ArrayBuffer) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const sha256 = async (text: string) =>
  hex(await crypto.subtle.digest("SHA-256", encoder.encode(text)));

async function hmac(key: ArrayBuffer | Uint8Array<ArrayBuffer>, data: string) {
  const k = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  return crypto.subtle.sign("HMAC", k, encoder.encode(data));
}

// RFC 3986 encoding, as SigV4 expects (keeps "/" in object keys).
const encodePath = (key: string) =>
  key
    .split("/")
    .map((part) =>
      encodeURIComponent(part).replace(
        /[!'()*]/g,
        (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
      ),
    )
    .join("/");

/** SigV4 query-string signature for one request against the bucket. */
async function presign(
  method: "GET" | "PUT" | "DELETE",
  key: string,
  expiresSeconds: number,
  params: Record<string, string> = {},
) {
  const host = `${env("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`;
  // An empty key addresses the bucket itself (listing).
  const path = key ? `/${env("R2_BUCKET")}/${encodePath(key)}` : `/${env("R2_BUCKET")}`;
  const now = new Date();
  const amzDate = now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  const day = amzDate.slice(0, 8);
  const scope = `${day}/auto/s3/aws4_request`;

  const query = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${env("R2_ACCESS_KEY_ID")}/${scope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresSeconds),
    "X-Amz-SignedHeaders": "host",
    ...params,
  });
  const canonicalQuery = [...query.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  const canonicalRequest = [
    method,
    path,
    canonicalQuery,
    `host:${host}`,
    "",
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, await sha256(canonicalRequest)].join(
    "\n",
  );

  let signingKey = await hmac(encoder.encode(`AWS4${env("R2_SECRET_ACCESS_KEY")}`), day);
  for (const part of ["auto", "s3", "aws4_request"]) signingKey = await hmac(signingKey, part);
  const signature = hex(await hmac(signingKey, stringToSign));

  return `https://${host}${path}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}

export function r2PublicUrl(key: string) {
  return `${env("R2_PUBLIC_URL").replace(/\/$/, "")}/${encodePath(key)}`;
}

/** URL the browser PUTs the video to (valid 1 hour — enough for a big file on slow Wi-Fi). */
export function r2UploadUrl(key: string) {
  return presign("PUT", key, 3600);
}

export async function r2Delete(key: string) {
  const res = await fetch(await presign("DELETE", key, 300), { method: "DELETE" });
  if (!res.ok && res.status !== 404)
    throw new Error(`R2: nie udało się usunąć pliku (HTTP ${res.status}).`);
}

/** Total size of everything in the bucket (ListObjectsV2, 1000 keys per page). */
export async function r2StoredBytes(): Promise<number> {
  let total = 0;
  let token = "";
  for (;;) {
    const params: Record<string, string> = { "list-type": "2" };
    if (token) params["continuation-token"] = token;
    const res = await fetch(await presign("GET", "", 300, params));
    if (!res.ok)
      throw new Error(`R2: nie udało się sprawdzić zajętego miejsca (HTTP ${res.status}).`);
    const xml = await res.text();
    for (const m of xml.matchAll(/<Size>(\d+)<\/Size>/g)) total += Number(m[1]);
    const next = /<IsTruncated>true<\/IsTruncated>/.test(xml)
      ? /<NextContinuationToken>([^<]+)<\/NextContinuationToken>/.exec(xml)?.[1]
      : undefined;
    if (!next) return total;
    token = next.replace(/&amp;/g, "&");
  }
}
