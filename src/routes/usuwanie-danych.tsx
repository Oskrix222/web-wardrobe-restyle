import { createFileRoute, Link } from "@tanstack/react-router";

import { BUSINESS, CONTACT_PHONES, telHref } from "@/config/business";
import { seoHead } from "@/lib/seo";

const title = "Usuwanie danych — OSCare Ubezpieczenia";
const description =
  "Jak usunąć dane, które aplikacja OSCare przetwarza na Instagramie i Facebooku. Data deletion instructions.";

// Meta App settings → "User data deletion" → Data deletion instructions URL points here.
export const Route = createFileRoute("/usuwanie-danych")({
  head: () => seoHead({ title, description, path: "/usuwanie-danych", noindex: true }),
  component: DataDeletion,
});

function DataDeletion() {
  const contact = CONTACT_PHONES.map((c) => c.phone).join(", ");
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
          <h1 className="section-heading">USUWANIE DANYCH</h1>
          <p className="legal__updated">Ostatnia aktualizacja: 10 października 2026 r.</p>

          <article>
            <h2>Jakie dane mamy</h2>
            <p>
              Aplikacja OSCare publikuje posty na naszym Instagramie i Facebooku i odpowiada osobom,
              które w komentarzu poproszą o informację (np. słowem „RAK”). Zapisujemy wtedy tylko:
              identyfikator komentarza, nazwę użytkownika lub imię z profilu, treść komentarza i
              datę odpowiedzi. Nie logujesz się do naszej aplikacji i nie dostajemy dostępu do
              Twojego konta. Szczegóły są w{" "}
              <Link to="/polityka-prywatnosci" hash="instagram-facebook">
                polityce prywatności
              </Link>
              .
            </p>

            <h2>Usuwamy je automatycznie</h2>
            <p>Zapis o wysłanej odpowiedzi kasujemy sam po 90 dniach.</p>

            <h2>Jak usunąć je od razu</h2>
            <ol>
              <li>
                Napisz do nas wiadomość prywatną na Instagramie lub Facebooku: „Usuń moje dane”.
                Możesz też zadzwonić: {contact}
                {BUSINESS.email ? `, lub napisać na ${BUSINESS.email}` : ""}.
              </li>
              <li>Usuniemy wszystkie zapisy związane z Twoim kontem w ciągu 30 dni.</li>
              <li>Potwierdzimy usunięcie w odpowiedzi na Twoją wiadomość.</li>
            </ol>
            <p>
              Sam komentarz pod postem możesz w każdej chwili usunąć na Instagramie lub Facebooku.
              Wiadomości w skrzynce odbiorczej przechowuje firma Meta, a usuniesz je w ustawieniach
              swojego konta.
            </p>
            <p>
              Administratorzy: {BUSINESS.name}, {BUSINESS.street}, {BUSINESS.postalCode}{" "}
              {BUSINESS.city}. Telefon:{" "}
              {CONTACT_PHONES.map((c, i) => (
                <span key={c.phone}>
                  {i > 0 ? ", " : ""}
                  <a href={telHref(c.phone)}>{c.phone}</a>
                </span>
              ))}
              .
            </p>

            <h2 id="english" lang="en">
              Data deletion instructions (English)
            </h2>
            <div lang="en">
              <p>
                The OSCare app publishes posts to our own Instagram account and Facebook Page and
                sends one private reply to people who ask for information in a comment. It stores
                only the comment ID, the commenter&apos;s username or profile name, the comment text
                and the reply date. Nobody logs in to our app and we get no access to your account.
              </p>
              <p>These records are deleted automatically after 90 days. To delete them now:</p>
              <ol>
                <li>
                  Send us a direct message on Instagram or Facebook saying &quot;Delete my
                  data&quot;, or call {contact}.
                </li>
                <li>We delete every record linked to your account within 30 days.</li>
                <li>We confirm the deletion in a reply to your message.</li>
              </ol>
            </div>
          </article>
        </div>
      </main>

      <footer className="legal-page__footer">
        <p>© {new Date().getFullYear()} OSCare. Wszelkie prawa zastrzeżone.</p>
      </footer>
    </div>
  );
}
