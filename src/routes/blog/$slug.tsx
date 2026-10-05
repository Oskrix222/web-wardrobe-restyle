import { useEffect, useRef } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Phone } from "lucide-react";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ButtonLink, Button } from "@/components/ui/Button";
import { BlogCard, PostMeta } from "@/components/blog/BlogCard";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import {
  getPublishedPostBySlug,
  listPublishedPosts,
  incrementPostView,
  incrementPostContactClick,
} from "@/lib/blog.functions";
import { trackEvent } from "@/lib/analytics";

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
    return {
      meta: [
        { title: `${post.title} — Blog OSCare` },
        { name: "description", content: description },
        { property: "og:title", content: post.title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        ...(post.publishedAt
          ? [{ property: "article:published_time", content: post.publishedAt }]
          : []),
        ...(post.coverImageUrl ? [{ property: "og:image", content: post.coverImageUrl }] : []),
      ],
      links: [{ rel: "canonical", href: `/blog/${post.slug}` }],
    };
  },
  component: BlogPost,
});

function BlogPost() {
  const { post, related } = Route.useLoaderData();
  const navigate = useNavigate();
  const goToForm = () => navigate({ to: "/", hash: "kontakt" });
  const trackedSlug = useRef<string | null>(null);

  // Keyed on slug so moving between posts via "Czytaj także" counts each view.
  useEffect(() => {
    if (trackedSlug.current === post.slug) return;
    trackedSlug.current = post.slug;
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
        <article className="blog-post section">
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
              <img src={post.coverImageUrl} alt="" className="blog-post__cover" />
            ) : null}

            <div
              className="blog-post__content"
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
                <ButtonLink href="tel:+48539075385" variant="outline" onClick={onContactClick}>
                  <Phone className="btn__icon" aria-hidden="true" />
                  +48 539 075 385
                </ButtonLink>
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
              <div className="blog-index__grid">
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
