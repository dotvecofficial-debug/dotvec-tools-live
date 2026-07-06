'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Eye, Plus, Save, Search, Trash2 } from 'lucide-react';
import type { ToolDefinition, ToolStatus } from '@/lib/tools';
import type { FaqItem } from '@/lib/store';
import { CmsRichEditor } from './CmsRichEditor';
import { errorMessage, requestJson } from '@/lib/client-api';

type EditableTool=ToolDefinition;

export function AdminToolsClient({initial}:{initial:ToolDefinition[]}){
  const [tools,setTools]=useState(initial);const [selected,setSelected]=useState(initial[0]?.slug||'');const [draft,setDraft]=useState<EditableTool|undefined>(initial[0]);const [query,setQuery]=useState('');const [message,setMessage]=useState('');const [saving,setSaving]=useState(false);
  const filtered=useMemo(()=>tools.filter(tool=>`${tool.title} ${tool.slug} ${tool.categoryLabel}`.toLowerCase().includes(query.toLowerCase())),[tools,query]);
  function select(slug:string){const tool=tools.find(item=>item.slug===slug);setSelected(slug);setDraft(tool?{...tool,faqs:tool.faqs||tool.defaultFaqs||[]}:undefined);setMessage('');}
  function set<K extends keyof EditableTool>(key:K,value:EditableTool[K]){setDraft(current=>current?{...current,[key]:value}:current);}
  async function save() {
    if (!draft || saving) return;

    setSaving(true);
    setMessage('Saving…');

    const patch = {
      status: draft.status,
      title: draft.title,
      shortDescription: draft.shortDescription,
      fullDescription: draft.fullDescription,
      seoTitle: draft.seoTitle || draft.defaultSeoTitle,
      metaDescription: draft.metaDescription || draft.defaultMetaDescription,
      metaKeywords: draft.metaKeywords || '',
      canonicalUrl: draft.canonicalUrl || '',
      openGraphTitle: draft.openGraphTitle || '',
      openGraphDescription: draft.openGraphDescription || '',
      openGraphImage: draft.openGraphImage || '',
      openGraphType: draft.openGraphType || 'website',
      twitterCard: draft.twitterCard || 'summary_large_image',
      twitterTitle: draft.twitterTitle || '',
      twitterDescription: draft.twitterDescription || '',
      twitterImage: draft.twitterImage || '',
      robotsIndex: draft.robotsIndex ?? true,
      robotsFollow: draft.robotsFollow ?? true,
      schemaJson: draft.schemaJson || '',
      featured: draft.featured,
      popular: draft.popular,
      maintenanceMessage: draft.maintenanceMessage || '',
      maximumFileSize: draft.maximumFileSize,
      privacyMessage: draft.privacyMessage,
      howToHtml: draft.howToHtml || '',
      featuresHtml: draft.featuresHtml || '',
      limitationsHtml: draft.limitationsHtml || '',
      faqs: draft.faqs || [],
      cardButtonText: draft.cardButtonText || 'Get Started',
      cardButtonColor: draft.cardButtonColor || '',
      actionButtonText: draft.actionButtonText || '',
      actionButtonColor: draft.actionButtonColor || '',
      resetButtonText: draft.resetButtonText || 'Reset',
      processingButtonText: draft.processingButtonText || '',
      resultTitle: draft.resultTitle || '',
      resultEmptyText: draft.resultEmptyText || '',
      resultSuccessText: draft.resultSuccessText || '',
    };

    try {
      await requestJson<{ ok: true; saved: typeof patch }>('/api/admin/tools', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug: draft.slug, patch }),
      });

      setTools((current) => current.map((tool) => tool.slug === draft.slug ? { ...tool, ...patch } : tool));
      setDraft((current) => current ? { ...current, ...patch } : current);
      setMessage('Tool page updated successfully.');
    } catch (error) {
      setMessage(errorMessage(error, 'Tool settings could not be saved.'));
    } finally {
      setSaving(false);
    }
  }
  function addFaq(){set('faqs',[...(draft?.faqs||[]),{question:'',answer:''}]);}
  function updateFaq(index:number,patch:Partial<FaqItem>){set('faqs',(draft?.faqs||[]).map((faq,i)=>i===index?{...faq,...patch}:faq));}
  function removeFaq(index:number){set('faqs',(draft?.faqs||[]).filter((_,i)=>i!==index));}

  return <div className="cms-page"><section className="admin-hero"><div><span>Tool Manager</span><h1>Customize every tool page</h1><p>Edit tool content, SEO, FAQs, card CTA, main action button color and maintenance status.</p></div>{draft&&<Link href={`/tools/${draft.slug}`} target="_blank" className="cms-btn secondary"><Eye size={17}/>Live Preview</Link>}</section>
    <div className="cms-tool-manager"><aside className="cms-panel cms-tool-sidebar"><div className="cms-sidebar-search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search tools…"/></div><div className="cms-tool-list">{filtered.map(tool=><button key={tool.slug} className={selected===tool.slug?'active':''} onClick={()=>select(tool.slug)}><span><b>{tool.title}</b><small>{tool.categoryLabel}</small></span><span className={`cms-status-dot ${tool.status}`}/></button>)}</div></aside>
      {draft?<section className="cms-panel cms-tool-editor"><div className="cms-editor-heading"><div><h2>{draft.title}</h2><p className="muted">/{draft.slug}</p></div><button className="cms-btn" disabled={saving} onClick={save}><Save size={17}/>{saving?'Saving…':'Save Changes'}</button></div>
        <div className="grid grid-2"><Field label="Tool title" value={draft.title} onChange={value=>set('title',value)}/><div className="field"><label className="label">Status</label><select className="select" value={draft.status} onChange={e=>set('status',e.target.value as ToolStatus)}><option value="active">Active</option><option value="maintenance">Maintenance</option><option value="disabled">Disabled</option><option value="coming-soon">Coming soon</option></select></div></div>
        <Field label="Short card description" value={draft.shortDescription} onChange={value=>set('shortDescription',value)} area/><Field label="Full tool page description" value={draft.fullDescription} onChange={value=>set('fullDescription',value)} area/>
        <div className="grid grid-2"><Field label="Card button text" value={draft.cardButtonText||'Get Started'} onChange={value=>set('cardButtonText',value)}/><ColorField label="Card button color" value={draft.cardButtonColor||'#6366f1'} onChange={value=>set('cardButtonColor',value)}/><Field label="Main action button text" value={draft.actionButtonText||''} onChange={value=>set('actionButtonText',value)} placeholder="Example: Convert file"/><ColorField label="Main action button color" value={draft.actionButtonColor||'#6366f1'} onChange={value=>set('actionButtonColor',value)}/><Field label="Processing button text" value={draft.processingButtonText||''} onChange={value=>set('processingButtonText',value)} placeholder="Example: Converting…"/><Field label="Reset button text" value={draft.resetButtonText||'Reset'} onChange={value=>set('resetButtonText',value)}/></div><div className="cms-subheading"><h3>Result section text</h3><span className="help">These labels apply to this individual tool page.</span></div><div className="grid grid-2"><Field label="Result section heading" value={draft.resultTitle||''} onChange={value=>set('resultTitle',value)} placeholder="Example: Conversion result"/><Field label="Empty result message" value={draft.resultEmptyText||''} onChange={value=>set('resultEmptyText',value)} placeholder="Shown before processing"/><Field label="Success message" value={draft.resultSuccessText||''} onChange={value=>set('resultSuccessText',value)} placeholder="Shown after successful processing" area/></div>
        <div className="grid grid-2"><div className="field"><label className="label">Maximum file size (MB)</label><input className="input" type="number" value={draft.maximumFileSize} onChange={e=>set('maximumFileSize',Number(e.target.value))}/></div><Field label="Maintenance message" value={draft.maintenanceMessage||''} onChange={value=>set('maintenanceMessage',value)}/></div>
        <div className="cms-check-row"><label><input type="checkbox" checked={draft.popular} onChange={e=>set('popular',e.target.checked)}/> Popular tool</label><label><input type="checkbox" checked={draft.featured} onChange={e=>set('featured',e.target.checked)}/> Featured tool</label></div>
        <div className="field"><label className="label">How to use content</label><CmsRichEditor value={draft.howToHtml||''} onChange={value=>set('howToHtml',value)}/></div><div className="field"><label className="label">Features content</label><CmsRichEditor value={draft.featuresHtml||''} onChange={value=>set('featuresHtml',value)}/></div><div className="field"><label className="label">Limitations content</label><CmsRichEditor value={draft.limitationsHtml||''} onChange={value=>set('limitationsHtml',value)}/></div>
        <Field label="Privacy message" value={draft.privacyMessage} onChange={value=>set('privacyMessage',value)} area/>
        <div className="cms-subheading"><h3>Tool FAQs</h3><button className="btn btn-secondary btn-sm" onClick={addFaq}><Plus size={15}/>Add FAQ</button></div>{(draft.faqs||[]).map((faq,index)=><div className="cms-faq-row" key={index}><input className="input" value={faq.question} onChange={e=>updateFaq(index,{question:e.target.value})} placeholder="FAQ question"/><textarea className="textarea" value={faq.answer} onChange={e=>updateFaq(index,{answer:e.target.value})} placeholder="FAQ answer"/><button className="icon-btn" onClick={()=>removeFaq(index)}><Trash2 size={17}/></button></div>)}
        <div className="cms-seo-grid"><div className="cms-subheading"><h3>Complete page SEO</h3><span className="help">Search, Open Graph, Twitter, robots and schema</span></div><div className="grid grid-2"><Field label="SEO title" value={draft.seoTitle||draft.defaultSeoTitle} onChange={value=>set('seoTitle',value)}/><Field label="Meta keywords" value={draft.metaKeywords||''} onChange={value=>set('metaKeywords',value)}/><Field label="Meta description" value={draft.metaDescription||draft.defaultMetaDescription} onChange={value=>set('metaDescription',value)} area/><Field label="Canonical URL" value={draft.canonicalUrl||''} onChange={value=>set('canonicalUrl',value)}/><Field label="Open Graph title" value={draft.openGraphTitle||''} onChange={value=>set('openGraphTitle',value)}/><Field label="Open Graph image" value={draft.openGraphImage||''} onChange={value=>set('openGraphImage',value)}/><Field label="Open Graph description" value={draft.openGraphDescription||''} onChange={value=>set('openGraphDescription',value)} area/><div className="field"><label className="label">Twitter card</label><select className="select" value={draft.twitterCard||'summary_large_image'} onChange={e=>set('twitterCard',e.target.value as 'summary'|'summary_large_image')}><option value="summary_large_image">Summary large image</option><option value="summary">Summary</option></select></div><Field label="Twitter title" value={draft.twitterTitle||''} onChange={value=>set('twitterTitle',value)}/><Field label="Twitter image" value={draft.twitterImage||''} onChange={value=>set('twitterImage',value)}/><Field label="Twitter description" value={draft.twitterDescription||''} onChange={value=>set('twitterDescription',value)} area/></div><div className="cms-check-row"><label><input type="checkbox" checked={draft.robotsIndex??true} onChange={e=>set('robotsIndex',e.target.checked)}/>Index this tool page</label><label><input type="checkbox" checked={draft.robotsFollow??true} onChange={e=>set('robotsFollow',e.target.checked)}/>Follow links</label></div><Field label="Custom schema JSON-LD" value={draft.schemaJson||''} onChange={value=>set('schemaJson',value)} area/></div>{message&&<div className={`status ${message.includes('successfully')?'success':''}`}>{message}</div>}
      </section>:<div className="cms-panel">Select a tool.</div>}
    </div>
  </div>;
}
function Field({label,value,onChange,area=false,placeholder}:{label:string;value:string;onChange:(value:string)=>void;area?:boolean;placeholder?:string}){return <div className="field"><label className="label">{label}</label>{area?<textarea className="textarea" value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)}/>:<input className="input" value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)}/>}</div>}
function ColorField({label,value,onChange}:{label:string;value:string;onChange:(value:string)=>void}){return <div className="field"><label className="label">{label}</label><div className="cms-color-field"><input className="input" value={value} onChange={e=>onChange(e.target.value)}/><input type="color" value={/^#[0-9a-f]{6}$/i.test(value)?value:'#6366f1'} onChange={e=>onChange(e.target.value)}/></div></div>}
