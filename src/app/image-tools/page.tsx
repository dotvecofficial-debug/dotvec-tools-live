import type { Metadata } from 'next';
import { metadataForPage } from '@/lib/seo';
import { ToolDirectory } from '@/components/ToolDirectory';
import { getEffectiveTools } from '@/lib/overrides';
import { PageSchema } from '@/components/PageSchema';

export async function generateMetadata():Promise<Metadata>{return metadataForPage('image-tools','Image Tools','Compress, resize, crop, convert and enhance images locally in your browser.','/image-tools');}
export default async function Page(){const tools=(await getEffectiveTools()).filter(t=>t.category==='image');return <main><PageSchema pageKey="image-tools"/><section className="page-hero"><div className="container"><span className="eyebrow">Image Tools</span><h1>Image Tools</h1><p className="section-copy">Compress, resize, crop, convert and enhance images locally in your browser.</p></div></section><section className="section-sm"><div className="container"><ToolDirectory tools={tools} initialCategory="image"/></div></section></main>}
