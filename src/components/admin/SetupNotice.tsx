import { Copy } from "lucide-react";
import { toast } from "sonner";

import calendarSql from "../../../supabase/migrations/20261008090000_content_calendar.sql?raw";
import settingsSql from "../../../supabase/migrations/20261008120000_content_settings.sql?raw";

// Both parts in one paste; each is safe to run more than once.
const SETUP_SQL = `${calendarSql}\n\n${settingsSql}`;

/** True when Supabase says the calendar tables/functions don't exist yet (SQL not run). */
export function isMissingSetup(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  return ["PGRST205", "PGRST204", "PGRST202", "42P01", "42703", "42883"].includes(code ?? "");
}

/** Shown instead of an endless "Wczytywanie…" until the calendar SQL has been run once. */
export function SetupNotice() {
  const copySql = () =>
    navigator.clipboard
      .writeText(SETUP_SQL)
      .then(() => toast.success("Skopiowano SQL — wklej go w Supabase."))
      .catch(() => toast.error("Nie udało się skopiować."));

  return (
    <div className="content-setup">
      <h2>Baza nie ma jeszcze tabel kalendarza</h2>
      <p>Jednorazowa konfiguracja, ok. 1 minuty:</p>
      <ol>
        <li>
          Kliknij <b>Kopiuj SQL</b> poniżej.
        </li>
        <li>
          Wejdź na <b>supabase.com</b> → Twój projekt → <b>SQL Editor</b> → <b>New query</b>.
        </li>
        <li>
          Wklej (Cmd + V) i kliknij <b>Run</b>. Ma się pojawić „Success”. Jeśli Supabase zapyta o
          „destructive operation”, kliknij <b>Run this query</b> — nic nie zostanie skasowane.
        </li>
        <li>Wróć tutaj i odśwież stronę.</li>
      </ol>
      <button type="button" className="btn btn--primary btn--md" onClick={copySql}>
        <Copy className="btn__icon" aria-hidden="true" />
        Kopiuj SQL
      </button>
    </div>
  );
}
