import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AnalyticsTracker } from '@/components/analytics/AnalyticsTracker';
import { readStore } from '@/lib/store';
import { parseSchema } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await readStore();
  const seo = settings.seo;
  return {
    title: { default: seo.defaultTitle, template: seo.titleTemplate || '%s | Dotvec Tools' },
    description: seo.defaultDescription,
    keywords: seo.metaKeywords.split(',').map((item) => item.trim()).filter(Boolean),
    metadataBase: new URL(settings.canonicalDomain || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
    openGraph: { siteName: seo.ogSiteName, images: seo.defaultOgImage ? [{ url: seo.defaultOgImage }] : undefined },
    twitter: { card: seo.twitterCard, site: seo.twitterSite || undefined, creator: seo.twitterCreator || undefined, images: seo.defaultOgImage ? [seo.defaultOgImage] : undefined },
    robots: { index: seo.defaultRobotsIndex, follow: seo.defaultRobotsFollow },
    verification: { google: seo.googleVerification || undefined, other: seo.bingVerification ? { 'msvalidate.01': seo.bingVerification } : undefined },
  };
}

function safe(value: string, fallback: string) {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const store = await readStore();
  const theme = store.settings.theme;
  const cards = store.settings.cardAppearance;
  const header = store.settings.header;
  const footer = store.settings.footer;
  const radius = Math.max(6, Math.min(36, Number(theme.cardRadius) || 18));
  const css = `:root{
    --bg:${safe(theme.lightBackground, '#f7f8ff')};--surface:${safe(theme.lightSurface, '#ffffff')};--surface-2:${safe(theme.lightSurfaceSecondary, '#f1f5ff')};
    --text:${safe(theme.lightText, '#0f172a')};--text-2:${safe(theme.lightTextSecondary, '#334155')};--muted:${safe(theme.lightMuted, '#64748b')};--border:${safe(theme.lightBorder, '#dbe4f2')};--border-strong:${safe(theme.lightBorder, '#dbe4f2')};
    --primary:${safe(theme.lightPrimary, '#6366f1')};--primary-2:${safe(theme.lightSecondary, '#3882f6')};--cyan:${safe(theme.lightAccent, '#06b6d4')};--radius:${radius}px;--gradient:linear-gradient(135deg,var(--primary),var(--primary-2) 55%,var(--cyan));
    --header-bg:${safe(header.lightBackground, '#f7f8ff')};--header-text:${safe(header.lightText, '#0f172a')};--header-link:${safe(header.lightLink, '#334155')};--header-hover:${safe(header.lightHover, '#eef2ff')};--header-border:${safe(header.lightBorder, '#dbe4f2')};
    --footer-bg:${safe(footer.lightBackground, '#0b1020')};--footer-text:${safe(footer.lightText, '#94a3b8')};--footer-heading:${safe(footer.lightHeading, '#ffffff')};--footer-link:${safe(footer.lightLink, '#94a3b8')};--footer-border:${safe(footer.lightBorder, '#25304a')};
    --tool-card-bg:${safe(cards.lightToolBackground, '#ffffff')};--tool-card-text:${safe(cards.lightToolText, '#0f172a')};--tool-card-muted:${safe(cards.lightToolMuted, '#64748b')};--tool-card-border:${safe(cards.lightToolBorder, '#dbe4f2')};--tool-card-action:${safe(cards.lightToolAction, '#5b5cf0')};--tool-card-icon-bg:${safe(cards.lightToolIconBackground, '#eef2ff')};--tool-card-icon-text:${safe(cards.lightToolIconText, '#6366f1')};
    --category-card-bg:${safe(cards.lightCategoryBackground, '#ffffff')};--category-card-text:${safe(cards.lightCategoryText, '#0f172a')};--category-card-muted:${safe(cards.lightCategoryMuted, '#64748b')};--category-card-border:${safe(cards.lightCategoryBorder, '#dbe4f2')};--category-card-action:${safe(cards.lightCategoryAction, '#5b5cf0')};--category-card-icon-bg:${safe(cards.lightCategoryIconBackground, '#eef2ff')};--category-card-icon-text:${safe(cards.lightCategoryIconText, '#6366f1')};
  }
  [data-theme="dark"]{
    --bg:${safe(theme.darkBackground, '#06101e')};--surface:${safe(theme.darkSurface, '#0d1b2e')};--surface-2:${safe(theme.darkSurfaceSecondary, '#14243b')};
    --text:${safe(theme.darkText, '#f8fbff')};--text-2:${safe(theme.darkTextSecondary, '#cbd5e1')};--muted:${safe(theme.darkMuted, '#94a3b8')};--border:${safe(theme.darkBorder, '#263a57')};--border-strong:${safe(theme.darkBorder, '#263a57')};
    --primary:${safe(theme.darkPrimary, '#8b5cf6')};--primary-2:${safe(theme.darkSecondary, '#3882f6')};--cyan:${safe(theme.darkAccent, '#06b6d4')};
    --header-bg:${safe(header.darkBackground, '#06101e')};--header-text:${safe(header.darkText, '#f8fbff')};--header-link:${safe(header.darkLink, '#cbd5e1')};--header-hover:${safe(header.darkHover, '#14243b')};--header-border:${safe(header.darkBorder, '#263a57')};
    --footer-bg:${safe(footer.darkBackground, '#050914')};--footer-text:${safe(footer.darkText, '#94a3b8')};--footer-heading:${safe(footer.darkHeading, '#ffffff')};--footer-link:${safe(footer.darkLink, '#a8b7cf')};--footer-border:${safe(footer.darkBorder, '#1e2c43')};
    --tool-card-bg:${safe(cards.darkToolBackground, '#0d1b2e')};--tool-card-text:${safe(cards.darkToolText, '#f8fbff')};--tool-card-muted:${safe(cards.darkToolMuted, '#94a3b8')};--tool-card-border:${safe(cards.darkToolBorder, '#263a57')};--tool-card-action:${safe(cards.darkToolAction, '#9b8cff')};--tool-card-icon-bg:${safe(cards.darkToolIconBackground, '#182747')};--tool-card-icon-text:${safe(cards.darkToolIconText, '#9b8cff')};
    --category-card-bg:${safe(cards.darkCategoryBackground, '#0d1b2e')};--category-card-text:${safe(cards.darkCategoryText, '#f8fbff')};--category-card-muted:${safe(cards.darkCategoryMuted, '#94a3b8')};--category-card-border:${safe(cards.darkCategoryBorder, '#263a57')};--category-card-action:${safe(cards.darkCategoryAction, '#9b8cff')};--category-card-icon-bg:${safe(cards.darkCategoryIconBackground, '#182747')};--category-card-icon-text:${safe(cards.darkCategoryIconText, '#9b8cff')};
  }`;
  const customOrganization = parseSchema(store.settings.seo.organizationSchemaJson);
  const organization = customOrganization || {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: store.settings.seo.organizationName || store.settings.siteName,
    url: store.settings.canonicalDomain,
    ...(store.settings.seo.organizationLogo ? { logo: store.settings.seo.organizationLogo } : {}),
  };

  const publicPages = store.pages.filter((page) => page.status === 'published');
  const headerPages = publicPages.filter((page) => page.showInHeader).map(({ slug, navigationLabel, sortOrder }) => ({ slug, navigationLabel, sortOrder }));
  const footerPages = publicPages.filter((page) => page.showInFooter).map(({ slug, navigationLabel, footerGroup, sortOrder }) => ({ slug, navigationLabel, footerGroup, sortOrder }));

  return <html lang="en" suppressHydrationWarning><head><style dangerouslySetInnerHTML={{ __html: css }}/><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization).replace(/</g, '\\u003c') }}/></head><body><Suspense fallback={null}><AnalyticsTracker/></Suspense><Header announcement={store.settings.announcementEnabled ? store.settings.announcement : undefined} pages={headerPages} settings={header}/>{children}<Footer pages={footerPages} settings={footer}/></body></html>;
}
