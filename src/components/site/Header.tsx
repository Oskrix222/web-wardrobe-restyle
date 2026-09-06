import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <a href="#top" className="min-w-0 truncate font-display text-2xl tracking-tight">
          KAMIEŃ
        </a>

        <nav aria-label="Główna nawigacja" className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
          <Button size="sm" className="ml-3 shrink-0" onClick={onContact}>
            Zostaw kontakt
          </Button>
        </nav>

        <button
          type="button"
          className="shrink-0 lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? "Zamknij menu" : "Otwórz menu"}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1" aria-label="Nawigacja mobilna">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-sm font-medium text-foreground/80 hover:bg-secondary"
              >
                {item.label}
              </a>
            ))}
            <Button
              className="mt-2 w-full"
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
