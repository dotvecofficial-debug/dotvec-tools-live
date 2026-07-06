import type { Metadata } from 'next';
import { metadataForPage } from '@/lib/seo';
import { ToolDirectory } from '@/components/ToolDirectory';
import { getEffectiveTools } from '@/lib/overrides';
import { PageSchema } from '@/components/PageSchema';

export async function generateMetadata():Promise<Metadata>{return metadataForPage('text-tools','Text Tools','Fast private text utilities with instant results.','/text-tools');}
export default async function Page(){const tools=(await getEffectiveTools()).filter(t=>t.category==='text');return <main><PageSchema pageKey="text-tools"/><section className="page-hero"><div className="container"><span className="eyebrow">Text Tools</span><h1>Text Tools</h1><p className="section-copy">Fast private text utilities with instant results.</p></div></section><section className="section-sm"><div className="container"><ToolDirectory tools={tools} initialCategory="text"/></div></section></main>}
