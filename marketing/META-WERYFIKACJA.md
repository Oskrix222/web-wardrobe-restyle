# Weryfikacja aplikacji w Mecie (App Review)

Cel: automat odpowiedzi („Napisz RAK” → prywatna wiadomość) ma działać dla **wszystkich** klientów,
a nie tylko dla osób dodanych do aplikacji. Do tego Meta musi zatwierdzić aplikację (dostęp
„Advanced”). Publikacja postów działa już teraz i nie wymaga weryfikacji.

Rób kroki po kolei. Teksty w ramkach kopiuj w całości, bo recenzenci Mety czytają po angielsku.

Strona przygotowana pod wymagania Mety (już działa):

| Czego wymaga Meta | Adres |
|---|---|
| Polityka prywatności (z punktem o Instagramie i Facebooku) | https://oscare.kubowiczoskar.workers.dev/polityka-prywatnosci |
| Instrukcja usuwania danych (PL + EN) | https://oscare.kubowiczoskar.workers.dev/usuwanie-danych |
| Ikona aplikacji 1024 × 1024 | `marketing/meta/ikona-aplikacji-1024.png` |

Jedna brakująca rzecz na stronie: **NIP Izumi**. Podeślij go, to go dopiszę (bez NIP-u punkt jest
pominięty, a nie pusty).

---

## Krok 1. Instagram: zezwól na dostęp do wiadomości (2 min)

Na telefonie, na koncie firmowym OSCare:
Ustawienia → **Wiadomości i odpowiedzi na relacje** → **Kontrola wiadomości** → sekcja
„Połączone narzędzia” → **Zezwól na dostęp do wiadomości: WŁĄCZ**.

Bez tego żadna aplikacja (także ManyChat) nie wyśle wiadomości z Twojego konta.

## Krok 2. Weryfikacja firmy w Meta Business (15 min + 1–5 dni czekania)

Meta daje dostęp „Advanced” tylko aplikacjom podpiętym pod **zweryfikowaną firmę**.

1. Wejdź na business.facebook.com → **Ustawienia** → **Centrum bezpieczeństwa** (Security Center)
   → **Rozpocznij weryfikację**.
2. Dane wpisz **dokładnie tak jak w CEIDG**: imię i nazwisko / nazwa firmy, adres
   ul. Starowiejska 43, 43-603 Jaworzno, NIP 6322037383, telefon +48 539 075 385,
   strona https://oscare.kubowiczoskar.workers.dev.
3. Dokument: **wydruk z CEIDG** (PDF ze strony biznes.gov.pl). Nazwa i adres na wydruku muszą się
   zgadzać z tym, co wpisałeś.
4. Potwierdzenie kontaktu: wybierz **telefon** (SMS lub połączenie na +48 539 075 385).

Weryfikacja domeny jest opcjonalna. Na adresie `…workers.dev` nie da się jej zrobić, bo to nie
jest Twoja domena. Gdy kupisz własną (np. oscare.pl), wejdź w Bezpieczeństwo marki → Domeny →
„Meta-tag” i podeślij mi kod z `content="…"`. Ten kod jest publiczny, można go wkleić w czacie.

## Krok 3. Ustawienia aplikacji (10 min)

developers.facebook.com → Twoja aplikacja → **App settings → Basic**:

| Pole | Wpisz |
|---|---|
| App icon | plik `marketing/meta/ikona-aplikacji-1024.png` |
| Privacy Policy URL | `https://oscare.kubowiczoskar.workers.dev/polityka-prywatnosci` |
| User data deletion | wybierz „Data deletion instructions URL” → `https://oscare.kubowiczoskar.workers.dev/usuwanie-danych` |
| Category | Business and pages |
| App domains | `oscare.kubowiczoskar.workers.dev` |
| Contact email | kubowiczoskar@gmail.com |
| Add platform → Website | `https://oscare.kubowiczoskar.workers.dev` |

Niżej w tej samej zakładce, w sekcji **Verification / Business portfolio**, podepnij aplikację do
firmy zweryfikowanej w kroku 2. Zapisz.

Potem u góry przełącz **App Mode: Development → Live**.

Jeśli Meta zapyta o **Data handling** (przetwarzanie danych), odpowiedz:
- Data processors: **Supabase** (baza danych, UE), **Cloudflare** (hosting).
- Responsible entity: Ty, kraj **Poland**.
- Wnioski organów państwowych o dane: **No**, nie dostałeś żadnych. Polityka: dane wydajemy
  tylko na podstawie przepisów prawa.

## Krok 4. Dodaj testera (2 min)

Do nagrania potrzebujesz drugiego konta na Instagramie, które napisze komentarz „RAK” (np. konto
Izumi). Dopóki Meta nie zatwierdzi aplikacji, wiadomość dojdzie tylko do kogoś z rolą w aplikacji:

App roles → Roles → **Add People → Instagram Testers** → wpisz nazwę konta Izumi. Izumi akceptuje
zaproszenie na instagram.com → Ustawienia → Aplikacje i witryny → Zaproszenia testerów.

## Krok 5. Nagranie ekranu (20 min)

Meta ocenia głównie nagranie. Odrzucają, gdy nie widać każdego uprawnienia w działaniu. Przed
nagraniem przełącz język Facebooka na **English (US)**, bo recenzenci wolą angielski interfejs.

Nagraj jeden film, 3–5 minut (QuickTime → Nowe nagranie ekranu, telefon może być w lustrze ekranu
albo nagrany osobno i doklejony):

1. **Logowanie i zgody.** Panel → Ustawienia → Połączenia → „Połącz z Facebookiem i Instagramem”.
   Pokaż okno Facebooka: wybór strony OSCare i konta Instagram, lista uprawnień, „Continue”.
   Potem Ustawienia → Automat odpowiedzi → „Pozwól automatowi wysyłać wiadomości” i drugie okno
   zgód.
2. **Ustawienia automatu.** Pokaż treść wiadomości i włączone przełączniki.
3. **Komentarz.** Na koncie testera skomentuj najnowszy post: `RAK`.
4. **Odpowiedź.** Automat odpisuje w ciągu 10 min. Wytnij czekanie. Pokaż na koncie testera
   wiadomość prywatną od OSCare i odpowiedź pod komentarzem, a w panelu wpis w „Ostatnich
   odpowiedziach” ze statusem „wysłano”.
5. **Publikacja.** Panel → Treści → Kalendarz → przy zatwierdzonym poście „Opublikuj teraz”, a potem
   ten post na Instagramie i na stronie na Facebooku.
6. **Komentarz z linkiem.** Pokaż pierwszy komentarz z linkiem do wpisu pod opublikowanym postem.

## Krok 6. Zgłoszenie (15 min)

App Review → **Permissions and features** → przy każdym uprawnieniu z listy niżej kliknij
**Request advanced access**. Potem **App Review → Requests → Edit** i przy każdym wklej opis.
Nagranie z kroku 5 wgraj przy każdym uprawnieniu (ten sam plik).

Nie proś o nic spoza tej listy. Każde zbędne uprawnienie to dodatkowy powód do odrzucenia.

### Notatka dla recenzenta (pole „Notes for reviewer” / opis aplikacji)

```
OSCare is a small insurance agency in Poland. This app is used ONLY by our own business to manage
our own Facebook Page and Instagram professional account. No other businesses or users log in.

What the app does:
1. Publishes our own scheduled posts, carousels, stories and reels to our Page and Instagram account.
2. Adds the first comment with a link to the related article on our website.
3. When someone comments a campaign keyword (e.g. "RAK") under our own post, the app sends that
   person ONE private reply (Instagram/Messenger private replies API) with the link they asked for,
   and optionally a short public reply under the comment. It never messages anyone who did not
   comment, never sends a second message, and replies only within 7 days of the comment.
   Any further conversation is handled manually by our staff.

Comments are read every 10 minutes, so a reply arrives within about 10 minutes.
Privacy policy: https://oscare.kubowiczoskar.workers.dev/polityka-prywatnosci
Data deletion: https://oscare.kubowiczoskar.workers.dev/usuwanie-danych
```

### Opisy uprawnień (wklej przy każdym)

**instagram_basic**
```
Used to read our own Instagram professional account ID and username after Facebook Login, so the
app knows which account to publish to and which comments are our own (we never reply to ourselves).
```

**instagram_content_publish**
```
Used to publish our own scheduled content (single images, carousels, stories and reels) to our own
Instagram professional account at the time set in our content calendar.
```

**instagram_manage_comments**
```
Used to read comments under our own Instagram posts and reels from the last 7 days, to find
comments containing the campaign keyword and answer them, and to post the first comment with a
link to the related article on our website.
```

**instagram_manage_messages**
```
Used only for private replies: when a user comments the campaign keyword under our own post, the
app sends that user one private message with the article link they requested. One message per
comment, within 7 days. Further conversation is handled manually by our staff in the Instagram inbox.
```

**pages_show_list**
```
Used after Facebook Login to list the Pages the admin manages, so they can pick the OSCare Page and
the Instagram account connected to it.
```

**pages_read_engagement**
```
Used to read our own Page's posts and their comments, so the app can find comments with the
campaign keyword and confirm that scheduled posts were published.
```

**pages_read_user_content**
```
Used to read comments written by users under our own Page posts, to find comments containing the
campaign keyword and send the private reply those users asked for.
```

**pages_manage_posts**
```
Used to publish our own scheduled photo posts, stories and reels to our Facebook Page.
```

**pages_manage_engagement**
```
Used to add the first comment with a link to our article under our own Page posts, and a short
public reply under comments that asked for information ("Sent you a message").
```

**pages_messaging**
```
Used for Messenger private replies: when a user comments the campaign keyword under our Page post,
the app sends that user one private message with the requested article link. One message per
comment, within 7 days. Further conversation is handled manually by our staff.
```

**business_management**
```
Dependency for pages_show_list, pages_messaging and instagram_manage_messages: the admin selects
our Page and Instagram account in the Facebook Login for Business flow (shown in the screencast).
```

## Krok 7. Po wysłaniu

- Odpowiedź przychodzi zwykle w ciągu kilku dni na maila i w zakładce App Review.
- Jeśli odrzucą: skopiuj mi treść uzasadnienia, poprawię aplikację albo opis i wyślesz jeszcze raz.
  Najczęstsze powody to brak któregoś uprawnienia na nagraniu, niepasujące dane firmy albo
  nieczytelny opis.
- Po akceptacji: Panel → Ustawienia → Automat odpowiedzi → „Pozwól automatowi wysyłać wiadomości”
  (jeszcze raz) i włącz przełączniki.
- Raz w roku Meta prosi o **Data Use Checkup** (mail). Kliknij i potwierdź, że uprawnienia są
  nadal używane, bo inaczej je odbierze.
