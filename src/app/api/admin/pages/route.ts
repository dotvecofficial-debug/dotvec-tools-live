import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { createId, defaultStaticPages, mutateStore, readStore, type StaticPage } from '@/lib/store';

const reservedSlugs = new Set([
  'admin', 'api', 'tools', 'blog', 'all-tools', 'image-tools', 'pdf-tools', 'text-tools',
  'developer-tools', 'seo-tools', 'calculators', 'ocr-tools', 'video-tools', 'audio-tools',
  'document-tools', 'social-downloaders', 'server-tools', 'privacy-policy', 'terms',
  'disclaimer', 'contact', 'robots.txt', 'sitemap.xml', '_next', 'favicon.ico',
]);
const systemSlugs = new Set(defaultStaticPages.map((page) => page.slug));

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100);
}

export async function GET() {
  if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json((await readStore()).pages);
}

async function postPages(req: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json() as Partial<StaticPage> & { action?: 'delete' };
  const currentStore = await readStore();
  const existing = body.id ? currentStore.pages.find((item) => item.id === body.id) : undefined;

  if (body.action === 'delete' && body.id) {
    await mutateStore((store) => {
      const page = store.pages.find((item) => item.id === body.id);
      store.pages = store.pages.filter((item) => item.id !== body.id);
      if (page?.isSystem || (page && systemSlugs.has(page.slug))) {
        store.deletedPageSlugs = Array.from(new Set([...(store.deletedPageSlugs || []), page.slug]));
      }
      store.activity.unshift({ id: createId('act'), action: 'Static page deleted', target: page?.slug || body.id, createdAt: new Date().toISOString() });
    });
    return NextResponse.json({ ok: true });
  }

  const title = String(body.title || '').trim();
  const requestedSlug = slugify(String(body.slug || title));
  const slug = existing?.isSystem ? existing.slug : requestedSlug;
  if (!title || !slug) return NextResponse.json({ error: 'Page title and slug are required.' }, { status: 400 });
  if (reservedSlugs.has(slug) && !(existing?.isSystem && existing.slug === slug)) {
    return NextResponse.json({ error: `The slug “${slug}” is reserved by the website.` }, { status: 400 });
  }

  const now = new Date().toISOString();
  const page: StaticPage = {
    id: body.id || createId('page'),
    slug,
    title,
    navigationLabel: String(body.navigationLabel || title).trim() || title,
    excerpt: String(body.excerpt || ''),
    content: String(body.content || '<p>Page content goes here.</p>'),
    status: body.status === 'published' || body.status === 'hidden' ? body.status : 'draft',
    showInHeader: Boolean(body.showInHeader),
    showInFooter: Boolean(body.showInFooter),
    footerGroup: body.footerGroup === 'resources' || body.footerGroup === 'legal' ? body.footerGroup : 'company',
    sortOrder: Math.max(-9999, Math.min(9999, Number(body.sortOrder) || 0)),
    createdAt: body.createdAt || existing?.createdAt || now,
    updatedAt: now,
    isSystem: Boolean(existing?.isSystem || body.isSystem || systemSlugs.has(slug)),
    seoTitle: body.seoTitle || title,
    metaDescription: body.metaDescription || body.excerpt || '',
    metaKeywords: body.metaKeywords || '',
    canonicalUrl: body.canonicalUrl || '',
    openGraphTitle: body.openGraphTitle || '',
    openGraphDescription: body.openGraphDescription || '',
    openGraphImage: body.openGraphImage || '',
    openGraphType: 'website',
    twitterCard: body.twitterCard || 'summary_large_image',
    twitterTitle: body.twitterTitle || '',
    twitterDescription: body.twitterDescription || '',
    twitterImage: body.twitterImage || body.openGraphImage || '',
    robotsIndex: body.robotsIndex ?? true,
    robotsFollow: body.robotsFollow ?? true,
    schemaJson: body.schemaJson || '',
  };

  try {
    await mutateStore((store) => {
      const duplicate = store.pages.find((item) => item.slug === page.slug && item.id !== page.id);
      if (duplicate) throw new Error('Another static page already uses this slug.');
      const index = store.pages.findIndex((item) => item.id === page.id);
      if (index >= 0) store.pages[index] = page;
      else store.pages.push(page);
      store.deletedPageSlugs = (store.deletedPageSlugs || []).filter((item) => item !== page.slug);
      store.pages.sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
      store.activity.unshift({
        id: createId('act'),
        action: page.status === 'published' ? 'Static page published' : page.status === 'hidden' ? 'Static page hidden' : 'Static page draft saved',
        target: page.slug,
        createdAt: now,
      });
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not save the page.' }, { status: 400 });
  }

  return NextResponse.json(page);
}


export async function POST(req: NextRequest) {
  try {
    return await postPages(req);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error && error.message ? error.message : 'Static page request failed.' },
      { status: 500 },
    );
  }
}
