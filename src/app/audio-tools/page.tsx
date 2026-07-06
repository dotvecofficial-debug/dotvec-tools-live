import type { Metadata } from 'next';
import { metadataForPage } from '@/lib/seo';
import { ToolDirectory } from '@/components/ToolDirectory';
import { getEffectiveTools } from '@/lib/overrides';
import { PageSchema } from '@/components/PageSchema';

export async function generateMetadata():Promise<Metadata>{return metadataForPage('audio-tools','Audio Tools','Self-hosted audio conversion, trimming, merging and effects tools.','/audio-tools');}
export default async function Page(){const tools=(await getEffectiveTools()).filter(t=>t.category==='audio');return <main><PageSchema pageKey="audio-tools"/><section className="page-hero"><div className="container"><span className="eyebrow">Audio Tools</span><h1>Audio Tools</h1><p className="section-copy">Convert, trim, merge, compress and enhance audio with FFmpeg on your VPS.</p></div></section><section className="section-sm"><div className="container"><ToolDirectory tools={tools} initialCategory="audio"/></div></section></main>}
