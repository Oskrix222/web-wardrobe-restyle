import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, Eye, MousePointerClick, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/AdminShell";
import { deletePost, listAllPosts, type AdminBlogPost } from "@/lib/blog-admin";
import { formatPostDate } from "@/lib/blog-format";

/** Published posts by publish date (newest first), drafts after them by creation date. */
function byDate(a: AdminBlogPost, b: AdminBlogPost): number {
  const aKey = a.publishedAt ?? "";
  const bKey = b.publishedAt ?? "";
  if (aKey !== bKey) return bKey.localeCompare(aKey);
  return b.createdAt.localeCompare(a.createdAt);
}

export const Route = createFileRoute("/admin/blog/")({
  head: () => ({
    meta: [{ title: "Wpisy — Panel OSCare" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminBlogList,
});

function AdminBlogList() {
  const [posts, setPosts] = useState<AdminBlogPost[] | null>(null);

  const load = () => {
    listAllPosts()
      .then((rows) => setPosts([...rows].sort(byDate)))
      .catch(() => toast.error("Nie udało się wczytać wpisów."));
  };

  useEffect(load, []);

  const onDelete = async (post: AdminBlogPost) => {
    if (!window.confirm(`Usunąć wpis „${post.title}”? Tej operacji nie można cofnąć.`)) return;
    try {
      await deletePost(post.id);
      toast.success("Wpis usunięty.");
      load();
    } catch {
      toast.error("Nie udało się usunąć wpisu.");
    }
  };

  return (
    <AdminShell>
      <div className="admin-blog-list">
        <div className="admin-blog-list__head">
          <h1>Wpisy na blogu</h1>
          <Link to="/admin/blog/new" className="btn btn--primary btn--sm">
            <Plus className="btn__icon" aria-hidden="true" />
            Nowy wpis
          </Link>
        </div>

        {posts === null ? (
          <p>Wczytywanie…</p>
        ) : posts.length === 0 ? (
          <p>
            Nie masz jeszcze żadnych wpisów. <Link to="/admin/blog/new">Utwórz pierwszy →</Link>
          </p>
        ) : (
          <table className="admin-blog-list__table">
            <thead>
              <tr>
                <th>Tytuł</th>
                <th>Status</th>
                <th>Data</th>
                <th title="Wyświetlenia">
                  <Eye aria-label="Wyświetlenia" />
                </th>
                <th title="Kliknięcia w kontakt">
                  <MousePointerClick aria-label="Kliknięcia w kontakt" />
                </th>
                <th aria-label="Akcje" />
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td>
                    <span className="admin-blog-list__title">{post.title}</span>
                    <span className="admin-blog-list__slug">/blog/{post.slug}</span>
                  </td>
                  <td>
                    <span
                      className={
                        post.status === "published"
                          ? "admin-blog-list__status is-published"
                          : "admin-blog-list__status"
                      }
                    >
                      {post.status === "published" ? "Opublikowany" : "Szkic"}
                    </span>
                  </td>
                  <td className="admin-blog-list__date">
                    {formatPostDate(post.publishedAt ?? post.createdAt)}
                  </td>
                  <td>{post.viewCount}</td>
                  <td>{post.contactClickCount}</td>
                  <td className="admin-blog-list__actions">
                    {post.status === "published" ? (
                      <a
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Zobacz na blogu"
                      >
                        <ExternalLink aria-hidden="true" />
                      </a>
                    ) : null}
                    <Link to="/admin/blog/$id" params={{ id: post.id }} aria-label="Edytuj">
                      <Pencil aria-hidden="true" />
                    </Link>
                    <button type="button" onClick={() => onDelete(post)} aria-label="Usuń">
                      <Trash2 aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminShell>
  );
}
