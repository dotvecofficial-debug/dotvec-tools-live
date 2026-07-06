import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { readStore } from '@/lib/store';
import { makeMetadata, parseSchema } from '@/lib/seo';

export const dynamic = 'force-dynamic';
const options = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img','h1','h2','h3','figure','figcaption','details','summary','section']),
  allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img:['src','alt','title','width','height','loading'], a:['href','name','target','rel'], section:['class'], details:['class'] },
  allowedSchemes: ['http','https','mailto'],
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const store = await readStore();
  const post = store.posts.find((item) => item.slug === slug && item.status === 'published');
  if (!post) return {};
  return makeMetadata({
    fields: post,
    global: store.settings.seo,
    title: post.seoTitle || post.title,
    description: post.metaDescription || post.excerpt,
    canonical: post.canonicalUrl || `/blog/${post.slug}`,
    image: post.openGraphImage || post.coverImage,
    type: 'article',
  });
}

export default async function Article({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await readStore();
  const post = store.posts.find((item) => item.slug === slug && item.status === 'published');
  if (!post) notFound();
  const source = post.contentFormat === 'html' || /^\s*</.test(post.content) ? post.content : await marked.parse(post.content);
  const html = sanitizeHtml(source, options);
  const schema = parseSchema(post.schemaJson) || {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.metaDescription || post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { '@type': 'Person', name: post.author },
    mainEntityOfPage: `${store.settings.canonicalDomain.replace(/\/$/, '')}/blog/${post.slug}`,
    ...(post.coverImage ? { image: post.coverImage } : {}),
  };
  const faqSchema = post.faqs?.length ? { '@context':'https://schema.org','@type':'FAQPage',mainEntity:post.faqs.map((faq) => ({ '@type':'Question',name:faq.question,acceptedAnswer:{ '@type':'Answer',text:faq.answer } })) } : null;

  return <main><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}/>{faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, '\\u003c') }}/>}<section className="page-hero blog-article-hero"><div className="reading"><span className="eyebrow">{post.category}</span><h1>{post.title}</h1><p className="section-copy">{post.excerpt}</p><p className="help">By {post.author} · {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ''}</p>{post.coverImage && <img className="article-cover" src={post.coverImage} alt={post.coverAlt || post.title}/>}</div></section><section className="section-sm"><article className="reading article" dangerouslySetInnerHTML={{ __html: html }}/></section>{post.faqs?.length ? <section className="section-sm"><div className="reading"><h2 className="section-title">Frequently asked questions</h2><div className="faq card" style={{ padding:'4px 24px', marginTop:20 }}>{post.faqs.map((faq,index) => <details key={index}><summary>{faq.question}<span>+</span></summary><p>{faq.answer}</p></details>)}</div></div></section> : null}</main>;
}
