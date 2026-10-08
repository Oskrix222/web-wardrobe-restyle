// Stand-in for the Meta Graph API (Instagram + Facebook Page), Facebook's video
// upload host and Cloudflare R2, installed as globalThis.fetch. Records every call.
export function createFakeMeta(account) {
  const calls = [];
  const comments = {}; // object id -> comments returned by GET /{id}/comments
  const failures = new Map(); // "POST <path>" -> error message
  const containerStatus = {}; // container id -> status_code (default FINISHED)
  let n = 0;

  async function fetch(input, init = {}) {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const method = init.method ?? "GET";
    if (url.hostname.endsWith(".r2.cloudflarestorage.com")) {
      calls.push({ host: "r2", method, path: decodeURIComponent(url.pathname) });
      return new Response(null, { status: 204 });
    }
    if (url.hostname === "rupload.facebook.com") {
      calls.push({
        host: "rupload",
        method,
        path: url.pathname,
        headers: Object.fromEntries(new Headers(init.headers)),
      });
      return Response.json({ success: true });
    }
    if (url.hostname !== "graph.facebook.com")
      throw new Error(`fake meta: unexpected host ${url.hostname}`);

    const path = url.pathname.replace(/^\/v\d+\.\d+\//, "");
    const params =
      method === "GET"
        ? Object.fromEntries(url.searchParams)
        : Object.fromEntries(new URLSearchParams(String(init.body ?? "")));
    calls.push({ host: "graph", method, path, params });

    const failure = failures.get(`${method} ${path}`);
    if (failure) return Response.json({ error: { message: failure, code: 2 } }, { status: 400 });

    const [id, edge] = path.split("/");
    const json = (body) => Response.json(body);
    if (method === "GET" && !edge && params.fields?.startsWith("status_code")) {
      return json({ status_code: containerStatus[id] ?? "FINISHED" });
    }
    if (method === "GET" && !edge && params.fields === "permalink") {
      return json({ permalink: `https://www.instagram.com/p/${id}/` });
    }
    if (method === "GET" && edge === "comments") return json({ data: comments[id] ?? [] });
    if (method === "POST") {
      switch (edge) {
        case "media":
          if (params.media_type)
            return json({ id: `${params.media_type.toLowerCase()}-container-${++n}` });
          return json({ id: params.is_carousel_item ? `child-${++n}` : `image-container-${++n}` });
        case "media_publish":
          return json({ id: `ig-${params.creation_id}` });
        case "photos":
          return json({ id: `fb-photo-${++n}` });
        case "feed":
          return json({ id: `${account.pageId}_post${++n}` });
        case "photo_stories":
          return json({ post_id: `fb-story-${++n}` });
        case "videos":
          return json({ id: `fb-video-${++n}` });
        case "video_reels":
          return params.upload_phase === "start"
            ? json({
                video_id: "fb-reel-1",
                upload_url: "https://rupload.facebook.com/video-upload/v23.0/fb-reel-1",
              })
            : json({ success: true });
        case "comments":
          return json({ id: `comment-${++n}` });
        case "replies":
          return json({ id: `reply-${++n}` });
        case "messages":
          return json({ recipient_id: "someone", message_id: `message-${++n}` });
      }
    }
    return Response.json(
      { error: { message: `fake meta: unexpected ${method} ${path}`, code: 999 } },
      { status: 400 },
    );
  }

  const graph = (method, edge) =>
    calls.filter((c) => c.host === "graph" && c.method === method && c.path.endsWith(`/${edge}`));
  return { fetch, calls, comments, failures, containerStatus, graph };
}
