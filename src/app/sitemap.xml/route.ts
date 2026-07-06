import { NextResponse } from 'next/server';
import { getEffectiveTools } from '@/lib/overrides';
import { readStore } from '@/lib/store';
import { categoryPath } from '@/lib/tools';

export const dynamic = 'force-dynamic';

function xml(value: string) { return value.replace(/[<>&'\"]/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[character] || character)); }

export async function GET() {
  const [store, tools] = await Promise.all([readStore(), getEffectiveTools()]);
  if (!store.settings.sitemap.enabled) return new NextResponse('Sitemap disabled.', { status: 404 });
  const domain = store.settings.canonicalDomain.replace(/\/$/, '');
  const map = store.settings.sitemap;
  const rows: Array<{ loc: string; changefreq: string; priority: number; lastmod?: string }> = [];
  const add = (loc: string, changefreq: string, priority: number, lastmod?: string) => {
    if (map.excludedPaths.some((excluded) => loc === excluded || loc.startsWith(`${excluded}/`))) return;
    if (!rows.some((row) => row.loc === loc)) rows.push({ loc, changefreq, priority, lastmod });
  };
  if (map.includeHome) add('/', 'weekly', 1);
  if (map.includeCategories) [...new Set(tools.map((tool) => categoryPath(tool.category)))].forEach((path) => add(path, 'weekly', 0.8));
  if (map.includeTools) tools.filter((tool) => tool.status === 'active').forEach((tool) => add(`/tools/${tool.slug}`, map.toolChangefreq, map.toolPriority));
  if (map.includeBlog) store.posts.filter((post) => post.status === 'published').forEach((post) => add(`/blog/${post.slug}`, map.blogChangefreq, map.blogPriority, post.updatedAt));
  if (map.includeStaticPages) {
    ['/all-tools','/blog','/privacy-policy','/terms','/disclaimer','/contact'].forEach((path) => add(path, 'monthly', 0.5));
    store.pages.filter((page) => page.status === 'published').forEach((page) => add(`/${page.slug}`, 'monthly', 0.6, page.updatedAt));
  }
  map.customUrls.forEach((item) => add(item.loc.startsWith('/') ? item.loc : `/${item.loc}`, item.changefreq, item.priority));

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.map((row) => `  <url><loc>${xml(`${domain}${row.loc}`)}</loc>${row.lastmod ? `<lastmod>${xml(row.lastmod)}</lastmod>` : ''}<changefreq>${row.changefreq}</changefreq><priority>${row.priority.toFixed(1)}</priority></url>`).join('\n')}\n</urlset>`;
  return new NextResponse(body, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'no-store' } });
}
