import { useEffect, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CircleCheck, CircleAlert, Copy } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/AdminShell";
import { getConnectionStatus, type ConnectionStatus } from "@/lib/content-admin";
import { disconnectMeta, getMetaConnectUrl, getServerSetup } from "@/lib/content.functions";

export const Route = createFileRoute("/admin/polaczenia")({
  // ?meta=ok|<error> comes back from the Facebook login (/api/meta/callback).
  validateSearch: (search: Record<string, unknown>): { meta?: string } =>
    typeof search["meta"] === "string" ? { meta: search["meta"] } : {},
  head: () => ({
    meta: [{ title: "Połączenia — Panel OSCare" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminConnections,
});

const dateTime = new Intl.DateTimeFormat("pl-PL", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Warsaw",
});

function Check({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <li className={ok ? "is-ok" : "is-missing"}>
      {ok ? <CircleCheck aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}
      <span>{children}</span>
    </li>
  );
}

function AdminConnections() {
  const { meta: metaResult } = Route.useSearch();
  const navigate = Route.useNavigate();
  const fetchSetup = useServerFn(getServerSetup);
  const fetchConnectUrl = useServerFn(getMetaConnectUrl);
  const disconnect = useServerFn(disconnectMeta);
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [setup, setSetup] = useState<{ serviceKey: boolean; metaApp: boolean } | null>(null);
  const [connecting, setConnecting] = useState(false);
  const callbackUrl = typeof window === "undefined" ? "" : `${window.location.origin}/api/meta/callback`;

  const load = () => {
    getConnectionStatus()
      .then(setStatus)
      .catch(() => toast.error("Nie udało się wczytać statusu. Czy baza ma już tabele kalendarza?"));
    fetchSetup()
      .then(setSetup)
      .catch(() => setSetup(null));
  };
  useEffect(load, []);

  // Result of the Facebook login (see /api/meta/callback).
  useEffect(() => {
    if (!metaResult) return;
    if (metaResult === "ok") toast.success("Połączono Instagram i Facebooka.");
    else toast.error(`Nie udało się połączyć: ${metaResult}`);
    navigate({ search: {}, replace: true });
  }, [metaResult, navigate]);

  const onConnect = async () => {
    setConnecting(true);
    try {
      const { url } = await fetchConnectUrl();
      window.location.href = url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nie udało się rozpocząć logowania.");
      setConnecting(false);
    }
  };

  const onDisconnect = async () => {
    if (!window.confirm("Rozłączyć konta? Automat przestanie publikować do czasu ponownego połączenia.")) return;
    try {
      await disconnect();
      toast.success("Rozłączono.");
      load();
    } catch {
      toast.error("Nie udało się rozłączyć.");
    }
  };

  const meta = status?.meta;
  const cron = status?.cron;
  const cronFresh = cron ? Date.now() - new Date(cron.lastRunAt).getTime() < 30 * 60_000 : false;

  return (
    <AdminShell>
      <div className="content-connections">
        <h1>Połączenia</h1>

        <section className="content-connections__card">
          <h2>Instagram i Facebook</h2>
          {meta ? (
            <p className="content-connections__ok">
              Połączono: strona <b>{meta.pageName}</b>
              {meta.igUsername ? (
                <>
                  {" "}
                  i Instagram <b>@{meta.igUsername}</b>
                </>
              ) : null}
              . Automat publikuje zatwierdzone posty i rolki.
            </p>
          ) : (
            <p>
              Po połączeniu automat sam publikuje zatwierdzone posty, rolki i story. Logujesz się przez
              Facebooka, bo to Facebook zarządza firmowymi kontami Instagrama.
            </p>
          )}
          <div className="content-connections__actions">
            <button
              type="button"
              className="btn btn--primary btn--md"
              onClick={onConnect}
              disabled={connecting || setup?.metaApp === false}
            >
              {meta ? "Połącz ponownie" : "Połącz z Facebookiem i Instagramem"}
            </button>
            {meta ? (
              <button type="button" className="btn btn--outline btn--md" onClick={onDisconnect}>
                Rozłącz
              </button>
            ) : null}
          </div>

          <h3>Co musi być gotowe</h3>
          <ul className="content-connections__checks">
            <Check ok={Boolean(setup?.metaApp)}>
              Aplikacja w Meta for Developers, a jej <b>App ID</b> i <b>App Secret</b> wpisane w
              Cloudflare (Worker → Settings → Variables and Secrets) jako <code>META_APP_ID</code> i{" "}
              <code>META_APP_SECRET</code>.
            </Check>
            <Check ok={Boolean(meta)}>
              Konto Instagram przełączone na <b>firmowe lub twórcy</b> i podpięte do strony na Facebooku.
            </Check>
            <li className="content-connections__plain">
              W aplikacji Meta, w ustawieniach logowania przez Facebooka, dodaj adres przekierowania:
              <span className="content-connections__copy">
                <code>{callbackUrl}</code>
                <button
                  type="button"
                  aria-label="Kopiuj adres"
                  onClick={() => navigator.clipboard.writeText(callbackUrl).then(() => toast.success("Skopiowano."))}
                >
                  <Copy aria-hidden="true" />
                </button>
              </span>
            </li>
          </ul>
        </section>

        <section className="content-connections__card">
          <h2>Automat publikacji</h2>
          <p>
            Co 10 minut sprawdza kalendarz i publikuje wszystko, co jest zatwierdzone i ma już swoją
            godzinę.
          </p>
          <ul className="content-connections__checks">
            <Check ok={Boolean(setup?.serviceKey)}>
              Klucz bazy <code>SUPABASE_SERVICE_ROLE_KEY</code> wpisany w Cloudflare jako Secret.
            </Check>
            <Check ok={cronFresh}>
              {cron ? (
                <>
                  Ostatnio działał: <b>{dateTime.format(new Date(cron.lastRunAt))}</b> (sprawdził{" "}
                  {cron.checked}, opublikował {cron.published.length}
                  {cron.errors.length ? `, błędy: ${cron.errors.length}` : ""}).
                </>
              ) : (
                "Jeszcze nie działał. Pierwszy przebieg pojawi się do 10 minut po wpisaniu klucza bazy."
              )}
            </Check>
          </ul>
          {cron?.errors.length ? (
            <ul className="content-connections__errors">
              {cron.errors.map((e) => (
                <li key={e.title}>
                  <b>{e.title}:</b> {e.error}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </div>
    </AdminShell>
  );
}
