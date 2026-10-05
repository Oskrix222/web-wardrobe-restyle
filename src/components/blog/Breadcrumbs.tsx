import { Fragment } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";

type Crumb = { label: string; to?: "/" | "/blog" };

/** "Strona główna › Blog › Tytuł" — the last crumb is the current page. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Okruszki" className="breadcrumbs">
      <ol>
        {items.map((item, index) => (
          <Fragment key={item.label}>
            {index > 0 ? (
              <li aria-hidden="true" className="breadcrumbs__sep">
                <ChevronRight />
              </li>
            ) : null}
            <li>
              {item.to ? (
                <Link to={item.to} className="breadcrumbs__link">
                  {index === 0 ? <Home aria-hidden="true" /> : null}
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="breadcrumbs__current">
                  {item.label}
                </span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
