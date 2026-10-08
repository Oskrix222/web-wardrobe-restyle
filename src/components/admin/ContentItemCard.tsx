import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, Copy, ExternalLink, Send, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import {
  deleteItem,
  getItem,
  retryItem,
  updateItem,
  uploadReelVideo,
  type Campaign,
  type ContentChannel,
  type ContentItem,
  type ContentKind,
} from "@/lib/content-admin";
import { publishItemNow } from "@/lib/content.functions";

const KIND_LABEL: Record<ContentKind, string> = {
  blog: "Wpis na blogu",
  post: "Post (karuzela)",
  story: "Story",
  reel: "Rolka",
};

const CHANNELS: Record<ContentKind, { value: ContentChannel; label: string }[]> = {
  blog: [],
  post: [
    { value: "instagram", label: "Instagram" },
    { value: "facebook", label: "Facebook" },
  ],
  story: [
    { value: "instagram", label: "Instagram" },
    { value: "facebook", label: "Facebook" },
  ],
  reel: [
    { value: "instagram", label: "Instagram" },
    { value: "facebook", label: "Facebook" },
  ],
};

const IG_CAPTION_LIMIT = 2200;

const weekday = new Intl.DateTimeFormat("pl-PL", { weekday: "long", timeZone: "Europe/Warsaw" });
const dayMonth = new Intl.DateTimeFormat("pl-PL", {
  day: "numeric",
  month: "long",
  timeZone: "Europe/Warsaw",
});
const hourMinute = new Intl.DateTimeFormat("pl-PL", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Warsaw",
});

/** ISO → value for <input type="datetime-local"> in the browser's time zone (Poland). */
function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export type ItemTone = "todo" | "ok" | "busy" | "done" | "error" | "manual";

/** What the admin needs to know about an item at a glance. */
export function statusOf(item: ContentItem): { tone: ItemTone; label: string } {
  if (item.status === "published") return { tone: "done", label: "Opublikowane" };
  if (item.status === "failed") return { tone: "error", label: "Błąd publikacji" };
  if (item.status === "publishing") return { tone: "busy", label: "Publikowanie…" };
  if (item.kind === "reel" && !item.media.length) return { tone: "todo", label: "Wgraj rolkę" };
  if (!item.mediaApproved || !item.captionApproved)
    return { tone: "todo", label: "Do zatwierdzenia" };
  if (item.kind !== "blog" && !item.channels.length) {
    return { tone: "manual", label: "Do wrzucenia ręcznie" };
  }
  if (new Date(item.scheduledAt) <= new Date())
    return { tone: "ok", label: "W kolejce (do 10 min)" };
  return { tone: "ok", label: "Zaplanowane" };
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Skopiowano.");
  } catch {
    toast.error("Nie udało się skopiować — zaznacz tekst i wciśnij Cmd + C.");
  }
}

function CopyBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="content-item__copy">
      <div className="content-item__copy-head">
        <span>{label}</span>
        <button type="button" onClick={() => copy(text)}>
          <Copy aria-hidden="true" /> Kopiuj
        </button>
      </div>
      <p>{text}</p>
    </div>
  );
}

function ApproveButton({
  approved,
  disabled,
  onClick,
  children,
}: {
  approved: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={approved ? "content-item__approve is-approved" : "content-item__approve"}
      disabled={disabled}
      onClick={onClick}
      title={approved ? "Kliknij, żeby cofnąć zatwierdzenie" : undefined}
    >
      <Check aria-hidden="true" />
      {children}
    </button>
  );
}

export function ContentItemCard({
  item,
  campaign,
  onChange,
  onDeleted,
}: {
  item: ContentItem;
  campaign?: Campaign | undefined;
  onChange: (item: ContentItem) => void;
  onDeleted: () => void;
}) {
  const publishNow = useServerFn(publishItemNow);
  const [caption, setCaption] = useState(item.caption);
  const [firstComment, setFirstComment] = useState(item.firstComment);
  const [when, setWhen] = useState(toLocalInput(item.scheduledAt));
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  // Keep drafts in sync when the item is reloaded from the server.
  useEffect(() => setCaption(item.caption), [item.caption]);
  useEffect(() => setFirstComment(item.firstComment), [item.firstComment]);
  useEffect(() => setWhen(toLocalInput(item.scheduledAt)), [item.scheduledAt]);

  const status = statusOf(item);
  const published = item.status === "published";
  const needsCaption = item.kind === "post" || item.kind === "reel";
  const hasVideo = item.media.some((m) => m.type === "video");
  const images = item.media.filter((m) => m.type === "image");
  const captionDirty = caption !== item.caption || firstComment !== item.firstComment;
  const whenDirty = when !== toLocalInput(item.scheduledAt);
  const hashtags = (caption.match(/#[\p{L}\p{N}_]+/gu) ?? []).length;

  const run = async (label: string, action: () => Promise<void>) => {
    setBusy(label);
    try {
      await action();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Coś poszło nie tak.");
    } finally {
      setBusy(null);
    }
  };

  const save = (patch: Parameters<typeof updateItem>[1], message?: string) =>
    run("save", async () => {
      onChange(await updateItem(item.id, patch));
      if (message) toast.success(message);
    });

  const toggleMedia = () => {
    // Blog posts and stories have one approval that covers everything.
    if (!needsCaption) {
      const next = !(item.mediaApproved && item.captionApproved);
      return save({ media_approved: next, caption_approved: next });
    }
    return save({ media_approved: !item.mediaApproved });
  };

  const saveCaption = () =>
    save(
      { caption, first_comment: firstComment, caption_approved: false },
      "Opis zapisany — zatwierdź go jeszcze raz.",
    );

  const saveWhen = () => save({ scheduled_at: new Date(when).toISOString() }, "Termin zmieniony.");

  const toggleChannel = (channel: ContentChannel) => {
    const channels = item.channels.includes(channel)
      ? item.channels.filter((c) => c !== channel)
      : [...item.channels, channel];
    return save({ channels });
  };

  const onUpload = (file: File | undefined) => {
    if (!file) return;
    return run("upload", async () => {
      setProgress(0);
      onChange(await uploadReelVideo(item, file, setProgress));
      toast.success("Rolka wgrana. Obejrzyj ją i zatwierdź.");
    });
  };

  const onPublishNow = () => {
    if (!window.confirm("Opublikować teraz, bez czekania na zaplanowany termin?")) return;
    return run("publish", async () => {
      const updated = await updateItem(item.id, { scheduled_at: new Date().toISOString() });
      onChange(updated);
      const report = await publishNow({ data: { itemId: item.id } });
      if (report.errors.length) toast.error(report.errors[0]!.error);
      else if (report.published.length) toast.success("Opublikowane.");
      else if (report.inProgress.length) {
        toast.success(
          "Instagram jeszcze przetwarza wideo — automat dokończy publikację w ciągu 10 minut.",
        );
      } else toast.message("Nic nie zostało opublikowane — powód znajdziesz w karcie.");
      onChange(await getItem(item.id));
    });
  };

  const onDelete = () => {
    if (!window.confirm(`Usunąć „${item.title}” z kalendarza?`)) return;
    return run("delete", async () => {
      await deleteItem(item);
      onDeleted();
    });
  };

  const permalinks = [
    item.publishState.instagram?.permalink,
    item.publishState.facebook?.permalink,
  ].filter((link): link is string => Boolean(link));

  return (
    <article className={`content-item is-${status.tone}`}>
      <header className="content-item__head">
        <div className="content-item__when">
          <span className="content-item__day">{weekday.format(new Date(item.scheduledAt))}</span>
          <span className="content-item__date">
            {dayMonth.format(new Date(item.scheduledAt))},{" "}
            {hourMinute.format(new Date(item.scheduledAt))}
          </span>
        </div>
        <span className="content-item__kind">
          {KIND_LABEL[item.kind]}
          {item.kind === "reel" ? ` ${item.position}` : ""}
        </span>
        <span className={`content-item__status is-${status.tone}`}>{status.label}</span>
      </header>

      <h3 className="content-item__title">{item.title}</h3>
      {campaign ? (
        <p className="content-item__campaign">
          {campaign.title}
          {campaign.keyword ? ` · słowo: ${campaign.keyword}` : ""}
        </p>
      ) : null}

      {item.lastError && !published ? (
        <p className="content-item__error">{item.lastError}</p>
      ) : null}
      {item.publishState.waiting && !published ? (
        <p className="content-item__note">{item.publishState.waiting}</p>
      ) : null}

      <div className="content-item__body">
        <div className="content-item__media">
          {item.kind === "reel" ? (
            <>
              {hasVideo ? (
                <video src={item.media[0]!.url} controls playsInline preload="metadata" />
              ) : (
                <div className="content-item__placeholder">
                  Nagraj rolkę według scenariusza poniżej i wgraj ją tutaj.
                </div>
              )}
              {!published ? (
                <>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="video/mp4,video/quicktime"
                    hidden
                    onChange={(e) => onUpload(e.target.files?.[0])}
                  />
                  <button
                    type="button"
                    className="btn btn--outline btn--sm"
                    disabled={busy === "upload"}
                    onClick={() => fileRef.current?.click()}
                  >
                    <Upload className="btn__icon" aria-hidden="true" />
                    {busy === "upload"
                      ? `Wysyłanie… ${Math.round(progress * 100)}%`
                      : hasVideo
                        ? "Podmień wideo"
                        : "Wgraj rolkę"}
                  </button>
                  <small>
                    MP4 lub MOV, pionowo, 1080p.
                    {(item.media[0]?.duration ?? 0) > 90
                      ? " Ta rolka ma ponad 90 s — na Facebooka pójdzie jako film (rolki FB do 90 s)."
                      : ""}
                  </small>
                </>
              ) : null}
            </>
          ) : (
            <div className={`content-item__images is-${item.kind}`}>
              {images.map((m) => (
                <a key={m.url} href={m.url} target="_blank" rel="noreferrer">
                  <img src={m.url} alt="" loading="lazy" />
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="content-item__text">
          {item.kind === "blog" ? (
            <>
              <p className="content-item__excerpt">{item.caption}</p>
              <div className="content-item__links">
                {item.blogPostId ? (
                  <Link to="/admin/blog/$id" params={{ id: item.blogPostId }}>
                    Otwórz wpis w edytorze
                  </Link>
                ) : (
                  <span>Wpis został usunięty z bloga.</span>
                )}
                {item.details.url ? (
                  <a href={item.details.url} target="_blank" rel="noreferrer">
                    Zobacz na blogu <ExternalLink aria-hidden="true" />
                  </a>
                ) : null}
              </div>
              <p className="content-item__hint">
                Wpis czeka w „Wpisach” jako szkic. Po zatwierdzeniu opublikuje się sam o tej
                godzinie.
              </p>
            </>
          ) : item.kind === "story" ? (
            <>
              <p className="content-item__hint">
                Story pójdzie samo w swoim terminie. Klikalnej naklejki z linkiem API nie pozwala
                dodać, dlatego na grafice jest „Link w bio”. W bio ustaw raz adres <b>/najnowszy</b>{" "}
                — zawsze prowadzi do najnowszego wpisu.
              </p>
            </>
          ) : (
            <>
              <label className="content-item__label">
                Opis (ten sam na Instagram i Facebook)
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={item.kind === "post" ? 12 : 6}
                  disabled={published}
                />
              </label>
              <p
                className={
                  caption.length > IG_CAPTION_LIMIT || hashtags > 30
                    ? "content-item__count is-over"
                    : "content-item__count"
                }
              >
                {caption.length} / {IG_CAPTION_LIMIT} znaków · {hashtags} / 30 hasztagów
              </p>
              <label className="content-item__label">
                Pierwszy komentarz (link do wpisu — dodaje się sam zaraz po publikacji)
                <textarea
                  value={firstComment}
                  onChange={(e) => setFirstComment(e.target.value)}
                  rows={2}
                  placeholder="Puste = bez komentarza"
                  disabled={published}
                />
              </label>
              {captionDirty ? (
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={saveCaption}
                  disabled={busy === "save"}
                >
                  Zapisz opis
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>

      {published ? (
        <div className="content-item__published">
          {permalinks.map((link) => (
            <a key={link} href={link} target="_blank" rel="noreferrer">
              {link.includes("facebook") ? "Zobacz na Facebooku" : "Zobacz na Instagramie"}
              <ExternalLink aria-hidden="true" />
            </a>
          ))}
        </div>
      ) : (
        <>
          <div className="content-item__approvals">
            {item.kind === "blog" || item.kind === "story" ? (
              <ApproveButton
                approved={item.mediaApproved && item.captionApproved}
                onClick={toggleMedia}
              >
                {item.mediaApproved && item.captionApproved
                  ? item.kind === "blog"
                    ? "Wpis zatwierdzony"
                    : "Story zatwierdzone"
                  : item.kind === "blog"
                    ? "Zatwierdź wpis"
                    : "Zatwierdź story"}
              </ApproveButton>
            ) : (
              <>
                <ApproveButton
                  approved={item.mediaApproved}
                  disabled={item.kind === "reel" && !hasVideo}
                  onClick={toggleMedia}
                >
                  {item.kind === "reel"
                    ? item.mediaApproved
                      ? "Wideo zatwierdzone"
                      : "Zatwierdź wideo"
                    : item.mediaApproved
                      ? "Grafika zatwierdzona"
                      : "Zatwierdź grafikę"}
                </ApproveButton>
                <ApproveButton
                  approved={item.captionApproved}
                  disabled={captionDirty}
                  onClick={() => save({ caption_approved: !item.captionApproved })}
                >
                  {item.captionApproved ? "Opis zatwierdzony" : "Zatwierdź opis"}
                </ApproveButton>
              </>
            )}
          </div>

          <footer className="content-item__foot">
            <label className="content-item__when-edit">
              Termin
              <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
              {whenDirty ? (
                <button type="button" className="btn btn--outline btn--sm" onClick={saveWhen}>
                  Zapisz termin
                </button>
              ) : null}
            </label>

            {CHANNELS[item.kind].length ? (
              <fieldset className="content-item__channels">
                <legend>Publikuj automatycznie na:</legend>
                {CHANNELS[item.kind].map((c) => (
                  <label key={c.value}>
                    <input
                      type="checkbox"
                      checked={item.channels.includes(c.value)}
                      onChange={() => toggleChannel(c.value)}
                    />
                    {c.label}
                  </label>
                ))}
              </fieldset>
            ) : null}

            <div className="content-item__actions">
              {item.status === "failed" ? (
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  onClick={() => run("retry", async () => onChange(await retryItem(item.id)))}
                >
                  Spróbuj ponownie
                </button>
              ) : null}
              {status.tone === "ok" ? (
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  onClick={onPublishNow}
                  disabled={busy === "publish"}
                >
                  <Send className="btn__icon" aria-hidden="true" />
                  {busy === "publish" ? "Publikowanie…" : "Opublikuj teraz"}
                </button>
              ) : null}
              <button
                type="button"
                className="content-item__delete"
                onClick={onDelete}
                aria-label="Usuń z kalendarza"
              >
                <Trash2 aria-hidden="true" />
              </button>
            </div>
          </footer>
        </>
      )}

      {item.kind === "reel" && item.details.scenes?.length ? <ReelScript item={item} /> : null}

      {item.kind === "post" &&
      (item.details.dm || item.details.google || item.details.links?.length) ? (
        <details className="content-item__more">
          <summary>Odpowiedź w DM, wizytówka Google i linki</summary>
          {item.details.dm ? (
            <CopyBlock
              label="Odpowiedź w DM (dla osób, które napiszą słowo)"
              text={item.details.dm}
            />
          ) : null}
          {item.details.google ? (
            <CopyBlock label="Wizytówka Google — aktualność" text={item.details.google} />
          ) : null}
          {item.details.links?.map((l) => (
            <CopyBlock key={l.url} label={l.label} text={l.url} />
          ))}
          {item.details.alt ? (
            <CopyBlock label="Tekst alternatywny (Instagram)" text={item.details.alt} />
          ) : null}
        </details>
      ) : null}
    </article>
  );
}

function ReelScript({ item }: { item: ContentItem }) {
  const d = item.details;
  const prompter = (d.scenes ?? [])
    .map((s) => s.say)
    .filter(Boolean)
    .join("\n\n");
  return (
    <details className="content-item__more">
      <summary>Scenariusz rolki</summary>
      <p className="content-item__meta">
        {[d.format, d.length, d.audio ? `dźwięk: ${d.audio}` : null].filter(Boolean).join(" · ")}
      </p>
      {d.hook ? (
        <p className="content-item__hook">
          <b>Hak (pierwsze 2 sekundy):</b> {d.hook}
        </p>
      ) : null}
      {d.cover ? (
        <p>
          <b>Napis na okładce:</b> {d.cover}
        </p>
      ) : null}
      <table className="content-item__scenes">
        <thead>
          <tr>
            <th>Czas</th>
            <th>Co widać</th>
            <th>Co mówisz</th>
            <th>Napis na ekranie</th>
          </tr>
        </thead>
        <tbody>
          {d.scenes!.map((s) => (
            <tr key={s.time}>
              <td data-h="Czas">{s.time}</td>
              <td data-h="Co widać">{s.shot}</td>
              <td data-h="Co mówisz">{s.say ?? "—"}</td>
              <td data-h="Napis">{s.text ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {d.tips ? (
        <p className="content-item__hint">
          <b>Jak nagrać:</b> {d.tips}
        </p>
      ) : null}
      {prompter ? (
        <button type="button" className="btn btn--outline btn--sm" onClick={() => copy(prompter)}>
          <Copy className="btn__icon" aria-hidden="true" />
          Kopiuj tekst do telepromptera
        </button>
      ) : null}
    </details>
  );
}
