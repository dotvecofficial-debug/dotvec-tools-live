import type { Metadata } from 'next';
import { metadataForPage } from '@/lib/seo';
import { ToolDirectory } from '@/components/ToolDirectory';
import { getEffectiveTools } from '@/lib/overrides';
import { PageSchema } from '@/components/PageSchema';

export async function generateMetadata():Promise<Metadata>{return metadataForPage('all-tools','All Free Online Tools','Browse browser-based and VPS-powered image, PDF, text, SEO, developer and calculator tools.','/all-tools');}
export default async function AllTools(){const tools=await getEffectiveTools();return <main><PageSchema pageKey="all-tools"/><section className="page-hero"><div className="container"><span className="eyebrow">Complete directory</span><h1>All Dotvec Tools</h1><p className="section-copy">Search all browser and server tools from one professional directory.</p></div></section><section className="section-sm"><div className="container"><ToolDirectory tools={tools}/></div></section></main>}
