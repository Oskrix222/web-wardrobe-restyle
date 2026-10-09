import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Clock, Newspaper } from "lucide-react";

import { formatPostDate } from "@/lib/blog-format";
import type { BlogPostSummary } from "@/lib/blog.functions";
import { cn } from "@/lib/utils";

/** Date + reading time line shared by cards and the post header. */
export function PostMeta({ post, className }: { post: BlogPostSummary; className?: string }) {
  const date = formatPostDate(post.publishedAt);

  return (
    <p className={cn("post-meta", className)}>
      {date ? (
        <span className="post-meta__item">
          <CalendarDays aria-hidden="true" />
          <time dateTime={post.publishedAt ?? undefined}>{date}</time>
        </span>
      ) : null}
      <span className="post-meta__item">
        <Clock aria-hidden="true" />
        {post.readingMinutes} min czytania
      </span>
    </p>
  );
}

/** A clickable post tile; `featured` renders the wide, image-left variant. */
export function BlogCard({
  post,
  featured = false,
  priority = false,
}: {
  post: BlogPostSummary;
  featured?: boolean;
  /** The first tile on the page: its image is the LCP element, so load it right away. */
  priority?: boolean;
}) {
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className={cn("blog-card", featured && "blog-card--featured")}
    >
      <article className="blog-card__box">
        <div className="blog-card__media">
          {post.coverImageUrl ? (
            <img
              src={post.coverImageUrl}
              alt=""
              className="blog-card__image"
              width={1200}
              height={750}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              decoding="async"
            />
          ) : (
            <div className="blog-card__placeholder" aria-hidden="true">
              <Newspaper />
            </div>
          )}
          {featured ? <span className="blog-card__badge">Najnowszy wpis</span> : null}
        </div>

        <div className="blog-card__body">
          <PostMeta post={post} />
          <h2 className="blog-card__title">{post.title}</h2>
          {post.excerpt ? <p className="blog-card__excerpt">{post.excerpt}</p> : null}
          <span className="blog-card__read-more">
            Czytaj artykuł
            <ArrowRight aria-hidden="true" />
          </span>
        </div>
      </article>
    </Link>
  );
}
