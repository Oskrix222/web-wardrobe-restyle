// Hard limits so a misclick can never run up a bill or lock the free Supabase project.
// Every upload asks here first; the publisher counts what Instagram/Facebook download
// from Supabase. The monthly counter lives in content_integrations (provider "usage"),
// which only the server can read or write. Server-only.
import { r2Configured, r2StoredBytes } from "@/lib/r2.server";
import type { AdminClient } from "@/lib/supabase-admin.server";
import type { Json } from "@/integrations/supabase/types";

const MB = 1024 * 1024;
const GB = 1024 * MB;

export const LIMITS = {
  /** Everything the content system moves through Supabase in one calendar month. */
  monthlyTransfer: 9 * GB,
  /** Files kept in R2 at once (10 GB free, card attached — never go past it). */
  r2Stored: 9 * GB,
  /** Files kept in Supabase Storage at once (1 GB free). */
  supabaseStored: 900 * MB,
  reel: 300 * MB,
  supabaseVideo: 50 * MB,
  zip: 50 * MB,
  image: 10 * MB,
} as const;

export type UploadKind = "reel" | "zip" | "image";
type Usage = { month: string; bytes: number };

const gb = (bytes: number) => `${(bytes / GB).toFixed(2).replace(".", ",")} GB`;
const mb = (bytes: number) => `${Math.round(bytes / MB)} MB`;

/** "2026-10" in Polish time — the counter resets on the 1st. */
export const currentMonth = (now = new Date()) =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Warsaw", year: "numeric", month: "2-digit" })
    .format(now)
    .slice(0, 7);

export async function monthlyUsage(db: AdminClient): Promise<Usage> {
  const { data } = await db
    .from("content_integrations")
    .select("data")
    .eq("provider", "usage")
    .maybeSingle();
  const stored = (data?.data ?? {}) as Partial<Usage>;
  const month = currentMonth();
  return { month, bytes: stored.month === month ? Number(stored.bytes) || 0 : 0 };
}

export class LimitError extends Error {}

/** Adds `bytes` to this month's counter, or throws if that would cross the limit. */
export async function countTransfer(db: AdminClient, bytes: number): Promise<Usage> {
  const usage = await monthlyUsage(db);
  if (usage.bytes + bytes > LIMITS.monthlyTransfer) {
    throw new LimitError(
      `Miesięczny limit transferu (${gb(LIMITS.monthlyTransfer)}) — zużyto już ${gb(usage.bytes)}. ` +
        "Wgrywanie i publikacja ruszą same 1. dnia następnego miesiąca.",
    );
  }
  const next = { month: usage.month, bytes: usage.bytes + bytes };
  await db.from("content_integrations").upsert({
    provider: "usage",
    data: next as Json,
    updated_at: new Date().toISOString(),
  });
  return next;
}

/** Total size of every file in the given Supabase Storage buckets. */
export async function supabaseStoredBytes(
  db: AdminClient,
  buckets = ["content", "blog-images"],
): Promise<number> {
  let total = 0;
  const walk = async (bucket: string, prefix: string): Promise<void> => {
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await db.storage.from(bucket).list(prefix, { limit: 1000, offset });
      if (error || !data) return;
      for (const entry of data) {
        const path = prefix ? `${prefix}/${entry.name}` : entry.name;
        // Folders come back without an id or metadata.
        if (entry.id == null) await walk(bucket, path);
        else total += Number((entry.metadata as { size?: number } | null)?.size) || 0;
      }
      if (data.length < 1000) return;
    }
  };
  for (const bucket of buckets) await walk(bucket, "");
  return total;
}

/**
 * Checks one upload against every limit and counts it. Returns where a reel should go:
 * R2 when it's set up, otherwise Supabase (50 MB per file).
 */
export async function reserveUpload(
  db: AdminClient,
  kind: UploadKind,
  bytes: number,
): Promise<{ store: "r2" | "supabase" }> {
  if (!(bytes > 0)) throw new LimitError("Pusty plik.");
  const store = kind === "reel" && r2Configured() ? "r2" : "supabase";

  const perFile =
    kind === "zip"
      ? LIMITS.zip
      : kind === "image"
        ? LIMITS.image
        : store === "r2"
          ? LIMITS.reel
          : LIMITS.supabaseVideo;
  if (bytes > perFile) {
    throw new LimitError(
      kind === "reel" && store === "supabase"
        ? "Plik ma ponad 50 MB, a magazyn na duże rolki (R2) nie jest jeszcze podłączony. Panel → Połączenia."
        : `Plik ma ${mb(bytes)} — limit to ${mb(perFile)} na jeden plik.`,
    );
  }

  if (store === "r2") {
    const stored = await r2StoredBytes();
    if (stored + bytes > LIMITS.r2Stored) {
      throw new LimitError(
        `Magazyn rolek jest prawie pełny (${gb(stored)} z ${gb(LIMITS.r2Stored)}). ` +
          "Rolki znikają same po publikacji — poczekaj albo usuń nieużywane.",
      );
    }
    // R2 → Instagram/Facebook is free, so reels in R2 don't touch the monthly counter.
    return { store };
  }

  const stored = await supabaseStoredBytes(db);
  if (stored + bytes > LIMITS.supabaseStored) {
    throw new LimitError(
      `Magazyn plików jest prawie pełny (${mb(stored)} z ${mb(LIMITS.supabaseStored)}). ` +
        "Usuń stare ZIP-y albo zakończone kampanie.",
    );
  }
  await countTransfer(db, bytes);
  return { store };
}

/** Numbers for Panel → Połączenia. */
export async function usageSummary(db: AdminClient) {
  const [usage, supabaseStored, r2Stored] = await Promise.all([
    monthlyUsage(db),
    supabaseStoredBytes(db).catch(() => null),
    r2Configured() ? r2StoredBytes().catch(() => null) : Promise.resolve(null),
  ]);
  return {
    month: usage.month,
    transfer: { used: usage.bytes, limit: LIMITS.monthlyTransfer },
    supabase: { used: supabaseStored, limit: LIMITS.supabaseStored },
    r2: { used: r2Stored, limit: LIMITS.r2Stored },
  };
}
