import type { Metadata } from 'next';
import { metadataForPage } from '@/lib/seo';
import { ToolDirectory } from '@/components/ToolDirectory';
import { getEffectiveTools } from '@/lib/overrides';
import { PageSchema } from '@/components/PageSchema';

export async function generateMetadata():Promise<Metadata>{return metadataForPage('video-tools','Video Tools','Self-hosted video compression, conversion, trimming, resizing and editing tools.','/video-tools');}
export default async function Page(){const tools=(await getEffectiveTools()).filter(t=>t.category==='video');return <main><PageSchema pageKey="video-tools"/><section className="page-hero"><div className="container"><span className="eyebrow">Video Tools</span><h1>Video Tools</h1><p className="section-copy">Compress, convert, trim, resize and edit video files with FFmpeg on your VPS.</p></div></section><section className="section-sm"><div className="container"><ToolDirectory tools={tools} initialCategory="video"/></div></section></main>}
