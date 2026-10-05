// Server-only: e-mails the team the moment a lead comes in, via Resend
// (resend.com, free tier). Needs RESEND_API_KEY (Cloudflare secret) and
// LEAD_NOTIFY_EMAIL (wrangler.jsonc vars). Never throws — a failed e-mail must
// not lose the lead, which is already saved in the database by then.

const INSURANCE_LABELS: Record<string, string> = {
  life: "Życie i zdrowie",
  home: "Majątek — dom / mieszkanie",
  travel: "Wakacje / turystyczne",
  business: "Grupowe dla firm",
};

type Lead = {
  name: string;
  phone: string;
  email?: string | undefined;
  insuranceType: string;
  message?: string | undefined;
};

/** Form input goes into an HTML e-mail — escape it so it can't inject markup. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function row(label: string, valueHtml: string): string {
  return `<tr><td style="padding:6px 12px 6px 0;color:#7a6a5f;vertical-align:top">${label}</td><td style="padding:6px 0;font-weight:600">${valueHtml}</td></tr>`;
}

export async function notifyNewLead(lead: Lead, siteOrigin: string | null): Promise<void> {
  const apiKey = process.env["RESEND_API_KEY"];
  const to = process.env["LEAD_NOTIFY_EMAIL"];
  if (!apiKey || !to) {
    console.warn("Powiadomienie o leadzie pominięte — brak RESEND_API_KEY lub LEAD_NOTIFY_EMAIL.");
    return;
  }

  const type = INSURANCE_LABELS[lead.insuranceType] ?? lead.insuranceType;
  const phone = escapeHtml(lead.phone);
  const telHref = lead.phone.replace(/[^\d+]/g, "");
  const panelLink = siteOrigin ? `${siteOrigin}/admin/zgloszenia` : null;

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;color:#2b1a12;max-width:520px">
      <h2 style="margin:0 0 12px">Nowe zgłoszenie z formularza</h2>
      <table style="border-collapse:collapse">
        ${row("Imię", escapeHtml(lead.name))}
        ${row("Telefon", `<a href="tel:${telHref}" style="color:#b4562a">${phone}</a>`)}
        ${lead.email ? row("E-mail", `<a href="mailto:${escapeHtml(lead.email)}" style="color:#b4562a">${escapeHtml(lead.email)}</a>`) : ""}
        ${row("Ubezpieczenie", escapeHtml(type))}
      </table>
      ${
        lead.message
          ? `<p style="margin:16px 0 0;padding:10px 14px;border-left:3px solid #b4562a;background:#f8f5ec;white-space:pre-wrap">${escapeHtml(lead.message)}</p>`
          : ""
      }
      ${
        panelLink
          ? `<p style="margin:20px 0 0"><a href="${panelLink}" style="color:#b4562a">Wszystkie zgłoszenia w panelu →</a></p>`
          : ""
      }
    </div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env["LEAD_NOTIFY_FROM"] || "OSCare <onboarding@resend.dev>",
        to: to.split(",").map((s) => s.trim()),
        subject: `Nowy lead: ${lead.name} — ${type}`,
        html,
        ...(lead.email ? { reply_to: lead.email } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error(`Resend odrzucił powiadomienie (${res.status}): ${await res.text()}`);
    }
  } catch (error) {
    console.error("Nie udało się wysłać powiadomienia o leadzie:", error);
  }
}
