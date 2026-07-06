'use client';

import { Download, Plus, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { errorMessage, requestJson } from '@/lib/client-api';
import type { SiteSettings, SitemapSettings, SitemapUrl } from '@/lib/store';

const frequencies: SitemapUrl['changefreq'][] = ['always','hourly','daily','weekly','monthly','yearly','never'];

export function AdminSitemapClient({ initial }: { initial: SiteSettings }) {
  const [settings, setSettings] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const sitemap = settings.sitemap;

  function setMap<K extends keyof SitemapSettings>(key: K, value: SitemapSettings[K]) {
    setSettings((current) => ({ ...current, sitemap: { ...current.sitemap, [key]: value } }));
  }
  function updateCustom(index: number, patch: Partial<SitemapUrl>) {
    setMap('customUrls', sitemap.customUrls.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
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
      setMessage('Sitemap and server files saved successfully.');
    } catch (error) {
      setMessage(errorMessage(error, 'Sitemap and server files could not be saved.'));
    } finally {
      setSaving(false);
    }
  }

  function download(name: string, content: string, type = 'text/plain') {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <div className="cms-page">
    <section className="admin-hero"><div><span>Technical SEO</span><h1>Sitemap, robots.txt & .htaccess</h1><p>Control which public pages enter the sitemap and maintain crawler/server directives from one dashboard.</p></div><button className="cms-btn" disabled={saving} onClick={save}><Save size={17}/>{saving ? 'Saving…' : 'Save Files'}</button></section>
    <div className="cms-settings-grid cms-wide-grid">
      <section className="cms-panel"><h2>Sitemap builder</h2><label className="cms-checkbox"><input type="checkbox" checked={sitemap.enabled} onChange={(event) => setMap('enabled', event.target.checked)}/>Enable dynamic sitemap.xml</label><div className="cms-check-grid"><Check label="Homepage" checked={sitemap.includeHome} set={(value) => setMap('includeHome', value)}/><Check label="Tool pages" checked={sitemap.includeTools} set={(value) => setMap('includeTools', value)}/><Check label="Category pages" checked={sitemap.includeCategories} set={(value) => setMap('includeCategories', value)}/><Check label="Blog posts" checked={sitemap.includeBlog} set={(value) => setMap('includeBlog', value)}/><Check label="Static pages" checked={sitemap.includeStaticPages} set={(value) => setMap('includeStaticPages', value)}/></div><div className="grid grid-2"><SelectFrequency label="Tool frequency" value={sitemap.toolChangefreq} set={(value) => setMap('toolChangefreq', value)}/><NumberField label="Tool priority" value={sitemap.toolPriority} set={(value) => setMap('toolPriority', value)}/><SelectFrequency label="Blog frequency" value={sitemap.blogChangefreq} set={(value) => setMap('blogChangefreq', value)}/><NumberField label="Blog priority" value={sitemap.blogPriority} set={(value) => setMap('blogPriority', value)}/></div><div className="field"><label className="label">Excluded paths, one per line</label><textarea className="textarea" value={sitemap.excludedPaths.join('\n')} onChange={(event) => setMap('excludedPaths', event.target.value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean))}/></div><a className="cms-btn secondary-dark" href="/sitemap.xml" target="_blank">Preview sitemap.xml</a></section>
      <section className="cms-panel"><div className="cms-subheading"><h2>Custom sitemap URLs</h2><button className="btn btn-secondary btn-sm" onClick={() => setMap('customUrls', [...sitemap.customUrls, { loc: '/', changefreq: 'monthly', priority: 0.5 }])}><Plus size={15}/>Add URL</button></div>{sitemap.customUrls.map((item, index) => <div className="sitemap-row" key={index}><input className="input" value={item.loc} onChange={(event) => updateCustom(index, { loc: event.target.value })} placeholder="/custom-page"/><select className="select" value={item.changefreq} onChange={(event) => updateCustom(index, { changefreq: event.target.value as SitemapUrl['changefreq'] })}>{frequencies.map((frequency) => <option value={frequency} key={frequency}>{frequency}</option>)}</select><input className="input" type="number" min="0" max="1" step="0.1" value={item.priority} onChange={(event) => updateCustom(index, { priority: Number(event.target.value) })}/><button className="icon-btn" onClick={() => setMap('customUrls', sitemap.customUrls.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={16}/></button></div>)}</section>
    </div>
    <div className="cms-dashboard-grid cms-file-grid"><section className="cms-panel"><div className="cms-subheading"><h2>robots.txt</h2><button className="btn btn-secondary btn-sm" onClick={() => download('robots.txt', settings.robotsTxt.replaceAll('{{DOMAIN}}', settings.canonicalDomain))}><Download size={15}/>Download</button></div><textarea className="cms-code-editor" value={settings.robotsTxt} onChange={(event) => setSettings({ ...settings, robotsTxt: event.target.value })}/><p className="help">Use {'{{DOMAIN}}'} as a domain placeholder. Public URL: /robots.txt</p></section><section className="cms-panel"><div className="cms-subheading"><h2>.htaccess</h2><button className="btn btn-secondary btn-sm" onClick={() => download('.htaccess', settings.htaccess)}><Download size={15}/>Download</button></div><textarea className="cms-code-editor" value={settings.htaccess} onChange={(event) => setSettings({ ...settings, htaccess: event.target.value })}/><p className="help">.htaccess is only used by Apache. A Docker/Node VPS normally uses Nginx or another reverse proxy.</p></section></div>
    {message && <div className={`status ${message.includes('successfully') ? 'success' : ''}`} style={{ margin: '0 28px 28px' }}>{message}</div>}
  </div>;
}

function Check({ label, checked, set }: { label: string; checked: boolean; set: (value: boolean) => void }) { return <label className="cms-checkbox"><input type="checkbox" checked={checked} onChange={(event) => set(event.target.checked)}/>{label}</label>; }
function SelectFrequency({ label, value, set }: { label: string; value: SitemapUrl['changefreq']; set: (value: SitemapUrl['changefreq']) => void }) { return <div className="field"><label className="label">{label}</label><select className="select" value={value} onChange={(event) => set(event.target.value as SitemapUrl['changefreq'])}>{frequencies.map((frequency) => <option value={frequency} key={frequency}>{frequency}</option>)}</select></div>; }
function NumberField({ label, value, set }: { label: string; value: number; set: (value: number) => void }) { return <div className="field"><label className="label">{label}</label><input className="input" type="number" min="0" max="1" step="0.1" value={value} onChange={(event) => set(Number(event.target.value))}/></div>; }
