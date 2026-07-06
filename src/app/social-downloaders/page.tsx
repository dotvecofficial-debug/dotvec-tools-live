import type { Metadata } from 'next';
import { metadataForPage } from '@/lib/seo';
import { ToolDirectory } from '@/components/ToolDirectory';
import { getEffectiveTools } from '@/lib/overrides';
import { PageSchema } from '@/components/PageSchema';

export async function generateMetadata():Promise<Metadata>{return metadataForPage('social-downloaders','Social Media Downloaders','Self-hosted downloaders for accessible public media using yt-dlp and FFmpeg without a paid downloader API.','/social-downloaders');}
export default async function Page(){const tools=(await getEffectiveTools()).filter(t=>t.category==='social');return <main><PageSchema pageKey="social-downloaders"/><section className="page-hero"><div className="container"><span className="eyebrow">Self-hosted · No paid API</span><h1>Social Media Downloaders</h1><p className="section-copy">Download accessible public media with yt-dlp and FFmpeg on your VPS. Use these tools only for content you own or have permission to save.</p></div></section><section className="section-sm"><div className="container"><div className="status" style={{marginBottom:20}}>Private, DRM-protected and inaccessible media is not bypassed. Some platforms require an administrator-configured cookies file.</div><ToolDirectory tools={tools} initialCategory="social"/></div></section></main>}
