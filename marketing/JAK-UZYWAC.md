# Treści: od grafiki do publikacji

Dajesz Claude'owi grafikę (np. od Nationale-Nederlanden), a on robi z niej komplet na jeden
tydzień i wstawia go do **Panelu → Kalendarz** na najbliższy wolny tydzień:

- **wpis na blogu** (pon 7:00), gotowy pod Google,
- **post-karuzela** na Instagram i Facebook (śr 18:00) z opisami i hasztagami,
- **story** z linkiem do wpisu (śr 20:00),
- **3 rolki** (wt i czw 19:00, sob 10:00): scenariusz, napisy, opis. Nagrywasz je Ty.

Ty tylko zatwierdzasz i wgrywasz rolki. Resztę robi automat.

## Na co dzień

1. Wrzuć grafiki do folderu **`marketing/wrzuc-tutaj`** albo wklej je do czatu i napisz
   **`/nowy-post`**.
2. Claude sprawdza Twoje **Prawdy**, robi paczkę i wysyła ją do panelu.
3. Wejdź w **Panel → Kalendarz**. Przy każdej pozycji masz przyciski:
   - **Zatwierdź grafikę / Zatwierdź opis** (post), **Zatwierdź wpis** (blog), **Zatwierdź story**,
   - przy rolkach: **Wgraj rolkę** (MP4/MOV, pionowo, do 50 MB), potem **Zatwierdź wideo**
     i **Zatwierdź opis**.
   Opis i termin możesz zmienić w każdej chwili. Zmiana opisu cofa jego zatwierdzenie.
4. Gdy wszystko przy pozycji jest zatwierdzone, publikuje się **samo o wyznaczonej godzinie**
   (automat sprawdza kalendarz co 10 minut). „Opublikuj teraz” publikuje od razu.

Story z naklejką „Link” wrzucasz ręcznie (Instagram nie pozwala dodać linku automatem). W karcie
story jest grafika do pobrania i gotowy link.

## Prawdy

**Panel → Prawdy** to lista faktów o Twojej ofercie: czego nie sprzedajesz, kto nie dostanie
danej polisy, czego nie piszemy. Claude czyta ją przed każdą paczką. Nigdy jej nie zaprzeczy
i nie porusza tych tematów w treściach, tylko je omija.

## Jednorazowa konfiguracja

Raz, na start (Claude przeprowadzi Cię krok po kroku):

1. **Baza:** wklej plik `supabase/migrations/20261008090000_content_calendar.sql`
   w Supabase → SQL Editor → Run.
2. **Klucz bazy** (Supabase → Project Settings → API Keys → Secret keys):
   - w Cloudflare (Worker `oscare` → Settings → Variables and Secrets) jako Secret
     `SUPABASE_SERVICE_ROLE_KEY`,
   - w pliku `.env.local` w projekcie, linia `SUPABASE_SERVICE_ROLE_KEY=…`
     (z niego Claude wysyła paczki do panelu).
3. **Instagram i Facebook:** konto Instagram przełączone na firmowe i podpięte do strony na
   Facebooku. Potem aplikacja w Meta for Developers: jej App ID i App Secret wpisz w Cloudflare
   jako `META_APP_ID` i `META_APP_SECRET` (Secret). Na koniec w **Panel → Połączenia** kliknij
   „Połącz z Facebookiem i Instagramem”.

## Ustawienia

Plik **`marketing/brand.mjs`**: adres strony (zmień po podpięciu domeny), telefon, miasto,
Instagram, autor wpisów i **rytm tygodnia** (dni i godziny publikacji).

## Co narzędzie robi z grafikami NN

- Usuwa logo NN, ich pomarańczową ramkę i hasztag kampanii. Zostawia samo zdjęcie i składa nową
  grafikę w kolorach i fontach OSCare, z napisem „Materiał marketingowy”.
- Teksty pisze od nowa: bez nazw produktów NN i bez ich nagród (Superbrands to nagroda NN).
- Animacji NN nie przerabia klatka po klatce. Bierze z nich pomysł i robi post oraz rolkę.

> Upewnij się, że umowa z ubezpieczycielem pozwala używać jego zdjęć w Twojej oprawie,
> i czytaj notatki „Zanim opublikujesz” przy każdej kampanii w kalendarzu.
