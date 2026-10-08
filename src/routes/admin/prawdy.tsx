import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/AdminShell";
import { isMissingSetup, SetupNotice } from "@/components/admin/SetupNotice";
import {
  addTruth,
  deleteTruth,
  listTruths,
  TRUTH_CATEGORIES,
  updateTruth,
  type Truth,
  type TruthCategory,
} from "@/lib/content-admin";

export const Route = createFileRoute("/admin/prawdy")({
  head: () => ({
    meta: [{ title: "Prawdy — Panel OSCare" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminTruths,
});

function AdminTruths() {
  const [truths, setTruths] = useState<Truth[] | null>(null);
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<TruthCategory>("oferta");
  const [editing, setEditing] = useState<{ id: string; body: string } | null>(null);
  const [missingSetup, setMissingSetup] = useState(false);

  const load = () => {
    listTruths()
      .then(setTruths)
      .catch((error: unknown) => {
        if (isMissingSetup(error)) setMissingSetup(true);
        else {
          setTruths([]);
          toast.error("Nie udało się wczytać listy. Odśwież stronę.");
        }
      });
  };
  useEffect(load, []);

  const onAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    try {
      await addTruth(body, category);
      setBody("");
      toast.success("Dodano. Claude uwzględni to przy następnej paczce.");
      load();
    } catch {
      toast.error("Nie udało się dodać.");
    }
  };

  const save = async (id: string, patch: Parameters<typeof updateTruth>[1], message?: string) => {
    try {
      await updateTruth(id, patch);
      if (message) toast.success(message);
      setEditing(null);
      load();
    } catch {
      toast.error("Nie udało się zapisać.");
    }
  };

  const onDelete = async (truth: Truth) => {
    if (!window.confirm("Usunąć tę zasadę?")) return;
    try {
      await deleteTruth(truth.id);
      load();
    } catch {
      toast.error("Nie udało się usunąć.");
    }
  };

  return (
    <AdminShell>
      <div className="content-truths">
        <h1>Prawdy o ofercie</h1>
        <p className="content-truths__hint">
          Wpisz tu wszystko, co jest prawdą o Twojej ofercie i jej ograniczeniach. Claude czyta tę listę
          przed napisaniem każdej paczki: nigdy jej nie zaprzeczy i nie będzie poruszał tych tematów w
          postach, na blogu ani w rolkach, po prostu je omija. Listę widzisz tylko Ty.
        </p>

        <form className="content-truths__form" onSubmit={onAdd}>
          <label>
            Rodzaj
            <select value={category} onChange={(e) => setCategory(e.target.value as TruthCategory)}>
              {TRUTH_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="content-truths__body">
            Prawda
            <textarea
              rows={2}
              value={body}
              placeholder={TRUTH_CATEGORIES.find((c) => c.value === category)?.hint}
              onChange={(e) => setBody(e.target.value)}
            />
          </label>
          <button type="submit" className="btn btn--primary btn--md" disabled={!body.trim()}>
            Dodaj
          </button>
        </form>

        {missingSetup ? (
          <SetupNotice />
        ) : truths === null ? (
          <p>Wczytywanie…</p>
        ) : (
          TRUTH_CATEGORIES.map((group) => {
            const list = truths.filter((t) => t.category === group.value);
            return (
              <section key={group.value} className="content-truths__group">
                <h2>{group.label}</h2>
                {list.length === 0 ? (
                  <p className="content-truths__empty">Nic tu jeszcze nie ma.</p>
                ) : (
                  <ul>
                    {list.map((truth) => (
                      <li key={truth.id} className={truth.active ? undefined : "is-off"}>
                        {editing?.id === truth.id ? (
                          <div className="content-truths__edit">
                            <textarea
                              rows={2}
                              value={editing.body}
                              onChange={(e) => setEditing({ id: truth.id, body: e.target.value })}
                            />
                            <button
                              type="button"
                              className="btn btn--primary btn--sm"
                              onClick={() => save(truth.id, { body: editing.body.trim() }, "Zapisano.")}
                            >
                              Zapisz
                            </button>
                            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditing(null)}>
                              Anuluj
                            </button>
                          </div>
                        ) : (
                          <p>{truth.body}</p>
                        )}
                        <div className="content-truths__actions">
                          <label title="Wyłączona zasada zostaje na liście, ale Claude jej nie stosuje.">
                            <input
                              type="checkbox"
                              checked={truth.active}
                              onChange={() => save(truth.id, { active: !truth.active })}
                            />
                            Obowiązuje
                          </label>
                          <button
                            type="button"
                            aria-label="Edytuj"
                            onClick={() => setEditing({ id: truth.id, body: truth.body })}
                          >
                            <Pencil aria-hidden="true" />
                          </button>
                          <button type="button" aria-label="Usuń" onClick={() => onDelete(truth)}>
                            <Trash2 aria-hidden="true" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })
        )}
      </div>
    </AdminShell>
  );
}
