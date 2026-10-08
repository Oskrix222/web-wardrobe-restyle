import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/AdminShell";
import { isMissingSetup, SetupNotice } from "@/components/admin/SetupNotice";
import {
  getSetting,
  listReplies,
  saveSetting,
  type AutoReply,
  type AutoReplyChannel,
  type Reply,
} from "@/lib/content-admin";
import { getMetaConnectUrl } from "@/lib/content.functions";

export const Route = createFileRoute("/admin/odpowiedzi")({
  head: () => ({
    meta: [{ title: "Automat odpowiedzi — Panel OSCare" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminReplies,
});

const EMPTY: AutoReplyChannel = { enabled: false, message: "", publicReply: "" };
const PLATFORMS = [
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
] as const;

const dateTime = new Intl.DateTimeFormat("pl-PL", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Warsaw",
});

function AdminReplies() {
  const [settings, setSettings] = useState<AutoReply | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [dirty, setDirty] = useState(false);
  const [missingSetup, setMissingSetup] = useState(false);
  const fetchConnectUrl = useServerFn(getMetaConnectUrl);

  // Messaging permissions are asked for separately from publishing (see meta-graph.server.ts).
  const allowMessages = async () => {
    try {
      const { url } = await fetchConnectUrl({ data: { messaging: true } });
      window.location.href = url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nie udało się rozpocząć logowania.");
    }
  };

  useEffect(() => {
    getSetting<AutoReply>("auto_reply", { instagram: EMPTY, facebook: EMPTY })
      .then(setSettings)
      .catch((error: unknown) => {
        if (isMissingSetup(error)) setMissingSetup(true);
        else toast.error("Nie udało się wczytać ustawień.");
      });
    listReplies()
      .then(setReplies)
      .catch(() => setReplies([]));
  }, []);

  const change = (platform: keyof AutoReply, patch: Partial<AutoReplyChannel>) => {
    if (!settings) return;
    setSettings({ ...settings, [platform]: { ...settings[platform], ...patch } });
    setDirty(true);
  };

  const save = async () => {
    try {
      await saveSetting("auto_reply", settings);
      setDirty(false);
      toast.success("Zapisano.");
    } catch {
      toast.error("Nie udało się zapisać.");
    }
  };

  return (
    <AdminShell>
      <div className="content-replies">
        <h1>Automat odpowiedzi</h1>
        <p className="content-replies__hint">
          Gdy ktoś skomentuje post albo rolkę słowem kluczem z tej kampanii (np. „RAK”), automat
          odpisuje mu prywatną wiadomością i krótko pod komentarzem. Każda osoba dostaje wiadomość
          tylko raz. W tekstach możesz użyć: <code>{"{imie}"}</code> (imię lub nazwa konta),{" "}
          <code>{"{slowo}"}</code> (słowo klucz), <code>{"{link}"}</code> (link do wpisu na blogu).
        </p>

        {missingSetup ? <SetupNotice /> : null}

        {settings ? (
          <>
            <div className="content-replies__grid">
              {PLATFORMS.map(({ key, label }) => (
                <section key={key} className="content-replies__card">
                  <header>
                    <h2>{label}</h2>
                    <label className="content-replies__switch">
                      <input
                        type="checkbox"
                        checked={settings[key].enabled}
                        onChange={(e) => change(key, { enabled: e.target.checked })}
                      />
                      {settings[key].enabled ? "Włączony" : "Wyłączony"}
                    </label>
                  </header>
                  <label>
                    Wiadomość prywatna
                    <textarea
                      rows={6}
                      value={settings[key].message}
                      onChange={(e) => change(key, { message: e.target.value })}
                    />
                  </label>
                  <label>
                    Odpowiedź pod komentarzem (widoczna dla wszystkich)
                    <textarea
                      rows={2}
                      value={settings[key].publicReply}
                      placeholder="Puste = bez odpowiedzi pod komentarzem"
                      onChange={(e) => change(key, { publicReply: e.target.value })}
                    />
                  </label>
                </section>
              ))}
            </div>
            {dirty ? (
              <button type="button" className="btn btn--primary btn--md" onClick={save}>
                Zapisz
              </button>
            ) : null}
            <button type="button" className="btn btn--outline btn--md" onClick={allowMessages}>
              Pozwól automatowi wysyłać wiadomości
            </button>
            <p className="content-replies__hint">
              Ten przycisk loguje Cię do Facebooka jeszcze raz i dodaje uprawnienie do wiadomości
              prywatnych. Działa po połączeniu kont w{" "}
              <Link to="/admin/polaczenia">Połączeniach</Link>. Wysyłanie wiadomości do osób spoza
              Twojego konta może wymagać jednorazowej akceptacji aplikacji przez Meta — przeprowadzi
              Cię przez nią Claude.
            </p>
          </>
        ) : null}

        <h2 className="content-replies__log-title">Ostatnie odpowiedzi</h2>
        {replies.length === 0 ? (
          <p className="content-replies__hint">Jeszcze nikomu nie odpisano.</p>
        ) : (
          <ul className="content-replies__log">
            {replies.map((r, i) => (
              <li key={i} className={r.status === "failed" ? "is-failed" : undefined}>
                <span className="content-replies__platform">
                  {r.platform === "instagram" ? "IG" : "FB"}
                </span>
                <div>
                  <b>{r.author ?? "—"}</b>: {r.comment}
                  <small>
                    {dateTime.format(new Date(r.createdAt))}
                    {r.status === "failed" ? ` · nie wysłano: ${r.error ?? ""}` : " · wysłano"}
                  </small>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}
