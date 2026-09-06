import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

const navItems = [
  { label: "Oferta", href: "#oferta" },
  { label: "Dla firm", href: "#dla-firm" },
  { label: "O nas", href: "#o-nas" },
  { label: "Opinie", href: "#opinie" },
  { label: "Kontakt", href: "#kontakt" },
];

export function Header({ onContact }: { onContact: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="site-header__bar">
        <a href="#top" className="site-header__logo">
          KAMIEŃ
        </a>

        <nav aria-label="Główna nawigacja" className="site-header__nav">
          {navItems.map((item) => (
            <a key={item.label} href={item.href} className="site-header__link">
              {item.label}
            </a>
          ))}
          <Button size="sm" className="site-header__cta" onClick={onContact}>
            Zostaw kontakt
          </Button>
        </nav>

        <button
          type="button"
          className="site-header__toggle"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? "Zamknij menu" : "Otwórz menu"}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="site-header__mobile">
          <nav className="site-header__mobile-nav" aria-label="Nawigacja mobilna">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="site-header__mobile-link"
              >
                {item.label}
              </a>
            ))}
            <Button
              block
              className="site-header__mobile-cta"
              onClick={() => {
                setOpen(false);
                onContact();
              }}
            >
              Zostaw kontakt
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
