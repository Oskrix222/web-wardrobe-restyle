export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__grid">
          <div>
            <p className="site-footer__brand">KAMIEŃ</p>
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
              <li>ul. Przykładowa 12</li>
              <li>00-000 Warszawa</li>
              <li>
                <a href="mailto:kontakt@kamien.pl">kontakt@kamien.pl</a>
              </li>
              <li>
                <a href="tel:+48123456789">+48 123 456 789</a>
              </li>
            </ul>
          </div>
          <div>
            <p className="site-footer__heading">Godziny</p>
            <ul className="site-footer__list">
              <li>Pon–Pt: 9:00–17:00</li>
              <li>Sob: 10:00–14:00</li>
              <li>Nd: nieczynne</li>
            </ul>
          </div>
        </div>
        <div className="site-footer__bottom">
          <p>© {new Date().getFullYear()} KAMIEŃ. Wszelkie prawa zastrzeżone.</p>
          <p>Strona ma charakter informacyjny i nie stanowi oferty w rozumieniu Kodeksu cywilnego.</p>
        </div>
      </div>
    </footer>
  );
}
