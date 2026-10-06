# Uruchomienie strony OSCare — krok po kroku

Cel: strona na własnej domenie, **za darmo** (płacisz tylko za domenę), bez Lovable.

- **Supabase** — baza danych (formularz kontaktowy, blog, zdjęcia, statystyki). Darmowe.
- **Cloudflare** — hosting, czyli to, co wyświetla stronę ludziom. Darmowe.
- **GitHub** — tam leży kod. Cloudflare sam z niego bierze każdą nową wersję.

> Nazwy przycisków w Supabase/Cloudflare czasem się zmieniają. Jeśli czegoś nie
> widzisz — zrób zrzut ekranu i wyślij Claude'owi.

---

## CZĘŚĆ 1 — Baza danych (Supabase), ok. 10 minut

### 1.1 Załóż konto i projekt
1. Wejdź na **supabase.com** → **Start your project** → zaloguj się przez GitHuba
   (to samo konto, na którym jest kod strony).
2. Kliknij **New project**:
   - **Name:** `oscare`
   - **Database Password:** kliknij **Generate a password** (nie będzie Ci potrzebne,
     ale zapisz je w menedżerze haseł)
   - **Region:** **Central EU (Frankfurt)** ← ważne dla RODO
   - plan **Free**
3. Kliknij **Create new project** i poczekaj ~2 minuty.

### 1.2 Utwórz tabele (jedno wklejenie)
1. W menu po lewej kliknij **SQL Editor** → **New query**.
2. Otwórz plik [`supabase/setup.sql`](supabase/setup.sql), zaznacz **całość**
   (Cmd+A), skopiuj (Cmd+C) i wklej do okna w Supabase (Cmd+V).
3. Kliknij **Run** (prawy dół). Ma się pojawić **Success. No rows returned**.
   - Jeśli Supabase zapyta o „destructive operation” — kliknij **Run this query**.
     Plik niczego nie kasuje, tylko podmienia zasady dostępu.

### 1.3 Załóż konto do logowania w panelu bloga
1. Menu po lewej → **Authentication** → **Users** → **Add user** → **Create new user**.
2. Email: `kubowiczoskar@gmail.com`, hasło: wymyśl mocne (min. 12 znaków).
3. Zaznacz **Auto Confirm User** → **Create user**.

### 1.4 Zablokuj zakładanie kont przez obcych
**Authentication** → **Sign In / Providers** (albo **Providers** → **Email**) →
wyłącz **Allow new users to sign up** → **Save**.
(Nawet bez tego obcy nie mieliby dostępu do panelu, ale lepiej zamknąć drzwi.)

### 1.5 Skopiuj dwa adresy i wyślij je Claude'owi
**Project Settings** (zębatka na dole menu) →
- **Data API** → skopiuj **Project URL** (wygląda jak `https://abcd1234.supabase.co`)
- **API Keys** → skopiuj **Publishable key** (zaczyna się od `sb_publishable_`)

Oba są publiczne (i tak trafiają do przeglądarki), więc możesz je spokojnie wkleić
na czacie. **Nie kopiuj** niczego, co nazywa się *secret* ani *service_role*.

➡️ **Napisz Claude'owi:** „URL: … klucz: … — wyślij”. Claude wpisze je w
konfigurację i wyśle kod na GitHuba.

---

## CZĘŚĆ 2 — Hosting (Cloudflare), ok. 10 minut

### 2.1 Załóż konto
**dash.cloudflare.com/sign-up** → załóż konto (plan **Free**).

### 2.2 Podłącz kod z GitHuba
1. Menu po lewej → **Compute (Workers)** → **Workers & Pages** → **Create**.
2. Wybierz **Import a repository** → **Connect GitHub** → zezwól Cloudflare na
   dostęp do repozytorium **web-wardrobe-restyle**.
3. Ustawienia (wpisz dokładnie):
   - **Project name:** `oscare` ← musi być dokładnie tak
   - **Build command:** `npm run build`
   - **Deploy command:** `npx wrangler deploy`
   - **Root directory:** zostaw puste / `/`
4. **Create and deploy**. Pierwsze budowanie trwa 2–4 minuty.
5. Na końcu dostaniesz adres typu **oscare.twoja-nazwa.workers.dev** — otwórz go.
   Strona powinna działać.

### 2.3 Opinie Google
Nie wymagają żadnego klucza: mapa Google ładuje się bez klucza, a karty opinii
dostarcza darmowy widżet Trustindex (ustawiony w `.env` jako `VITE_TRUSTINDEX_WIDGET_ID`).
Wizytówkę zmienia się w jednym pliku: `src/config/business.ts`.

---

## CZĘŚĆ 3 — Własna domena

### 3.1 Kup domenę
Jeśli jeszcze jej nie masz: kup np. `oscare.pl` w dowolnym polskim rejestratorze
(OVH, nazwa.pl, home.pl, cyber_Folks…). Kosztuje zwykle kilkadziesiąt zł rocznie.
**Nie dokupuj** hostingu, poczty-pakietów itp. — wystarczy sama domena.

### 3.2 Przenieś domenę „pod” Cloudflare (DNS — za darmo)
1. W Cloudflare: **Websites / Domains** → **Add a domain** → wpisz `oscare.pl` →
   plan **Free** → **Continue**.
2. Cloudflare pokaże **dwa adresy serwerów nazw** (np. `anna.ns.cloudflare.com`,
   `bob.ns.cloudflare.com`). Skopiuj je.
3. Zaloguj się u rejestratora domeny → ustawienia domeny → **Serwery DNS / Nameservery**
   → wybierz „własne” → wklej oba adresy z Cloudflare → zapisz.
4. Poczekaj — zwykle 1–2 godziny, maksymalnie do 24 h. Cloudflare wyśle maila, gdy domena będzie aktywna.

### 3.3 Podepnij domenę do strony
Workers & Pages → **oscare** → **Settings** → **Domains & Routes** → **Add** →
**Custom domain** → `oscare.pl` → **Add**. Powtórz dla `www.oscare.pl`.
Certyfikat (kłódka https) Cloudflare robi sam i za darmo.

---

## CZĘŚĆ 4 — Google Analytics, ok. 5 minut

1. Wejdź na **analytics.google.com** → **Zacznij pomiar**.
2. Konto: `OSCare` → Usługa: `OSCare strona`, **strefa czasowa Polska**, **waluta PLN**.
3. Platforma: **Internet** → adres: `https://oscare.pl` → nazwa strumienia `Strona`
   → **Utwórz strumień**.
4. Skopiuj **Identyfikator pomiaru** (zaczyna się od `G-`).
5. ➡️ **Wyślij go Claude'owi** — doda go do strony.

Analytics zacznie zbierać dane dopiero od osób, które klikną „Akceptuję” w okienku
cookies (tak wymaga prawo). Raport zobaczysz w Analytics i skrótowo w panelu
strony → **Statystyki**.

**Google Ads (opcjonalnie, gdy zaczniesz reklamy):** w Google Ads → Cele →
Konwersje → **Nowa konwersja** → Witryna → kategoria **Potencjalny klient**.
Wyślij Claude'owi identyfikator `AW-…` i **etykietę konwersji** — każde wysłanie
formularza będzie liczone jako konwersja z reklamy.

---

## CZĘŚĆ 5 — Sprzątanie po Lovable

1. **Stare zgłoszenia z formularza** (tylko jeśli przyszły prawdziwe):
   w Lovable → **Cloud** → **Database** → tabela `leads` → eksport do CSV.
   Potem w Supabase → **Table Editor** → `leads` → **Insert** → **Import data from CSV**.
2. W Lovable → ustawienia projektu → **GitHub** → **Disconnect**, żeby Lovable już
   niczego nie nadpisywał w kodzie. Nie musisz wykupywać planu Lovable.

---

## Na co dzień

| Co chcesz zrobić | Gdzie |
|---|---|
| Napisać / edytować wpis na blogu | `oscare.pl/admin` → **Nowy wpis** / **Wpisy** |
| Zobaczyć, ile osób czyta bloga | `oscare.pl/admin` → **Statystyki** |
| Zobaczyć zgłoszenia z formularza | `oscare.pl/admin` → **Zgłoszenia** |
| Pełne statystyki ruchu | analytics.google.com |
| Dodać Izumi do panelu | Supabase → **SQL Editor** → wpisz `insert into blog_admins (email) values ('adres@izumi.pl');` → **Run**, potem załóż konto jak w kroku 1.3 |

Raz dziennie GitHub automatycznie „szturcha” bazę, żeby darmowy Supabase nie
zasypiał (plik `.github/workflows/supabase-keepalive.yml`). Gdyby GitHub kiedyś
przysłał maila, że wyłączył to zadanie z braku aktywności — kliknij w mailu „Enable”.

---

## Znane sprawy do załatwienia

- **E-mail kontaktowy:** na stronie i w polityce prywatności nadal jest stary adres
  `kontakt@kamien.pl`. Podaj Claude'owi prawdziwy adres — podmieni go wszędzie.
