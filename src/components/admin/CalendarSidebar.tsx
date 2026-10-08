import { useEffect, useRef, useState, type DragEvent } from "react";
import { FileArchive, Trash2, Upload as UploadIcon } from "lucide-react";
import { toast } from "sonner";

import {
  DEFAULT_WEEK_PLAN,
  deleteUpload,
  getSetting,
  listUploads,
  saveSetting,
  uploadZip,
  type Author,
  type Slot,
  type Upload,
  type WeekPlan,
} from "@/lib/content-admin";

const DAYS = ["poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota", "niedziela"];

const UPLOAD_STATUS: Record<Upload["status"], string> = {
  new: "Czeka na przygotowanie",
  processing: "Claude przygotowuje…",
  done: "Gotowe — w kalendarzu",
  error: "Błąd",
};

const dateTime = new Intl.DateTimeFormat("pl-PL", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Warsaw",
});

/** Drop zone for a ZIP of graphics + the list of what's waiting / done. */
export function ZipUploadBox() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    listUploads()
      .then(setUploads)
      .catch(() => setUploads([]));
  };
  useEffect(load, []);

  const send = async (files: FileList | null) => {
    const zips = [...(files ?? [])].filter((f) => /\.zip$/i.test(f.name));
    if (!zips.length) {
      toast.error("Wrzuć plik .zip z grafikami.");
      return;
    }
    setBusy(true);
    try {
      for (const zip of zips) await uploadZip(zip);
      toast.success("Wysłane. Otwórz Claude Code i napisz /nowy-post — przygotuje paczki.");
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nie udało się wysłać ZIP-a.");
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    void send(e.dataTransfer.files);
  };

  const onDelete = async (upload: Upload) => {
    if (!window.confirm(`Usunąć ${upload.fileName}?`)) return;
    try {
      await deleteUpload(upload.id);
      load();
    } catch {
      toast.error("Nie udało się usunąć.");
    }
  };

  return (
    <section className="cal-side__box">
      <h2>Nowa paczka</h2>
      <div
        className={over ? "zip-drop is-over" : "zip-drop"}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      >
        <UploadIcon aria-hidden="true" />
        <span>{busy ? "Wysyłanie…" : "Przeciągnij tu ZIP z grafikami albo kliknij"}</span>
        <small>Każda grafika = osobny temat = osobny tydzień.</small>
        <input
          ref={inputRef}
          type="file"
          accept=".zip,application/zip"
          multiple
          hidden
          onChange={(e) => void send(e.target.files)}
        />
      </div>
      {uploads.length ? (
        <ul className="zip-list">
          {uploads.map((u) => (
            <li key={u.id} className={`is-${u.status}`}>
              <FileArchive aria-hidden="true" />
              <div>
                <b>{u.fileName}</b>
                <span>
                  {UPLOAD_STATUS[u.status]} · {dateTime.format(new Date(u.createdAt))}
                </span>
                {u.note ? <small>{u.note}</small> : null}
              </div>
              <button type="button" aria-label={`Usuń ${u.fileName}`} onClick={() => onDelete(u)}>
                <Trash2 aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {uploads.some((u) => u.status === "new") ? (
        <p className="cal-side__hint">
          Następny krok: w Claude Code na Macu napisz <code>/nowy-post</code>. Przygotuje każdą
          grafikę i wstawi ją na kolejne wolne tygodnie.
        </p>
      ) : null}
    </section>
  );
}

function SlotEditor({
  label,
  slot,
  onChange,
}: {
  label: string;
  slot: Slot;
  onChange: (slot: Slot) => void;
}) {
  return (
    <label className="slot-row">
      <span>{label}</span>
      <select value={slot.day} onChange={(e) => onChange({ ...slot, day: Number(e.target.value) })}>
        {DAYS.map((d, i) => (
          <option key={d} value={i + 1}>
            {d}
          </option>
        ))}
      </select>
      <input
        type="time"
        value={slot.time}
        onChange={(e) => onChange({ ...slot, time: e.target.value })}
      />
    </label>
  );
}

/** Default days/hours for every new week, plus the blog authors (they alternate weekly). */
export function WeekPlanBox() {
  const [plan, setPlan] = useState<WeekPlan | null>(null);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    Promise.all([getSetting("schedule", DEFAULT_WEEK_PLAN), getSetting<Author[]>("authors", [])])
      .then(([p, a]) => {
        setPlan(p);
        setAuthors(a);
      })
      .catch(() => setPlan(DEFAULT_WEEK_PLAN));
  }, []);

  if (!plan) return null;

  const change = (next: WeekPlan) => {
    setPlan(next);
    setDirty(true);
  };
  const changeAuthor = (i: number, patch: Partial<Author>) => {
    setAuthors(authors.map((a, j) => (j === i ? { ...a, ...patch } : a)));
    setDirty(true);
  };

  const save = async () => {
    try {
      await Promise.all([saveSetting("schedule", plan), saveSetting("authors", authors)]);
      setDirty(false);
      toast.success("Zapisano. Nowe tygodnie dostaną te dni i godziny.");
    } catch {
      toast.error("Nie udało się zapisać.");
    }
  };

  return (
    <section className="cal-side__box">
      <h2>Plan tygodnia</h2>
      <p className="cal-side__hint">
        Domyślne dni i godziny dla każdego nowego tygodnia. Pojedynczą pozycję przestawisz w jej
        karcie.
      </p>
      <div className="slot-list">
        <SlotEditor
          label="Wpis na blogu"
          slot={plan.blog}
          onChange={(blog) => change({ ...plan, blog })}
        />
        {plan.reels.map((reel, i) => (
          <SlotEditor
            key={i}
            label={`Rolka ${i + 1}`}
            slot={reel}
            onChange={(slot) =>
              change({ ...plan, reels: plan.reels.map((r, j) => (j === i ? slot : r)) })
            }
          />
        ))}
        <SlotEditor label="Post" slot={plan.post} onChange={(post) => change({ ...plan, post })} />
        <SlotEditor
          label="Story"
          slot={plan.story}
          onChange={(story) => change({ ...plan, story })}
        />
      </div>

      <h3>Autorzy wpisów (na zmianę)</h3>
      <div className="author-list">
        {authors.map((a, i) => (
          <div key={i} className="author-row">
            <input
              value={a.name}
              aria-label="Imię i nazwisko"
              onChange={(e) => changeAuthor(i, { name: e.target.value })}
            />
            <input
              value={a.phone}
              aria-label="Telefon"
              inputMode="tel"
              onChange={(e) => changeAuthor(i, { phone: e.target.value })}
            />
          </div>
        ))}
      </div>

      {dirty ? (
        <button type="button" className="btn btn--primary btn--sm" onClick={save}>
          Zapisz plan
        </button>
      ) : null}
    </section>
  );
}
