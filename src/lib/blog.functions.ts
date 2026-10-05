import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { readingMinutes } from "@/lib/blog-format";

export type BlogPostSummary = {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  author: string | null;
  publishedAt: string | null;
  readingMinutes: number;
};

export type BlogPost = BlogPostSummary & {
  contentHtml: string;
};

/** Published posts, newest first — used by the /blog listing and "Czytaj także". */
export const listPublishedPosts = createServerFn({ method: "GET" }).handler(
  async (): Promise<BlogPostSummary[]> => {
    // content_html is only read to work out reading time — it never leaves the server.
    const { data, error } = await supabase
      .from("blog_posts")
      .select("slug, title, excerpt, content_html, cover_image_url, author, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error) throw new Error("Nie udało się wczytać wpisów bloga.");

    return (data ?? []).map((post) => ({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      coverImageUrl: post.cover_image_url,
      author: post.author,
      publishedAt: post.published_at,
      readingMinutes: readingMinutes(post.content_html),
    }));
  },
);

/** A single published post by slug — used by /blog/$slug. Null if not found. */
export const getPublishedPostBySlug = createServerFn({ method: "GET" })
  .validator((slug: unknown) => z.string().min(1).parse(slug))
  .handler(async ({ data: slug }): Promise<BlogPost | null> => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("slug, title, excerpt, content_html, cover_image_url, author, published_at")
      .eq("status", "published")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw new Error("Nie udało się wczytać wpisu.");
    if (!data) return null;

    return {
      slug: data.slug,
      title: data.title,
      excerpt: data.excerpt,
      contentHtml: data.content_html,
      coverImageUrl: data.cover_image_url,
      author: data.author,
      publishedAt: data.published_at,
      readingMinutes: readingMinutes(data.content_html),
    };
  });

/** Fire-and-forget view counter — called once when a post page mounts. */
export const incrementPostView = createServerFn({ method: "POST" })
  .validator((slug: unknown) => z.string().min(1).parse(slug))
  .handler(async ({ data: slug }) => {
    await supabase.rpc("increment_blog_post_view", { post_slug: slug });
    return null;
  });

/** Fire-and-forget counter for clicks on a post's "Zostaw kontakt" CTAs. */
export const incrementPostContactClick = createServerFn({ method: "POST" })
  .validator((slug: unknown) => z.string().min(1).parse(slug))
  .handler(async ({ data: slug }) => {
    await supabase.rpc("increment_blog_post_contact_click", { post_slug: slug });
    return null;
  });
