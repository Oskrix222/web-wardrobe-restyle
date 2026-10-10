import { useEffect, useState, type ReactNode } from "react";
import { Link, Navigate, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  CalendarClock,
  CalendarDays,
  ChartColumn,
  ExternalLink,
  FileText,
  Inbox,
  LogOut,
  MessageSquareReply,
  Newspaper,
  Plug,
  Settings,
  ShieldCheck,
  SquarePen,
  TrendingUp,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAdminSession } from "@/hooks/useAdminSession";

type AdminPage = {
  to:
    | "/admin/kalendarz"
    | "/admin/blog"
    | "/admin/blog/new"
    | "/admin/prawdy"
    | "/admin/zgloszenia"
    | "/admin/odpowiedzi"
    | "/admin/statystyki"
    | "/admin/plan"
    | "/admin/polaczenia";
  label: string;
  icon: LucideIcon;
  /** Other paths that belong to this page (e.g. editing a post belongs to "Wpisy"). */
  match?: (path: string) => boolean;
};
type AdminSection = { label: string; icon: LucideIcon; pages: AdminPage[] };

// Two levels: the sections in the top bar, their pages in the row under it.
// Everyday work lives in "Treści" and "Klienci"; everything set up once and
// left alone (rules, automations, connections) lives in "Ustawienia".
const SECTIONS: AdminSection[] = [
  {
    label: "Treści",
    icon: Newspaper,
    pages: [
      { to: "/admin/kalendarz", label: "Kalendarz", icon: CalendarDays },
      {
        to: "/admin/blog",
        label: "Wpisy na blogu",
        icon: FileText,
        match: (p) => p.startsWith("/admin/blog") && p !== "/admin/blog/new",
      },
      { to: "/admin/blog/new", label: "Nowy wpis", icon: SquarePen },
    ],
  },
  {
    label: "Klienci",
    icon: UsersRound,
    pages: [{ to: "/admin/zgloszenia", label: "Zgłoszenia", icon: Inbox }],
  },
  {
    label: "Wyniki",
    icon: TrendingUp,
    pages: [{ to: "/admin/statystyki", label: "Statystyki bloga", icon: ChartColumn }],
  },
  {
    label: "Ustawienia",
    icon: Settings,
    pages: [
      { to: "/admin/plan", label: "Plan tygodnia", icon: CalendarClock },
      { to: "/admin/prawdy", label: "Prawdy", icon: ShieldCheck },
      { to: "/admin/odpowiedzi", label: "Automat odpowiedzi", icon: MessageSquareReply },
      { to: "/admin/polaczenia", label: "Połączenia", icon: Plug },
    ],
  },
];

const isPageActive = (page: Pick<AdminPage, "to" | "match">, path: string) =>
  page.match ? page.match(path) : path === page.to || path === `${page.to}/`;

/** Gates admin pages behind a Supabase session; shows the shared top bar once logged in. */
export function AdminShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { session, isLoggedIn, loading } = useAdminSession();
  const path = useRouterState({ select: (s) => s.location.pathname });
  // Being signed in isn't enough — the e-mail must be on the blog_admins list.
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!session) return;
    supabase.rpc("is_blog_admin").then(({ data, error }) => setIsAdmin(!error && data === true));
  }, [session]);

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Wylogowano.");
    navigate({ to: "/admin/login" });
  };

  if (loading || (isLoggedIn && isAdmin === null)) {
    return <div className="admin-shell__loading">Wczytywanie…</div>;
  }

  if (!isLoggedIn) {
    return <Navigate to="/admin/login" />;
  }

  if (!isAdmin) {
    return (
      <div className="admin-auth">
        <div className="admin-auth__card">
          <h1 className="admin-auth__title">Brak dostępu</h1>
          <p className="admin-auth__hint">
            Konto {session?.user.email} nie ma uprawnień do panelu bloga. Poproś Oskara o dodanie
            tego adresu do listy administratorów.
          </p>
          <button type="button" className="btn btn--outline btn--md" onClick={signOut}>
            Wyloguj
          </button>
        </div>
      </div>
    );
  }

  const section = SECTIONS.find((sec) => sec.pages.some((p) => isPageActive(p, path)));

  return (
    <div className="admin-shell">
      <header className="admin-shell__bar">
        <Link to="/admin/kalendarz" className="admin-shell__brand">
          Panel OSCare
        </Link>
        <nav className="admin-shell__sections" aria-label="Działy panelu">
          {SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const active = sec === section;
            return (
              <Link
                key={sec.label}
                to={sec.pages[0]!.to}
                className={active ? "is-active" : undefined}
                aria-current={active ? "true" : undefined}
              >
                <Icon aria-hidden="true" />
                {sec.label}
              </Link>
            );
          })}
        </nav>
        <div className="admin-shell__tools">
          <a href="/blog" target="_blank" rel="noreferrer">
            Zobacz blog <ExternalLink aria-hidden="true" />
          </a>
          <button type="button" onClick={signOut}>
            <LogOut aria-hidden="true" /> Wyloguj
          </button>
        </div>
      </header>
      {section ? (
        <nav className="admin-shell__pages" aria-label={`${section.label}: podstrony`}>
          <span className="admin-shell__pages-label">{section.label}</span>
          {section.pages.map(({ icon: PageIcon, ...page }) => (
            <Link
              key={page.to}
              to={page.to}
              className={isPageActive(page, path) ? "is-active" : undefined}
              aria-current={isPageActive(page, path) ? "page" : undefined}
            >
              <PageIcon aria-hidden="true" />
              {page.label}
            </Link>
          ))}
        </nav>
      ) : null}
      <main className="admin-shell__content">{children}</main>
    </div>
  );
}
