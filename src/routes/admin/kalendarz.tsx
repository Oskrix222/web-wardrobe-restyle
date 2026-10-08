import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/AdminShell";
import { ContentItemCard, statusOf } from "@/components/admin/ContentItemCard";
import { isMissingSetup, SetupNotice } from "@/components/admin/SetupNotice";
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
  const thisWeek = weekKey(new Date().toISOString()) === key;
  return `${thisWeek ? "Ten tydzień · " : ""}${rangeDay.format(start)} – ${rangeDay.format(end)}`;
}

function AdminCalendar() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [items, setItems] = useState<ContentItem[] | null>(null);
  const [connection, setConnection] = useState<ConnectionStatus | null>(null);
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [missingSetup, setMissingSetup] = useState(false);

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
      filter === "all" ? true : filter === "published" ? i.status === "published" : i.status !== "published",
    );
    const groups = new Map<string, ContentItem[]>();
    for (const item of visible) {
      const key = weekKey(item.scheduledAt);
      groups.set(key, [...(groups.get(key) ?? []), item]);
    }
    const sorted = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
    return filter === "published" ? sorted.reverse() : sorted;
  }, [items, filter]);

  const onShift = async (campaign: Campaign, days: number) => {
    try {
      await shiftCampaign(campaign, (items ?? []).filter((i) => i.campaignId === campaign.id), days);
      toast.success(days > 0 ? "Przesunięto o tydzień do przodu." : "Przesunięto o tydzień wcześniej.");
      load();
    } catch {
      toast.error("Nie udało się przesunąć kampanii.");
    }
  };

  const onDeleteCampaign = async (campaign: Campaign) => {
    if (!window.confirm(`Usunąć całą kampanię „${campaign.title}” (wszystkie posty, rolki i story)?`)) return;
    try {
      await deleteCampaign(campaign, (items ?? []).filter((i) => i.campaignId === campaign.id));
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
                onClick={() => setFilter(value)}
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
            return (
              <section key={key} className="content-cal__week">
                <header className="content-cal__week-head">
                  <h2>{weekLabel(key)}</h2>
                  {weekCampaigns.map((c) => (
                    <div key={c.id} className="content-cal__campaign">
                      <span>
                        {c.title}
                        {c.keyword ? <em> · {c.keyword}</em> : null}
                      </span>
                      <button type="button" onClick={() => onShift(c, -7)} title="Cała kampania tydzień wcześniej">
                        −7 dni
                      </button>
                      <button type="button" onClick={() => onShift(c, 7)} title="Cała kampania tydzień później">
                        +7 dni
                      </button>
                      <button type="button" onClick={() => onDeleteCampaign(c)}>
                        Usuń
                      </button>
                      {c.notes.length ? (
                        <details>
                          <summary>Zanim opublikujesz ({c.notes.length})</summary>
                          <ul>
                            {c.notes.map((n) => (
                              <li key={n}>{n}</li>
                            ))}
                          </ul>
                        </details>
                      ) : null}
                    </div>
                  ))}
                </header>
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
              </section>
            );
          })
        )}
      </div>
    </AdminShell>
  );
}
