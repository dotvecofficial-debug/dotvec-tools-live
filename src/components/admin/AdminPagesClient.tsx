'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Eye, FilePlus2, Plus, Save, Trash2, X } from 'lucide-react';
import type { StaticPage } from '@/lib/store';
import { CmsRichEditor } from './CmsRichEditor';
import { errorMessage, requestJson } from '@/lib/client-api';

const emptyPage: StaticPage = {
  id: '',
  slug: '',
  title: '',
  navigationLabel: '',
  excerpt: '',
  content: '<h2>New page</h2><p>Write your page content here.</p>',
  status: 'draft',
  showInHeader: false,
  showInFooter: true,
  footerGroup: 'company',
  sortOrder: 10,
  createdAt: '',
  updatedAt: '',
  seoTitle: '',
  metaDescription: '',
  metaKeywords: '',
  canonicalUrl: '',
  openGraphTitle: '',
  openGraphDescription: '',
  openGraphImage: '',
  openGraphType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '',
  twitterDescription: '',
  twitterImage: '',
  robotsIndex: true,
  robotsFollow: true,
  schemaJson: '',
  isSystem: false,
};

export function AdminPagesClient({ initial }: { initial: StaticPage[] }) {
  const [pages, setPages] = useState(initial);
  const [edit, setEdit] = useState<StaticPage | null>(null);
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => pages.filter((page) => `${page.title} ${page.slug} ${page.status}`.toLowerCase().includes(query.toLowerCase())), [pages, query]);

  function start(page?: StaticPage) {
    setMessage('');
    setEdit(page ? { ...page } : { ...emptyPage, slug: `new-page-${Date.now()}` });
  }

  function set<K extends keyof StaticPage>(key: K, value: StaticPage[K]) {
    setEdit((current) => current ? { ...current, [key]: value } : current);
  }

  async function save(status?: StaticPage['status']) {
    if (!edit || saving) return;
    setSaving(true);
    setMessage('Saving…');
    const payload = { ...edit, status: status || edit.status };
    try {
      const data = await requestJson<StaticPage>('/api/admin/pages', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setPages((current) => [...current.filter((item) => item.id !== data.id), data].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title)));
      setEdit(data);
      setMessage(data.status === 'published' ? 'Page published successfully. Its navigation links are now live.' : data.status === 'hidden' ? 'Page hidden successfully.' : 'Draft saved successfully.');
    } catch (error) {
      setMessage(errorMessage(error, 'Page could not be saved.'));
    } finally {
      setSaving(false);
    }
  }

  async function remove(page: StaticPage) {
    if (!window.confirm(`Delete “${page.title}” permanently? Its public URL and automatic links will be removed.`)) return;
    try {
      await requestJson<{ ok: true }>('/api/admin/pages', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: page.id }),
      });
      setPages((current) => current.filter((item) => item.id !== page.id));
      if (edit?.id === page.id) setEdit(null);
      setMessage('Page deleted successfully.');
    } catch (error) {
      setMessage(errorMessage(error, 'Page could not be deleted.'));
    }
  }


  return <div className="cms-page">
    <section className="admin-hero">
      <div><span>Page Manager</span><h1>Static pages and automatic links</h1><p>Create pages such as About Us, Services or Help, then publish, hide or delete them. Header and footer links update automatically.</p></div>
      <button className="cms-btn" onClick={() => start()}><FilePlus2 size={18}/>Add New Page</button>
    </section>

    {!edit ? <>
      <div className="cms-page-toolbar"><input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search static pages…"/><button className="cms-btn" onClick={() => start()}><Plus size={17}/>Add New Page</button></div>
      <div className="cms-panel cms-table-wrap">
        <table className="table"><thead><tr><th>Page</th><th>Status</th><th>Automatic links</th><th>Order</th><th>Actions</th></tr></thead><tbody>
          {filtered.map((page) => <tr key={page.id}>
            <td><b>{page.title}</b>{page.isSystem && <span className="badge badge-info" style={{ marginLeft: 8 }}>Built-in</span>}<div className="help">/{page.slug}</div></td>
            <td><span className={`badge ${page.status === 'published' ? 'badge-success' : page.status === 'hidden' ? 'badge-danger' : 'badge-warning'}`}>{page.status}</span></td>
            <td>{page.status === 'published' ? [page.showInHeader ? 'Header' : '', page.showInFooter ? `Footer (${page.footerGroup})` : ''].filter(Boolean).join(' + ') || 'No menu link' : 'Not public'}</td>
            <td>{page.sortOrder}</td>
            <td><div className="action-row"><button className="btn btn-secondary btn-sm" onClick={() => start(page)}>Edit</button>{page.status === 'published' && <Link className="btn btn-secondary btn-sm" target="_blank" href={`/${page.slug}`}>View</Link>}<button className="btn btn-danger btn-sm" onClick={() => remove(page)}><Trash2 size={15}/></button></div></td>
          </tr>)}
          {!filtered.length && <tr><td colSpan={5}><div className="notice">No static pages match your search.</div></td></tr>}
        </tbody></table>
      </div>
    </> : <div className="cms-editor-layout">
      <section className="cms-panel cms-main-editor">
        <div className="cms-editor-heading"><div><h2>{edit.id ? 'Edit static page' : 'Create static page'}</h2><p className="muted">The page URL, SEO metadata and navigation links are all controlled here.</p></div><button className="icon-btn" onClick={() => setEdit(null)} aria-label="Close editor"><X size={19}/></button></div>
        <div className="grid grid-2"><Field label="Page title" value={edit.title} onChange={(value) => { set('title', value); if (!edit.id) { set('slug', slugify(value)); set('navigationLabel', value); } }}/><div><Field label="URL slug" value={edit.slug} onChange={(value) => { if (!edit.isSystem) set('slug', slugify(value)); }} disabled={Boolean(edit.isSystem)}/>{edit.isSystem && <p className="help">Built-in page URLs stay fixed so existing links and SEO do not break.</p>}</div><Field label="Navigation label" value={edit.navigationLabel} onChange={(value) => set('navigationLabel', value)}/><Field label="Menu sort order" value={String(edit.sortOrder)} onChange={(value) => set('sortOrder', Number(value) || 0)} type="number"/></div>
        <Field label="Short excerpt" value={edit.excerpt} onChange={(value) => set('excerpt', value)} area/>
        <div className="field"><label className="label">Page content</label><CmsRichEditor key={edit.id || edit.slug} value={edit.content} onChange={(value) => set('content', value)}/></div>
      </section>

      <aside className="cms-panel cms-editor-sidebar">
        <h3>Publishing and links</h3>
        <div className="field"><label className="label">Page status</label><select className="select" value={edit.status} onChange={(event) => set('status', event.target.value as StaticPage['status'])}><option value="draft">Draft — admin only</option><option value="published">Published — public page</option><option value="hidden">Hidden — page unavailable</option></select></div>
        <label className="cms-checkbox"><input type="checkbox" checked={edit.showInHeader} onChange={(event) => set('showInHeader', event.target.checked)}/>Automatically add link to header</label>
        <label className="cms-checkbox"><input type="checkbox" checked={edit.showInFooter} onChange={(event) => set('showInFooter', event.target.checked)}/>Automatically add link to footer</label>
        <div className="field"><label className="label">Footer column</label><select className="select" value={edit.footerGroup} onChange={(event) => set('footerGroup', event.target.value as StaticPage['footerGroup'])}><option value="company">Company</option><option value="resources">Resources</option><option value="legal">Legal</option></select></div>
        <p className="help">Links only appear when the page status is Published. Hidden and Draft pages are removed from public navigation automatically.</p>
        <hr/>
        <h3>Complete page SEO</h3>
        <Field label="SEO title" value={edit.seoTitle || ''} onChange={(value) => set('seoTitle', value)}/>
        <Field label="Meta description" value={edit.metaDescription || ''} onChange={(value) => set('metaDescription', value)} area/>
        <Field label="Meta keywords" value={edit.metaKeywords || ''} onChange={(value) => set('metaKeywords', value)} area/>
        <Field label="Canonical URL" value={edit.canonicalUrl || ''} onChange={(value) => set('canonicalUrl', value)}/>
        <Field label="Open Graph title" value={edit.openGraphTitle || ''} onChange={(value) => set('openGraphTitle', value)}/>
        <Field label="Open Graph description" value={edit.openGraphDescription || ''} onChange={(value) => set('openGraphDescription', value)} area/>
        <Field label="Open Graph image" value={edit.openGraphImage || ''} onChange={(value) => set('openGraphImage', value)}/>
        <div className="field"><label className="label">Twitter card</label><select className="select" value={edit.twitterCard || 'summary_large_image'} onChange={(event) => set('twitterCard', event.target.value as 'summary' | 'summary_large_image')}><option value="summary_large_image">Summary large image</option><option value="summary">Summary</option></select></div>
        <Field label="Twitter title" value={edit.twitterTitle || ''} onChange={(value) => set('twitterTitle', value)}/>
        <Field label="Twitter description" value={edit.twitterDescription || ''} onChange={(value) => set('twitterDescription', value)} area/>
        <Field label="Twitter image" value={edit.twitterImage || ''} onChange={(value) => set('twitterImage', value)}/>
        <div className="cms-check-row"><label><input type="checkbox" checked={edit.robotsIndex ?? true} onChange={(event) => set('robotsIndex', event.target.checked)}/>Index page</label><label><input type="checkbox" checked={edit.robotsFollow ?? true} onChange={(event) => set('robotsFollow', event.target.checked)}/>Follow links</label></div>
        <Field label="Custom schema JSON-LD" value={edit.schemaJson || ''} onChange={(value) => set('schemaJson', value)} area/>
        <div className="cms-save-stack"><button className="cms-btn" disabled={saving} onClick={() => save(edit.status)}><Save size={17}/>{saving ? 'Saving…' : edit.status === 'published' ? 'Publish Page' : edit.status === 'hidden' ? 'Save Hidden Page' : 'Save Draft'}</button>{edit.status === 'published' && edit.slug && <Link href={`/${edit.slug}`} target="_blank" className="cms-btn secondary-dark"><Eye size={17}/>Preview Page</Link>}{edit.id && <button className="btn btn-danger" onClick={() => remove(edit)}><Trash2 size={16}/>Delete Page</button>}{message && <div className={`status ${message.includes('success') || message.includes('published') || message.includes('saved') || message.includes('hidden') ? 'success' : 'error'}`}>{message}</div>}</div>
      </aside>
    </div>}
  </div>;
}

function Field({ label, value, onChange, area = false, type = 'text', disabled = false }: { label: string; value: string; onChange: (value: string) => void; area?: boolean; type?: string; disabled?: boolean }) {
  return <div className="field"><label className="label">{label}</label>{area ? <textarea className="textarea" value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}/> : <input className="input" type={type} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}/>}</div>;
}

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
