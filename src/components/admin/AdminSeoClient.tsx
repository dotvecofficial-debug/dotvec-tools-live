'use client';

import { Save } from 'lucide-react';
import { useState } from 'react';
import { errorMessage, requestJson } from '@/lib/client-api';
import type { GlobalSeoSettings, SeoFields, SiteSettings } from '@/lib/store';

const pageOptions = [
  ['all-tools', '/all-tools'], ['image-tools', '/image-tools'], ['pdf-tools', '/pdf-tools'], ['video-tools', '/video-tools'], ['audio-tools', '/audio-tools'], ['social-downloaders', '/social-downloaders'], ['document-tools', '/document-tools'], ['text-tools', '/text-tools'], ['developer-tools', '/developer-tools'], ['seo-tools', '/seo-tools'], ['calculators', '/calculators'], ['ocr-tools', '/ocr-tools'], ['blog', '/blog'], ['contact', '/contact'], ['privacy-policy', '/privacy-policy'], ['terms', '/terms'], ['disclaimer', '/disclaimer'],
] as const;

const blankPage: SeoFields = { seoTitle:'',metaDescription:'',metaKeywords:'',canonicalUrl:'',openGraphTitle:'',openGraphDescription:'',openGraphImage:'',openGraphType:'website',twitterCard:'summary_large_image',twitterTitle:'',twitterDescription:'',twitterImage:'',robotsIndex:true,robotsFollow:true,schemaJson:'' };

export function AdminSeoClient({ initial }: { initial: SiteSettings }) {
  const [settings, setSettings] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedPage, setSelectedPage] = useState<string>(pageOptions[0][0]);
  const seo = settings.seo;
  const page = { ...blankPage, ...(settings.pageSeo[selectedPage] || {}) };

  function setSeo<K extends keyof GlobalSeoSettings>(key: K, value: GlobalSeoSettings[K]) {
    setSettings((current) => ({ ...current, seo: { ...current.seo, [key]: value } }));
  }
  function setPage<K extends keyof SeoFields>(key: K, value: SeoFields[K]) {
    setSettings((current) => ({ ...current, pageSeo: { ...current.pageSeo, [selectedPage]: { ...blankPage, ...(current.pageSeo[selectedPage] || {}), [key]: value } } }));
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
      setMessage('SEO settings saved successfully.');
    } catch (error) {
      setMessage(errorMessage(error, 'SEO settings could not be saved.'));
    } finally {
      setSaving(false);
    }
  }


  return <div className="cms-page">
    <section className="admin-hero"><div><span>SEO Manager</span><h1>Overall website SEO</h1><p>Manage defaults and complete SEO for every public page, tool page and blog post.</p></div><button className="cms-btn" onClick={save} disabled={saving}><Save size={17}/>{saving ? 'Saving…' : 'Save SEO'}</button></section>
    <div className="cms-settings-grid cms-wide-grid">
      <section className="cms-panel"><h2>Search metadata defaults</h2><Field label="Default title" value={seo.defaultTitle} set={(value) => setSeo('defaultTitle', value)}/><Field label="Title template" value={seo.titleTemplate} set={(value) => setSeo('titleTemplate', value)} help="Use %s where the page title should appear."/><Field label="Default meta description" value={seo.defaultDescription} set={(value) => setSeo('defaultDescription', value)} area/><Field label="Default meta keywords" value={seo.metaKeywords} set={(value) => setSeo('metaKeywords', value)} area/><div className="cms-check-row"><label><input type="checkbox" checked={seo.defaultRobotsIndex} onChange={(event) => setSeo('defaultRobotsIndex', event.target.checked)}/>Index pages by default</label><label><input type="checkbox" checked={seo.defaultRobotsFollow} onChange={(event) => setSeo('defaultRobotsFollow', event.target.checked)}/>Follow links by default</label></div></section>
      <section className="cms-panel"><h2>Open Graph & Twitter Card</h2><Field label="Default Open Graph image" value={seo.defaultOgImage} set={(value) => setSeo('defaultOgImage', value)}/><Field label="Open Graph site name" value={seo.ogSiteName} set={(value) => setSeo('ogSiteName', value)}/><div className="field"><label className="label">Default Twitter card</label><select className="select" value={seo.twitterCard} onChange={(event) => setSeo('twitterCard', event.target.value as GlobalSeoSettings['twitterCard'])}><option value="summary_large_image">Summary large image</option><option value="summary">Summary</option></select></div><Field label="Twitter/X site handle" value={seo.twitterSite} set={(value) => setSeo('twitterSite', value)}/><Field label="Twitter/X creator handle" value={seo.twitterCreator} set={(value) => setSeo('twitterCreator', value)}/><div className="seo-preview-card"><small>Social preview</small><div className="seo-preview-image">Open Graph image preview</div><h3>{seo.defaultTitle}</h3><p>{seo.defaultDescription}</p></div></section>
    </div>
    <div className="cms-dashboard-grid"><section className="cms-panel"><h2>Organization schema</h2><Field label="Organization name" value={seo.organizationName} set={(value) => setSeo('organizationName', value)}/><Field label="Organization logo URL" value={seo.organizationLogo} set={(value) => setSeo('organizationLogo', value)}/><Field label="Custom organization JSON-LD" value={seo.organizationSchemaJson} set={(value) => setSeo('organizationSchemaJson', value)} area/><p className="help">Leave blank to generate a basic Organization schema automatically.</p></section><section className="cms-panel"><h2>Search engine verification</h2><Field label="Google verification code" value={seo.googleVerification} set={(value) => setSeo('googleVerification', value)}/><Field label="Bing verification code" value={seo.bingVerification} set={(value) => setSeo('bingVerification', value)}/><Field label="Canonical domain" value={settings.canonicalDomain} set={(value) => setSettings({ ...settings, canonicalDomain: value })}/></section></div>
    <section className="cms-panel cms-full-panel"><div className="cms-subheading"><div><h2>Static & category page SEO</h2><p className="help">Tools and blog posts have their own SEO editors. This section controls every remaining public page.</p></div><select className="select seo-page-select" value={selectedPage} onChange={(event) => setSelectedPage(event.target.value)}>{pageOptions.map(([key,path]) => <option value={key} key={key}>{path}</option>)}</select></div><div className="grid grid-2"><Field label="SEO title" value={page.seoTitle || ''} set={(value) => setPage('seoTitle', value)}/><Field label="Meta keywords" value={page.metaKeywords || ''} set={(value) => setPage('metaKeywords', value)}/><Field label="Meta description" value={page.metaDescription || ''} set={(value) => setPage('metaDescription', value)} area/><Field label="Canonical URL" value={page.canonicalUrl || ''} set={(value) => setPage('canonicalUrl', value)}/><Field label="Open Graph title" value={page.openGraphTitle || ''} set={(value) => setPage('openGraphTitle', value)}/><Field label="Open Graph image" value={page.openGraphImage || ''} set={(value) => setPage('openGraphImage', value)}/><Field label="Open Graph description" value={page.openGraphDescription || ''} set={(value) => setPage('openGraphDescription', value)} area/><div className="field"><label className="label">Twitter card</label><select className="select" value={page.twitterCard || 'summary_large_image'} onChange={(event) => setPage('twitterCard', event.target.value as SeoFields['twitterCard'])}><option value="summary_large_image">Summary large image</option><option value="summary">Summary</option></select></div><Field label="Twitter title" value={page.twitterTitle || ''} set={(value) => setPage('twitterTitle', value)}/><Field label="Twitter image" value={page.twitterImage || ''} set={(value) => setPage('twitterImage', value)}/><Field label="Twitter description" value={page.twitterDescription || ''} set={(value) => setPage('twitterDescription', value)} area/></div><div className="cms-check-row"><label><input type="checkbox" checked={page.robotsIndex ?? true} onChange={(event) => setPage('robotsIndex', event.target.checked)}/>Index page</label><label><input type="checkbox" checked={page.robotsFollow ?? true} onChange={(event) => setPage('robotsFollow', event.target.checked)}/>Follow links</label></div><Field label="Custom page schema JSON-LD" value={page.schemaJson || ''} set={(value) => setPage('schemaJson', value)} area/></section>
    <section className="cms-panel cms-full-panel"><h2>Per-content SEO</h2><p>Tool pages: <b>Tools & Pages</b> includes title, description, keywords, canonical, Open Graph, Twitter card, robots and schema. Blog posts: <b>Blog Posts</b> includes the same complete SEO controls plus FAQ schema.</p></section>
    {message && <div className={`status ${message.includes('successfully') ? 'success' : ''}`} style={{ margin: '0 28px 28px' }}>{message}</div>}
  </div>;
}

function Field({ label, value, set, area = false, help }: { label: string; value: string; set: (value: string) => void; area?: boolean; help?: string }) { return <div className="field"><label className="label">{label}</label>{area ? <textarea className="textarea" value={value} onChange={(event) => set(event.target.value)}/> : <input className="input" value={value} onChange={(event) => set(event.target.value)}/>} {help && <span className="help">{help}</span>}</div>; }
