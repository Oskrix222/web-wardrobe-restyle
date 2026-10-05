import { useRef, useState } from "react";
import { useEditor, useEditorState, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Heading2,
  List,
  ListOrdered,
  Quote,
  LinkIcon,
  ImageIcon,
  Undo2,
  Redo2,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { slugify, uploadBlogImage, type AdminBlogPostInput } from "@/lib/blog-admin";
import type { Json } from "@/integrations/supabase/types";
import { BlogImage, IMAGE_SIZES, type ImageAlign, type ImageSize } from "./blog-image";

export type PostEditorValue = {
  title: string;
  slug: string;
  excerpt: string;
  author: string;
  status: "draft" | "published";
  coverImageUrl: string | null;
  contentJson: Json;
};

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };

const ALIGN_BUTTONS: { value: ImageAlign; label: string; icon: typeof AlignLeft }[] = [
  { value: "left", label: "Zdjęcie do lewej (tekst obok)", icon: AlignLeft },
  { value: "center", label: "Zdjęcie na środku", icon: AlignCenter },
  { value: "right", label: "Zdjęcie do prawej (tekst obok)", icon: AlignRight },
];

function EditorToolbar({ editor }: { editor: Editor | null }) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  // Re-render the toolbar when the selection changes, so active states and the
  // image controls follow the cursor.
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            // Formatting flags are read below via editor.isActive; listing them
            // here is what makes the toolbar re-render when they change.
            marks: ["bold", "italic", "bulletList", "orderedList", "blockquote"].map((name) =>
              e.isActive(name),
            ),
            heading: e.isActive("heading", { level: 2 }),
            image: e.isActive("image"),
            imageSize: e.getAttributes("image")["size"] as ImageSize | undefined,
            imageAlign: e.getAttributes("image")["align"] as ImageAlign | undefined,
          }
        : null,
  });

  if (!editor) return null;

  const setImageAttrs = (attrs: { size?: ImageSize; align?: ImageAlign }) =>
    editor.chain().focus().updateAttributes("image", attrs).run();

  const addImage = async (file: File) => {
    try {
      const url = await uploadBlogImage(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch {
      toast.error("Nie udało się wgrać zdjęcia.");
    }
  };

  const addLink = () => {
    const url = window.prompt("Adres linku (https://...)");
    if (!url) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="post-editor__toolbar">
      <button
        type="button"
        className={editor.isActive("bold") ? "is-active" : ""}
        onClick={() => editor.chain().focus().toggleBold().run()}
        aria-label="Pogrubienie"
      >
        <Bold aria-hidden="true" />
      </button>
      <button
        type="button"
        className={editor.isActive("italic") ? "is-active" : ""}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        aria-label="Kursywa"
      >
        <Italic aria-hidden="true" />
      </button>
      <button
        type="button"
        className={editor.isActive("heading", { level: 2 }) ? "is-active" : ""}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        aria-label="Nagłówek"
      >
        <Heading2 aria-hidden="true" />
      </button>
      <button
        type="button"
        className={editor.isActive("bulletList") ? "is-active" : ""}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        aria-label="Lista punktowana"
      >
        <List aria-hidden="true" />
      </button>
      <button
        type="button"
        className={editor.isActive("orderedList") ? "is-active" : ""}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        aria-label="Lista numerowana"
      >
        <ListOrdered aria-hidden="true" />
      </button>
      <button
        type="button"
        className={editor.isActive("blockquote") ? "is-active" : ""}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        aria-label="Cytat"
      >
        <Quote aria-hidden="true" />
      </button>
      <button type="button" onClick={addLink} aria-label="Wstaw link">
        <LinkIcon aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => imageInputRef.current?.click()}
        aria-label="Wstaw zdjęcie"
      >
        <ImageIcon aria-hidden="true" />
      </button>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void addImage(file);
          e.target.value = "";
        }}
      />
      <span className="post-editor__toolbar-spacer" />
      <button type="button" onClick={() => editor.chain().focus().undo().run()} aria-label="Cofnij">
        <Undo2 aria-hidden="true" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().redo().run()} aria-label="Ponów">
        <Redo2 aria-hidden="true" />
      </button>

      {state?.image ? (
        <div className="post-editor__image-tools" role="group" aria-label="Ustawienia zdjęcia">
          <span className="post-editor__image-tools-label">Zdjęcie:</span>
          {IMAGE_SIZES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={(state.imageSize ?? "full") === value ? "is-active" : ""}
              onClick={() => setImageAttrs({ size: value })}
              aria-label={`Szerokość ${label}`}
            >
              {label}
            </button>
          ))}
          <span className="post-editor__image-tools-sep" aria-hidden="true" />
          {ALIGN_BUTTONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              className={(state.imageAlign ?? "center") === value ? "is-active" : ""}
              onClick={() => setImageAttrs({ align: value })}
              aria-label={label}
              title={label}
            >
              <Icon aria-hidden="true" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function PostEditor({
  initial,
  saving,
  onSave,
}: {
  initial: PostEditorValue;
  saving: boolean;
  onSave: (value: AdminBlogPostInput) => void;
}) {
  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.slug));
  const [excerpt, setExcerpt] = useState(initial.excerpt);
  const [author, setAuthor] = useState(initial.author);
  const [status, setStatus] = useState<"draft" | "published">(initial.status);
  const [coverImageUrl, setCoverImageUrl] = useState(initial.coverImageUrl);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      BlogImage,
      LinkExtension.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Zacznij pisać treść wpisu…" }),
    ],
    content: (initial.contentJson as object) ?? EMPTY_DOC,
    immediatelyRender: false,
  });

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const handleCoverUpload = async (file: File) => {
    setUploadingCover(true);
    try {
      const url = await uploadBlogImage(file);
      setCoverImageUrl(url);
    } catch {
      toast.error("Nie udało się wgrać okładki.");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSave = (nextStatus: "draft" | "published") => {
    if (!editor) return;
    if (!title.trim()) {
      toast.error("Podaj tytuł wpisu.");
      return;
    }
    if (!slug.trim()) {
      toast.error("Podaj adres (slug) wpisu.");
      return;
    }
    onSave({
      title: title.trim(),
      slug: slugify(slug),
      excerpt,
      author,
      status: nextStatus,
      coverImageUrl,
      contentJson: editor.getJSON() as Json,
      contentHtml: editor.getHTML(),
    });
  };

  return (
    <div className="post-editor">
      <div className="post-editor__fields">
        <Field label="Tytuł" htmlFor="post-title">
          <Input
            id="post-title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="np. Jak przygotować się na kontrolę mieszkania przed polisą"
          />
        </Field>

        <Field label="Adres (slug)" htmlFor="post-slug">
          <Input
            id="post-slug"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            placeholder="jak-przygotowac-sie-na-kontrole"
          />
        </Field>

        <Field label="Zajawka (opcjonalna)" htmlFor="post-excerpt">
          <Textarea
            id="post-excerpt"
            rows={2}
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Krótki opis widoczny na liście wpisów…"
          />
        </Field>

        <div className="field__row">
          <Field label="Autor (opcjonalnie)" htmlFor="post-author">
            <Input
              id="post-author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Oskar Kubowicz"
            />
          </Field>

          <Field label="Status" htmlFor="post-status">
            <Select
              id="post-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as "draft" | "published")}
              options={[
                { value: "draft", label: "Szkic" },
                { value: "published", label: "Opublikowany" },
              ]}
            />
          </Field>
        </div>

        <div className="post-editor__cover">
          <span className="label">Okładka</span>
          {coverImageUrl ? (
            <div className="post-editor__cover-preview">
              <img src={coverImageUrl} alt="" width={160} height={100} />
              <button type="button" onClick={() => setCoverImageUrl(null)}>
                Usuń
              </button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploadingCover}
              onClick={() => coverInputRef.current?.click()}
            >
              {uploadingCover ? "Wgrywanie…" : "Wgraj okładkę"}
            </Button>
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleCoverUpload(file);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <div className="post-editor__body">
        <span className="label">Treść</span>
        <div className="post-editor__editor">
          <EditorToolbar editor={editor} />
          <EditorContent editor={editor} className="post-editor__content" />
        </div>
      </div>

      <div className="post-editor__actions">
        <Button
          type="button"
          variant="outline"
          disabled={saving}
          onClick={() => handleSave("draft")}
        >
          {saving ? "Zapisywanie…" : "Zapisz jako szkic"}
        </Button>
        <Button type="button" disabled={saving} onClick={() => handleSave("published")}>
          {saving ? "Zapisywanie…" : "Opublikuj"}
        </Button>
      </div>
    </div>
  );
}
