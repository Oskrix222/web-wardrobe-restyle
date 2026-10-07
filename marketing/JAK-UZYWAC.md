# Paczka posta z grafiki — jak używać

Dajesz Claude'owi grafikę (np. od Nationale-Nederlanden), a dostajesz komplet do publikacji:

- **post w brandingu OSCare** + karuzela (5 slajdów) + story + okładka wpisu na blog,
- **opisy**: Instagram (z hasztagami i tekstem alternatywnym), Facebook, wizytówka Google,
  gotowa odpowiedź w DM,
- **wpis na blog** pod Google, do wklejenia jednym przyciskiem,
- **3 scenariusze rolek**: co mówisz, co widać, napisy na ekranie, opis pod rolką,
- **linki ze śledzeniem** (UTM), żeby było widać, skąd przychodzą klienci,
- **plan publikacji** z datami.

## Krok po kroku

1. Wrzuć grafiki (albo animacje .mp4) do folderu **`marketing/wrzuc-tutaj`**.
   Możesz też po prostu wkleić je do czatu.
2. Napisz do Claude'a: **`/nowy-post`** (albo zwyczajnie: „zrób paczkę z tych grafik”).
3. Po kilku minutach dostaniesz folder `marketing/posty/<data>-<temat>/`.
   Otwórz w nim **`paczka.html`** (dwuklik — otworzy się w przeglądarce).
4. W paczce wszystko ma przycisk **Kopiuj**. Grafiki pobierzesz z sekcji „Grafiki”
   albo weźmiesz prosto z folderu.

## Jak to publikować, żeby sprzedawało

1. **Najpierw wpis na blogu.** Wszystkie linki z kampanii prowadzą do niego.
2. Ustaw **link w bio** na link z sekcji „Linki” (na czas kampanii).
3. Rolki i karuzela kończą się prośbą: *napisz SŁOWO w komentarzu*. Każdemu, kto napisze,
   wyślij w DM gotową odpowiedź z paczki. Można to zautomatyzować w ManyChat.
4. W dniu posta wrzuć story z naklejką „Link” w wolnym miejscu pod tekstem.
5. Ten sam post wrzuć na Facebooka i do wizytówki Google (teksty są w paczce).

## Ustawienia

Plik **`marketing/brand.mjs`**: adres strony (zmień po podpięciu domeny), telefon, miasto,
konto na Instagramie, autor wpisów. Miasto i Instagram dają lepsze lokalne SEO.

## Co narzędzie robi z grafikami NN

- Usuwa logo NN, ich pomarańczową ramkę i hasztag kampanii. Zostawia samo zdjęcie i składa
  nową grafikę w kolorach i fontach strony OSCare, z napisem „Materiał marketingowy”.
- Teksty pisze od nowa: bez nazw produktów NN i bez ich nagród. Nagroda Superbrands należy do NN,
  nie do OSCare, więc takich grafik nie przerabia.
- Animacji NN nie da się przemalować klatka po klatce. Z animacji bierze pomysł i treść
  i robi z nich post oraz rolkę.

> Upewnij się, że umowa z ubezpieczycielem pozwala używać jego zdjęć w Twojej oprawie,
> i sprawdzaj notatki „Zanim opublikujesz” w każdej paczce.
