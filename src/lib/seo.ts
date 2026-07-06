import type { Metadata } from 'next';
import type { GlobalSeoSettings, SeoFields } from './store';

export function makeMetadata({
  fields,
  global,
  title,
  description,
  canonical,
  image,
  type = 'website',
}: {
  fields?: SeoFields;
  global: GlobalSeoSettings;
  title: string;
  description: string;
  canonical: string;
  image?: string;
  type?: 'website' | 'article';
}): Metadata {
  const finalTitle = fields?.seoTitle || title;
  const finalDescription = fields?.metaDescription || description;
  const finalImage = fields?.openGraphImage || fields?.twitterImage || image || global.defaultOgImage || undefined;
  const keywords = (fields?.metaKeywords || global.metaKeywords).split(',').map((item) => item.trim()).filter(Boolean);
  const robotsIndex = fields?.robotsIndex ?? global.defaultRobotsIndex;
  const robotsFollow = fields?.robotsFollow ?? global.defaultRobotsFollow;
  const canonicalUrl = fields?.canonicalUrl || canonical;

  return {
    title: finalTitle,
    description: finalDescription,
    keywords,
    alternates: { canonical: canonicalUrl },
    robots: { index: robotsIndex, follow: robotsFollow },
    openGraph: {
      title: fields?.openGraphTitle || finalTitle,
      description: fields?.openGraphDescription || finalDescription,
      url: canonicalUrl,
      siteName: global.ogSiteName,
      type: fields?.openGraphType || type,
      images: finalImage ? [{ url: finalImage }] : undefined,
    },
    twitter: {
      card: fields?.twitterCard || global.twitterCard,
      title: fields?.twitterTitle || fields?.openGraphTitle || finalTitle,
      description: fields?.twitterDescription || fields?.openGraphDescription || finalDescription,
      images: finalImage ? [fields?.twitterImage || finalImage] : undefined,
      site: global.twitterSite || undefined,
      creator: global.twitterCreator || undefined,
    },
  };
}

export function parseSchema(value?: string): unknown | null {
  if (!value?.trim()) return null;
  try { return JSON.parse(value); } catch { return null; }
}

export async function metadataForPage(key: string, title: string, description: string, canonical: string): Promise<Metadata> {
  const { readStore } = await import('./store');
  const store = await readStore();
  return makeMetadata({
    fields: store.settings.pageSeo[key],
    global: store.settings.seo,
    title,
    description,
    canonical,
    image: store.settings.pageSeo[key]?.openGraphImage || store.settings.seo.defaultOgImage,
  });
}
