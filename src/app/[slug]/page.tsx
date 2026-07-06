import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import sanitizeHtml from 'sanitize-html';
import { readStore } from '@/lib/store';
import { makeMetadata, parseSchema } from '@/lib/seo';

export const dynamic = 'force-dynamic';

const sanitizeOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'figure', 'figcaption', 'details', 'summary', 'section']),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    a: ['href', 'name', 'target', 'rel'],
    section: ['class'],
    details: ['class'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const store = await readStore();
  const page = store.pages.find((item) => item.slug === slug && item.status === 'published');
  if (!page) return {};
  return makeMetadata({
    fields: page,
    global: store.settings.seo,
    title: page.seoTitle || page.title,
    description: page.metaDescription || page.excerpt,
    canonical: page.canonicalUrl || `/${page.slug}`,
    image: page.openGraphImage || store.settings.seo.defaultOgImage,
  });
}

export default async function StaticPageRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await readStore();
  const page = store.pages.find((item) => item.slug === slug && item.status === 'published');
  if (!page) notFound();

  const html = sanitizeHtml(page.content, sanitizeOptions);
  const schema = parseSchema(page.schemaJson) || {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.title,
    description: page.metaDescription || page.excerpt,
    url: `${store.settings.canonicalDomain.replace(/\/$/, '')}/${page.slug}`,
    dateModified: page.updatedAt,
  };

  return <main>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}/>
    <section className="page-hero static-page-hero"><div className="reading"><span className="eyebrow">{store.settings.siteName}</span><h1>{page.title}</h1>{page.excerpt && <p className="section-copy">{page.excerpt}</p>}</div></section>
    <section className="section-sm"><article className="reading article static-page-content" dangerouslySetInnerHTML={{ __html: html }}/></section>
  </main>;
}
