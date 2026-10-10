import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/AdminShell";
import { ContentItemCard, statusOf } from "@/components/admin/ContentItemCard";
import { isMissingSetup, SetupNotice } from "@/components/admin/SetupNotice";
import { ZipUploadBox } from "@/components/admin/CalendarSidebar";
import {
  deleteCampaign,
  getConnectionStatus,
  listCalendar,
  shiftCampaign,
  type Campaign,
  type ConnectionStatus,
  type ContentItem,
} from "@/lib/content-admin";

export const Route = createFileRoute("/admin/kalendarz")({
  head: () => ({
    meta: [{ title: "Kalendarz treści — Panel OSCare" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminCalendar,
});

type Filter = "upcoming" | "published" | "all";

const rangeDay = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long" });

/** Monday 00:00 (local time) of the item's week — the calendar groups by it. */
function weekKey(iso: string) {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.toISOString();
}

function weekLabel(key: string) {
  const start = new Date(key);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return `${rangeDay.format(start)} – ${rangeDay.format(end)}`;
}

/** "Ten tydzień", "Za tydzień", "Za 3 tygodnie", "2 tygodnie temu". */
function weekDistance(key: string) {
  const diff = Math.round(
    (new Date(key).getTime() - new Date(weekKey(new Date().toISOString())).getTime()) /
      (7 * 24 * 3600 * 1000),
  );
  if (diff === 0) return "Ten tydzień";
  if (diff === 1) return "Następny tydzień";
  if (diff > 1) return `Za ${diff} tyg.`;
  return diff === -1 ? "Poprzedni tydzień" : `${-diff} tyg. temu`;
}

const KIND_LABEL: Record<ContentItem["kind"], string> = {
  blog: "Wpis",
  post: "Post",
  story: "Story",
  reel: "Rolka",
};

const itemLabel = (item: ContentItem) =>
  item.kind === "reel" ? `${KIND_LABEL.reel} ${item.position}` : KIND_LABEL[item.kind];

/** What's still to do in a week — drives the preview card and the week list. */
function weekProgress(items: ContentItem[]) {
  const statuses = items.map(statusOf);
  return {
    total: items.length,
    ready: statuses.filter((s) => s.tone === "ok" || s.tone === "done" || s.tone === "busy").length,
    toApprove: statuses.filter((s) => s.label === "Do zatwierdzenia").length,
    toFilm: statuses.filter((s) => s.label === "Wgraj rolkę").length,
    errors: statuses.filter((s) => s.tone === "error").length,
  };
}

function todoText(p: ReturnType<typeof weekProgress>) {
  const parts = [];
  if (p.errors) parts.push(`${p.errors} z błędem`);
  if (p.toApprove) parts.push(`${p.toApprove} do zatwierdzenia`);
  if (p.toFilm) parts.push(`${p.toFilm} ${p.toFilm === 1 ? "rolka" : "rolki"} do nagrania`);
  return parts.length ? parts.join(" · ") : "Wszystko gotowe, czeka na publikację";
}

function AdminCalendar() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [items, setItems] = useState<ContentItem[] | null>(null);
  const [connection, setConnection] = useState<ConnectionStatus | null>(null);
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [missingSetup, setMissingSetup] = useState(false);
  // Weeks shown in full; the rest are one-line previews. null = not chosen yet.
  const [openWeeks, setOpenWeeks] = useState<Set<string> | null>(null);

  const load = useCallback(() => {
    listCalendar()
      .then((data) => {
        setCampaigns(data.campaigns);
        setItems(data.items);
      })
      .catch((error: unknown) => {
        if (isMissingSetup(error)) setMissingSetup(true);
        else {
          setItems([]);
          toast.error("Nie udało się wczytać kalendarza. Odśwież stronę.");
        }
      });
    getConnectionStatus()
      .then(setConnection)
      .catch(() => setConnection(null));
  }, []);

  useEffect(load, [load]);

  const replace = (updated: ContentItem) =>
    setItems((list) => list?.map((i) => (i.id === updated.id ? updated : i)) ?? null);
  const remove = (id: string) => setItems((list) => list?.filter((i) => i.id !== id) ?? null);

  const campaignById = useMemo(() => new Map(campaigns.map((c) => [c.id, c])), [campaigns]);

  const counts = useMemo(() => {
    const all = (items ?? []).map(statusOf);
    return {
      todo: all.filter((s) => s.label === "Do zatwierdzenia").length,
      reels: all.filter((s) => s.label === "Wgraj rolkę").length,
      scheduled: all.filter((s) => s.tone === "ok").length,
      errors: all.filter((s) => s.tone === "error").length,
    };
  }, [items]);

  const weeks = useMemo(() => {
    const visible = (items ?? []).filter((i) =>
      filter === "all"
        ? true
        : filter === "published"
          ? i.status === "published"
          : i.status !== "published",
    );
    const groups = new Map<string, ContentItem[]>();
    for (const item of visible) {
      const key = weekKey(item.scheduledAt);
      groups.set(key, [...(groups.get(key) ?? []), item]);
    }
    const sorted = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
    return filter === "published" ? sorted.reverse() : sorted;
  }, [items, filter]);

  // Open the first week of the list by default (this week, or the next one with work).
  useEffect(() => {
    if (openWeeks || !weeks.length) return;
    setOpenWeeks(new Set([weeks[0]![0]]));
  }, [weeks, openWeeks]);

  const isOpen = (key: string) => openWeeks?.has(key) ?? false;
  const toggleWeek = (key: string, open = !isOpen(key)) =>
    setOpenWeeks((current) => {
      const next = new Set(current ?? []);
      if (open) next.add(key);
      else next.delete(key);
      return next;
    });
  const jumpTo = (key: string) => {
    toggleWeek(key, true);
    requestAnimationFrame(() =>
      document
        .getElementById(`week-${key}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  const onShift = async (campaign: Campaign, days: number) => {
    try {
      await shiftCampaign(
        campaign,
        (items ?? []).filter((i) => i.campaignId === campaign.id),
        days,
      );
      toast.success(
        days > 0 ? "Przesunięto o tydzień do przodu." : "Przesunięto o tydzień wcześniej.",
      );
      load();
    } catch {
      toast.error("Nie udało się przesunąć kampanii.");
    }
  };

  const onDeleteCampaign = async (campaign: Campaign) => {
    if (
      !window.confirm(`Usunąć całą kampanię „${campaign.title}” (wszystkie posty, rolki i story)?`)
    )
      return;
    try {
      await deleteCampaign(
        campaign,
        (items ?? []).filter((i) => i.campaignId === campaign.id),
      );
      toast.success("Kampania usunięta. Szkic wpisu został w „Wpisach”.");
      load();
    } catch {
      toast.error("Nie udało się usunąć kampanii.");
    }
  };

  return (
    <AdminShell>
      <div className="content-cal">
        <div className="content-cal__head">
          <div>
            <h1>Kalendarz treści</h1>
            <p className="content-cal__hint">
              Każdy tydzień: wpis na blogu, post, story i 3 rolki. Zatwierdź grafikę i opis, wgraj
              rolki, a automat opublikuje wszystko o wyznaczonej godzinie.
            </p>
          </div>
          <div className="content-cal__filters" role="tablist">
            {(
              [
                ["upcoming", "Do publikacji"],
                ["published", "Opublikowane"],
                ["all", "Wszystko"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={filter === value}
                className={filter === value ? "is-active" : undefined}
                onClick={() => {
                  setFilter(value);
                  setOpenWeeks(null);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {connection && !connection.meta ? (
          <div className="content-cal__banner">
            Instagram i Facebook nie są jeszcze połączone, więc automat nie opublikuje postów ani
            rolek. <Link to="/admin/polaczenia">Połącz konta →</Link>
          </div>
        ) : null}

        <div className="content-cal__kpis">
          <div className={counts.todo ? "is-todo" : undefined}>
            <b>{counts.todo}</b> do zatwierdzenia
          </div>
          <div className={counts.reels ? "is-todo" : undefined}>
            <b>{counts.reels}</b> rolek do nagrania
          </div>
          <div>
            <b>{counts.scheduled}</b> zaplanowanych
          </div>
          <div className={counts.errors ? "is-error" : undefined}>
            <b>{counts.errors}</b> błędów
          </div>
        </div>

        <div className="content-cal__layout">
          {missingSetup ? null : (
            <aside className="cal-side">
              {weeks.length ? (
                <section className="cal-side__box">
                  <h2>Tygodnie</h2>
                  <ol className="cal-weeks">
                    {weeks.map(([key, weekItems]) => {
                      const progress = weekProgress(weekItems);
                      const topic = campaignById.get(weekItems[0]!.campaignId)?.title;
                      return (
                        <li key={key}>
                          <button
                            type="button"
                            className={isOpen(key) ? "is-open" : undefined}
                            onClick={() => jumpTo(key)}
                          >
                            <span className="cal-weeks__when">
                              {weekDistance(key)} · {weekLabel(key)}
                            </span>
                            {topic ? <span className="cal-weeks__topic">{topic}</span> : null}
                            <span className="cal-weeks__bar" aria-hidden="true">
                              <span
                                style={{ width: `${(progress.ready / progress.total) * 100}%` }}
                              />
                            </span>
                            <span
                              className={
                                progress.errors
                                  ? "cal-weeks__todo is-error"
                                  : progress.ready === progress.total
                                    ? "cal-weeks__todo is-done"
                                    : "cal-weeks__todo"
                              }
                            >
                              {progress.ready}/{progress.total} gotowe
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              ) : null}
              <ZipUploadBox />
              <p className="cal-side__plan-link">
                Dni i godziny nowych tygodni ustawisz w{" "}
                <Link to="/admin/plan">Ustawienia → Plan tygodnia</Link>.
              </p>
            </aside>
          )}
          <div className="content-cal__main">
            {missingSetup ? (
              <SetupNotice />
            ) : items === null ? (
              <p>Wczytywanie…</p>
            ) : weeks.length === 0 ? (
              <div className="content-cal__empty">
                <p>
                  {filter === "published"
                    ? "Nic jeszcze nie zostało opublikowane."
                    : "Kalendarz jest pusty. Wyślij Claude'owi nowe grafiki: zrobi paczkę i wstawi ją tutaj na najbliższy wolny tydzień."}
                </p>
              </div>
            ) : (
              weeks.map(([key, weekItems]) => {
                const weekCampaigns = [...new Set(weekItems.map((i) => i.campaignId))]
                  .map((id) => campaignById.get(id))
                  .filter((c): c is Campaign => Boolean(c));
                const progress = weekProgress(weekItems);
                const open = isOpen(key);
                return (
                  <section
                    key={key}
                    id={`week-${key}`}
                    className={open ? "content-cal__week is-open" : "content-cal__week"}
                  >
                    <header className="content-cal__week-head">
                      <button
                        type="button"
                        className="content-cal__week-toggle"
                        aria-expanded={open}
                        onClick={() => toggleWeek(key)}
                      >
                        <span className="content-cal__week-when">{weekDistance(key)}</span>
                        <h2>{weekLabel(key)}</h2>
                        <span className="content-cal__week-topic">
                          {weekCampaigns.map((c) => c.title).join(" · ")}
                        </span>
                        <span className="content-cal__week-progress">
                          <span className="content-cal__week-bar" aria-hidden="true">
                            <span
                              style={{ width: `${(progress.ready / progress.total) * 100}%` }}
                            />
                          </span>
                          {progress.ready}/{progress.total} gotowe · {todoText(progress)}
                        </span>
                        {open ? (
                          <ChevronUp className="content-cal__week-chevron" aria-hidden="true" />
                        ) : (
                          <ChevronDown className="content-cal__week-chevron" aria-hidden="true" />
                        )}
                      </button>

                      {/* Closed: what's in the week at a glance. */}
                      {open ? null : (
                        <ul className="content-cal__chips" aria-label="Pozycje w tym tygodniu">
                          {weekItems.map((item) => {
                            const st = statusOf(item);
                            return (
                              <li key={item.id} className={`is-${st.tone}`} title={st.label}>
                                <b>{itemLabel(item)}</b>
                                <span>
                                  {new Intl.DateTimeFormat("pl-PL", {
                                    weekday: "short",
                                    timeZone: "Europe/Warsaw",
                                  }).format(new Date(item.scheduledAt))}
                                </span>
                                <em>{st.label}</em>
                              </li>
                            );
                          })}
                        </ul>
                      )}

                      {/* Open: campaign tools. */}
                      {open
                        ? weekCampaigns.map((c) => (
                            <div key={c.id} className="content-cal__campaign">
                              <span>
                                {c.title}
                                {c.keyword ? <em> · słowo {c.keyword}</em> : null}
                              </span>
                              <div className="content-cal__campaign-tools">
                                <button
                                  type="button"
                                  onClick={() => onShift(c, -7)}
                                  title="Cała kampania tydzień wcześniej"
                                >
                                  <ArrowUp aria-hidden="true" /> Tydzień wcześniej
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onShift(c, 7)}
                                  title="Cała kampania tydzień później"
                                >
                                  <ArrowDown aria-hidden="true" /> Tydzień później
                                </button>
                                <button
                                  type="button"
                                  className="is-danger"
                                  onClick={() => onDeleteCampaign(c)}
                                >
                                  <Trash2 aria-hidden="true" /> Usuń kampanię
                                </button>
                              </div>
                              {c.notes.length ? (
                                <details className="content-cal__notes">
                                  <summary>Zanim opublikujesz ({c.notes.length})</summary>
                                  <ul>
                                    {c.notes.map((n) => (
                                      <li key={n}>{n}</li>
                                    ))}
                                  </ul>
                                </details>
                              ) : null}
                            </div>
                          ))
                        : null}
                    </header>
                    {open ? (
                      <div className="content-cal__items">
                        {weekItems.map((item) => (
                          <ContentItemCard
                            key={item.id}
                            item={item}
                            campaign={campaignById.get(item.campaignId)}
                            onChange={replace}
                            onDeleted={() => remove(item.id)}
                          />
                        ))}
                      </div>
                    ) : null}
                  </section>
                );
              })
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
