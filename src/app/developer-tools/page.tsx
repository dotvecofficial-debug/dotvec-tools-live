import type { Metadata } from 'next';
import { metadataForPage } from '@/lib/seo';
import { ToolDirectory } from '@/components/ToolDirectory';
import { getEffectiveTools } from '@/lib/overrides';
import { PageSchema } from '@/components/PageSchema';

export async function generateMetadata():Promise<Metadata>{return metadataForPage('developer-tools','Developer Tools','Format, validate, encode and generate development data.','/developer-tools');}
export default async function Page(){const tools=(await getEffectiveTools()).filter(t=>t.category==='developer');return <main><PageSchema pageKey="developer-tools"/><section className="page-hero"><div className="container"><span className="eyebrow">Developer Tools</span><h1>Developer Tools</h1><p className="section-copy">Format, validate, encode and generate development data.</p></div></section><section className="section-sm"><div className="container"><ToolDirectory tools={tools} initialCategory="developer"/></div></section></main>}
