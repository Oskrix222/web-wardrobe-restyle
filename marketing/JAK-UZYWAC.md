# Treści: od ZIP-a do publikacji

Każda grafika z ZIP-a staje się osobnym tematem na osobny tydzień:

- **wpis na blogu** (pisze go Claude, pod Google, z przyciskiem kontaktu i numerami w środku),
- **post** na Instagram i Facebook (ta sama treść, format 4:5), link do wpisu w pierwszym
  komentarzu, słowo klucz w opisie („Napisz „RAK” w komentarzu, a podeślemy Ci ofertę”),
- **story** na Instagram i Facebook („link w bio”),
- **3 rolki**: scenariusz od Claude'a, nagrywasz Ty, wgrywasz w panelu; idą na Instagram
  i Facebook w różne dni tego samego tygodnia.

Dni i godziny ustawiasz raz w **Panel → Kalendarz → Plan tygodnia**. Każda pozycja ma też
własny termin do zmiany. Nic nie wychodzi bez Twojego „Zatwierdź”, a zatwierdzać możesz na
miesiąc do przodu.

## Na co dzień

1. **Panel → Kalendarz → Nowa paczka:** przeciągnij ZIP z grafikami.
2. Na Macu otwórz Claude Code i napisz **`/nowy-post`**. Claude pobierze ZIP-y z panelu,
   przeczyta Prawdy, przerobi grafiki na OSCare, napisze teksty i wstawi każdy temat na kolejny
   wolny tydzień. Przy ZIP-ie w panelu pojawi się „Gotowe” i podsumowanie.
3. W kalendarzu zatwierdzasz grafiki, opisy i wpisy; poprawiasz, co chcesz.
4. Nagrywasz rolki według scenariuszy i wgrywasz je w ich kartach („Wgraj rolkę”), potem
   „Zatwierdź wideo”.
5. Resztę robi automat (co 10 minut): publikuje, dodaje komentarz z linkiem, a w
   **Panel → Odpowiedzi** odpisuje osobom, które skomentowały słowo klucz.

W bio na Instagramie ustaw raz link **`https://<twoja-strona>/najnowszy`** — zawsze prowadzi
do najnowszego wpisu.

## Jednorazowa konfiguracja

1. **Baza:** Panel → Kalendarz → „Kopiuj SQL” → Supabase → SQL Editor → wklej → Run.
2. **Klucz bazy** (Supabase → Project Settings → API Keys → Secret keys): w Cloudflare
   (Worker `oscare` → Settings → Variables and Secrets) jako Secret `SUPABASE_SERVICE_ROLE_KEY`
   oraz w pliku `.env.local` w projekcie: `SUPABASE_SERVICE_ROLE_KEY=…`.
3. **Instagram i Facebook:** konto Instagram firmowe, podpięte do strony na Facebooku.
   Aplikacja w Meta for Developers → jej App ID i App Secret w Cloudflare jako `META_APP_ID`
   i `META_APP_SECRET` → adres przekierowania `https://<twoja-strona>/api/meta/callback` →
   Panel → Połączenia → „Połącz”.
4. **Rolki (Cloudflare R2, 10 GB za darmo):** Cloudflare → R2 → utwórz bucket `oscare-rolki`
   → Settings → Public Development URL: włącz → CORS policy:

   ```json
   [{ "AllowedOrigins": ["https://<twoja-strona>"], "AllowedMethods": ["PUT"], "AllowedHeaders": ["Content-Type"], "MaxAgeSeconds": 3600 }]
   ```

   R2 → Manage API tokens → Create token (Object Read & Write, tylko ten bucket). W Workerze:
   zmienne `R2_ACCOUNT_ID` (ID konta), `R2_BUCKET` (`oscare-rolki`), `R2_PUBLIC_URL` (adres
   `https://pub-….r2.dev`) i sekrety `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`.

## Ważne

- Prawdy (Panel → Prawdy) są nadrzędne: Claude nigdy im nie zaprzecza i omija zakazane tematy.
  Fakty z „O nas” (od kiedy w branży itd.) wykorzystuje w treściach.
- Grafiki NN: logo, ramka i hasztag NN znikają; nagrody NN (Superbrands) są pomijane.
- Rolki na Facebooku mogą mieć max 90 s; dłuższe idą tam jako zwykły film.
- Automatyczne wiadomości do obcych osób mogą wymagać jednorazowej akceptacji aplikacji przez
  Meta (App Review).
