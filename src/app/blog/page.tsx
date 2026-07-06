import type { Metadata } from 'next';
import { metadataForPage } from '@/lib/seo';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { readStore } from '@/lib/store';
import { PageSchema } from '@/components/PageSchema';

export async function generateMetadata():Promise<Metadata>{return metadataForPage('blog','Dotvec Tools Blog','Guides for online tools, file privacy, PDFs, images and SEO.','/blog');}
export default async function Blog(){const posts=(await readStore()).posts.filter(p=>p.status==='published');return <main><PageSchema pageKey="blog"/><section className="page-hero"><div className="container"><span className="eyebrow">Resources</span><h1>Dotvec Tools Blog</h1><p className="section-copy">Practical guides for files, privacy, SEO and online productivity.</p></div></section><section className="section-sm"><div className="container"><div className="grid grid-3">{posts.map(p=><Link className="card blog-card" key={p.id} href={`/blog/${p.slug}`}><div className="blog-cover"><Sparkles size={38}/></div><div className="blog-body"><span className="badge">{p.category}</span><h2 style={{fontSize:22}}>{p.title}</h2><p className="muted">{p.excerpt}</p><span className="help">{p.author} · {p.publishedAt?new Date(p.publishedAt).toLocaleDateString():''}</span></div></Link>)}</div></div></section></main>}
