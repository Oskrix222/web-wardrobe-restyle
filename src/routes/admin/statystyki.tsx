import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  Eye,
  ExternalLink,
  FileText,
  MousePointerClick,
  Percent,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/AdminShell";
import { StatsChart, type ChartDay } from "@/components/admin/StatsChart";
import { listAllPosts, listDailyStats, type AdminBlogPost, type DailyStat } from "@/lib/blog-admin";
import { GA_MEASUREMENT_ID, GOOGLE_ADS_ID } from "@/lib/analytics";

/** Embed URL of a Looker Studio report pulling GA4 + Google Ads data (optional). */
const LOOKER_STUDIO_URL = import.meta.env["VITE_LOOKER_STUDIO_URL"] as string | undefined;

const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];
const MAX_RANGE = 90;

// en-CA formats as YYYY-MM-DD, matching the `day` column (Warsaw calendar days).
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Warsaw" });

function lastDays(count: number): string[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) =>
    dayKey.format(new Date(now - (count - 1 - i) * 86_400_000)),
  );
}

function percent(part: number, whole: number): string {
  return whole ? `${((part / whole) * 100).toFixed(1).replace(".", ",")}%` : "—";
}

export const Route = createFileRoute("/admin/statystyki")({
  head: () => ({
    meta: [{ title: "Statystyki — Panel OSCare" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminStats,
});

function AdminStats() {
  const [range, setRange] = useState<Range>(30);
  const [posts, setPosts] = useState<AdminBlogPost[] | null>(null);
  const [daily, setDaily] = useState<DailyStat[] | null>(null);
  const [dailyFailed, setDailyFailed] = useState(false);

  useEffect(() => {
    listAllPosts()
      .then(setPosts)
      .catch(() => toast.error("Nie udało się wczytać wpisów."));
    // Always fetch the widest range once; switching ranges just re-slices it.
    listDailyStats(lastDays(MAX_RANGE)[0]!)
      .then(setDaily)
      .catch(() => setDailyFailed(true));
  }, []);

  const view = useMemo(() => {
    const days = lastDays(range);
    const byDay = new Map<string, ChartDay>(
      days.map((day) => [day, { day, views: 0, contactClicks: 0 }]),
    );
    const byPost = new Map<string, { views: number; contactClicks: number }>();

    for (const row of daily ?? []) {
      const bucket = byDay.get(row.day);
      if (!bucket) continue;
      bucket.views += row.views;
      bucket.contactClicks += row.contactClicks;
      const post = byPost.get(row.postId) ?? { views: 0, contactClicks: 0 };
      post.views += row.views;
      post.contactClicks += row.contactClicks;
      byPost.set(row.postId, post);
    }

    const chart = [...byDay.values()];
    return {
      chart,
      byPost,
      views: chart.reduce((sum, d) => sum + d.views, 0),
      contactClicks: chart.reduce((sum, d) => sum + d.contactClicks, 0),
    };
  }, [daily, range]);

  const published = posts?.filter((p) => p.status === "published") ?? [];
  const drafts = (posts?.length ?? 0) - published.length;

  const ranking = [...published]
    .map((post) => ({
      post,
      period: view.byPost.get(post.id) ?? { views: 0, contactClicks: 0 },
    }))
    .sort((a, b) => b.period.views - a.period.views || b.post.viewCount - a.post.viewCount);

  const dailyReady = daily !== null || dailyFailed;
  const kpis = [
    {
      label: "Wyświetlenia",
      value: view.views.toLocaleString("pl-PL"),
      ready: dailyReady,
      icon: Eye,
    },
    {
      label: "Kliknięcia w kontakt",
      value: view.contactClicks.toLocaleString("pl-PL"),
      ready: dailyReady,
      icon: MousePointerClick,
    },
    {
      label: "Konwersja",
      value: percent(view.contactClicks, view.views),
      ready: dailyReady,
      icon: Percent,
    },
    {
      label: "Opublikowane wpisy",
      value: String(published.length),
      hint: drafts ? `+ ${drafts} w szkicach` : undefined,
      ready: posts !== null,
      icon: FileText,
    },
  ];

  return (
    <AdminShell>
      <div className="admin-stats">
        <div className="admin-stats__head">
          <h1>Statystyki</h1>
          <div className="admin-stats__range" role="group" aria-label="Zakres dat">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                className={r === range ? "is-active" : ""}
                aria-pressed={r === range}
                onClick={() => setRange(r)}
              >
                {r} dni
              </button>
            ))}
          </div>
        </div>

        {dailyFailed ? (
          <p className="admin-stats__notice">
            <TriangleAlert aria-hidden="true" />
            Brak danych dziennych — upewnij się, że migracja <code>blog_daily_stats</code> została
            uruchomiona w Supabase. Łączne liczniki w tabeli poniżej działają niezależnie.
          </p>
        ) : null}

        <div className="admin-stats__kpis">
          {kpis.map(({ label, value, hint, ready, icon: Icon }) => (
            <div key={label} className="admin-stats__kpi">
              <Icon aria-hidden="true" />
              <span className="admin-stats__kpi-label">{label}</span>
              <span className="admin-stats__kpi-value">{ready ? value : "…"}</span>
              {hint ? <span className="admin-stats__kpi-hint">{hint}</span> : null}
            </div>
          ))}
        </div>

        <section className="admin-stats__card">
          <h2>Ruch na blogu — ostatnie {range} dni</h2>
          <StatsChart days={view.chart} />
        </section>

        <section className="admin-stats__card">
          <h2>Najpopularniejsze wpisy</h2>
          {posts === null ? (
            <p>Wczytywanie…</p>
          ) : ranking.length === 0 ? (
            <p>
              Brak opublikowanych wpisów. <Link to="/admin/blog/new">Dodaj pierwszy →</Link>
            </p>
          ) : (
            <table className="admin-stats__table">
              <thead>
                <tr>
                  <th>Wpis</th>
                  <th>Wyśw. ({range} dni)</th>
                  <th>Kontakt ({range} dni)</th>
                  <th>Konwersja</th>
                  <th>Wyśw. łącznie</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map(({ post, period }) => (
                  <tr key={post.id}>
                    <td>
                      <Link to="/admin/blog/$id" params={{ id: post.id }}>
                        {post.title}
                      </Link>
                    </td>
                    <td>{period.views}</td>
                    <td>{period.contactClicks}</td>
                    <td>{percent(period.contactClicks, period.views)}</td>
                    <td>{post.viewCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="admin-stats__card">
          <h2>Google Analytics i Google Ads</h2>
          <ul className="admin-stats__integrations">
            <li>
              <span>Google Analytics 4</span>
              <span className={GA_MEASUREMENT_ID ? "is-on" : ""}>
                {GA_MEASUREMENT_ID ? `Połączono · ${GA_MEASUREMENT_ID}` : "Nie skonfigurowano"}
              </span>
              <a href="https://analytics.google.com/" target="_blank" rel="noreferrer">
                Otwórz <ExternalLink aria-hidden="true" />
              </a>
            </li>
            <li>
              <span>Google Ads — konwersje</span>
              <span className={GOOGLE_ADS_ID ? "is-on" : ""}>
                {GOOGLE_ADS_ID ? `Połączono · ${GOOGLE_ADS_ID}` : "Nie skonfigurowano"}
              </span>
              <a href="https://ads.google.com/" target="_blank" rel="noreferrer">
                Otwórz <ExternalLink aria-hidden="true" />
              </a>
            </li>
            <li>
              <span>Google Search Console</span>
              <span>Pozycje w wyszukiwarce</span>
              <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer">
                Otwórz <ExternalLink aria-hidden="true" />
              </a>
            </li>
          </ul>

          {LOOKER_STUDIO_URL ? (
            <iframe
              src={LOOKER_STUDIO_URL}
              title="Raport Google (Looker Studio)"
              className="admin-stats__report"
              loading="lazy"
              allowFullScreen
              sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            />
          ) : (
            <div className="admin-stats__report-empty">
              <BarChart3 aria-hidden="true" />
              <p>
                Tu pojawi się raport z Google Analytics i Google Ads w jednym miejscu (Looker Studio
                — darmowe). Wklej jego adres osadzenia do <code>VITE_LOOKER_STUDIO_URL</code> w
                pliku <code>.env</code>.
              </p>
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
