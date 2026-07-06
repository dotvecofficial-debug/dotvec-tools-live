import type { Metadata } from 'next';
import { metadataForPage } from '@/lib/seo';
import { ToolDirectory } from '@/components/ToolDirectory';
import { getEffectiveTools } from '@/lib/overrides';
import { PageSchema } from '@/components/PageSchema';

export async function generateMetadata():Promise<Metadata>{return metadataForPage('seo-tools','SEO Tools','Create metadata, schema, sitemaps and campaign URLs locally.','/seo-tools');}
export default async function Page(){const tools=(await getEffectiveTools()).filter(t=>t.category==='seo');return <main><PageSchema pageKey="seo-tools"/><section className="page-hero"><div className="container"><span className="eyebrow">SEO Tools</span><h1>SEO Tools</h1><p className="section-copy">Create metadata, schema, sitemaps and campaign URLs locally.</p></div></section><section className="section-sm"><div className="container"><ToolDirectory tools={tools} initialCategory="seo"/></div></section></main>}
