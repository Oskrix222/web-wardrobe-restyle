import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/AdminShell";
import { insuranceOptions } from "@/components/site/LeadForm";
import { deleteLead, listLeads, type AdminLead } from "@/lib/leads-admin";
import { describeSource } from "@/lib/attribution";

const dateTime = new Intl.DateTimeFormat("pl-PL", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Warsaw",
});

function insuranceLabel(value: string): string {
  return insuranceOptions.find((o) => o.value === value)?.label ?? value;
}

export const Route = createFileRoute("/admin/zgloszenia")({
  head: () => ({
    meta: [{ title: "Zgłoszenia — Panel OSCare" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminLeads,
});

function AdminLeads() {
  const [leads, setLeads] = useState<AdminLead[] | null>(null);

  const load = () => {
    listLeads()
      .then(setLeads)
      .catch(() => toast.error("Nie udało się wczytać zgłoszeń."));
  };

  useEffect(load, []);

  const onDelete = async (lead: AdminLead) => {
    if (!window.confirm(`Trwale usunąć zgłoszenie od ${lead.name}? Tej operacji nie można cofnąć.`))
      return;
    try {
      await deleteLead(lead.id);
      toast.success("Zgłoszenie usunięte.");
      load();
    } catch {
      toast.error("Nie udało się usunąć zgłoszenia.");
    }
  };

  return (
    <AdminShell>
      <div className="admin-leads">
        <h1>Zgłoszenia z formularza</h1>
        <p className="admin-leads__hint">
          Dane osobowe klientów — nie przesyłaj ich dalej. Usuń zgłoszenie, gdy klient o to poprosi
          albo minie okres przechowywania z polityki prywatności.
        </p>

        {leads === null ? (
          <p>Wczytywanie…</p>
        ) : leads.length === 0 ? (
          <p>Nie ma jeszcze żadnych zgłoszeń.</p>
        ) : (
          <ul className="admin-leads__list">
            {leads.map((lead) => (
              <li key={lead.id} className="admin-leads__item">
                <div className="admin-leads__top">
                  <span className="admin-leads__name">{lead.name}</span>
                  <span className="admin-leads__type">{insuranceLabel(lead.insuranceType)}</span>
                  <time className="admin-leads__date" dateTime={lead.createdAt}>
                    {dateTime.format(new Date(lead.createdAt))}
                  </time>
                </div>
                <div className="admin-leads__contact">
                  <a href={`tel:${lead.phone}`}>
                    <Phone aria-hidden="true" />
                    {lead.phone}
                  </a>
                  {lead.email ? (
                    <a href={`mailto:${lead.email}`}>
                      <Mail aria-hidden="true" />
                      {lead.email}
                    </a>
                  ) : null}
                </div>
                {lead.message ? <p className="admin-leads__message">{lead.message}</p> : null}
                {describeSource(lead.source) ? (
                  <p className="admin-leads__source">Skąd: {describeSource(lead.source)}</p>
                ) : null}
                <button
                  type="button"
                  className="admin-leads__delete"
                  onClick={() => onDelete(lead)}
                  aria-label={`Usuń zgłoszenie od ${lead.name}`}
                >
                  <Trash2 aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}
