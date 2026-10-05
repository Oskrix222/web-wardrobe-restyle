import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/AdminShell";
import { PostEditor } from "@/components/admin/PostEditor";
import { createPost, type AdminBlogPostInput } from "@/lib/blog-admin";

export const Route = createFileRoute("/admin/blog/new")({
  head: () => ({
    meta: [{ title: "Nowy wpis — Panel OSCare" }, { name: "robots", content: "noindex" }],
  }),
  component: NewPost,
});

function NewPost() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const onSave = async (value: AdminBlogPostInput) => {
    setSaving(true);
    try {
      await createPost(value);
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
        <h1>Nowy wpis</h1>
        <PostEditor
          initial={{
            title: "",
            slug: "",
            excerpt: "",
            author: "",
            status: "draft",
            coverImageUrl: null,
            contentJson: { type: "doc", content: [{ type: "paragraph" }] },
          }}
          saving={saving}
          onSave={onSave}
        />
      </div>
    </AdminShell>
  );
}
