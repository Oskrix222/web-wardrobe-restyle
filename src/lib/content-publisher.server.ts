// Publishes approved calendar items when their time comes. Runs every 10 minutes
// from the Worker's cron (src/server/cron-plugin.ts → /api/content/cron) and on
// demand from the panel ("Opublikuj teraz"). Each run moves an item as far as it
// can; Instagram processes reels asynchronously, so a reel may finish on the next run.
// The same run answers keyword comments (Panel → Odpowiedzi).
import {
  fbComment,
  fbListComments,
  fbPublishPhotos,
  fbPublishPhotoStory,
  fbPublishVideo,
  igComment,
  igContainerStatus,
  igCreateCarousel,
  igCreateImage,
  igCreateReel,
  igListComments,
  igPublish,
  loadMetaAccount,
  replyUnderComment,
  sendPrivateReply,
  type MetaAccount,
} from "@/lib/meta-graph.server";
import { r2Delete } from "@/lib/r2.server";
import { createAdminClient, type AdminClient } from "@/lib/supabase-admin.server";
import type { Database, Json } from "@/integrations/supabase/types";

type ItemRow = Database["public"]["Tables"]["content_items"]["Row"];
type Media = { type: "image" | "video"; url: string; path?: string; duration?: number };
type Channel = "instagram" | "facebook";
type ChannelState = {
  containerId?: string;
  done?: boolean;
  permalink?: string;
  id?: string;
  commented?: boolean;
  commentError?: string;
};
type PublishState = { instagram?: ChannelState; facebook?: ChannelState; waiting?: string };
type AutoReplyChannel = { enabled: boolean; message: string; publicReply: string };

const MAX_ATTEMPTS = 4;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type PublisherReport = {
  checked: number;
  published: string[];
  inProgress: string[];
  errors: { title: string; error: string }[];
  replies: number;
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

const imagesOf = (item: ItemRow) =>
  (item.media as Media[]).filter((m) => m.type === "image").map((m) => m.url);
const videoOf = (item: ItemRow) => (item.media as Media[]).find((m) => m.type === "video");

async function publishInstagram(acc: MetaAccount, item: ItemRow, state: ChannelState) {
  const images = imagesOf(item);
  const details = (item.details ?? {}) as { alt?: string };

  if (!state.containerId) {
    if (item.kind === "reel") {
      const video = videoOf(item);
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
  // Same content as on Instagram, unless a separate Facebook caption was written.
  const caption = item.caption_facebook || item.caption;
  if (item.kind === "post") {
    const images = imagesOf(item);
    if (!images.length) throw new Error("Brak grafiki posta.");
    const result = await fbPublishPhotos(acc, images, caption);
    state.id = result.postId;
    state.permalink = result.permalink;
  } else if (item.kind === "story") {
    const image = imagesOf(item)[0];
    if (!image) throw new Error("Brak grafiki story.");
    const result = await fbPublishPhotoStory(acc, image);
    state.id = result.postId;
    state.permalink = result.permalink;
  } else if (item.kind === "reel") {
    const video = videoOf(item);
    if (!video) throw new Error("Brak wgranej rolki (wideo).");
    const result = await fbPublishVideo(acc, video.url, caption, video.duration);
    state.id = result.postId;
    state.permalink = result.permalink;
  }
  state.done = true;
}

/** The blog link as the first comment. A failed comment never undoes the publication. */
async function addFirstComment(acc: MetaAccount, item: ItemRow, channel: Channel, state: ChannelState) {
  if (!item.first_comment.trim() || item.kind === "story" || !state.id || state.commented) return;
  try {
    if (channel === "instagram") await igComment(acc, state.id, item.first_comment);
    else await fbComment(acc, state.id, item.first_comment);
    state.commented = true;
    delete state.commentError;
  } catch (error) {
    state.commentError = error instanceof Error ? error.message : String(error);
  }
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

/** Big reel files live in R2 only until the networks have them. */
async function cleanUpVideo(item: ItemRow) {
  for (const m of item.media as Media[]) {
    if (m.type === "video" && m.path?.startsWith("r2:")) await r2Delete(m.path.slice(3)).catch(() => {});
  }
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

    for (const channel of item.channels as Channel[]) {
      const channelState = (state[channel] ??= {});
      if (!channelState.done) {
        if (channel === "instagram") await publishInstagram(acc, item, channelState);
        if (channel === "facebook") await publishFacebook(acc, item, channelState);
      }
      if (channelState.done) await addFirstComment(acc, item, channel, channelState);
    }

    const done = (item.channels as Channel[]).every((c) => state[c]?.done);
    if (done) {
      await save({ status: "published", published_at: new Date().toISOString(), last_error: null });
      await cleanUpVideo(item);
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

// ------------------------------------------------------------------ keyword replies
// "RAK", "rak!", "Rak 🙏" all count; Polish letters don't matter ("zdrowie" = "zdrówie").
const normalize = (text: string) =>
  text.toLowerCase().replace(/ł/g, "l").normalize("NFD").replace(/[̀-ͯ]/g, "");

function mentionsKeyword(comment: string, keyword: string) {
  const kw = normalize(keyword).trim();
  if (!kw) return false;
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`).test(normalize(comment));
}

const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{(imie|slowo|link)\}/g, (_, key: string) => values[key] ?? "").trim();

/** Answers comments containing the campaign keyword on posts/reels from the last 7 days. */
async function answerKeywordComments(db: AdminClient, acc: MetaAccount, report: PublisherReport) {
  const { data: setting } = await db
    .from("content_settings")
    .select("value")
    .eq("key", "auto_reply")
    .maybeSingle();
  const config = setting?.value as Record<Channel, AutoReplyChannel> | undefined;
  if (!config?.instagram?.enabled && !config?.facebook?.enabled) return;

  const { data: items } = await db
    .from("content_items")
    .select("id, campaign_id, publish_state, first_comment")
    .eq("status", "published")
    .in("kind", ["post", "reel"])
    .gte("published_at", new Date(Date.now() - 7 * 86_400_000).toISOString());
  if (!items?.length) return;

  const { data: campaigns } = await db
    .from("content_campaigns")
    .select("id, keyword")
    .in("id", [...new Set(items.map((i) => i.campaign_id))]);
  const keywordOf = new Map((campaigns ?? []).map((c) => [c.id, c.keyword ?? ""]));
  const { data: handled } = await db
    .from("content_replies")
    .select("comment_id")
    .in("item_id", items.map((i) => i.id));
  const seen = new Set((handled ?? []).map((h) => h.comment_id));

  for (const item of items) {
    const keyword = keywordOf.get(item.campaign_id);
    if (!keyword) continue;
    const link = /https?:\/\/\S+/.exec(item.first_comment)?.[0] ?? "";
    for (const platform of ["instagram", "facebook"] as const) {
      const settings = config[platform];
      const objectId = (item.publish_state as PublishState)[platform]?.id;
      if (!settings?.enabled || !objectId) continue;

      const comments = await (platform === "instagram"
        ? igListComments(acc, objectId)
        : fbListComments(acc, objectId)
      ).catch(() => []);
      for (const c of comments) {
        const own = c.authorId === acc.igUserId || c.authorId === acc.pageId || c.author === acc.igUsername;
        if (seen.has(c.id) || own || !mentionsKeyword(c.text, keyword)) continue;
        seen.add(c.id);
        const values = { imie: c.author, slowo: keyword, link };
        let error: string | null = null;
        try {
          await sendPrivateReply(acc, platform, c.id, fill(settings.message, values));
          if (settings.publicReply.trim()) {
            await replyUnderComment(acc, platform, c.id, fill(settings.publicReply, values));
          }
          report.replies++;
        } catch (e) {
          error = e instanceof Error ? e.message : String(e);
        }
        await db.from("content_replies").insert({
          platform,
          comment_id: c.id,
          item_id: item.id,
          author: c.author,
          comment: c.text.slice(0, 500),
          status: error ? "failed" : "sent",
          error,
        });
      }
    }
  }
}

export async function runPublisher({ itemId }: { itemId?: string } = {}): Promise<PublisherReport> {
  const db = createAdminClient();
  const report: PublisherReport = { checked: 0, published: [], inProgress: [], errors: [], replies: 0 };
  const acc = await loadMetaAccount(db);

  for (const item of await dueItems(db, itemId)) {
    if (!(await claim(db, item.id))) continue;
    report.checked++;
    await processItem(db, acc, item, report);
  }

  if (!itemId) {
    if (acc) {
      await answerKeywordComments(db, acc, report).catch((error: unknown) =>
        report.errors.push({
          title: "Automat odpowiedzi",
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    }
    // Heartbeat for Panel → Połączenia ("automat ostatnio działał…").
    await db.from("content_integrations").upsert({
      provider: "cron",
      data: { lastRunAt: new Date().toISOString(), ...report } as Json,
      updated_at: new Date().toISOString(),
    });
  }
  return report;
}
