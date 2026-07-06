import type { Metadata } from 'next';
import { metadataForPage } from '@/lib/seo';
import { ToolDirectory } from '@/components/ToolDirectory';
import { getEffectiveTools } from '@/lib/overrides';
import { PageSchema } from '@/components/PageSchema';

export async function generateMetadata():Promise<Metadata>{return metadataForPage('calculators','Calculators','Useful finance, date, health and conversion calculators.','/calculators');}
export default async function Page(){const tools=(await getEffectiveTools()).filter(t=>t.category==='calculator');return <main><PageSchema pageKey="calculators"/><section className="page-hero"><div className="container"><span className="eyebrow">Calculators</span><h1>Calculators</h1><p className="section-copy">Useful finance, date, health and conversion calculators.</p></div></section><section className="section-sm"><div className="container"><ToolDirectory tools={tools} initialCategory="calculator"/></div></section></main>}
