// Meta Graph API: connecting the Facebook Page + Instagram professional account
// (Facebook Login) and publishing to them. Server-only.
//
// Needs Worker settings META_APP_ID and META_APP_SECRET (Meta for Developers → app →
// Settings → Basic). The app can stay in Development mode: the admin's own Page and
// Instagram account work without App Review.
import { createAdminClient } from "@/lib/supabase-admin.server";

const GRAPH_VERSION = "v23.0";
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;

const SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  // First comment with the blog link + automatic replies to keyword comments.
  "pages_manage_engagement",
  "pages_read_user_content",
  "pages_messaging",
  "instagram_basic",
  "instagram_content_publish",
  "instagram_manage_comments",
  "instagram_manage_messages",
  "business_management",
];

export type MetaAccount = {
  pageId: string;
  pageName: string;
  pageToken: string;
  igUserId: string;
  igUsername: string;
};

export class GraphError extends Error {
  constructor(
    message: string,
    readonly code?: number,
  ) {
    super(message);
  }
}

type GraphErrorBody = { error?: { message?: string; error_user_msg?: string; code?: number } };

async function graph<T>(
  path: string,
  params: Record<string, string>,
  method: "GET" | "POST" = "GET",
): Promise<T> {
  const url = new URL(`${GRAPH}/${path}`);
  let body: URLSearchParams | undefined;
  if (method === "GET") {
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  } else {
    body = new URLSearchParams(params);
  }
  const res = await fetch(url, { method, body: body ?? null });
  const json = (await res.json().catch(() => ({}))) as T & GraphErrorBody;
  if (!res.ok || json.error) {
    const e = json.error;
    throw new GraphError(e?.error_user_msg || e?.message || `Meta API: HTTP ${res.status}`, e?.code);
  }
  return json;
}

function appConfig() {
  const appId = process.env["META_APP_ID"];
  const appSecret = process.env["META_APP_SECRET"];
  if (!appId || !appSecret) {
    throw new Error(
      "Brak META_APP_ID / META_APP_SECRET w ustawieniach serwera (Cloudflare → Variables and Secrets).",
    );
  }
  return { appId, appSecret };
}

export const metaAppConfigured = () =>
  Boolean(process.env["META_APP_ID"] && process.env["META_APP_SECRET"]);

// ------------------------------------------------------------ OAuth
// `state` is signed with the app secret and expires after 15 minutes, so the
// callback only accepts logins started from the admin panel.
const b64url = (bytes: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

async function hmac(secret: string, data: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return b64url(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data)));
}

const redirectUri = (origin: string) => `${origin}/api/meta/callback`;

export async function buildConnectUrl(origin: string): Promise<string> {
  const { appId, appSecret } = appConfig();
  const payload = b64url(
    new TextEncoder().encode(JSON.stringify({ exp: Date.now() + 15 * 60_000, n: crypto.randomUUID() })),
  );
  const state = `${payload}.${await hmac(appSecret, payload)}`;
  const url = new URL(`https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`);
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", redirectUri(origin));
  url.searchParams.set("state", state);
  url.searchParams.set("scope", SCOPES.join(","));
  url.searchParams.set("response_type", "code");
  return url.toString();
}

async function verifyState(state: string, appSecret: string): Promise<boolean> {
  const [payload, signature] = state.split(".");
  if (!payload || !signature || (await hmac(appSecret, payload)) !== signature) return false;
  const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
  return (JSON.parse(json) as { exp: number }).exp > Date.now();
}

type PageAccount = {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: { id: string; username?: string };
};

/** Handles Facebook's redirect: stores a never-expiring Page token next to the Instagram account id. */
export async function handleMetaCallback(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const back = (result: string) =>
    Response.redirect(`${url.origin}/admin/polaczenia?meta=${encodeURIComponent(result)}`, 302);

  try {
    const { appId, appSecret } = appConfig();
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state") ?? "";
    if (!code) return back(url.searchParams.get("error_description") ?? "anulowano");
    if (!(await verifyState(state, appSecret))) return back("link wygasł, spróbuj ponownie");

    const short = await graph<{ access_token: string }>("oauth/access_token", {
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri(url.origin),
      code,
    });
    // Page tokens derived from a long-lived user token never expire.
    const long = await graph<{ access_token: string }>("oauth/access_token", {
      grant_type: "fb_exchange_token",
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: short.access_token,
    });
    const pages = await graph<{ data: PageAccount[] }>("me/accounts", {
      fields: "id,name,access_token,instagram_business_account{id,username}",
      limit: "100",
      access_token: long.access_token,
    });
    const page = pages.data.find((p) => p.instagram_business_account) ?? pages.data[0];
    if (!page) return back("nie znaleziono strony na Facebooku");
    if (!page.instagram_business_account) {
      return back(`strona „${page.name}” nie ma podpiętego konta firmowego na Instagramie`);
    }

    const account: MetaAccount & { connectedAt: string } = {
      pageId: page.id,
      pageName: page.name,
      pageToken: page.access_token,
      igUserId: page.instagram_business_account.id,
      igUsername: page.instagram_business_account.username ?? "",
      connectedAt: new Date().toISOString(),
    };
    const db = createAdminClient();
    const { error } = await db
      .from("content_integrations")
      .upsert({ provider: "meta", data: account, updated_at: new Date().toISOString() });
    if (error) throw error;
    return back("ok");
  } catch (error) {
    console.error(error);
    return back(error instanceof Error ? error.message : "nieznany błąd");
  }
}

export async function loadMetaAccount(db = createAdminClient()): Promise<MetaAccount | null> {
  const { data } = await db
    .from("content_integrations")
    .select("data")
    .eq("provider", "meta")
    .maybeSingle();
  const account = data?.data as MetaAccount | undefined;
  return account?.pageToken && account.igUserId ? account : null;
}

// ------------------------------------------------------------ Instagram
type Created = { id: string };

/** Image container: feed photo, carousel item or story. Instagram accepts JPEG only. */
export async function igCreateImage(
  acc: MetaAccount,
  opts: {
    imageUrl: string;
    caption?: string | undefined;
    altText?: string | undefined;
    carouselItem?: boolean;
    story?: boolean;
  },
): Promise<string> {
  const params: Record<string, string> = { image_url: opts.imageUrl, access_token: acc.pageToken };
  if (opts.caption) params["caption"] = opts.caption;
  if (opts.carouselItem) params["is_carousel_item"] = "true";
  if (opts.story) params["media_type"] = "STORIES";
  if (opts.altText && !opts.story) params["alt_text"] = opts.altText;
  try {
    return (await graph<Created>(`${acc.igUserId}/media`, params, "POST")).id;
  } catch (error) {
    // Older API versions reject alt_text — retry without it rather than fail the post.
    if (params["alt_text"] && error instanceof GraphError && error.code === 100) {
      delete params["alt_text"];
      return (await graph<Created>(`${acc.igUserId}/media`, params, "POST")).id;
    }
    throw error;
  }
}

export async function igCreateCarousel(acc: MetaAccount, children: string[], caption: string) {
  return (
    await graph<Created>(
      `${acc.igUserId}/media`,
      { media_type: "CAROUSEL", children: children.join(","), caption, access_token: acc.pageToken },
      "POST",
    )
  ).id;
}

export async function igCreateReel(acc: MetaAccount, videoUrl: string, caption: string) {
  return (
    await graph<Created>(
      `${acc.igUserId}/media`,
      {
        media_type: "REELS",
        video_url: videoUrl,
        caption,
        share_to_feed: "true",
        access_token: acc.pageToken,
      },
      "POST",
    )
  ).id;
}

/** FINISHED, IN_PROGRESS, ERROR, EXPIRED or PUBLISHED. */
export async function igContainerStatus(acc: MetaAccount, containerId: string) {
  const res = await graph<{ status_code: string; status?: string }>(containerId, {
    fields: "status_code,status",
    access_token: acc.pageToken,
  });
  return { code: res.status_code, detail: res.status ?? "" };
}

export async function igPublish(acc: MetaAccount, containerId: string) {
  const { id } = await graph<Created>(
    `${acc.igUserId}/media_publish`,
    { creation_id: containerId, access_token: acc.pageToken },
    "POST",
  );
  const { permalink } = await graph<{ permalink?: string }>(id, {
    fields: "permalink",
    access_token: acc.pageToken,
  }).catch(() => ({ permalink: undefined }));
  return { mediaId: id, permalink: permalink ?? "" };
}

// ------------------------------------------------------------ Facebook Page
/** Photo post (one or many images) with a caption on the Page. */
export async function fbPublishPhotos(acc: MetaAccount, imageUrls: string[], message: string) {
  const ids: string[] = [];
  for (const url of imageUrls) {
    const { id } = await graph<Created>(
      `${acc.pageId}/photos`,
      { url, published: "false", access_token: acc.pageToken },
      "POST",
    );
    ids.push(id);
  }
  const params: Record<string, string> = { message, access_token: acc.pageToken };
  ids.forEach((id, i) => (params[`attached_media[${i}]`] = JSON.stringify({ media_fbid: id })));
  const { id } = await graph<Created>(`${acc.pageId}/feed`, params, "POST");
  const [pageId, postId] = id.split("_");
  return { postId: id, permalink: `https://www.facebook.com/${pageId}/posts/${postId}` };
}

/** Story from one image on the Page. */
export async function fbPublishPhotoStory(acc: MetaAccount, imageUrl: string) {
  const photo = await graph<Created>(
    `${acc.pageId}/photos`,
    { url: imageUrl, published: "false", access_token: acc.pageToken },
    "POST",
  );
  const story = await graph<{ post_id?: string }>(
    `${acc.pageId}/photo_stories`,
    { photo_id: photo.id, access_token: acc.pageToken },
    "POST",
  );
  return { postId: story.post_id ?? photo.id, permalink: `https://www.facebook.com/${acc.pageId}` };
}

/**
 * Video on the Page: a Reel when it fits Facebook's 90 s limit, otherwise a regular
 * video post. Facebook downloads the file from `videoUrl` itself.
 */
export async function fbPublishVideo(
  acc: MetaAccount,
  videoUrl: string,
  description: string,
  durationSeconds?: number,
) {
  if (durationSeconds && durationSeconds > 90) {
    const { id } = await graph<Created>(
      `${acc.pageId}/videos`,
      { file_url: videoUrl, description, access_token: acc.pageToken },
      "POST",
    );
    return { postId: id, permalink: `https://www.facebook.com/${acc.pageId}/videos/${id}` };
  }
  const start = await graph<{ video_id: string; upload_url: string }>(
    `${acc.pageId}/video_reels`,
    { upload_phase: "start", access_token: acc.pageToken },
    "POST",
  );
  const upload = await fetch(start.upload_url, {
    method: "POST",
    headers: { Authorization: `OAuth ${acc.pageToken}`, file_url: videoUrl },
  });
  if (!upload.ok) throw new GraphError(`Facebook nie pobrał wideo (HTTP ${upload.status}).`);
  await graph(
    `${acc.pageId}/video_reels`,
    {
      upload_phase: "finish",
      video_id: start.video_id,
      video_state: "PUBLISHED",
      description,
      access_token: acc.pageToken,
    },
    "POST",
  );
  return { postId: start.video_id, permalink: `https://www.facebook.com/reel/${start.video_id}` };
}

// ------------------------------------------------------------ comments
/** Comment under our own Instagram media / Facebook post (the blog link). */
export async function igComment(acc: MetaAccount, mediaId: string, message: string) {
  return (await graph<Created>(`${mediaId}/comments`, { message, access_token: acc.pageToken }, "POST")).id;
}

export async function fbComment(acc: MetaAccount, objectId: string, message: string) {
  return (await graph<Created>(`${objectId}/comments`, { message, access_token: acc.pageToken }, "POST")).id;
}

export type SocialComment = { id: string; text: string; author: string; authorId?: string };

export async function igListComments(acc: MetaAccount, mediaId: string): Promise<SocialComment[]> {
  const res = await graph<{ data: { id: string; text?: string; username?: string; from?: { id: string } }[] }>(
    `${mediaId}/comments`,
    { fields: "id,text,username,from", limit: "50", access_token: acc.pageToken },
  );
  return res.data.map((c) => ({
    id: c.id,
    text: c.text ?? "",
    author: c.username ?? "",
    ...(c.from?.id ? { authorId: c.from.id } : {}),
  }));
}

export async function fbListComments(acc: MetaAccount, objectId: string): Promise<SocialComment[]> {
  const res = await graph<{ data: { id: string; message?: string; from?: { id: string; name: string } }[] }>(
    `${objectId}/comments`,
    { fields: "id,message,from", limit: "50", filter: "stream", access_token: acc.pageToken },
  );
  return res.data.map((c) => ({
    id: c.id,
    text: c.message ?? "",
    author: c.from?.name ?? "",
    ...(c.from?.id ? { authorId: c.from.id } : {}),
  }));
}

/** Private message to the person who wrote a comment ("private reply"). */
export async function sendPrivateReply(
  acc: MetaAccount,
  platform: "instagram" | "facebook",
  commentId: string,
  text: string,
) {
  const sender = platform === "instagram" ? acc.igUserId : acc.pageId;
  await graph(
    `${sender}/messages`,
    {
      recipient: JSON.stringify({ comment_id: commentId }),
      message: JSON.stringify({ text }),
      access_token: acc.pageToken,
    },
    "POST",
  );
}

/** Short public answer under the comment. */
export async function replyUnderComment(
  acc: MetaAccount,
  platform: "instagram" | "facebook",
  commentId: string,
  text: string,
) {
  const edge = platform === "instagram" ? "replies" : "comments";
  await graph(`${commentId}/${edge}`, { message: text, access_token: acc.pageToken }, "POST");
}
