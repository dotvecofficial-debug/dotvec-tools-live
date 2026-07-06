import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import {
  createId,
  defaultCardAppearance,
  defaultFooter,
  defaultHeader,
  defaultHome,
  defaultSeo,
  defaultSitemap,
  defaultTheme,
  mutateStore,
  readStore,
  type CardAppearanceSettings,
  type FooterColumnSettings,
  type FooterSettings,
  type HeaderSettings,
  type HomeSettings,
  type NavigationLink,
  type SitemapSettings,
  type ThemeSettings,
} from '@/lib/store';

const color = /^#[0-9a-f]{6}$/i;

function cleanLink(value: Partial<NavigationLink>, index: number): NavigationLink {
  const href = String(value.href || '/').trim();
  return {
    id: String(value.id || `link_${index}_${Date.now().toString(36)}`).slice(0, 80),
    label: String(value.label || 'Link').trim().slice(0, 80),
    href: href.startsWith('/') || /^https?:\/\//i.test(href) ? href : `/${href.replace(/^\/+/, '')}`,
    visible: value.visible !== false,
    sortOrder: Math.max(-9999, Math.min(9999, Number(value.sortOrder) || index * 10)),
  };
}

function cleanHeader(value: Partial<HeaderSettings>, current: HeaderSettings): HeaderSettings {
  const next = { ...defaultHeader, ...current, ...value };
  for (const key of ['lightBackground', 'lightText', 'lightLink', 'lightHover', 'lightBorder', 'darkBackground', 'darkText', 'darkLink', 'darkHover', 'darkBorder'] as const) {
    if (!color.test(String(next[key]))) next[key] = defaultHeader[key];
  }
  next.showSearch = value.showSearch === undefined ? current.showSearch : Boolean(value.showSearch);
  next.showThemeToggle = value.showThemeToggle === undefined ? current.showThemeToggle : Boolean(value.showThemeToggle);
  next.links = (Array.isArray(value.links) ? value.links : current.links).slice(0, 80).map(cleanLink).sort((a, b) => a.sortOrder - b.sortOrder);
  return next;
}

function cleanFooter(value: Partial<FooterSettings>, current: FooterSettings): FooterSettings {
  const next = { ...defaultFooter, ...current, ...value };
  for (const key of ['lightBackground', 'lightText', 'lightHeading', 'lightLink', 'lightBorder', 'darkBackground', 'darkText', 'darkHeading', 'darkLink', 'darkBorder'] as const) {
    if (!color.test(String(next[key]))) next[key] = defaultFooter[key];
  }
  next.description = String(value.description ?? current.description).slice(0, 1000);
  next.copyrightText = String(value.copyrightText ?? current.copyrightText).slice(0, 300);
  next.bottomNote = String(value.bottomNote ?? current.bottomNote).slice(0, 500);
  next.showAdminLink = value.showAdminLink === undefined ? current.showAdminLink : Boolean(value.showAdminLink);
  const columns = Array.isArray(value.columns) ? value.columns : current.columns;
  next.columns = columns.slice(0, 12).map((column: Partial<FooterColumnSettings>, index) => ({
    id: String(column.id || `column_${index}`).slice(0, 80),
    title: String(column.title || `Column ${index + 1}`).slice(0, 80),
    visible: column.visible !== false,
    sortOrder: Math.max(-9999, Math.min(9999, Number(column.sortOrder) || index * 10)),
    links: (Array.isArray(column.links) ? column.links : []).slice(0, 80).map(cleanLink).sort((a, b) => a.sortOrder - b.sortOrder),
  })).sort((a, b) => a.sortOrder - b.sortOrder);
  return next;
}

export async function GET() {
  if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json((await readStore()).settings);
}

async function postSettings(req: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json() as Record<string, unknown>;

  await mutateStore((store) => {
    const current = store.settings;
    const incomingTheme = (body.theme || {}) as Partial<ThemeSettings>;
    const theme = { ...defaultTheme, ...current.theme, ...incomingTheme };

    for (const key of Object.keys(theme) as Array<keyof ThemeSettings>) {
      if (key === 'cardRadius') {
        theme[key] = Math.max(6, Math.min(36, Number(theme[key]) || 18)) as never;
      } else if (!color.test(String(theme[key]))) {
        theme[key] = defaultTheme[key] as never;
      }
    }

    const incomingCards = (body.cardAppearance || {}) as Partial<CardAppearanceSettings>;
    const cardAppearance = { ...defaultCardAppearance, ...current.cardAppearance, ...incomingCards };
    for (const key of Object.keys(cardAppearance) as Array<keyof CardAppearanceSettings>) {
      if (!color.test(String(cardAppearance[key]))) cardAppearance[key] = defaultCardAppearance[key];
    }

    const incomingHome = (body.home || {}) as Partial<HomeSettings>;
    const home = { ...defaultHome, ...current.home, ...incomingHome };
    home.stats = Array.isArray(incomingHome.stats) ? incomingHome.stats.slice(0, 12) : current.home.stats;
    home.faqs = Array.isArray(incomingHome.faqs) ? incomingHome.faqs.slice(0, 40) : current.home.faqs;
    home.whyItems = Array.isArray(incomingHome.whyItems) ? incomingHome.whyItems.slice(0, 12) : current.home.whyItems;
    home.categoryCards = Array.isArray(incomingHome.categoryCards) ? incomingHome.categoryCards.slice(0, 30) : current.home.categoryCards;
    home.privacyItems = Array.isArray(incomingHome.privacyItems) ? incomingHome.privacyItems.slice(0, 20) : current.home.privacyItems;
    home.howSteps = Array.isArray(incomingHome.howSteps) ? incomingHome.howSteps.slice(0, 12) : current.home.howSteps;
    home.sectionOrder = Array.isArray(incomingHome.sectionOrder) ? incomingHome.sectionOrder.slice(0, 20) : current.home.sectionOrder;
    home.sectionVisibility = { ...defaultHome.sectionVisibility, ...current.home.sectionVisibility, ...(incomingHome.sectionVisibility || {}) };
    home.heroShowVisual = incomingHome.heroShowVisual === undefined ? current.home.heroShowVisual : Boolean(incomingHome.heroShowVisual);
    home.heroShowActiveToolCount = incomingHome.heroShowActiveToolCount === undefined ? current.home.heroShowActiveToolCount : Boolean(incomingHome.heroShowActiveToolCount);
    home.popularLimit = Math.max(1, Math.min(24, Number(incomingHome.popularLimit ?? current.home.popularLimit) || defaultHome.popularLimit));
    home.blogLimit = Math.max(1, Math.min(12, Number(incomingHome.blogLimit ?? current.home.blogLimit) || defaultHome.blogLimit));

    const incomingSitemap = (body.sitemap || {}) as Partial<SitemapSettings>;
    const sitemap = { ...defaultSitemap, ...current.sitemap, ...incomingSitemap };
    sitemap.toolPriority = Math.max(0, Math.min(1, Number(sitemap.toolPriority) || 0.8));
    sitemap.blogPriority = Math.max(0, Math.min(1, Number(sitemap.blogPriority) || 0.7));
    sitemap.customUrls = Array.isArray(incomingSitemap.customUrls) ? incomingSitemap.customUrls.slice(0, 500) : current.sitemap.customUrls;
    sitemap.excludedPaths = Array.isArray(incomingSitemap.excludedPaths) ? incomingSitemap.excludedPaths.slice(0, 200) : current.sitemap.excludedPaths;

    store.settings = {
      ...current,
      ...body,
      announcementEnabled: body.announcementEnabled === undefined ? current.announcementEnabled : Boolean(body.announcementEnabled),
      theme,
      cardAppearance,
      header: cleanHeader((body.header || {}) as Partial<HeaderSettings>, current.header),
      footer: cleanFooter((body.footer || {}) as Partial<FooterSettings>, current.footer),
      home,
      seo: { ...defaultSeo, ...current.seo, ...((body.seo || {}) as Record<string, unknown>) },
      sitemap,
      robotsTxt: String(body.robotsTxt ?? current.robotsTxt).slice(0, 100_000),
      htaccess: String(body.htaccess ?? current.htaccess).slice(0, 100_000),
    };

    store.activity.unshift({
      id: createId('act'),
      action: 'Site settings updated',
      target: 'site-configuration',
      createdAt: new Date().toISOString(),
    });
  });

  return NextResponse.json((await readStore()).settings);
}


export async function POST(req: NextRequest) {
  try {
    return await postSettings(req);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error && error.message ? error.message : 'Site settings could not be saved.' },
      { status: 500 },
    );
  }
}
