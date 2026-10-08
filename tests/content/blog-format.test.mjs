// Blog helpers: slugs, heading anchors (table of contents) and the mid-post contact box.
import { test } from "node:test";
import assert from "node:assert/strict";

const { slugify, withHeadingAnchors, withMiddleBlock } = await import("@/lib/blog-format");

test("slugify keeps Polish words readable", () => {
  assert.equal(
    slugify("Ubezpieczenie dla małej firmy – Łódź"),
    "ubezpieczenie-dla-malej-firmy-lodz",
  );
  assert.equal(
    slugify("  Zdrowie psychiczne: co obejmuje polisa?  "),
    "zdrowie-psychiczne-co-obejmuje-polisa",
  );
  assert.equal(slugify("Żółć & gęś"), "zolc-ges");
  assert.equal(slugify("x".repeat(120)).length, 80);
});

test("every h2 gets a unique anchor; h3, empty headings and existing ids are respected", () => {
  const html = [
    "<p>Wstęp</p>",
    "<h2>Na co uważać?</h2>",
    "<h3>Karencja</h3>",
    "<h2><strong>Ile</strong> to kosztuje &amp; od czego zależy?</h2>",
    "<h2>Na co uważać?</h2>",
    '<h2 id="faq">Najczęstsze pytania</h2>',
    "<h2> </h2>",
  ].join("");
  const { html: out, headings } = withHeadingAnchors(html);
  assert.deepEqual(headings, [
    { id: "na-co-uwazac", text: "Na co uważać?" },
    { id: "ile-to-kosztuje-od-czego-zalezy", text: "Ile to kosztuje & od czego zależy?" },
    { id: "na-co-uwazac-2", text: "Na co uważać?" },
    { id: "faq", text: "Najczęstsze pytania" },
  ]);
  assert.match(out, /<h2 id="na-co-uwazac">Na co uważać\?<\/h2>/);
  assert.match(out, /<h2 id="faq">/);
  assert.equal((out.match(/id="faq"/g) ?? []).length, 1, "existing id not duplicated");
  assert.match(out, /<h3>Karencja<\/h3>/, "h3 untouched");
});

test("the contact box goes before the middle section of the post", () => {
  const box = "<aside>KONTAKT</aside>";
  const html = "<p>a</p><h2>1</h2><p>b</p><h2>2</h2><p>c</p><h2>3</h2><p>d</p><h2>4</h2><p>e</p>";
  const out = withMiddleBlock(html, box);
  assert.equal(
    out,
    "<p>a</p><h2>1</h2><p>b</p><h2>2</h2><p>c</p><aside>KONTAKT</aside><h2>3</h2><p>d</p><h2>4</h2><p>e</p>",
  );
  assert.equal((out.match(/KONTAKT/g) ?? []).length, 1);
});

test("posts without sections get the box after the middle paragraph; short ones get none", () => {
  const box = "<aside>KONTAKT</aside>";
  const long = "<p>1</p><p>2</p><p>3</p><p>4</p><p>5</p>";
  assert.equal(
    withMiddleBlock(long, box),
    "<p>1</p><p>2</p><p>3</p><aside>KONTAKT</aside><p>4</p><p>5</p>",
  );
  assert.equal(withMiddleBlock("<p>1</p><p>2</p>", box), "<p>1</p><p>2</p>");
});
