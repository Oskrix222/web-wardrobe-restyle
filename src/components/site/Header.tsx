import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/Button";
import { useActiveSection, SECTION_ORDER } from "@/hooks/useActiveSection";

const navItems = [
  { label: "O nas", href: "#o-nas" },
  { label: "Oferta", href: "#oferta" },
  { label: "Dla firm", href: "#dla-firm" },
  { label: "Opinie", href: "#opinie" },
  { label: "Kontakt", href: "#kontakt" },
];

export function Header({ onContact }: { onContact: () => void }) {
  const [open, setOpen] = useState(false);
  const activeId = useActiveSection(SECTION_ORDER);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === "/";
  const isBlog = pathname.startsWith("/blog");

  return (
    <header className="site-header">
      <div className="site-header__bar">
        {isHome ? (
          <button
            type="button"
            className="site-header__logo-btn"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Przewiń na górę strony"
          >
            <img src="/imgs/logo.png" alt="OSCare" className="site-header__logo" height={100} />
          </button>
        ) : (
          <Link to="/" className="site-header__logo-btn" aria-label="Strona główna OSCare">
            <img src="/imgs/logo.png" alt="OSCare" className="site-header__logo" height={100} />
          </Link>
        )}

        <nav aria-label="Główna nawigacja" className="site-header__nav">
          {navItems.map((item) => {
            const isActive = isHome && activeId === item.href.slice(1);
            return (
              <a
                key={item.label}
                href={isHome ? item.href : `/${item.href}`}
                aria-current={isActive ? "location" : undefined}
                className={isActive ? "site-header__link is-active" : "site-header__link"}
              >
                {item.label}
              </a>
            );
          })}
          <Link
            to="/blog"
            aria-current={isBlog ? "location" : undefined}
            className={isBlog ? "site-header__link is-active" : "site-header__link"}
          >
            Blog
          </Link>
          <Button size="sm" className="site-header__cta" onClick={onContact}>
            CHCĘ OFERTĘ!
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
            {navItems.map((item) => {
              const isActive = isHome && activeId === item.href.slice(1);
              return (
                <a
                  key={item.label}
                  href={isHome ? item.href : `/${item.href}`}
                  onClick={() => setOpen(false)}
                  aria-current={isActive ? "location" : undefined}
                  className={
                    isActive ? "site-header__mobile-link is-active" : "site-header__mobile-link"
                  }
                >
                  {item.label}
                </a>
              );
            })}
            <Link
              to="/blog"
              onClick={() => setOpen(false)}
              aria-current={isBlog ? "location" : undefined}
              className={isBlog ? "site-header__mobile-link is-active" : "site-header__mobile-link"}
            >
              Blog
            </Link>
            <Button
              block
              className="site-header__mobile-cta"
              onClick={() => {
                setOpen(false);
                onContact();
              }}
            >
              CHCĘ OFERTĘ!
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
