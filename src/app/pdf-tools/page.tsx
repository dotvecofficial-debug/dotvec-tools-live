import type { Metadata } from 'next';
import { metadataForPage } from '@/lib/seo';
import { ToolDirectory } from '@/components/ToolDirectory';
import { getEffectiveTools } from '@/lib/overrides';
import { PageSchema } from '@/components/PageSchema';

export async function generateMetadata():Promise<Metadata>{return metadataForPage('pdf-tools','PDF Tools','Organize and edit PDF pages without sending supported files to a server.','/pdf-tools');}
export default async function Page(){const tools=(await getEffectiveTools()).filter(t=>t.category==='pdf');return <main><PageSchema pageKey="pdf-tools"/><section className="page-hero"><div className="container"><span className="eyebrow">PDF Tools</span><h1>PDF Tools</h1><p className="section-copy">Organize and edit PDF pages without sending supported files to a server.</p></div></section><section className="section-sm"><div className="container"><ToolDirectory tools={tools} initialCategory="pdf"/></div></section></main>}
