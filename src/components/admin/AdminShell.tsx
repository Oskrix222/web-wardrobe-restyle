import { useEffect, useState, type ReactNode } from "react";
import { Link, Navigate, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAdminSession } from "@/hooks/useAdminSession";

/** Gates admin pages behind a Supabase session; shows the shared top bar once logged in. */
export function AdminShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { session, isLoggedIn, loading } = useAdminSession();
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

  return (
    <div className="admin-shell">
      <header className="admin-shell__bar">
        <Link to="/admin/statystyki" className="admin-shell__brand">
          Panel OSCare
        </Link>
        <nav className="admin-shell__nav">
          <Link to="/admin/statystyki" activeProps={{ className: "is-active" }}>
            Statystyki
          </Link>
          <Link
            to="/admin/blog"
            activeOptions={{ exact: true }}
            activeProps={{ className: "is-active" }}
          >
            Wpisy
          </Link>
          <Link to="/admin/blog/new" activeProps={{ className: "is-active" }}>
            Nowy wpis
          </Link>
          <Link to="/admin/zgloszenia" activeProps={{ className: "is-active" }}>
            Zgłoszenia
          </Link>
          <a href="/blog" target="_blank" rel="noreferrer">
            Zobacz blog ↗
          </a>
          <button type="button" onClick={signOut}>
            Wyloguj
          </button>
        </nav>
      </header>
      <main className="admin-shell__content">{children}</main>
    </div>
  );
}
