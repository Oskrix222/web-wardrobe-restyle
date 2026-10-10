import assert from "node:assert/strict";
import { test } from "node:test";

import { facebookCaption, limitHashtags } from "../../src/lib/caption-rules.ts";

test("only the first 5 hashtags stay", () => {
  assert.equal(limitHashtags("Tekst\n\n#a #b #c #d #e #f #g"), "Tekst\n\n#a #b #c #d #e");
  assert.equal(limitHashtags("Bez tagów."), "Bez tagów.");
});

test("Facebook: the keyword ask becomes an invitation to write, the rest stays", () => {
  const ig = `„Mam NFZ, po co mi polisa?” Leczenie jest bezpłatne.

Plan B? Napisz „RAK”, a podeślę Ci ofertę.

Twoi bliscy też mogą być objęci ochroną.

#RóżowyPaździernik #OSCare`;
  const fb = facebookCaption(ig, "RAK");
  assert.match(fb, /^„Mam NFZ, po co mi polisa\?” Leczenie jest bezpłatne\./);
  assert.match(fb, /Plan B\? Chcesz ofertę\? Napisz do nas wiadomość/);
  assert.doesNotMatch(fb, /„RAK”/);
  assert.match(fb, /#RóżowyPaździernik #OSCare$/);
  // "bliscy" as a normal word is not an ask
  assert.match(facebookCaption("Twoi bliscy są ważni.", "BLISCY"), /^Twoi bliscy są ważni\.$/);
  assert.match(facebookCaption("Napisz BLISCY w komentarzu.", "BLISCY"), /^Chcesz ofertę\?/);
});
