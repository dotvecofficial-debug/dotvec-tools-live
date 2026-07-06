import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  FileImage,
  FileText,
  Gift,
  Image as ImageIcon,
  MonitorSmartphone,
  Play,
  Scissors,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Zap,
} from 'lucide-react';
import { ToolCard } from '@/components/ToolCard';
import { categories, categoryPath, type ToolCategory } from '@/lib/tools';
import { getEffectiveTools } from '@/lib/overrides';
import { readStore, type HomeSectionId } from '@/lib/store';
import { makeMetadata, parseSchema } from '@/lib/seo';

const heroTiles = [
  { Icon: ImageIcon, className: 'hero-tile tile-blue' },
  { Icon: FileText, className: 'hero-tile tile-red' },
  { Icon: Scissors, className: 'hero-tile tile-purple' },
  { Icon: FileImage, className: 'hero-tile tile-cyan' },
  { Icon: UploadCloud, className: 'hero-tile tile-orange' },
  { Icon: Play, className: 'hero-tile tile-green' },
];

const sectionDefaults: HomeSectionId[] = ['hero', 'stats', 'popular', 'why', 'categories', 'privacy', 'how', 'blog', 'faq'];

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await readStore();
  return makeMetadata({
    fields: settings.home,
    global: settings.seo,
    title: settings.home.seoTitle || settings.seo.defaultTitle,
    description: settings.home.metaDescription || settings.seo.defaultDescription,
    canonical: settings.home.canonicalUrl || '/',
    image: settings.home.openGraphImage || settings.seo.defaultOgImage,
  });
}

export default async function Home() {
  const [store, allTools] = await Promise.all([readStore(), getEffectiveTools()]);
  const home = store.settings.home;
  const activeTools = allTools.filter((tool) => tool.status === 'active');
  const popular = activeTools.filter((tool) => tool.popular).slice(0, home.popularLimit || 8);
  const posts = store.posts.filter((post) => post.status === 'published').slice(0, home.blogLimit || 3);
  const homepageSchema = parseSchema(home.schemaJson) || {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: store.settings.siteName,
    url: store.settings.canonicalDomain,
    description: home.metaDescription || home.heroDescription,
  };

  const categoryMap = new Map(categories.map((category) => [category.slug, category]));
  const categoryCards = [...home.categoryCards]
    .filter((item) => item.visible && categoryMap.has(item.slug as ToolCategory))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const sectionOrder = [...home.sectionOrder, ...sectionDefaults.filter((id) => !home.sectionOrder.includes(id))];

  const sections: Record<HomeSectionId, React.ReactNode> = {
    hero: <section className="hero landing-hero" key="hero">
      <div className={`container landing-hero-grid ${home.heroShowVisual ? '' : 'hero-without-visual'}`}>
        <div className="landing-hero-copy">
          {home.heroBadge && <span className="eyebrow">{home.heroBadge}</span>}
          <h1>{home.heroTitle} {home.heroAccent && <span className="gradient-text">{home.heroAccent}</span>}</h1>
          {home.heroDescription && <p>{home.heroShowActiveToolCount ? `${activeTools.length}+ ` : ''}{home.heroDescription}</p>}
          <div className="hero-actions hero-actions-left">
            {home.primaryButtonText && <Link className="btn btn-primary" href={home.primaryButtonUrl || '/all-tools'}>{home.primaryButtonText} <ArrowRight size={18}/></Link>}
            {home.secondaryButtonText && <Link className="btn btn-secondary" href={home.secondaryButtonUrl || '#how-it-works'}><Play size={17}/> {home.secondaryButtonText}</Link>}
          </div>
        </div>

        {home.heroShowVisual && <div className="hero-visual" aria-hidden="true">
          <div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/>
          <div className="hero-app-card"><div className="hero-app-search"><span>Search tools...</span><span>⌕</span></div><div className="hero-app-grid">{heroTiles.map(({ Icon, className }, index) => <span className={className} key={index}><Icon size={25}/></span>)}</div></div>
          <span className="floating-tool floating-one"><ImageIcon size={24}/></span><span className="floating-tool floating-two"><Scissors size={24}/></span><span className="floating-tool floating-three"><Play size={24}/></span><span className="floating-spark spark-one">✦</span><span className="floating-spark spark-two">✦</span>
        </div>}
      </div>
    </section>,

    stats: <section className="stats-section" key="stats"><div className="container stats-grid">{home.stats.map((stat,index) => { const icons=[Sparkles,FileText,Zap,Gift]; const Icon=icons[index % icons.length] || Sparkles; const classes=['icon-purple','icon-blue','icon-orange','icon-pink']; return <div className="stat-card" key={`${stat.label}-${index}`}><span className={`stat-icon ${classes[index % classes.length]}`}><Icon size={22}/></span><div><strong>{stat.value}</strong><span>{stat.label}</span></div></div>; })}</div></section>,

    popular: <section className="section popular-section" key="popular"><div className="container"><div className="section-heading-row"><div><h2 className="section-title compact-title">{home.popularTitle}</h2>{home.popularDescription && <p className="section-copy compact-copy">{home.popularDescription}</p>}</div>{home.popularViewAllText && <Link className="text-action" href={home.popularViewAllUrl || '/all-tools'}>{home.popularViewAllText} <ArrowRight size={16}/></Link>}</div><div className="tool-grid" style={{ marginTop: 26 }}>{popular.map((tool) => <ToolCard key={tool.slug} tool={tool}/>)}</div>{!popular.length && <div className="notice" style={{ marginTop: 24 }}>No tools are currently marked as popular. Use Admin → Tools & Pages to mark tools as popular.</div>}</div></section>,

    why: <section className="section why-section" key="why"><div className="container"><h2 className="section-title compact-title">{home.whyTitle}</h2>{home.whyDescription && <p className="section-copy compact-copy">{home.whyDescription}</p>}<div className="why-grid">{home.whyItems.map((item,index) => { const icons=[ShieldCheck,Zap,MonitorSmartphone,Gift]; const Icon=icons[index % icons.length] || ShieldCheck; const classes=['icon-purple','icon-orange','icon-cyan','icon-green']; return <div className="why-item" key={`${item.title}-${index}`}><span className={`why-icon ${classes[index % classes.length]}`}><Icon size={21}/></span><div><h3>{item.title}</h3><p>{item.description}</p></div></div>; })}</div></div></section>,

    categories: <section className="section categories-section" key="categories"><div className="container"><h2 className="section-title">{home.categoriesTitle}</h2>{home.categoriesDescription && <p className="section-copy">{home.categoriesDescription}</p>}<div className="grid grid-4" style={{ marginTop: 30 }}>{categoryCards.map((item) => { const category=categoryMap.get(item.slug as ToolCategory)!; return <Link href={categoryPath(category.slug)} key={item.slug} className="card category-card"><div className="tool-icon"><UploadCloud size={23}/></div><h3>{item.title || category.title}</h3><p>{(item.description || '{count} available tools').replaceAll('{count}', String(activeTools.filter((tool) => tool.category === category.slug).length))}</p><span className="text-action">{item.buttonText || 'Explore category'} <ArrowRight size={15}/></span></Link>; })}</div></div></section>,

    privacy: <section className="section" key="privacy"><div className="container"><div className="privacy-panel grid grid-2"><div style={{ minHeight: 300, display: 'grid', placeItems: 'center' }}><div className="card privacy-demo-card"><ShieldCheck size={64} color="var(--primary)" style={{ margin: 'auto' }}/><h3>Your device does the work</h3><p className="muted">Canvas, Web Crypto, PDF libraries and OCR workers run inside your browser.</p></div></div><div style={{ alignSelf: 'center' }}>{home.privacyBadge && <span className="eyebrow">{home.privacyBadge}</span>}<h2 className="section-title">{home.privacyTitle}</h2>{home.privacyDescription && <p className="section-copy">{home.privacyDescription}</p>}<div className="grid" style={{ marginTop: 24 }}>{home.privacyItems.map((item,index) => <div className="trust-item" key={`${item}-${index}`}><Check size={18} color="var(--success)"/>{item}</div>)}</div></div></div></div></section>,

    how: <section className="section how-section" id="how-it-works" key="how"><div className="container"><h2 className="section-title">{home.howTitle}</h2>{home.howDescription && <p className="section-copy">{home.howDescription}</p>}<div className="grid grid-3" style={{ marginTop: 28 }}>{home.howSteps.map((step,index) => <div className="card step" key={`${step.number}-${index}`}><span className="step-number">{step.number || String(index + 1)}</span><h3>{step.title}</h3><p className="muted">{step.description}</p></div>)}</div></div></section>,

    blog: <section className="section" key="blog"><div className="container"><div className="section-heading-row"><div><h2 className="section-title">{home.blogTitle}</h2>{home.blogDescription && <p className="section-copy">{home.blogDescription}</p>}</div>{home.blogViewAllText && <Link className="btn btn-secondary" href={home.blogViewAllUrl || '/blog'}>{home.blogViewAllText}</Link>}</div><div className="grid grid-3" style={{ marginTop: 28 }}>{posts.map((post) => <Link className="card blog-card" key={post.id} href={`/blog/${post.slug}`}><div className="blog-cover"><Sparkles size={38}/></div><div className="blog-body"><span className="badge">{post.category}</span><h3>{post.title}</h3><p className="muted">{post.excerpt}</p></div></Link>)}</div>{!posts.length && <div className="notice" style={{ marginTop: 24 }}>No published blog posts are available yet.</div>}</div></section>,

    faq: <section className="section" key="faq"><div className="reading"><h2 className="section-title">{home.faqTitle}</h2>{home.faqDescription && <p className="section-copy">{home.faqDescription}</p>}<div className="faq card" style={{ padding: '4px 24px', marginTop: 24 }}>{home.faqs.map((faq,index) => <details key={`${faq.question}-${index}`}><summary>{faq.question}<span>+</span></summary><p>{faq.answer}</p></details>)}</div></div></section>,
  };

  return <main>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageSchema).replace(/</g, '\\u003c') }}/>
    {sectionOrder.filter((id, index, list) => list.indexOf(id) === index && home.sectionVisibility[id] !== false).map((id) => sections[id])}
  </main>;
}
