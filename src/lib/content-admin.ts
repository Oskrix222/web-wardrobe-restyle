import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";

// Content calendar data for /admin/kalendarz and /admin/prawdy. Everything goes
// through the admin's own session; RLS only lets allow-listed admins in.

export type ContentKind = "blog" | "post" | "story" | "reel";
export type ContentChannel = "instagram" | "facebook";
export type ContentMedia = { type: "image" | "video"; url: string; path?: string };
export type ReelScene = { time: string; shot: string; say?: string; text?: string };

export type ContentDetails = {
  alt?: string;
  dm?: string;
  google?: string;
  links?: { label: string; url: string }[];
  linkUrl?: string;
  slug?: string;
  url?: string;
  format?: string;
  length?: string;
  hook?: string;
  cover?: string;
  audio?: string;
  tips?: string;
  scenes?: ReelScene[];
};

type ChannelState = { done?: boolean; permalink?: string };
export type PublishState = { instagram?: ChannelState; facebook?: ChannelState; waiting?: string };

export type ContentItem = {
  id: string;
  campaignId: string;
  kind: ContentKind;
  position: number;
  title: string;
  scheduledAt: string;
  channels: ContentChannel[];
  caption: string;
  captionFacebook: string;
  /** Posted as the first comment right after publishing — the blog link lives here. */
  firstComment: string;
  media: ContentMedia[];
  details: ContentDetails;
  blogPostId: string | null;
  mediaApproved: boolean;
  captionApproved: boolean;
  status: "pending" | "publishing" | "published" | "failed";
  publishState: PublishState;
  lastError: string | null;
  publishedAt: string | null;
};

export type Campaign = {
  id: string;
  folder: string;
  title: string;
  keyword: string | null;
  weekStart: string;
  notes: string[];
};

type ItemRow = Database["public"]["Tables"]["content_items"]["Row"];
type ItemUpdate = Database["public"]["Tables"]["content_items"]["Update"];

function mapItem(row: ItemRow): ContentItem {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    kind: row.kind as ContentKind,
    position: row.position,
    title: row.title,
    scheduledAt: row.scheduled_at,
    channels: row.channels as ContentChannel[],
    caption: row.caption,
    captionFacebook: row.caption_facebook,
    firstComment: row.first_comment ?? "",
    media: (row.media ?? []) as ContentMedia[],
    details: (row.details ?? {}) as ContentDetails,
    blogPostId: row.blog_post_id,
    mediaApproved: row.media_approved,
    captionApproved: row.caption_approved,
    status: row.status as ContentItem["status"],
    publishState: (row.publish_state ?? {}) as PublishState,
    lastError: row.last_error,
    publishedAt: row.published_at,
  };
}

export async function listCalendar(): Promise<{ campaigns: Campaign[]; items: ContentItem[] }> {
  const [campaigns, items] = await Promise.all([
    supabase.from("content_campaigns").select("*").order("week_start"),
    supabase.from("content_items").select("*").order("scheduled_at"),
  ]);
  if (campaigns.error) throw campaigns.error;
  if (items.error) throw items.error;
  return {
    campaigns: campaigns.data.map((c) => ({
      id: c.id,
      folder: c.folder,
      title: c.title,
      keyword: c.keyword,
      weekStart: c.week_start,
      notes: c.notes,
    })),
    items: items.data.map(mapItem),
  };
}

export async function getItem(id: string): Promise<ContentItem> {
  const { data, error } = await supabase.from("content_items").select("*").eq("id", id).single();
  if (error) throw error;
  return mapItem(data);
}

export async function updateItem(id: string, patch: ItemUpdate): Promise<ContentItem> {
  const { data, error } = await supabase
    .from("content_items")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapItem(data);
}

/** A failed item goes back into the queue with a clean slate. */
export function retryItem(id: string) {
  return updateItem(id, { status: "pending", attempts: 0, last_error: null });
}

export async function deleteItem(item: ContentItem): Promise<void> {
  const paths = item.media.map((m) => m.path).filter((p): p is string => Boolean(p));
  if (paths.length) await supabase.storage.from("content").remove(paths);
  const { error } = await supabase.from("content_items").delete().eq("id", item.id);
  if (error) throw error;
}

export async function deleteCampaign(campaign: Campaign, items: ContentItem[]): Promise<void> {
  const paths = items.flatMap((i) => i.media.map((m) => m.path)).filter((p): p is string => Boolean(p));
  if (paths.length) await supabase.storage.from("content").remove(paths);
  const { error } = await supabase.from("content_campaigns").delete().eq("id", campaign.id);
  if (error) throw error;
}

/** Moves the campaign and its unpublished items by `days` (e.g. +7 = next week). */
export async function shiftCampaign(campaign: Campaign, items: ContentItem[], days: number) {
  const ms = days * 86_400_000;
  for (const item of items) {
    if (item.status === "published") continue;
    await updateItem(item.id, {
      scheduled_at: new Date(new Date(item.scheduledAt).getTime() + ms).toISOString(),
    });
  }
  const week = new Date(`${campaign.weekStart}T12:00:00Z`);
  week.setUTCDate(week.getUTCDate() + days);
  const { error } = await supabase
    .from("content_campaigns")
    .update({ week_start: week.toISOString().slice(0, 10) })
    .eq("id", campaign.id);
  if (error) throw error;
}

/** Supabase Free stores files up to 50 MB — a 1080p reel of up to ~60 s fits. */
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

/** Uploads the filmed reel and attaches it to the item (approval resets: watch it first). */
export async function uploadReelVideo(item: ContentItem, file: File): Promise<ContentItem> {
  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error("Plik ma ponad 50 MB. Wyeksportuj rolkę w 1080p (nie 4K) i spróbuj ponownie.");
  }
  const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
  const path = `${item.campaignId}/${item.kind}-${item.position}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("content").upload(path, file, {
    contentType: file.type || "video/mp4",
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("content").getPublicUrl(path);

  const old = item.media.map((m) => m.path).filter((p): p is string => Boolean(p));
  const updated = await updateItem(item.id, {
    media: [{ type: "video", url: data.publicUrl, path }] as Json,
    media_approved: false,
  });
  if (old.length) await supabase.storage.from("content").remove(old);
  return updated;
}

// ------------------------------------------------------------------ truths
export type TruthCategory = "o_nas" | "oferta" | "ograniczenie" | "zasada";
export type Truth = { id: string; body: string; category: TruthCategory; active: boolean };

export const TRUTH_CATEGORIES: { value: TruthCategory; label: string; hint: string }[] = [
  {
    value: "o_nas",
    label: "O nas (fakty do wykorzystania)",
    hint: "np. W branży od 2005 roku. Działamy w Warszawie i okolicach.",
  },
  { value: "oferta", label: "Czego nie mam w ofercie", hint: "np. Nie mam w ofercie ubezpieczenia samochodu." },
  {
    value: "ograniczenie",
    label: "Ograniczenia i wykluczenia",
    hint: "np. Kto nie dostanie danej polisy, czego polisa nie obejmuje.",
  },
  { value: "zasada", label: "Inne zasady", hint: "np. Nie podajemy cen w postach." },
];

export async function listTruths(): Promise<Truth[]> {
  const { data, error } = await supabase
    .from("content_truths")
    .select("id, body, category, active")
    .order("created_at");
  if (error) throw error;
  return data.map((t) => ({ ...t, category: t.category as TruthCategory }));
}

export async function addTruth(body: string, category: TruthCategory): Promise<void> {
  const { error } = await supabase.from("content_truths").insert({ body: body.trim(), category });
  if (error) throw error;
}

export async function updateTruth(
  id: string,
  patch: { body?: string; category?: TruthCategory; active?: boolean },
): Promise<void> {
  const { error } = await supabase.from("content_truths").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteTruth(id: string): Promise<void> {
  const { error } = await supabase.from("content_truths").delete().eq("id", id);
  if (error) throw error;
}

// ------------------------------------------------------------------ connections
export type ConnectionStatus = {
  meta: { pageName: string; igUsername: string; connectedAt: string } | null;
  cron: {
    lastRunAt: string;
    checked: number;
    published: string[];
    errors: { title: string; error: string }[];
  } | null;
};

export async function getConnectionStatus(): Promise<ConnectionStatus> {
  const { data, error } = await supabase.rpc("content_connection_status");
  if (error) throw error;
  const status = (data ?? {}) as Partial<ConnectionStatus>;
  return { meta: status.meta ?? null, cron: status.cron ?? null };
}

// ------------------------------------------------------------------ settings
export type Slot = { day: number; time: string };
export type WeekPlan = { blog: Slot; post: Slot; story: Slot; reels: Slot[] };
export type Author = { name: string; phone: string };
export type AutoReplyChannel = { enabled: boolean; message: string; publicReply: string };
export type AutoReply = { instagram: AutoReplyChannel; facebook: AutoReplyChannel };

export const DEFAULT_WEEK_PLAN: WeekPlan = {
  blog: { day: 1, time: "07:00" },
  post: { day: 3, time: "18:00" },
  story: { day: 3, time: "20:00" },
  reels: [
    { day: 2, time: "19:00" },
    { day: 4, time: "19:00" },
    { day: 6, time: "10:00" },
  ],
};

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const { data, error } = await supabase
    .from("content_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) throw error;
  return (data?.value as T | undefined) ?? fallback;
}

export async function saveSetting(key: string, value: unknown): Promise<void> {
  const { error } = await supabase
    .from("content_settings")
    .upsert({ key, value: value as Json }, { onConflict: "key" });
  if (error) throw error;
}

// ------------------------------------------------------------------ ZIP uploads
export type Upload = {
  id: string;
  fileName: string;
  size: number | null;
  status: "new" | "processing" | "done" | "error";
  note: string | null;
  createdAt: string;
};

export async function listUploads(): Promise<Upload[]> {
  const { data, error } = await supabase
    .from("content_uploads")
    .select("id, file_name, size, status, note, created_at")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data.map((u) => ({
    id: u.id,
    fileName: u.file_name,
    size: u.size,
    status: u.status as Upload["status"],
    note: u.note,
    createdAt: u.created_at,
  }));
}

/** Stores a ZIP of graphics; Claude Code on the Mac picks it up (/nowy-post). */
export async function uploadZip(file: File): Promise<void> {
  if (file.size > 50 * 1024 * 1024) {
    throw new Error("ZIP ma ponad 50 MB. Podziel grafiki na dwa mniejsze ZIP-y.");
  }
  const path = `uploads/${crypto.randomUUID()}.zip`;
  const { error } = await supabase.storage.from("content").upload(path, file, {
    contentType: "application/zip",
    upsert: false,
  });
  if (error) throw error;
  const insert = await supabase
    .from("content_uploads")
    .insert({ file_name: file.name, path, size: file.size });
  if (insert.error) throw insert.error;
}

export async function deleteUpload(id: string): Promise<void> {
  const { data } = await supabase.from("content_uploads").select("path").eq("id", id).single();
  if (data?.path) await supabase.storage.from("content").remove([data.path]);
  const { error } = await supabase.from("content_uploads").delete().eq("id", id);
  if (error) throw error;
}

// ------------------------------------------------------------------ automatic replies
export type Reply = {
  platform: "instagram" | "facebook";
  author: string | null;
  comment: string | null;
  status: "sent" | "failed";
  error: string | null;
  createdAt: string;
};

export async function listReplies(): Promise<Reply[]> {
  const { data, error } = await supabase
    .from("content_replies")
    .select("platform, author, comment, status, error, created_at")
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return data.map((r) => ({
    platform: r.platform as Reply["platform"],
    author: r.author,
    comment: r.comment,
    status: r.status as Reply["status"],
    error: r.error,
    createdAt: r.created_at,
  }));
}
