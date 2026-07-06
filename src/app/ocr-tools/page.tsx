import type { Metadata } from 'next';
import { metadataForPage } from '@/lib/seo';
import { ToolDirectory } from '@/components/ToolDirectory';
import { getEffectiveTools } from '@/lib/overrides';
import { PageSchema } from '@/components/PageSchema';

export async function generateMetadata():Promise<Metadata>{return metadataForPage('ocr-tools','OCR Tools','Extract text from images locally with a browser OCR worker.','/ocr-tools');}
export default async function Page(){const tools=(await getEffectiveTools()).filter(t=>t.category==='ocr');return <main><PageSchema pageKey="ocr-tools"/><section className="page-hero"><div className="container"><span className="eyebrow">OCR Tools</span><h1>OCR Tools</h1><p className="section-copy">Extract text from images locally with a browser OCR worker.</p></div></section><section className="section-sm"><div className="container"><ToolDirectory tools={tools} initialCategory="ocr"/></div></section></main>}
