import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type AdminBlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  contentJson: Json;
  contentHtml: string;
  coverImageUrl: string | null;
  status: "draft" | "published";
  author: string | null;
  viewCount: number;
  contactClickCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminBlogPostInput = {
  slug: string;
  title: string;
  excerpt: string;
  contentJson: Json;
  contentHtml: string;
  coverImageUrl: string | null;
  status: "draft" | "published";
  author: string;
};

export { slugify } from "@/lib/blog-format";

function mapRow(row: {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content_json: Json;
  content_html: string;
  cover_image_url: string | null;
  status: string;
  author: string | null;
  view_count: number;
  contact_click_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}): AdminBlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    contentJson: row.content_json,
    contentHtml: row.content_html,
    coverImageUrl: row.cover_image_url,
    status: row.status === "published" ? "published" : "draft",
    author: row.author,
    viewCount: row.view_count,
    contactClickCount: row.contact_click_count,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listAllPosts(): Promise<AdminBlogPost[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function getPostById(id: string): Promise<AdminBlogPost> {
  const { data, error } = await supabase.from("blog_posts").select("*").eq("id", id).single();
  if (error) throw error;
  return mapRow(data);
}

export async function createPost(input: AdminBlogPostInput): Promise<AdminBlogPost> {
  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      slug: input.slug,
      title: input.title,
      excerpt: input.excerpt || null,
      content_json: input.contentJson,
      content_html: input.contentHtml,
      cover_image_url: input.coverImageUrl,
      status: input.status,
      author: input.author || null,
      published_at: input.status === "published" ? new Date().toISOString() : null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapRow(data);
}

export async function updatePost(
  id: string,
  input: AdminBlogPostInput,
  { wasPublished }: { wasPublished: boolean },
): Promise<AdminBlogPost> {
  const { data, error } = await supabase
    .from("blog_posts")
    .update({
      slug: input.slug,
      title: input.title,
      excerpt: input.excerpt || null,
      content_json: input.contentJson,
      content_html: input.contentHtml,
      cover_image_url: input.coverImageUrl,
      status: input.status,
      author: input.author || null,
      // Stamp published_at the first time a post goes live; keep it stable after that.
      ...(input.status === "published" && !wasPublished
        ? { published_at: new Date().toISOString() }
        : {}),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return mapRow(data);
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) throw error;
}

export type DailyStat = {
  postId: string;
  day: string; // YYYY-MM-DD, Europe/Warsaw
  views: number;
  contactClicks: number;
};

/** Per-post, per-day counters since `sinceDay` (YYYY-MM-DD), oldest first. */
export async function listDailyStats(sinceDay: string): Promise<DailyStat[]> {
  const { data, error } = await supabase
    .from("blog_post_daily_stats")
    .select("post_id, day, views, contact_clicks")
    .gte("day", sinceDay)
    .order("day", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => ({
    postId: row.post_id,
    day: row.day,
    views: row.views,
    contactClicks: row.contact_clicks,
  }));
}

/** Uploads an image to the public blog-images bucket and returns its public URL. */
export async function uploadBlogImage(original: File): Promise<string> {
  // Max 1600 px wide, WebP — covers load fast for visitors (src/lib/image-optimize.ts).
  const { optimizeImage } = await import("@/lib/image-optimize");
  const file = await optimizeImage(original);
  // Size + storage + monthly transfer limits (usage-guard.server.ts).
  const { reserveFileUpload } = await import("@/lib/content.functions");
  await reserveFileUpload({ data: { kind: "image", size: file.size } });
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("blog-images").upload(path, file, {
    cacheControl: "31536000",
    ...(file.type ? { contentType: file.type } : {}),
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
  return data.publicUrl;
}
