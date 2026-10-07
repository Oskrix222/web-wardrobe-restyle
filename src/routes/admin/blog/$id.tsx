import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/AdminShell";
import { PostEditor } from "@/components/admin/PostEditor";
import {
  getPostById,
  updatePost,
  type AdminBlogPost,
  type AdminBlogPostInput,
} from "@/lib/blog-admin";

export const Route = createFileRoute("/admin/blog/$id")({
  head: () => ({
    meta: [{ title: "Edytuj wpis — Panel OSCare" }, { name: "robots", content: "noindex" }],
  }),
  component: EditPost,
});

function EditPost() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<AdminBlogPost | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPostById(id)
      .then(setPost)
      .catch(() => {
        toast.error("Nie znaleziono wpisu.");
        navigate({ to: "/admin/blog" });
      });
  }, [id, navigate]);

  const onSave = async (value: AdminBlogPostInput) => {
    if (!post) return;
    setSaving(true);
    try {
      await updatePost(post.id, value, { wasPublished: post.status === "published" });
      toast.success(value.status === "published" ? "Wpis opublikowany." : "Szkic zapisany.");
      navigate({ to: "/admin/blog" });
    } catch (error) {
      const message =
        error instanceof Error && error.message.includes("duplicate")
          ? "Ten adres (slug) jest już zajęty — zmień go."
          : "Nie udało się zapisać wpisu.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell>
      <div className="admin-blog-editor">
        <h1>Edytuj wpis</h1>
        {post ? (
          <PostEditor
            initial={{
              title: post.title,
              slug: post.slug,
              excerpt: post.excerpt ?? "",
              author: post.author ?? "",
              status: post.status,
              coverImageUrl: post.coverImageUrl,
              contentJson: post.contentJson,
              contentHtml: post.contentHtml,
            }}
            saving={saving}
            onSave={onSave}
          />
        ) : (
          <p>Wczytywanie…</p>
        )}
      </div>
    </AdminShell>
  );
}
