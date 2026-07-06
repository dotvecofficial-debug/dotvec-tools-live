import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import sanitizeHtml from 'sanitize-html';
import { ChevronRight, Sparkles } from 'lucide-react';
import { getEffectiveTool, getEffectiveTools } from '@/lib/overrides';
import { readStore } from '@/lib/store';
import { makeMetadata, parseSchema } from '@/lib/seo';
import { categoryPath } from '@/lib/tools';
import { ToolClient } from '@/components/tools/ToolClient';
import { ToolCard } from '@/components/ToolCard';
import { ToolRunnerCustomization } from '@/components/tools/ToolRunnerCustomization';

export const dynamic='force-dynamic';

function clean(value?:string){
  if(!value)return '';
  return sanitizeHtml(value,{allowedTags:['p','h1','h2','h3','h4','strong','b','em','i','u','ul','ol','li','a','blockquote','code','pre','br','hr','span','div'],allowedAttributes:{a:['href','target','rel'],span:['class'],div:['class']},allowedSchemes:['http','https','mailto']});
}

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params;const [tool,store]=await Promise.all([getEffectiveTool(slug),readStore()]);if(!tool)return{};
  return makeMetadata({fields:{...tool,robotsIndex:tool.status==='disabled'||tool.status==='coming-soon'?false:(tool.robotsIndex??true)},global:store.settings.seo,title:tool.seoTitle||tool.defaultSeoTitle,description:tool.metaDescription||tool.defaultMetaDescription,canonical:tool.canonicalUrl||`/tools/${tool.slug}`,image:tool.openGraphImage,type:'website'});
}

export default async function ToolPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;const tool=await getEffectiveTool(slug);if(!tool)notFound();
  const [all,store]=await Promise.all([getEffectiveTools(),readStore()]);const related=all.filter(t=>t.category===tool.category&&t.slug!==tool.slug&&t.status!=='disabled').slice(0,4);
  const faqs=tool.faqs?.length?tool.faqs:tool.defaultFaqs;
  const howTo=clean(tool.howToHtml);
  const features=clean(tool.featuresHtml);
  const limitations=clean(tool.limitationsHtml);
  const schema=parseSchema(tool.schemaJson)||{'@context':'https://schema.org','@type':'SoftwareApplication',name:tool.title,description:tool.metaDescription||tool.defaultMetaDescription,applicationCategory:'UtilitiesApplication',operatingSystem:'Web',url:`${store.settings.canonicalDomain.replace(/\/$/,'')}/tools/${tool.slug}`,offers:{'@type':'Offer',price:'0',priceCurrency:'USD'}};
  const faqSchema=faqs?.length?{'@context':'https://schema.org','@type':'FAQPage',mainEntity:faqs.map(faq=>({'@type':'Question',name:faq.question,acceptedAnswer:{'@type':'Answer',text:faq.answer}}))}:null;
  return <main className="tool-public-page" data-tool-slug={tool.slug}><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,'\\u003c')}}/>{faqSchema&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(faqSchema).replace(/</g,'\\u003c')}}/>}
    <section className="page-hero"><div className="container">
      <div className="breadcrumbs"><Link href="/">Home</Link><ChevronRight size={14}/><Link href={categoryPath(tool.category)}>{tool.categoryLabel}</Link><ChevronRight size={14}/><span>{tool.title}</span></div>
      <span className="eyebrow" style={{marginTop:20}}><Sparkles size={14}/>Free online utility</span>
      <h1>{tool.title}</h1><p className="section-copy">{tool.fullDescription||tool.shortDescription}</p>
    </div></section>
    <section className="section-sm"><div className="container"><ToolRunnerCustomization label={tool.actionButtonText} color={tool.actionButtonColor} resetButtonText={tool.resetButtonText} processingButtonText={tool.processingButtonText} resultTitle={tool.resultTitle} resultEmptyText={tool.resultEmptyText} resultSuccessText={tool.resultSuccessText} privacyMessage={tool.privacyMessage}><ToolClient tool={tool}/></ToolRunnerCustomization></div></section>
    <section className="section"><div className="container tool-content-grid">
      <article className="card tool-content-card"><h2>How to use {tool.title}</h2>{howTo?<div className="article" dangerouslySetInnerHTML={{__html:howTo}}/>:<ol><li>Add the required file or content.</li><li>Adjust the available settings.</li><li>Process the input and review the result.</li><li>Download or copy the output.</li></ol>}</article>
      <aside className="privacy-panel"><h3>Privacy and limitations</h3><p>{tool.privacyMessage}</p>{limitations?<div className="article" dangerouslySetInnerHTML={{__html:limitations}}/>:<p className="muted">Maximum configured file size: {tool.maximumFileSize} MB. Performance depends on the device, file complexity and required VPS binaries.</p>}</aside>
    </div></section>
    {features&&<section className="section-sm"><div className="container"><div className="card tool-content-card"><h2>Features</h2><div className="article" dangerouslySetInnerHTML={{__html:features}}/></div></div></section>}
    {faqs?.length?<section className="section"><div className="reading"><h2 className="section-title">Frequently asked questions</h2><div className="faq card" style={{padding:'4px 24px',marginTop:24}}>{faqs.map((faq,index)=><details key={`${faq.question}-${index}`}><summary>{faq.question}<span>+</span></summary><p>{faq.answer}</p></details>)}</div></div></section>:null}
    <section className="section related-section"><div className="container"><h2 className="section-title">Related tools</h2><div className="tool-grid" style={{marginTop:24}}>{related.map(t=><ToolCard key={t.slug} tool={t}/>)}</div></div></section>
  </main>;
}
