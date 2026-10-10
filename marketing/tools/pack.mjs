// paczka.html — everything for one post on a single page with "Kopiuj" buttons:
// graphics, captions, blog post, reel scripts, tracked links and the schedule.
import { escapeHtml as esc } from "./templates.mjs";

/** Same rules as the blog panel (src/lib/blog-admin.ts), so links match the published post. */
export function slugify(title) {
  return title
    .trim()
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Blog address + one tracked link per channel, shared by paczka.html and the panel upload. */
export function campaignLinks(brand, spec) {
  const slug = spec.blog.slug ?? slugify(spec.blog.title);
  const campaign = spec.campaign ?? slug;
  const base = `${brand.site.replace(/\/$/, "")}/blog/${slug}`;
  const utm = (source, medium, content) =>
    `${base}?utm_source=${source}&utm_medium=${medium}&utm_campaign=${encodeURIComponent(campaign)}&utm_content=${content}`;
  return {
    slug,
    campaign,
    base,
    utm,
    link: {
      bio: utm("instagram", "social", "bio"),
      story: utm("instagram", "social", "story"),
      dm: utm("instagram", "social", "dm"),
      facebook: utm("facebook", "social", "post"),
      google: utm("google_business", "profile", "post"),
      linkedin: utm("linkedin", "social", "post"),
    },
  };
}

export const fillLink = (text, href) => (text ?? "").replaceAll("{link}", href).trim();

/** Ready-to-publish captions with {link} filled in per channel. */
export function captionsFor(brand, spec) {
  const { link } = campaignLinks(brand, spec);
  const c = spec.captions ?? {};
  // Instagram allows 5 hashtags per post; extra ones would be cut at publishing anyway.
  const hashtags = (spec.hashtags ?? []).slice(0, 5).join(" ");
  return {
    instagram: [fillLink(c.instagram, link.bio), hashtags].filter(Boolean).join("\n\n"),
    facebook: fillLink(c.facebook, link.facebook) || `${fillLink(c.instagram, link.facebook)}\n\n👉 ${link.facebook}`,
    google: c.google ? fillLink(c.google, link.google) : "",
    linkedin: c.linkedin ? fillLink(c.linkedin, link.linkedin) : "",
    dm: spec.dm ? fillLink(spec.dm, link.dm) : "",
    alt: c.alt ?? "",
  };
}

/** Article HTML with the legal footnote appended once. */
export function articleHtml(brand, spec) {
  const html = spec.blog.html;
  return html.includes(brand.disclosure) ? html : `${html}\n<p><em>${esc(brand.disclosure)}</em></p>`;
}

const CSS = `
:root{--ink:#2b1a12;--muted:#7a6a5f;--accent:#b4562a;--bg:#f8f5ec;--card:#fff;--border:#e5dccf;--soft:#f3eee4}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif}
.wrap{max-width:60rem;margin:0 auto;padding:24px 16px 80px}
header.top{display:flex;flex-wrap:wrap;gap:8px 20px;align-items:baseline;justify-content:space-between;margin-bottom:16px}
header.top h1{margin:0;font-size:26px;line-height:1.2}
header.top p{margin:0;color:var(--muted);font-size:14px}
nav{position:sticky;top:0;z-index:5;display:flex;flex-wrap:wrap;gap:6px;padding:10px 0;background:var(--bg);margin-bottom:12px}
nav a{font-size:14px;font-weight:600;color:var(--accent);text-decoration:none;padding:6px 12px;border:1px solid var(--border);border-radius:999px;background:var(--card)}
.panel{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:20px;margin-bottom:20px}
.panel>h2{margin:0 0 14px;font-size:15px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
.panel h3{margin:22px 0 10px;font-size:19px}
.field{margin-bottom:14px}
.field>label{display:block;font-size:13px;font-weight:600;color:var(--muted);margin-bottom:4px}
.value{padding:10px 12px;border:1px solid var(--border);border-radius:8px;background:var(--bg);white-space:pre-wrap;word-break:break-word}
.row{display:flex;gap:8px;align-items:flex-start}
.row .value{flex:1;min-width:0}
button{font:inherit;font-size:14px;font-weight:600;padding:10px 14px;border-radius:8px;border:1px solid var(--accent);background:var(--accent);color:#fff;cursor:pointer;white-space:nowrap}
button.secondary{background:#fff;color:var(--accent)}
.big{width:100%;padding:14px;font-size:16px}
.hint{font-size:14px;color:var(--muted);margin:8px 0 0}
.note{background:var(--soft);border-radius:10px;padding:12px 14px;font-size:14px}
.gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
.gallery figure{margin:0}
.gallery img{width:100%;border-radius:8px;border:1px solid var(--border);background:var(--soft)}
.gallery figcaption{font-size:12px;color:var(--muted);margin-top:4px;line-height:1.35}
.gallery a{font-size:13px;font-weight:600;color:var(--accent)}
ol.steps{margin:0;padding-left:20px}
ol.steps li{margin:4px 0}
#article h2{margin-top:30px;font-size:23px;line-height:1.25}
#article h3{font-size:19px}
#article ul,#article ol{padding-left:22px}
#article li{margin:6px 0}
#article blockquote{margin:16px 0;padding:4px 16px;border-left:3px solid var(--accent);color:var(--muted)}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.chip{font-size:13px;padding:3px 10px;border-radius:999px;background:var(--soft);border:1px solid var(--border)}
.reel{border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:16px}
.reel h3{margin:0 0 4px}
.meta{margin:0 0 12px;color:var(--muted);font-size:14px}
.hook{background:var(--soft);border-left:3px solid var(--accent);padding:10px 12px;border-radius:6px;margin-bottom:12px}
table{width:100%;border-collapse:collapse;font-size:14px;margin:8px 0 12px}
th,td{text-align:left;vertical-align:top;padding:8px;border-bottom:1px solid var(--border)}
th{font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted)}
td:first-child{white-space:nowrap;font-weight:600;color:var(--accent)}
@media (max-width:640px){
  table,thead,tbody,tr,th,td{display:block}
  thead{display:none}
  tr{border:1px solid var(--border);border-radius:8px;padding:6px;margin-bottom:8px}
  td{border:0;padding:3px 6px}
  td::before{content:attr(data-h);display:block;font-size:11px;text-transform:uppercase;color:var(--muted)}
  .row{flex-direction:column}
  .row button{align-self:flex-end}
}
.links td:first-child{white-space:normal;color:var(--ink);font-weight:500}
.links code{font-size:12px;word-break:break-all;color:var(--muted)}
.plan label{display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-bottom:1px solid var(--border)}
.plan input{margin-top:5px;accent-color:var(--accent)}
.plan b{display:inline-block;min-width:118px}
.toast{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);background:var(--ink);color:#fff;padding:10px 16px;border-radius:8px;opacity:0;transition:opacity .2s;pointer-events:none}
.toast.show{opacity:1}
.hidden{display:none}
`;

const SCRIPT = `
const toast = (msg) => { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 1600); };
function selectCopy(node) {
  node.classList.remove('hidden');
  const range = document.createRange(); range.selectNodeContents(node);
  const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
  try { document.execCommand('copy'); } finally { sel.removeAllRanges(); if (node.dataset.hidden) node.classList.add('hidden'); }
}
function copyNode(node, rich) {
  const text = node.innerText.trim() || node.textContent.trim();
  if (navigator.clipboard && window.ClipboardItem && rich) {
    return navigator.clipboard.write([new ClipboardItem({
      'text/html': new Blob([node.innerHTML.trim()], { type: 'text/html' }),
      'text/plain': new Blob([text], { type: 'text/plain' }),
    })]).catch(() => selectCopy(node));
  }
  if (navigator.clipboard) return navigator.clipboard.writeText(text).catch(() => selectCopy(node));
  return selectCopy(node);
}
document.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
  const node = document.getElementById(b.dataset.copy);
  await copyNode(node, b.hasAttribute('data-rich'));
  toast(b.hasAttribute('data-rich') ? 'Skopiowano treść — wklej w panelu (Cmd + V)' : 'Skopiowano');
}));
// Schedule ticks survive a reload (this browser only).
document.querySelectorAll('.plan input').forEach((box) => {
  const key = 'oscare-plan:' + box.id;
  try { box.checked = localStorage.getItem(key) === '1'; } catch {}
  box.addEventListener('change', () => { try { localStorage.setItem(key, box.checked ? '1' : '0'); } catch {} });
});
`;

let uid = 0;
const copyField = (label, text, { hint = "" } = {}) => {
  const id = `f${++uid}`;
  return `<div class="field"><label>${esc(label)}</label><div class="row"><div class="value" id="${id}">${esc(text)}</div><button class="secondary" data-copy="${id}">Kopiuj</button></div>${hint ? `<p class="hint">${hint}</p>` : ""}</div>`;
};
const hiddenCopy = (text, button) => {
  const id = `f${++uid}`;
  return `<div class="value hidden" data-hidden="1" id="${id}">${esc(text)}</div><button class="secondary" data-copy="${id}">${esc(button)}</button>`;
};

export function buildPack({ brand, spec, files, dir }) {
  const blog = spec.blog;
  const { slug, campaign, base, link } = campaignLinks(brand, spec);
  const fill = fillLink;
  const c = spec.captions ?? {};
  const { instagram, facebook } = captionsFor(brand, spec);

  const gallery = files
    .map(
      (f) =>
        `<figure><a href="${esc(f.file)}" target="_blank"><img src="${f.thumb ?? esc(f.file)}" alt=""></a><figcaption>${esc(f.label)}<br><a href="${esc(f.file)}" download>Pobierz ${esc(f.file)}</a></figcaption></figure>`,
    )
    .join("");

  const reels = (spec.reels ?? [])
    .map((r, i) => {
      const rows = (r.scenes ?? [])
        .map(
          (s) =>
            `<tr><td data-h="Czas">${esc(s.time)}</td><td data-h="Co widać">${esc(s.shot)}</td><td data-h="Co mówisz">${esc(s.say ?? "—")}</td><td data-h="Napis na ekranie">${esc(s.text ?? "—")}</td></tr>`,
        )
        .join("");
      const prompter = (r.scenes ?? []).map((s) => s.say).filter(Boolean).join("\n\n");
      return `<div class="reel">
  <h3>Rolka ${i + 1}: ${esc(r.title)}</h3>
  <p class="meta">${esc(r.format)} · ${esc(r.length)}${r.audio ? ` · Dźwięk: ${esc(r.audio)}` : ""}</p>
  <div class="hook"><b>Hak (pierwsze 2 sekundy):</b> ${esc(r.hook)}</div>
  ${r.cover ? `<p><b>Napis na okładce rolki:</b> ${esc(r.cover)}</p>` : ""}
  <table><thead><tr><th>Czas</th><th>Co widać</th><th>Co mówisz</th><th>Napis na ekranie</th></tr></thead><tbody>${rows}</tbody></table>
  ${r.tips ? `<p class="hint"><b>Jak nagrać:</b> ${esc(r.tips)}</p>` : ""}
  ${copyField("Opis pod rolką", fill(r.caption, link.bio))}
  ${prompter ? hiddenCopy(prompter, "Kopiuj tekst do telepromptera") : ""}
</div>`;
    })
    .join("");

  const linkRows = [
    ["Instagram — link w bio (na czas kampanii)", link.bio],
    ["Instagram — naklejka „Link” w story", link.story],
    ["Instagram — link w odpowiedzi na DM", link.dm],
    ["Facebook — post", link.facebook],
    ["Wizytówka Google — przycisk „Więcej informacji”", link.google],
    ...(c.linkedin ? [["LinkedIn — post", link.linkedin]] : []),
  ]
    .map(([label, href]) => {
      const id = `f${++uid}`;
      return `<tr><td>${esc(label)}<br><code id="${id}">${esc(href)}</code></td><td><button class="secondary" data-copy="${id}">Kopiuj</button></td></tr>`;
    })
    .join("");

  const plan = (spec.plan ?? [])
    .map(
      (p, i) =>
        `<label><input type="checkbox" id="${esc(campaign)}-${i}"><span><b>${esc(p.date)}</b> ${esc(p.what)}</span></label>`,
    )
    .join("");

  const article = articleHtml(brand, spec);

  return `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Paczka: ${esc(spec.topic)}</title>
<style>${CSS}</style>
</head>
<body>
<div class="wrap">
<header class="top">
  <h1>${esc(spec.topic)}</h1>
  <p>Słowo do komentarzy: <b>${esc(spec.keyword)}</b> · Kampania: ${esc(campaign)}</p>
</header>
<nav><a href="#plan">Plan</a><a href="#grafiki">Grafiki</a><a href="#opisy">Opisy</a><a href="#blog">Blog</a><a href="#rolki">Rolki</a><a href="#linki">Linki</a></nav>

${spec.notes?.length ? `<div class="panel"><h2>Zanim opublikujesz</h2><ul>${spec.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul></div>` : ""}

<section class="panel plan" id="plan">
  <h2>Plan publikacji</h2>
  ${plan}
  <p class="hint">Najpierw blog (rolki i posty będą do niego linkować). Odhaczenia zapamiętuje ta przeglądarka.</p>
</section>

<section class="panel" id="grafiki">
  <h2>Grafiki</h2>
  <div class="gallery">${gallery}</div>
  <p class="hint">Karuzela na Instagramie: wgraj pliki post-1, post-2… w tej kolejności. Pliki leżą w folderze: <code>${esc(dir)}</code></p>
</section>

<section class="panel" id="opisy">
  <h2>Opisy</h2>
  ${copyField("Instagram — opis posta (z hasztagami)", instagram)}
  ${c.alt ? copyField("Instagram — tekst alternatywny", c.alt, { hint: "Przy publikacji: Ustawienia zaawansowane → Ułatwienia dostępu → Napisz tekst alternatywny. Instagram czyta go przy wyszukiwaniu." }) : ""}
  ${copyField("Facebook — post", facebook)}
  ${c.google ? copyField("Wizytówka Google — aktualność", fill(c.google, link.google), { hint: "W wizytówce dodaj przycisk „Więcej informacji” i wklej link z sekcji Linki." }) : ""}
  ${c.linkedin ? copyField("LinkedIn — post", fill(c.linkedin, link.linkedin)) : ""}
  ${spec.dm ? copyField(`Odpowiedź w DM dla osób, które napiszą „${spec.keyword}”`, fill(spec.dm, link.dm), { hint: "Wysyłasz ręcznie albo ustawiasz jako automat w ManyChat (słowo kluczowe: " + esc(spec.keyword) + ")." }) : ""}
</section>

<section class="panel" id="blog">
  <h2>Wpis na blog</h2>
  <ol class="steps">
    <li>Wejdź do panelu → <b>Nowy wpis</b>.</li>
    <li>Skopiuj po kolei <b>Tytuł</b> i <b>Zajawkę</b> i wklej do pól o tych nazwach. Sprawdź, że adres (slug) jest taki jak niżej — na niego prowadzą linki z kampanii.</li>
    <li>Kliknij <b>Kopiuj treść artykułu</b>, kliknij w pole <b>Treść</b> w panelu i wciśnij <b>Cmd + V</b>.</li>
    <li>Okładka: wgraj <b>okladka-bloga.jpg</b> z folderu paczki. Autor: <b>${esc(brand.author)}</b>. Kliknij <b>Opublikuj</b>.</li>
  </ol>
  <h3>Pola wpisu</h3>
  ${copyField("Tytuł", blog.title)}
  ${copyField("Adres (slug)", slug, { hint: `Wpis będzie pod adresem: ${esc(base)}` })}
  ${copyField("Zajawka (pokazuje się też w Google)", blog.excerpt)}
  <div class="note"><b>SEO:</b> fraza główna „${esc(blog.keyword)}”${blog.keywords?.length ? `; frazy dodatkowe: ${blog.keywords.map((k) => `„${esc(k)}”`).join(", ")}` : ""}. Nie wklejasz ich nigdzie — są już w tytule, zajawce i treści.</div>
  <p></p>
  <button class="big" data-copy="article" data-rich>Kopiuj treść artykułu</button>
  <p class="hint">Jeśli przycisk nie zadziała: zaznacz myszką cały tekst artykułu poniżej, wciśnij Cmd + C i wklej w panelu.</p>
  <article id="article" class="panel">${article}</article>
</section>

<section class="panel" id="rolki">
  <h2>Scenariusze rolek</h2>
  ${reels}
  <p class="hint">Każda rolka kończy się tym samym wezwaniem: napisz „${esc(spec.keyword)}” w komentarzu. Odpisujesz tekstem z sekcji Opisy → DM.</p>
</section>

<section class="panel" id="linki">
  <h2>Linki ze śledzeniem (UTM)</h2>
  <table class="links"><tbody>${linkRows}</tbody></table>
  <p class="hint">Każdy kanał ma swój link, więc w Google Analytics zobaczysz, skąd przyszli ludzie, którzy zostawili kontakt.</p>
</section>
</div>
<div class="toast" id="toast"></div>
<script>${SCRIPT}</script>
</body>
</html>`;
}
