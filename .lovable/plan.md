# Move a website from Tailwind to SCSS

You share a public repository link, I copy that site into this project and rebuild every style as SCSS, keeping the look identical.

## What I need from you

- The public repository link (or a zip attached in chat if the repo is private).
- Confirmation that this project can be overwritten — it is currently an empty starter, so nothing of yours is lost.

## How it will work

1. **Bring the code in.** I download the repository into this project: pages, images, fonts, text, and any data files.
2. **Set up SCSS.** Add the SCSS build, a variables file for the colours, spacing, fonts, radii, and shadows already used on the site, plus mixins for the screen-size breakpoints, so nothing is hardcoded twice.
3. **Rebuild the styles page by page.** For each page and each piece of the interface I create its own `.scss` file, translate the Tailwind classes into real CSS rules with readable class names, and remove the Tailwind classes from the markup.
4. **Keep dark mode and hover/animation behaviour** working exactly as before, if the site has them.
5. **Remove Tailwind completely** once nothing references it: the package, its config and its imports.
6. **Compare before and after.** I open each page at phone, tablet, and desktop widths and check it against the original screenshots, fixing any spacing or size drift until they match.

## Things worth knowing up front

- If the site uses ready-made components that are built on Tailwind (a common component kit), those have to be restyled by hand too. That is the slowest part; I will do it, but the page count drives the time.
- If the original project uses a different page/routing setup than this one, I keep your pages and content and adapt the wiring so everything still opens at the same addresses.
- Anything that was already broken in the original stays as-is unless you ask me to fix it.

## Technical notes

- Add `sass` and load styles through `src/styles/main.scss` (partials: `_variables.scss`, `_mixins.scss`, `_base.scss`, per-page and per-component partials); component-scoped styles via `*.module.scss` where isolation helps.
- Port the existing design tokens from the Tailwind theme/CSS variables into SCSS variables plus CSS custom properties, so theming and dark mode keep working.
- Remove `tailwindcss`, `tw-animate-css`, `@tailwind`/`@theme` directives, and any `tailwind-merge`/`clsx` class plumbing that only existed for utility classes.
- Verify with a production build and a headless browser pass over every route at 390px / 768px / 1440px.
