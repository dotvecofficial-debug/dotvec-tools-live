# Dotvec Tools Header, Footer and Static Pages Upgrade

## Completed

- Static Pages Manager now lists and edits About Us, Contact, Privacy Policy, Terms of Use and Disclaimer.
- Built-in pages use CMS content instead of hardcoded content.
- Built-in pages can be published, hidden or deleted.
- Custom pages can still be created, edited and linked automatically.
- Header navigation labels, URLs, visibility and order are editable.
- Header search and theme-toggle visibility are editable.
- Footer description, copyright, bottom note, columns, links, visibility and order are editable.
- Header and footer light/dark background, text, link, hover and border colors are editable.
- Whole-site light/dark main, secondary, muted text, surface and border colors are editable.
- Static page header/footer links remain automatic and duplicate links are removed.

## Validation

- TypeScript check: passed.
- Next.js production build: passed.
- HTTP smoke tests: `/`, `/privacy-policy`, `/terms`, `/disclaimer`, `/contact`, `/about-us`, `/admin/login` returned HTTP 200.
