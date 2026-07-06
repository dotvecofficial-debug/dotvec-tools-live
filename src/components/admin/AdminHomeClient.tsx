'use client';

import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { errorMessage, requestJson } from '@/lib/client-api';
import type {
  FaqItem,
  HomeCategoryCard,
  HomeFeatureItem,
  HomeSectionId,
  HomeSettings,
  HomeStepItem,
  SiteSettings,
} from '@/lib/store';

const sectionLabels: Record<HomeSectionId, string> = {
  hero: 'Hero',
  stats: 'Statistics',
  popular: 'Popular Tools',
  why: 'Why Choose Us',
  categories: 'Categories',
  privacy: 'Privacy',
  how: 'How It Works',
  blog: 'Latest Blog Posts',
  faq: 'FAQs',
};

export function AdminHomeClient({ initial }: { initial: SiteSettings }) {
  const [settings, setSettings] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const home = settings.home;

  function setHome<K extends keyof HomeSettings>(key: K, value: HomeSettings[K]) {
    setSettings((current) => ({ ...current, home: { ...current.home, [key]: value } }));
  }

  function updateFaq(index: number, patch: Partial<FaqItem>) {
    setHome('faqs', home.faqs.map((faq, itemIndex) => itemIndex === index ? { ...faq, ...patch } : faq));
  }

  function updateStat(index: number, key: 'label' | 'value', value: string) {
    setHome('stats', home.stats.map((stat, itemIndex) => itemIndex === index ? { ...stat, [key]: value } : stat));
  }

  function updateWhy(index: number, patch: Partial<HomeFeatureItem>) {
    setHome('whyItems', home.whyItems.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  function updateStep(index: number, patch: Partial<HomeStepItem>) {
    setHome('howSteps', home.howSteps.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  function updateCategory(index: number, patch: Partial<HomeCategoryCard>) {
    setHome('categoryCards', home.categoryCards.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  function updatePrivacy(index: number, value: string) {
    setHome('privacyItems', home.privacyItems.map((item, itemIndex) => itemIndex === index ? value : item));
  }

  function moveSection(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= home.sectionOrder.length) return;
    const next = [...home.sectionOrder];
    [next[index], next[target]] = [next[target], next[index]];
    setHome('sectionOrder', next);
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    setMessage('Saving…');
    try {
      const data = await requestJson<SiteSettings>('/api/admin/settings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(settings),
      });
      setSettings(data);
      setMessage('Homepage saved successfully. Refresh the public homepage to see every change.');
    } catch (error) {
      setMessage(errorMessage(error, 'Homepage settings could not be saved.'));
    } finally {
      setSaving(false);
    }
  }

  return <div className="cms-page">
    <section className="admin-hero">
      <div><span>Full Homepage Builder</span><h1>Edit every homepage section</h1><p>Edit all text, buttons, cards, lists, visibility and section order from one screen.</p></div>
      <button className="cms-btn" onClick={save} disabled={saving}><Save size={17}/>{saving ? 'Saving…' : 'Save Homepage'}</button>
    </section>

    <section className="cms-panel cms-full-panel">
      <div className="cms-subheading"><div><h2>Section visibility and order</h2><p className="muted">Hide any homepage component or move it up and down. Changes apply after saving.</p></div></div>
      <div className="home-section-manager">
        {home.sectionOrder.map((section, index) => <div className="home-section-row" key={section}>
          <label className="cms-checkbox"><input type="checkbox" checked={home.sectionVisibility[section] !== false} onChange={(event) => setHome('sectionVisibility', { ...home.sectionVisibility, [section]: event.target.checked })}/><b>{sectionLabels[section]}</b></label>
          <div className="action-row"><button className="icon-btn" disabled={index === 0} onClick={() => moveSection(index, -1)} aria-label={`Move ${sectionLabels[section]} up`}><ArrowUp size={16}/></button><button className="icon-btn" disabled={index === home.sectionOrder.length - 1} onClick={() => moveSection(index, 1)} aria-label={`Move ${sectionLabels[section]} down`}><ArrowDown size={16}/></button></div>
        </div>)}
      </div>
    </section>

    <div className="home-editor-stack">
      <details className="cms-panel cms-edit-section" open>
        <summary><span>Hero section</span><small>Badge, complete content, buttons and visual</small></summary>
        <div className="cms-edit-section-body">
          <Field label="Hero badge" value={home.heroBadge} set={(value) => setHome('heroBadge', value)}/>
          <div className="grid grid-2"><Field label="Main heading" value={home.heroTitle} set={(value) => setHome('heroTitle', value)}/><Field label="Gradient heading" value={home.heroAccent} set={(value) => setHome('heroAccent', value)}/></div>
          <Field label="Complete hero description" value={home.heroDescription} set={(value) => setHome('heroDescription', value)} area/>
          <div className="cms-check-row"><label><input type="checkbox" checked={home.heroShowVisual} onChange={(event) => setHome('heroShowVisual', event.target.checked)}/>Show animated hero visual</label><label><input type="checkbox" checked={home.heroShowActiveToolCount} onChange={(event) => setHome('heroShowActiveToolCount', event.target.checked)}/>Show active tool count before description</label></div>
          <div className="grid grid-2"><Field label="Primary button text" value={home.primaryButtonText} set={(value) => setHome('primaryButtonText', value)}/><Field label="Primary button URL" value={home.primaryButtonUrl} set={(value) => setHome('primaryButtonUrl', value)}/><Field label="Secondary button text" value={home.secondaryButtonText} set={(value) => setHome('secondaryButtonText', value)}/><Field label="Secondary button URL" value={home.secondaryButtonUrl} set={(value) => setHome('secondaryButtonUrl', value)}/></div>
        </div>
      </details>

      <details className="cms-panel cms-edit-section">
        <summary><span>Statistics cards</span><small>Add, edit or remove every statistic</small></summary>
        <div className="cms-edit-section-body"><div className="cms-subheading"><h3>Statistics</h3><button className="btn btn-secondary btn-sm" onClick={() => setHome('stats', [...home.stats, { value: '0', label: 'New statistic' }])}><Plus size={15}/>Add statistic</button></div>{home.stats.map((stat, index) => <div className="cms-array-row" key={index}><input className="input" value={stat.value} onChange={(event) => updateStat(index, 'value', event.target.value)} placeholder="Value"/><input className="input" value={stat.label} onChange={(event) => updateStat(index, 'label', event.target.value)} placeholder="Label"/><button className="icon-btn" onClick={() => setHome('stats', home.stats.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={16}/></button></div>)}</div>
      </details>

      <details className="cms-panel cms-edit-section">
        <summary><span>Popular tools section</span><small>Heading, description, link and number of cards</small></summary>
        <div className="cms-edit-section-body"><div className="grid grid-2"><Field label="Section heading" value={home.popularTitle} set={(value) => setHome('popularTitle', value)}/><Field label="View-all button text" value={home.popularViewAllText} set={(value) => setHome('popularViewAllText', value)}/><Field label="Description" value={home.popularDescription} set={(value) => setHome('popularDescription', value)} area/><Field label="View-all URL" value={home.popularViewAllUrl} set={(value) => setHome('popularViewAllUrl', value)}/><Field label="Maximum tool cards" value={String(home.popularLimit)} set={(value) => setHome('popularLimit', Math.max(1, Number(value) || 8))} type="number"/></div><p className="help">Select which tools appear here from Admin → Tools & Pages by enabling the Popular option.</p></div>
      </details>

      <details className="cms-panel cms-edit-section">
        <summary><span>Why Choose Us section</span><small>Edit every feature card</small></summary>
        <div className="cms-edit-section-body"><Field label="Section heading" value={home.whyTitle} set={(value) => setHome('whyTitle', value)}/><Field label="Section description" value={home.whyDescription} set={(value) => setHome('whyDescription', value)} area/><div className="cms-subheading"><h3>Feature cards</h3><button className="btn btn-secondary btn-sm" onClick={() => setHome('whyItems', [...home.whyItems, { title: 'New feature', description: 'Feature description' }])}><Plus size={15}/>Add card</button></div>{home.whyItems.map((item, index) => <div className="cms-content-card" key={index}><div className="grid grid-2"><Field label="Card title" value={item.title} set={(value) => updateWhy(index, { title: value })}/><Field label="Card description (use {count} for live tool count)" value={item.description} set={(value) => updateWhy(index, { description: value })} area/></div><button className="btn btn-danger btn-sm" onClick={() => setHome('whyItems', home.whyItems.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={15}/>Remove card</button></div>)}</div>
      </details>

      <details className="cms-panel cms-edit-section">
        <summary><span>Categories section</span><small>Edit, hide and reorder category cards</small></summary>
        <div className="cms-edit-section-body"><Field label="Section heading" value={home.categoriesTitle} set={(value) => setHome('categoriesTitle', value)}/><Field label="Section description" value={home.categoriesDescription} set={(value) => setHome('categoriesDescription', value)} area/><div className="cms-category-editor">{home.categoryCards.map((item, index) => <div className="cms-content-card" key={item.slug}><div className="cms-subheading"><h3>{item.slug}</h3><label className="cms-checkbox"><input type="checkbox" checked={item.visible} onChange={(event) => updateCategory(index, { visible: event.target.checked })}/>Show card</label></div><div className="grid grid-2"><Field label="Card title" value={item.title} set={(value) => updateCategory(index, { title: value })}/><Field label="Button text" value={item.buttonText} set={(value) => updateCategory(index, { buttonText: value })}/><Field label="Card description (use {count} for live tool count)" value={item.description} set={(value) => updateCategory(index, { description: value })} area/><Field label="Sort order" value={String(item.sortOrder)} set={(value) => updateCategory(index, { sortOrder: Number(value) || 0 })} type="number"/></div></div>)}</div></div>
      </details>

      <details className="cms-panel cms-edit-section">
        <summary><span>Privacy section</span><small>Badge, text and all checklist items</small></summary>
        <div className="cms-edit-section-body"><Field label="Small badge" value={home.privacyBadge} set={(value) => setHome('privacyBadge', value)}/><Field label="Section heading" value={home.privacyTitle} set={(value) => setHome('privacyTitle', value)}/><Field label="Section description" value={home.privacyDescription} set={(value) => setHome('privacyDescription', value)} area/><div className="cms-subheading"><h3>Privacy checklist</h3><button className="btn btn-secondary btn-sm" onClick={() => setHome('privacyItems', [...home.privacyItems, 'New privacy point'])}><Plus size={15}/>Add item</button></div>{home.privacyItems.map((item, index) => <div className="cms-array-row cms-array-row-wide" key={index}><input className="input" value={item} onChange={(event) => updatePrivacy(index, event.target.value)}/><button className="icon-btn" onClick={() => setHome('privacyItems', home.privacyItems.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={16}/></button></div>)}</div>
      </details>

      <details className="cms-panel cms-edit-section">
        <summary><span>How It Works section</span><small>Edit heading and all steps</small></summary>
        <div className="cms-edit-section-body"><Field label="Section heading" value={home.howTitle} set={(value) => setHome('howTitle', value)}/><Field label="Section description" value={home.howDescription} set={(value) => setHome('howDescription', value)} area/><div className="cms-subheading"><h3>Steps</h3><button className="btn btn-secondary btn-sm" onClick={() => setHome('howSteps', [...home.howSteps, { number: String(home.howSteps.length + 1), title: 'New step', description: 'Step description' }])}><Plus size={15}/>Add step</button></div>{home.howSteps.map((item, index) => <div className="cms-content-card" key={index}><div className="grid grid-3"><Field label="Number" value={item.number} set={(value) => updateStep(index, { number: value })}/><Field label="Step title" value={item.title} set={(value) => updateStep(index, { title: value })}/><Field label="Description" value={item.description} set={(value) => updateStep(index, { description: value })} area/></div><button className="btn btn-danger btn-sm" onClick={() => setHome('howSteps', home.howSteps.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={15}/>Remove step</button></div>)}</div>
      </details>

      <details className="cms-panel cms-edit-section">
        <summary><span>Blog section</span><small>Heading, description, link and post count</small></summary>
        <div className="cms-edit-section-body"><div className="grid grid-2"><Field label="Section heading" value={home.blogTitle} set={(value) => setHome('blogTitle', value)}/><Field label="View-all button text" value={home.blogViewAllText} set={(value) => setHome('blogViewAllText', value)}/><Field label="Section description" value={home.blogDescription} set={(value) => setHome('blogDescription', value)} area/><Field label="View-all URL" value={home.blogViewAllUrl} set={(value) => setHome('blogViewAllUrl', value)}/><Field label="Maximum blog cards" value={String(home.blogLimit)} set={(value) => setHome('blogLimit', Math.max(1, Number(value) || 3))} type="number"/></div></div>
      </details>

      <details className="cms-panel cms-edit-section">
        <summary><span>FAQ section</span><small>Heading, description and every FAQ</small></summary>
        <div className="cms-edit-section-body"><Field label="FAQ heading" value={home.faqTitle} set={(value) => setHome('faqTitle', value)}/><Field label="FAQ description" value={home.faqDescription} set={(value) => setHome('faqDescription', value)} area/><div className="cms-subheading"><h3>Questions and answers</h3><button className="btn btn-secondary btn-sm" onClick={() => setHome('faqs', [...home.faqs, { question: '', answer: '' }])}><Plus size={15}/>Add FAQ</button></div>{home.faqs.map((faq, index) => <div className="cms-content-card" key={index}><Field label="Question" value={faq.question} set={(value) => updateFaq(index, { question: value })}/><Field label="Answer" value={faq.answer} set={(value) => updateFaq(index, { answer: value })} area/><button className="btn btn-danger btn-sm" onClick={() => setHome('faqs', home.faqs.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={15}/>Remove FAQ</button></div>)}</div>
      </details>

      <details className="cms-panel cms-edit-section">
        <summary><span>Complete homepage SEO</span><small>Metadata, social cards, robots and schema</small></summary>
        <div className="cms-edit-section-body"><div className="grid grid-2"><Field label="SEO title" value={home.seoTitle || ''} set={(value) => setHome('seoTitle', value)}/><Field label="Meta keywords" value={home.metaKeywords || ''} set={(value) => setHome('metaKeywords', value)}/><Field label="Meta description" value={home.metaDescription || ''} set={(value) => setHome('metaDescription', value)} area/><Field label="Canonical URL" value={home.canonicalUrl || ''} set={(value) => setHome('canonicalUrl', value)}/><Field label="Open Graph title" value={home.openGraphTitle || ''} set={(value) => setHome('openGraphTitle', value)}/><Field label="Open Graph description" value={home.openGraphDescription || ''} set={(value) => setHome('openGraphDescription', value)} area/><Field label="Open Graph image" value={home.openGraphImage || ''} set={(value) => setHome('openGraphImage', value)}/><SelectField label="Open Graph type" value={home.openGraphType || 'website'} options={[['website','Website'],['article','Article']]} set={(value) => setHome('openGraphType', value as 'website' | 'article')}/><SelectField label="Twitter card" value={home.twitterCard || 'summary_large_image'} options={[['summary_large_image','Summary large image'],['summary','Summary']]} set={(value) => setHome('twitterCard', value as 'summary' | 'summary_large_image')}/><Field label="Twitter title" value={home.twitterTitle || ''} set={(value) => setHome('twitterTitle', value)}/><Field label="Twitter description" value={home.twitterDescription || ''} set={(value) => setHome('twitterDescription', value)} area/><Field label="Twitter image" value={home.twitterImage || ''} set={(value) => setHome('twitterImage', value)}/></div><div className="cms-check-row"><label><input type="checkbox" checked={home.robotsIndex ?? true} onChange={(event) => setHome('robotsIndex', event.target.checked)}/>Index homepage</label><label><input type="checkbox" checked={home.robotsFollow ?? true} onChange={(event) => setHome('robotsFollow', event.target.checked)}/>Follow homepage links</label></div><Field label="Custom homepage schema JSON-LD" value={home.schemaJson || ''} set={(value) => setHome('schemaJson', value)} area/></div>
      </details>
    </div>

    <div className="cms-sticky-save"><span>{message}</span><button className="cms-btn" onClick={save} disabled={saving}><Save size={17}/>{saving ? 'Saving…' : 'Save All Homepage Changes'}</button></div>
  </div>;
}

function Field({ label, value, set, area = false, type = 'text' }: { label: string; value: string; set: (value: string) => void; area?: boolean; type?: string }) {
  return <div className="field"><label className="label">{label}</label>{area ? <textarea className="textarea" value={value} onChange={(event) => set(event.target.value)}/> : <input className="input" type={type} value={value} onChange={(event) => set(event.target.value)}/>}</div>;
}

function SelectField({ label, value, set, options }: { label: string; value: string; set: (value: string) => void; options: Array<[string, string]> }) {
  return <div className="field"><label className="label">{label}</label><select className="select" value={value} onChange={(event) => set(event.target.value)}>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></div>;
}
