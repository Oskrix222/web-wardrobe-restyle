import { Link } from "@tanstack/react-router";
import { useReveal } from "@/hooks/useReveal";
import { cn } from "@/lib/utils";
import { resetConsent, trackingConfigured } from "@/lib/analytics";

export function Footer() {
  const reveal = useReveal<HTMLDivElement>();

  return (
    <footer className="site-footer">
      <div className="pattern-layer pattern-layer--light" aria-hidden="true" />
      <div className="container">
        <div ref={reveal.ref} className={cn("site-footer__grid", reveal.className)}>
          <div>
            <p className="site-footer__brand">OSCare</p>
            <p className="site-footer__about">
              Doradztwo ubezpieczeniowe z ludzkim podejściem. Pomagamy wybrać ochronę, która ma
              sens.
            </p>
          </div>
          <nav aria-label="Oferta">
            <p className="site-footer__heading">Oferta</p>
            <ul className="site-footer__list">
              <li>
                <a href="#oferta">Życie i zdrowie</a>
              </li>
              <li>
                <a href="#oferta">Majątek</a>
              </li>
              <li>
                <a href="#oferta">Wakacje</a>
              </li>
              <li>
                <a href="#dla-firm">Ubezpieczenia grupowe</a>
              </li>
            </ul>
          </nav>
          <div>
            <p className="site-footer__heading">Kontakt</p>
            <ul className="site-footer__list">
              <li>ul. Starowiejska 43</li>
              <li>43-603, Jaworzno</li>
              <li>NIP: 6322037383</li>
              <li>Numer agenta: 11115498/A</li>

              <li>
                <a href="mailto:kontakt@kamien.pl">kontakt@kamien.pl</a>
              </li>
              <li>
                <a href="tel:+48539075385">+48 539 075 385</a>
              </li>
              <li>
                <a href="tel:+48123456789">+48 123 456 789</a>
              </li>
            </ul>
          </div>
          <div>
            <p className="site-footer__heading">Godziny</p>
            <ul className="site-footer__list">
              <li>Pon–Pt: 9:00–20:00</li>
              <li>Sob: 10:00–14:00</li>
            </ul>
          </div>
        </div>
        <div className="site-footer__bottom">
          <p>© {new Date().getFullYear()} OSCare. Wszelkie prawa zastrzeżone.</p>
          <p>
            Strona ma charakter informacyjny i nie stanowi oferty w rozumieniu Kodeksu cywilnego.
          </p>
          <Link to="/polityka-prywatnosci">Polityka prywatności</Link>
          {trackingConfigured ? (
            <button type="button" className="site-footer__cookie-btn" onClick={resetConsent}>
              Ustawienia cookies
            </button>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
