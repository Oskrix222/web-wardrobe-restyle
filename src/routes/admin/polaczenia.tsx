import { useEffect, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CircleCheck, CircleAlert, Copy } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/AdminShell";
import { isMissingSetup, SetupNotice } from "@/components/admin/SetupNotice";
import { getConnectionStatus, type ConnectionStatus } from "@/lib/content-admin";
import {
  disconnectMeta,
  getMetaConnectUrl,
  getServerSetup,
  getUsage,
} from "@/lib/content.functions";

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

type Usage = Awaited<ReturnType<typeof getUsage>>;

const sizeLabel = (bytes: number) =>
  bytes >= 1024 ** 3
    ? `${(bytes / 1024 ** 3).toFixed(2).replace(".", ",")} GB`
    : `${Math.round(bytes / 1024 ** 2)} MB`;

function UsageBar({ label, used, limit }: { label: string; used: number | null; limit: number }) {
  const ratio = used == null ? 0 : Math.min(1, used / limit);
  const level = ratio >= 1 ? "is-full" : ratio >= 0.8 ? "is-high" : "";
  return (
    <div className={`content-usage ${level}`}>
      <div className="content-usage__label">
        <span>{label}</span>
        <span>{used == null ? "—" : `${sizeLabel(used)} z ${sizeLabel(limit)}`}</span>
      </div>
      <div className="content-usage__track">
        <div className="content-usage__fill" style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}

function AdminConnections() {
  const { meta: metaResult } = Route.useSearch();
  const navigate = Route.useNavigate();
  const fetchSetup = useServerFn(getServerSetup);
  const fetchUsage = useServerFn(getUsage);
  const [usage, setUsage] = useState<Usage | null>(null);
  const fetchConnectUrl = useServerFn(getMetaConnectUrl);
  const disconnect = useServerFn(disconnectMeta);
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [setup, setSetup] = useState<{ serviceKey: boolean; metaApp: boolean; r2: boolean } | null>(
    null,
  );
  const [connecting, setConnecting] = useState(false);
  const [missingSetup, setMissingSetup] = useState(false);
  const callbackUrl =
    typeof window === "undefined" ? "" : `${window.location.origin}/api/meta/callback`;

  const load = () => {
    getConnectionStatus()
      .then(setStatus)
      .catch((error: unknown) => {
        if (isMissingSetup(error)) setMissingSetup(true);
        else toast.error("Nie udało się wczytać statusu. Odśwież stronę.");
      });
    fetchSetup()
      .then(setSetup)
      .catch(() => setSetup(null));
    fetchUsage()
      .then(setUsage)
      .catch(() => setUsage(null));
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
    if (
      !window.confirm(
        "Rozłączyć konta? Automat przestanie publikować do czasu ponownego połączenia.",
      )
    )
      return;
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
        {missingSetup ? <SetupNotice /> : null}

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
              Po połączeniu automat sam publikuje zatwierdzone posty, rolki i story. Logujesz się
              przez Facebooka, bo to Facebook zarządza firmowymi kontami Instagrama.
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
              Konto Instagram przełączone na <b>firmowe lub twórcy</b> i podpięte do strony na
              Facebooku.
            </Check>
            <li className="content-connections__plain">
              W aplikacji Meta, w ustawieniach logowania przez Facebooka, dodaj adres
              przekierowania:
              <span className="content-connections__copy">
                <code>{callbackUrl}</code>
                <button
                  type="button"
                  aria-label="Kopiuj adres"
                  onClick={() =>
                    navigator.clipboard
                      .writeText(callbackUrl)
                      .then(() => toast.success("Skopiowano."))
                  }
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

        <section className="content-connections__card">
          <h2>Magazyn na rolki (Cloudflare R2)</h2>
          <p>
            Duże rolki (np. 1,5 min w 1080p) trzymamy w darmowym magazynie Cloudflare R2: 10 GB za
            darmo, a po publikacji plik sam się kasuje. Bez niego panel przyjmie rolki tylko do 50
            MB.
          </p>
          <ul className="content-connections__checks">
            <Check ok={Boolean(setup?.r2)}>
              Cloudflare → R2: włączone, bucket <code>oscare-rolki</code> z publicznym adresem
              (r2.dev), a w ustawieniach Workera: <code>R2_ACCOUNT_ID</code>, <code>R2_BUCKET</code>
              , <code>R2_PUBLIC_URL</code> oraz sekrety <code>R2_ACCESS_KEY_ID</code> i{" "}
              <code>R2_SECRET_ACCESS_KEY</code>. Claude przeprowadzi Cię przez to krok po kroku.
            </Check>
          </ul>
        </section>

        <section className="content-connections__card">
          <h2>Limity (ochrona przed rachunkami)</h2>
          <p>
            Twarde blokady w kodzie: po dojściu do limitu panel odmawia wgrania pliku, a automat
            wstrzymuje publikację do 1. dnia następnego miesiąca. Pojedynczy plik: rolka do 300 MB,
            ZIP do 50 MB, zdjęcie do 10 MB.
          </p>
          {usage ? (
            <>
              <UsageBar
                label={`Transfer w tym miesiącu (${usage.month})`}
                used={usage.transfer.used}
                limit={usage.transfer.limit}
              />
              <UsageBar
                label="Pliki w Supabase"
                used={usage.supabase.used}
                limit={usage.supabase.limit}
              />
              <UsageBar label="Rolki w R2" used={usage.r2.used} limit={usage.r2.limit} />
            </>
          ) : (
            <p>Zużycie pokaże się po dodaniu klucza bazy (SUPABASE_SERVICE_ROLE_KEY).</p>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
