import { Link } from "@tanstack/react-router";
import { useReveal } from "@/hooks/useReveal";
import { cn } from "@/lib/utils";
import { resetConsent, trackingConfigured } from "@/lib/analytics";
import { BUSINESS, CONTACT_PHONES, telHref } from "@/config/business";
import { LOCATIONS } from "@/config/locations";

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
                <a href="/#oferta">Życie i zdrowie</a>
              </li>
              <li>
                <a href="/#oferta">Majątek</a>
              </li>
              <li>
                <a href="/#oferta">Wakacje</a>
              </li>
              <li>
                <a href="/#dla-firm">Ubezpieczenia grupowe</a>
              </li>
              {LOCATIONS.map((location) => (
                <li key={location.slug}>
                  <Link to={location.path}>Ubezpieczenia {location.city}</Link>
                </li>
              ))}
              <li>
                <Link to="/blog">Blog i poradniki</Link>
              </li>
            </ul>
          </nav>
          <div>
            <p className="site-footer__heading">Kontakt</p>
            <ul className="site-footer__list">
              <li>{BUSINESS.street}</li>
              <li>
                {BUSINESS.postalCode} {BUSINESS.city}
              </li>
              <li>NIP: {BUSINESS.nip}</li>
              <li>Numer agenta: {BUSINESS.agentNumber}</li>
              {BUSINESS.email ? (
                <li>
                  <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
                </li>
              ) : null}
              {CONTACT_PHONES.map((c) => (
                <li key={c.phone}>
                  <a href={telHref(c.phone)}>
                    {c.phone} <span className="site-footer__muted">({c.name})</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="site-footer__heading">Godziny</p>
            <ul className="site-footer__list">
              {BUSINESS.hours.map((h) => (
                <li key={h.label}>
                  {h.label}: {h.time}
                </li>
              ))}
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
