// Publishes approved calendar items when their time comes. Runs every 10 minutes
// from the Worker's cron (src/server/cron-plugin.ts → /api/content/cron) and on
// demand from the panel ("Opublikuj teraz"). Each run moves an item as far as it
// can; Instagram processes reels asynchronously, so a reel may finish on the next run.
import {
  fbPublishPhotos,
  igContainerStatus,
  igCreateCarousel,
  igCreateImage,
  igCreateReel,
  igPublish,
  loadMetaAccount,
  type MetaAccount,
} from "@/lib/meta-graph.server";
import { createAdminClient, type AdminClient } from "@/lib/supabase-admin.server";
import type { Database, Json } from "@/integrations/supabase/types";

type ItemRow = Database["public"]["Tables"]["content_items"]["Row"];
type Media = { type: "image" | "video"; url: string; path?: string };
type ChannelState = { containerId?: string; done?: boolean; permalink?: string; id?: string };
type PublishState = { instagram?: ChannelState; facebook?: ChannelState; waiting?: string };

const MAX_ATTEMPTS = 4;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type PublisherReport = {
  checked: number;
  published: string[];
  inProgress: string[];
  errors: { title: string; error: string }[];
};

/** Approved + due items (or one item, when the admin presses "Opublikuj teraz"). */
async function dueItems(db: AdminClient, itemId?: string): Promise<ItemRow[]> {
  let query = db
    .from("content_items")
    .select("*")
    .in("status", ["pending", "publishing"])
    .eq("media_approved", true)
    .eq("caption_approved", true)
    .order("scheduled_at", { ascending: true })
    .limit(10);
  query = itemId ? query.eq("id", itemId) : query.lte("scheduled_at", new Date().toISOString());
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).filter((item) => item.kind === "blog" || item.channels.length > 0);
}

/** Takes a 5-minute lock so an overlapping run can't publish the same item twice. */
async function claim(db: AdminClient, id: string): Promise<boolean> {
  const now = new Date();
  const { data } = await db
    .from("content_items")
    .update({ locked_until: new Date(now.getTime() + 5 * 60_000).toISOString() })
    .eq("id", id)
    .or(`locked_until.is.null,locked_until.lt.${now.toISOString()}`)
    .select("id");
  return Boolean(data?.length);
}

/** Social posts wait until the campaign's blog post is live — their links point to it. */
async function blogStillPending(db: AdminClient, item: ItemRow): Promise<boolean> {
  if (item.kind === "blog") return false;
  const { data } = await db
    .from("content_items")
    .select("status")
    .eq("campaign_id", item.campaign_id)
    .eq("kind", "blog")
    .maybeSingle();
  return Boolean(data && data.status !== "published");
}

async function waitForContainer(acc: MetaAccount, containerId: string, maxMs: number) {
  const started = Date.now();
  for (;;) {
    const status = await igContainerStatus(acc, containerId);
    if (status.code !== "IN_PROGRESS" || Date.now() - started > maxMs) return status;
    await sleep(4000);
  }
}

async function publishInstagram(acc: MetaAccount, item: ItemRow, state: ChannelState) {
  const media = item.media as Media[];
  const images = media.filter((m) => m.type === "image").map((m) => m.url);
  const details = (item.details ?? {}) as { alt?: string };

  if (!state.containerId) {
    if (item.kind === "reel") {
      const video = media.find((m) => m.type === "video");
      if (!video) throw new Error("Brak wgranej rolki (wideo).");
      state.containerId = await igCreateReel(acc, video.url, item.caption);
    } else if (item.kind === "story") {
      if (!images[0]) throw new Error("Brak grafiki story.");
      state.containerId = await igCreateImage(acc, { imageUrl: images[0], story: true });
    } else if (images.length > 1) {
      const children: string[] = [];
      for (const url of images.slice(0, 10)) {
        children.push(await igCreateImage(acc, { imageUrl: url, carouselItem: true }));
      }
      state.containerId = await igCreateCarousel(acc, children, item.caption);
    } else {
      if (!images[0]) throw new Error("Brak grafiki posta.");
      state.containerId = await igCreateImage(acc, {
        imageUrl: images[0],
        caption: item.caption,
        altText: details.alt,
      });
    }
  }

  const status = await waitForContainer(acc, state.containerId, item.kind === "reel" ? 60_000 : 20_000);
  if (status.code === "IN_PROGRESS") return; // Instagram still processing — next run publishes it.
  if (status.code === "ERROR" || status.code === "EXPIRED") {
    delete state.containerId; // start over with a fresh container next time
    throw new Error(`Instagram odrzucił materiał: ${status.detail || status.code}`);
  }
  const published = await igPublish(acc, state.containerId);
  state.id = published.mediaId;
  state.permalink = published.permalink;
  state.done = true;
}

async function publishFacebook(acc: MetaAccount, item: ItemRow, state: ChannelState) {
  const images = (item.media as Media[]).filter((m) => m.type === "image").map((m) => m.url);
  if (item.kind !== "post" || !images.length) throw new Error("Na Facebooka publikujemy tylko posty z grafiką.");
  const result = await fbPublishPhotos(acc, images, item.caption_facebook || item.caption);
  state.id = result.postId;
  state.permalink = result.permalink;
  state.done = true;
}

async function publishBlog(db: AdminClient, item: ItemRow): Promise<string> {
  if (!item.blog_post_id) throw new Error("Wpis na blogu został usunięty.");
  const { data, error } = await db
    .from("blog_posts")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", item.blog_post_id)
    .select("slug")
    .single();
  if (error) throw error;
  return `/blog/${data.slug}`;
}

async function processItem(db: AdminClient, acc: MetaAccount | null, item: ItemRow, report: PublisherReport) {
  const state = { ...((item.publish_state ?? {}) as PublishState) };
  delete state.waiting;
  const save = (fields: Partial<ItemRow>) =>
    db
      .from("content_items")
      .update({ ...fields, publish_state: state as Json, locked_until: null })
      .eq("id", item.id);

  try {
    if (await blogStillPending(db, item)) {
      state.waiting = "Czeka na publikację wpisu na blogu z tej kampanii.";
      await save({});
      return;
    }

    if (item.kind === "blog") {
      const path = await publishBlog(db, item);
      await save({
        status: "published",
        published_at: new Date().toISOString(),
        last_error: null,
        details: { ...(item.details as Record<string, Json>), url: path },
      });
      report.published.push(item.title);
      return;
    }

    if (!acc) {
      await save({ last_error: "Brak połączenia z Instagramem/Facebookiem — Panel → Połączenia." });
      report.errors.push({ title: item.title, error: "brak połączenia z Meta" });
      return;
    }

    for (const channel of item.channels) {
      const channelState = (state[channel as "instagram" | "facebook"] ??= {});
      if (channelState.done) continue;
      if (channel === "instagram") await publishInstagram(acc, item, channelState);
      if (channel === "facebook") await publishFacebook(acc, item, channelState);
    }

    const done = item.channels.every((c) => state[c as "instagram" | "facebook"]?.done);
    if (done) {
      await save({ status: "published", published_at: new Date().toISOString(), last_error: null });
      report.published.push(item.title);
    } else {
      await save({ status: "publishing", last_error: null });
      report.inProgress.push(item.title);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const attempts = item.attempts + 1;
    await save({
      attempts,
      last_error: message,
      status: attempts >= MAX_ATTEMPTS ? "failed" : item.status,
    });
    report.errors.push({ title: item.title, error: message });
  }
}

export async function runPublisher({ itemId }: { itemId?: string } = {}): Promise<PublisherReport> {
  const db = createAdminClient();
  const report: PublisherReport = { checked: 0, published: [], inProgress: [], errors: [] };
  const acc = await loadMetaAccount(db);

  for (const item of await dueItems(db, itemId)) {
    if (!(await claim(db, item.id))) continue;
    report.checked++;
    await processItem(db, acc, item, report);
  }

  // Heartbeat for Panel → Połączenia ("automat ostatnio działał…").
  if (!itemId) {
    await db.from("content_integrations").upsert({
      provider: "cron",
      data: { lastRunAt: new Date().toISOString(), ...report } as Json,
      updated_at: new Date().toISOString(),
    });
  }
  return report;
}
