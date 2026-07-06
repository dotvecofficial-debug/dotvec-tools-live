# Dotvec Tools 2.3 — Pro Admin Build

This build adds the requested administration and SEO features without removing the existing tools.

## Admin upgrades

- Sidebar collapse/expand button now works and remembers the setting in localStorage
- New Homepage editor at `/admin/home`
- New Live Analytics dashboard at `/admin/analytics`
- New complete SEO manager at `/admin/seo`
- New Sitemap & Files manager at `/admin/sitemap`
- Tool manager supports Active, Maintenance, Disabled and Coming Soon

## SEO controls

- Global title, title template, description and meta keywords
- Open Graph site name, image and social preview
- Twitter/X card, site handle and creator handle
- Organization JSON-LD and custom per-page JSON-LD
- Google and Bing verification
- Canonical domain and per-page canonical URLs
- Index/follow controls
- Complete tool-page and blog-post SEO fields

## Technical SEO

- Dynamic sitemap.xml builder
- Category, tool, blog, static and custom URL controls
- Change frequency, priority and exclusions
- robots.txt editor and public route
- .htaccess editor/download for Apache deployments

## Validation

- Source validator: passed
- TypeScript: passed
- Production Next.js build: passed in validation environment
- No duplicate admin routes
