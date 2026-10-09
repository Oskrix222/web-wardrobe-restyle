import { useEffect, useRef } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Phone } from "lucide-react";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ButtonLink, Button } from "@/components/ui/Button";
import { BlogCard, PostMeta } from "@/components/blog/BlogCard";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { PostToc } from "@/components/blog/PostToc";
import {
  getPublishedPostBySlug,
  listPublishedPosts,
  incrementPostView,
  incrementPostContactClick,
} from "@/lib/blog.functions";
import { trackEvent } from "@/lib/analytics";
import { notePostRead } from "@/lib/attribution";
import { CONTACT_PHONES, telHref } from "@/config/business";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";
import { articleJsonLd, breadcrumbJsonLd, seoHead, storagePreconnect } from "@/lib/seo";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const [post, all] = await Promise.all([
      getPublishedPostBySlug({ data: params.slug }),
      // "Czytaj także" is a nice-to-have — never fail the article over it.
      listPublishedPosts().catch(() => []),
    ]);
    if (!post) throw notFound();
    return { post, related: all.filter((p) => p.slug !== post.slug).slice(0, 3) };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { post } = loaderData;
    const description = post.excerpt ?? "Wpis na blogu OSCare Ubezpieczenia.";
    const head = seoHead({
      title: `${post.title} | Blog OSCare`,
      description,
      path: `/blog/${post.slug}`,
      image: post.coverImageUrl,
      type: "article",
      meta: [
        ...(post.publishedAt
          ? [{ property: "article:published_time", content: post.publishedAt }]
          : []),
        ...(post.updatedAt ? [{ property: "article:modified_time", content: post.updatedAt }] : []),
        ...(post.author ? [{ property: "article:author", content: post.author }] : []),
      ],
      jsonLd: [
        articleJsonLd(post),
        breadcrumbJsonLd([
          { name: "Strona główna", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ]),
      ],
    });
    // The cover comes from Supabase Storage: open the connection early (LCP image).
    return { ...head, links: [...head.links, ...storagePreconnect] };
  },
  component: BlogPost,
});

function BlogPost() {
  const { post, related } = Route.useLoaderData();
  const relatedIn = useInView();
  const navigate = useNavigate();
  const goToForm = () => navigate({ to: "/", hash: "kontakt" });
  const trackedSlug = useRef<string | null>(null);

  // Keyed on slug so moving between posts via "Czytaj także" counts each view.
  useEffect(() => {
    if (trackedSlug.current === post.slug) return;
    trackedSlug.current = post.slug;
    notePostRead(post.slug);
    void incrementPostView({ data: post.slug });
    trackEvent("blog_post_view", { post_slug: post.slug, post_title: post.title });
  }, [post.slug, post.title]);

  const onContactClick = () => {
    void incrementPostContactClick({ data: post.slug });
    trackEvent("blog_contact_click", { post_slug: post.slug, post_title: post.title });
  };

  return (
    <div className="page">
      <Header onContact={goToForm} />

      <main>
        <article className="blog-post section section--panel">
          <div className="container blog-post__container">
            <Breadcrumbs
              items={[
                { label: "Strona główna", to: "/" },
                { label: "Blog", to: "/blog" },
                { label: post.title },
              ]}
            />

            <h1 className="blog-post__title">{post.title}</h1>
            <div className="blog-post__meta">
              {post.author ? <span className="blog-post__author">{post.author}</span> : null}
              <PostMeta post={post} />
            </div>

            {post.coverImageUrl ? (
              <img
                src={post.coverImageUrl}
                alt={post.title}
                className="blog-post__cover"
                width={1200}
                height={630}
                fetchPriority="high"
                decoding="async"
              />
            ) : null}

            <PostToc headings={post.headings} />

            <div
              className="blog-post__content"
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("[data-cta]")) onContactClick();
              }}
              dangerouslySetInnerHTML={{ __html: post.contentHtml }}
            />

            <div className="blog-post__cta">
              <p>Masz pytania po lekturze? Porozmawiajmy.</p>
              <div className="blog-post__cta-actions">
                <Button
                  onClick={() => {
                    onContactClick();
                    goToForm();
                  }}
                >
                  Zostaw kontakt
                </Button>
                {CONTACT_PHONES.map((c) => (
                  <ButtonLink
                    key={c.phone}
                    href={telHref(c.phone)}
                    variant="outline"
                    onClick={onContactClick}
                  >
                    <Phone className="btn__icon" aria-hidden="true" />
                    {c.name}: {c.phone}
                  </ButtonLink>
                ))}
              </div>
            </div>

            <Link to="/blog" className="blog-post__back">
              <ArrowLeft aria-hidden="true" />
              Wszystkie wpisy
            </Link>
          </div>
        </article>

        {related.length > 0 ? (
          <section className="blog-related section section--soft">
            <div className="container">
              <span className="eyebrow">Czytaj także</span>
              <h2 className="section-heading">INNE WPISY</h2>
              <div
                ref={relatedIn.ref}
                className={cn("blog-index__grid stagger", relatedIn.inView && "is-in")}
              >
                {related.map((p) => (
                  <BlogCard key={p.slug} post={p} />
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
