import type { Metadata } from 'next';
import { metadataForPage } from '@/lib/seo';
import { ToolDirectory } from '@/components/ToolDirectory';
import { getEffectiveTools } from '@/lib/overrides';
import { PageSchema } from '@/components/PageSchema';

export async function generateMetadata():Promise<Metadata>{return metadataForPage('document-tools','Document Tools','Convert Word, Excel, PowerPoint, DOCX, XLSX and CSV files on your own VPS.','/document-tools');}
export default async function Page(){const tools=(await getEffectiveTools()).filter(t=>t.category==='document');return <main><PageSchema pageKey="document-tools"/><section className="page-hero"><div className="container"><span className="eyebrow">Document Tools</span><h1>Document Tools</h1><p className="section-copy">Convert office documents using LibreOffice and Python libraries on your VPS without a paid conversion API.</p></div></section><section className="section-sm"><div className="container"><ToolDirectory tools={tools} initialCategory="document"/></div></section></main>}
