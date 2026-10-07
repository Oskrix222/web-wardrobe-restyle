import { useEffect, useState } from "react";
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Hairline + soft shadow under the header once the page moves; state only
  // changes when crossing the threshold, so scrolling doesn't re-render.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setScrolled(window.scrollY > 8);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <header className={scrolled ? "site-header is-scrolled" : "site-header"}>
      <div className="site-header__bar">
        {isHome ? (
          <button
            type="button"
            className="site-header__logo-btn"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Przewiń na górę strony"
          >
            <img
              src="/imgs/logo.webp"
              alt="OSCare"
              className="site-header__logo"
              width={156}
              height={140}
            />
          </button>
        ) : (
          <Link to="/" className="site-header__logo-btn" aria-label="Strona główna OSCare">
            <img
              src="/imgs/logo.webp"
              alt="OSCare"
              className="site-header__logo"
              width={156}
              height={140}
            />
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
            Bezpłatna wycena
          </Button>
        </nav>

        <button
          type="button"
          className={open ? "site-header__toggle is-open" : "site-header__toggle"}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? "Zamknij menu" : "Otwórz menu"}
        >
          <Menu className="site-header__toggle-icon site-header__toggle-icon--menu" />
          <X className="site-header__toggle-icon site-header__toggle-icon--close" />
        </button>
      </div>

      {/* Always mounted so it can slide in and out; inert keeps closed links
          out of the tab order and away from screen readers. */}
      <div className={open ? "site-header__mobile is-open" : "site-header__mobile"} inert={!open}>
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
            Bezpłatna wycena
          </Button>
        </nav>
      </div>
    </header>
  );
}
