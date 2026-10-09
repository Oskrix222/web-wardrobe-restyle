import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { BlogCard } from "@/components/blog/BlogCard";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { listPublishedPosts } from "@/lib/blog.functions";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";
import { breadcrumbJsonLd, seoHead, storagePreconnect } from "@/lib/seo";

const title = "Blog o ubezpieczeniach na życie, zdrowie i dla firm | OSCare";
const description =
  "Poradniki OSCare: jakie ubezpieczenie na życie wybrać, ile kosztuje polisa, co obejmuje ubezpieczenie grupowe dla małej firmy i na co uważać w umowie.";

export const Route = createFileRoute("/blog/")({
  // A failed fetch shouldn't take the whole page down — render a friendly message instead.
  loader: () => listPublishedPosts().catch(() => null),
  head: () => {
    const head = seoHead({
      title,
      description,
      path: "/blog",
      jsonLd: [
        breadcrumbJsonLd([
          { name: "Strona główna", path: "/" },
          { name: "Blog", path: "/blog" },
        ]),
      ],
    });
    return { ...head, links: [...head.links, ...storagePreconnect] };
  },
  component: BlogIndex,
});

function BlogIndex() {
  const posts = Route.useLoaderData();
  const headIn = useInView();
  const gridIn = useInView();
  const navigate = useNavigate();
  const goToForm = () => navigate({ to: "/", hash: "kontakt" });
  // Posts arrive newest first, so the first one is the featured tile.
  const [featured, ...rest] = posts ?? [];

  return (
    <div className="page">
      <Header onContact={goToForm} />

      <main>
        <section className="blog-index section section--panel">
          <div className="container">
            <Breadcrumbs items={[{ label: "Strona główna", to: "/" }, { label: "Blog" }]} />

            <div
              ref={headIn.ref}
              className={cn("blog-index__head", headIn.inView && "is-in")}
              data-animate
            >
              <span className="eyebrow">Blog OSCare</span>
              <h1 className="section-heading">PORADY I NOWOŚCI</h1>
              <p className="blog-index__intro">
                Praktyczna wiedza o ubezpieczeniach — bez marketingowego bełkotu.
              </p>
            </div>

            {posts === null ? (
              <p className="blog-index__empty">
                Nie udało się wczytać wpisów. Odśwież stronę za chwilę.
              </p>
            ) : !featured ? (
              <p className="blog-index__empty">Pierwsze wpisy już wkrótce.</p>
            ) : (
              <>
                <BlogCard post={featured} featured priority />
                {rest.length > 0 ? (
                  <div
                    ref={gridIn.ref}
                    className={cn("blog-index__grid stagger", gridIn.inView && "is-in")}
                  >
                    {rest.map((post) => (
                      <BlogCard key={post.slug} post={post} />
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
