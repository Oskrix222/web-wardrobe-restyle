export function Footer() {
  return (
    <footer className="border-t border-border bg-foreground py-16 text-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-2xl">KAMIEŃ</p>
            <p className="mt-4 text-sm leading-relaxed text-background/70">
              Doradztwo ubezpieczeniowe z ludzkim podejściem. Pomagamy wybrać ochronę, która ma sens.
            </p>
          </div>
          <nav aria-label="Oferta">
            <p className="font-mono text-xs uppercase tracking-widest text-background/50">Oferta</p>
            <ul className="mt-4 space-y-2 text-sm text-background/80">
              <li><a href="#oferta" className="hover:underline">Życie i zdrowie</a></li>
              <li><a href="#oferta" className="hover:underline">Majątek</a></li>
              <li><a href="#oferta" className="hover:underline">Wakacje</a></li>
              <li><a href="#dla-firm" className="hover:underline">Ubezpieczenia grupowe</a></li>
            </ul>
          </nav>
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-background/50">Kontakt</p>
            <ul className="mt-4 space-y-2 text-sm text-background/80">
              <li>ul. Przykładowa 12</li>
              <li>00-000 Warszawa</li>
              <li><a href="mailto:kontakt@kamien.pl" className="hover:underline">kontakt@kamien.pl</a></li>
              <li><a href="tel:+48123456789" className="hover:underline">+48 123 456 789</a></li>
            </ul>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-background/50">Godziny</p>
            <ul className="mt-4 space-y-2 text-sm text-background/80">
              <li>Pon–Pt: 9:00–17:00</li>
              <li>Sob: 10:00–14:00</li>
              <li>Nd: nieczynne</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-background/10 pt-8 sm:flex-row">
          <p className="text-xs text-background/50">
            © {new Date().getFullYear()} KAMIEŃ. Wszelkie prawa zastrzeżone.
          </p>
          <p className="text-xs text-background/50">
            Strona ma charakter informacyjny i nie stanowi oferty w rozumieniu Kodeksu cywilnego.
          </p>
        </div>
      </div>
    </footer>
  );
}
