import { createFileRoute, Link } from "@tanstack/react-router";

import { BUSINESS, CONTACT_PHONES, telHref } from "@/config/business";
import { seoHead } from "@/lib/seo";

const title = "Polityka prywatności — OSCare Ubezpieczenia";
const description =
  "Informacje o przetwarzaniu danych osobowych zbieranych przez formularz kontaktowy OSCare.";

export const Route = createFileRoute("/polityka-prywatnosci")({
  // Legal page: reachable, but not something to rank in Google.
  head: () => seoHead({ title, description, path: "/polityka-prywatnosci", noindex: true }),
  component: PrivacyPolicy,
});

function PrivacyPolicy() {
  return (
    <div className="legal-page">
      <header className="legal-page__header">
        <Link to="/" aria-label="OSCare — strona główna">
          <img
            src="/imgs/logo.webp"
            alt="OSCare"
            className="legal-page__logo"
            width={156}
            height={140}
          />
        </Link>
        <Link to="/" className="legal-page__back">
          ← Wróć na stronę główną
        </Link>
      </header>

      <main className="section section--panel">
        <div className="container legal">
          <span className="eyebrow">Dokument prawny</span>
          <h1 className="section-heading">POLITYKA PRYWATNOŚCI</h1>
          <p className="legal__updated">Ostatnia aktualizacja: 9 października 2026 r.</p>

          <p className="legal__note">
            Pola oznaczone <mark>na żółto</mark> to miejsca, które musicie uzupełnić własnymi danymi
            (NIP działalności Izumi Sato oraz dokładny okres przechowywania danych) zanim dokument
            zacznie obowiązywać. Ponieważ OSCare to dwie odrębne, współpracujące ze sobą
            jednoosobowe działalności gospodarcze korzystające ze wspólnego formularza, prawnie
            jesteście <strong>współadministratorami danych</strong> w rozumieniu art. 26 RODO.
            Przepis ten wymaga pisemnego porozumienia między Wami określającego, kto odpowiada za
            jakie obowiązki (np. kto odpowiada na wnioski osób, których dane dotyczą). Ten dokument
            nie zastępuje takiego porozumienia — zalecamy skonsultowanie całości z prawnikiem lub
            specjalistą RODO przed uruchomieniem formularza na produkcji.
          </p>

          <article>
            <h2>1. Administratorzy danych</h2>
            <p>
              Współadministratorami Twoich danych osobowych, zbieranych za pośrednictwem formularza
              kontaktowego na naszej stronie internetowej, są prowadzący współpracującą działalność
              pod wspólną marką „OSCare”:
            </p>
            <ul>
              <li>
                <strong>Oskar Kubowicz</strong>, prowadzący jednoosobową działalność gospodarczą,
                NIP: 6322037383, ul. Starowiejska 43, 43-603 Jaworzno,
              </li>
              <li>
                <strong>Izumi Sato</strong>, prowadząca jednoosobową działalność gospodarczą, NIP:{" "}
                <mark>uzupełnić NIP działalności Izumi Sato</mark>, ul. Starowiejska 43, 43-603
                Jaworzno.
              </li>
            </ul>
            <p>
              We wszystkich sprawach dotyczących ochrony danych osobowych możesz skontaktować się z
              nami{" "}
              {BUSINESS.email ? (
                <>
                  pod adresem e-mail <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>,{" "}
                </>
              ) : null}
              telefonicznie:{" "}
              {CONTACT_PHONES.map((c, i) => (
                <span key={c.phone}>
                  {i > 0 ? ", " : ""}
                  <a href={telHref(c.phone)}>{c.phone}</a> ({c.fullName})
                </span>
              ))}{" "}
              lub listownie: {BUSINESS.street}, {BUSINESS.postalCode} {BUSINESS.city}.
            </p>

            <h2>2. Jakie dane zbieramy</h2>
            <p>Formularz „Zostaw kontakt” zbiera:</p>
            <ul>
              <li>imię i nazwisko,</li>
              <li>numer telefonu,</li>
              <li>adres e-mail (opcjonalnie, jeśli go podasz),</li>
              <li>wybrany rodzaj ubezpieczenia,</li>
              <li>treść wiadomości (opcjonalnie),</li>
              <li>datę i godzinę wyrażenia zgody na przetwarzanie danych,</li>
              <li>
                informację, skąd trafiłeś do formularza (np. link z naszego posta na Instagramie,
                strona albo artykuł na blogu) — zapisujemy ją razem ze zgłoszeniem, bez plików
                cookies, żeby wiedzieć, które treści naprawdę pomagają.
              </li>
            </ul>

            <h2>3. Cel i podstawa prawna przetwarzania</h2>
            <p>
              Dane przetwarzamy w celu odpowiedzi na Twoje zgłoszenie, przygotowania oferty
              ubezpieczenia i kontaktu telefonicznego lub mailowego w tej sprawie — na podstawie
              Twojej dobrowolnej zgody (art. 6 ust. 1 lit. a RODO) oraz, w zakresie w jakim
              zgłoszenie dotyczy przygotowania oferty, jako działania podjęte na Twoje żądanie przed
              zawarciem umowy (art. 6 ust. 1 lit. b RODO).
            </p>

            <h2>4. Komu udostępniamy dane</h2>
            <p>
              Dane są przetwarzane przez obu współadministratorów wymienionych w pkt 1 — zgłoszenie
              trafia do jednej, wspólnej bazy, z której może skontaktować się z Tobą Oskar Kubowicz
              lub Izumi Sato, w zależności od wybranego rodzaju ubezpieczenia i dostępności.
              Korzystamy z usług dostawców działających jako nasze podmioty przetwarzające, na
              podstawie umów powierzenia przetwarzania danych:
            </p>
            <ul>
              <li>
                Supabase Inc. — baza danych, w której przechowujemy zgłoszenia (serwery w UE),
              </li>
              <li>Cloudflare, Inc. — hosting i zabezpieczenie strony,</li>
              <li>Resend — wysyłka powiadomienia e-mail o nowym zgłoszeniu na skrzynkę doradcy,</li>
              <li>Crisp IM SAS (Francja) — czat na żywo na stronie, tylko jeśli go otworzysz,</li>
              <li>
                Google Ireland Ltd. — Google Analytics i Google Ads, wyłącznie jeśli wyrazisz zgodę
                na cookies (zob. pkt 8).
              </li>
            </ul>
            <p>
              Dostawcy ci mogą przetwarzać dane także poza Europejskim Obszarem Gospodarczym — w
              takim wypadku na podstawie standardowych klauzul umownych zatwierdzonych przez Komisję
              Europejską lub decyzji o odpowiednim stopniu ochrony (EU-US Data Privacy Framework).
              Danych nie sprzedajemy ani nie udostępniamy innym podmiotom w celach marketingowych.
            </p>

            <h2>5. Okres przechowywania</h2>
            <p>
              Dane przechowujemy przez czas niezbędny do obsługi Twojego zgłoszenia, a jeśli dojdzie
              do zawarcia umowy ubezpieczenia — przez okres wymagany przepisami prawa (w tym
              podatkowymi) oraz do czasu przedawnienia ewentualnych roszczeń. Jeżeli zgłoszenie nie
              zakończy się zawarciem umowy, dane usuwamy nie później niż{" "}
              <mark>uzupełnić: np. po 12 miesiącach od ostatniego kontaktu</mark> — w każdej chwili
              możesz też wcześniej cofnąć zgodę, o czym mowa w pkt 7.
            </p>

            <h2>6. Dobrowolność podania danych</h2>
            <p>
              Podanie danych w formularzu jest dobrowolne, ale niezbędne do tego, abyśmy mogli
              odpowiedzieć na zgłoszenie i przygotować ofertę. Bez zaznaczenia zgody formularz nie
              zostanie wysłany.
            </p>

            <h2>7. Twoje prawa</h2>
            <p>W związku z przetwarzaniem danych przysługuje Ci prawo do:</p>
            <ul>
              <li>dostępu do swoich danych i uzyskania ich kopii,</li>
              <li>sprostowania (poprawienia) danych,</li>
              <li>usunięcia danych („prawo do bycia zapomnianym”),</li>
              <li>ograniczenia przetwarzania,</li>
              <li>przenoszenia danych,</li>
              <li>wniesienia sprzeciwu wobec przetwarzania,</li>
              <li>
                cofnięcia zgody w dowolnym momencie, bez wpływu na zgodność z prawem przetwarzania
                dokonanego przed jej cofnięciem,
              </li>
              <li>
                wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych (UODO), jeśli uznasz,
                że przetwarzanie narusza przepisy RODO.
              </li>
            </ul>
            <p>
              Aby skorzystać z powyższych praw,{" "}
              {BUSINESS.email ? (
                <>
                  napisz na <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>, zadzwoń
                </>
              ) : (
                "zadzwoń"
              )}{" "}
              pod jeden z numerów podanych w punkcie 1 albo wyślij list na adres {BUSINESS.street},{" "}
              {BUSINESS.postalCode} {BUSINESS.city}.
            </p>

            <h2>8. Pliki cookies</h2>
            <p>
              Za Twoją zgodą (art. 6 ust. 1 lit. a RODO, art. 399 Prawa komunikacji elektronicznej)
              korzystamy z plików cookies Google Analytics 4 — żeby wiedzieć, które treści są
              przydatne — oraz Google Ads — żeby mierzyć skuteczność naszych reklam (np. czy ktoś
              wysłał formularz po kliknięciu reklamy). Bez zgody narzędzia te w ogóle się nie
              ładują.
            </p>
            <p>
              Przy pierwszej wizycie zapytamy o zgodę w okienku na dole strony. Swoją decyzję
              zapamiętujemy w pamięci przeglądarki (localStorage), a zmienisz ją w każdej chwili
              linkiem „Ustawienia cookies” w stopce strony. Licznik wyświetleń wpisów na blogu nie
              używa cookies ani nie zbiera danych osobowych.
            </p>
            <p>
              Czat na żywo (Crisp) ładuje się dopiero po kliknięciu przycisku „Napisz do nas”. Wtedy
              zapisuje w przeglądarce plik cookie potrzebny do utrzymania rozmowy, żeby nasza
              odpowiedź dotarła do Ciebie także po odświeżeniu strony. Treść rozmowy i dane podane
              na czacie (np. e-mail) przetwarzamy wyłącznie po to, żeby odpowiedzieć na Twoje
              pytanie.
            </p>

            <h2>9. Zautomatyzowane podejmowanie decyzji</h2>
            <p>
              Nie podejmujemy wobec Ciebie decyzji w sposób zautomatyzowany, w tym nie stosujemy
              profilowania w rozumieniu RODO.
            </p>
          </article>
        </div>
      </main>

      <footer className="legal-page__footer">
        <p>© {new Date().getFullYear()} OSCare. Wszelkie prawa zastrzeżone.</p>
      </footer>
    </div>
  );
}
