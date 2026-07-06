'use client';

import { useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { errorMessage, requestJson } from '@/lib/client-api';
import type {
  CardAppearanceSettings,
  FooterColumnSettings,
  FooterSettings,
  HeaderSettings,
  NavigationLink,
  SiteSettings,
  ThemeSettings,
} from '@/lib/store';

export function AdminSettingsClient({ initial }: { initial: SiteSettings }) {
  const [settings, setSettings] = useState(initial);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  function setTheme(key: keyof ThemeSettings, value: string | number) {
    setSettings((current) => ({ ...current, theme: { ...current.theme, [key]: value } }));
  }

  function setCard(key: keyof CardAppearanceSettings, value: string) {
    setSettings((current) => ({ ...current, cardAppearance: { ...current.cardAppearance, [key]: value } }));
  }

  function setHeader<K extends keyof HeaderSettings>(key: K, value: HeaderSettings[K]) {
    setSettings((current) => ({ ...current, header: { ...current.header, [key]: value } }));
  }

  function setFooter<K extends keyof FooterSettings>(key: K, value: FooterSettings[K]) {
    setSettings((current) => ({ ...current, footer: { ...current.footer, [key]: value } }));
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
      setMessage('Settings saved successfully. Refresh the public website to see all header, footer, text and color changes.');
    } catch (error) {
      setMessage(errorMessage(error, 'Settings could not be saved.'));
    } finally {
      setSaving(false);
    }
  }

  const colors: Array<[keyof ThemeSettings, string]> = [
    ['lightBackground', 'Light page background'], ['lightSurface', 'Light cards/surfaces'], ['lightSurfaceSecondary', 'Light secondary surface'],
    ['lightText', 'Light main text'], ['lightTextSecondary', 'Light secondary text'], ['lightMuted', 'Light muted text'], ['lightBorder', 'Light borders'],
    ['lightPrimary', 'Light primary'], ['lightSecondary', 'Light blue'], ['lightAccent', 'Light accent'],
    ['darkBackground', 'Dark page background'], ['darkSurface', 'Dark cards/surfaces'], ['darkSurfaceSecondary', 'Dark secondary surface'],
    ['darkText', 'Dark main text'], ['darkTextSecondary', 'Dark secondary text'], ['darkMuted', 'Dark muted text'], ['darkBorder', 'Dark borders'],
    ['darkPrimary', 'Dark primary'], ['darkSecondary', 'Dark blue'], ['darkAccent', 'Dark accent'],
  ];

  const cardColors: Array<[keyof CardAppearanceSettings, string]> = [
    ['lightToolBackground', 'Light tool-card background'], ['lightToolText', 'Light tool-card heading'],
    ['lightToolMuted', 'Light tool-card description'], ['lightToolBorder', 'Light tool-card border'],
    ['lightToolAction', 'Light tool-card link'], ['lightToolIconBackground', 'Light tool icon background'], ['lightToolIconText', 'Light tool icon color'],
    ['lightCategoryBackground', 'Light category-card background'], ['lightCategoryText', 'Light category-card heading'],
    ['lightCategoryMuted', 'Light category-card description'], ['lightCategoryBorder', 'Light category-card border'],
    ['lightCategoryAction', 'Light category-card link'], ['lightCategoryIconBackground', 'Light category icon background'], ['lightCategoryIconText', 'Light category icon color'],
    ['darkToolBackground', 'Dark tool-card background'], ['darkToolText', 'Dark tool-card heading'],
    ['darkToolMuted', 'Dark tool-card description'], ['darkToolBorder', 'Dark tool-card border'],
    ['darkToolAction', 'Dark tool-card link'], ['darkToolIconBackground', 'Dark tool icon background'], ['darkToolIconText', 'Dark tool icon color'],
    ['darkCategoryBackground', 'Dark category-card background'], ['darkCategoryText', 'Dark category-card heading'],
    ['darkCategoryMuted', 'Dark category-card description'], ['darkCategoryBorder', 'Dark category-card border'],
    ['darkCategoryAction', 'Dark category-card link'], ['darkCategoryIconBackground', 'Dark category icon background'], ['darkCategoryIconText', 'Dark category icon color'],
  ];

  const headerColors: Array<[keyof HeaderSettings, string]> = [
    ['lightBackground', 'Light header background'], ['lightText', 'Light logo/icon text'], ['lightLink', 'Light menu link'], ['lightHover', 'Light menu hover'], ['lightBorder', 'Light header border'],
    ['darkBackground', 'Dark header background'], ['darkText', 'Dark logo/icon text'], ['darkLink', 'Dark menu link'], ['darkHover', 'Dark menu hover'], ['darkBorder', 'Dark header border'],
  ];

  const footerColors: Array<[keyof FooterSettings, string]> = [
    ['lightBackground', 'Light-mode footer background'], ['lightText', 'Light-mode footer description'], ['lightHeading', 'Light-mode footer heading'], ['lightLink', 'Light-mode footer link'], ['lightBorder', 'Light-mode footer border'],
    ['darkBackground', 'Dark-mode footer background'], ['darkText', 'Dark-mode footer description'], ['darkHeading', 'Dark-mode footer heading'], ['darkLink', 'Dark-mode footer link'], ['darkBorder', 'Dark-mode footer border'],
  ];

  return <div className="cms-page">
    <section className="admin-hero">
      <div><span>Appearance & Site</span><h1>Full website, header and footer editor</h1><p>Edit global text colors, navigation links, footer columns and every major public color for light and dark mode.</p></div>
      <button className="cms-btn" disabled={saving} onClick={save}><Save size={17}/>{saving ? 'Saving…' : 'Save All Settings'}</button>
    </section>

    <div className="cms-settings-grid">
      <section className="cms-panel">
        <h2>Website details</h2>
        <Field label="Site name" value={settings.siteName} set={(value) => setSettings({ ...settings, siteName: value })}/>
        <Field label="Tagline" value={settings.tagline} set={(value) => setSettings({ ...settings, tagline: value })}/>
        <Field label="Announcement" value={settings.announcement} set={(value) => setSettings({ ...settings, announcement: value })} area/>
        <label className="cms-checkbox"><input type="checkbox" checked={settings.announcementEnabled} onChange={(event) => setSettings({ ...settings, announcementEnabled: event.target.checked })}/>Show announcement bar</label>
        <Field label="Contact email" value={settings.contactEmail} set={(value) => setSettings({ ...settings, contactEmail: value })}/>
        <Field label="Canonical domain" value={settings.canonicalDomain} set={(value) => setSettings({ ...settings, canonicalDomain: value })}/>
      </section>

      <section className="cms-panel">
        <h2>Whole website light and dark colors</h2>
        <p className="muted">These controls change page backgrounds, normal cards, headings, secondary copy, muted text and borders across the public website.</p>
        <div className="cms-color-grid">{colors.map(([key, label]) => <ColorField key={key} label={label} value={String(settings.theme[key])} set={(value) => setTheme(key, value)}/>)}</div>
        <div className="field"><label className="label">Card radius: {settings.theme.cardRadius}px</label><input className="range" type="range" min="6" max="36" value={settings.theme.cardRadius} onChange={(event) => setTheme('cardRadius', Number(event.target.value))}/></div>
      </section>
    </div>

    <section className="cms-panel cms-full-panel">
      <h2>Header design and navigation</h2>
      <p className="muted">Edit menu labels, URLs, order and visibility. Static pages marked “Add to header” are appended automatically and duplicate URLs are removed.</p>
      <div className="cms-check-row"><label><input type="checkbox" checked={settings.header.showSearch} onChange={(event) => setHeader('showSearch', event.target.checked)}/>Show search button</label><label><input type="checkbox" checked={settings.header.showThemeToggle} onChange={(event) => setHeader('showThemeToggle', event.target.checked)}/>Show light/dark toggle</label></div>
      <div className="cms-color-grid cms-card-color-grid">{headerColors.map(([key, label]) => <ColorField key={key} label={label} value={String(settings.header[key])} set={(value) => setHeader(key, value as never)}/>)}</div>
      <LinkEditor title="Header menu links" links={settings.header.links} onChange={(links) => setHeader('links', links)}/>
    </section>

    <section className="cms-panel cms-full-panel">
      <h2>Footer design, text and columns</h2>
      <div className="cms-settings-grid cms-inner-grid">
        <div>
          <Field label="Footer description" value={settings.footer.description} set={(value) => setFooter('description', value)} area/>
          <Field label="Copyright text ({year} is replaced automatically)" value={settings.footer.copyrightText} set={(value) => setFooter('copyrightText', value)}/>
          <Field label="Bottom note" value={settings.footer.bottomNote} set={(value) => setFooter('bottomNote', value)} area/>
          <label className="cms-checkbox"><input type="checkbox" checked={settings.footer.showAdminLink} onChange={(event) => setFooter('showAdminLink', event.target.checked)}/>Show Admin Login link in Legal column</label>
        </div>
        <div className="cms-color-grid">{footerColors.map(([key, label]) => <ColorField key={key} label={label} value={String(settings.footer[key])} set={(value) => setFooter(key, value as never)}/>)}</div>
      </div>
      <FooterColumnsEditor columns={settings.footer.columns} onChange={(columns) => setFooter('columns', columns)}/>
    </section>

    <section className="cms-panel cms-full-panel">
      <h2>Plain tool and category cards</h2>
      <p className="muted">Tool and category cards use a flat style. Change card, heading, description, link, icon and border colors independently for light and dark mode.</p>
      <div className="cms-color-grid cms-card-color-grid">{cardColors.map(([key, label]) => <ColorField key={key} label={label} value={settings.cardAppearance[key]} set={(value) => setCard(key, value)}/>)}</div>
      <div className="card-style-preview-grid">
        <div className="tool-card card card-style-preview"><span className="tool-icon">T</span><h3>Tool card preview</h3><p>Your selected tool-card colors appear here after saving and refreshing.</p><span className="tool-card-cta">Get Started</span></div>
        <div className="category-card card card-style-preview"><span className="tool-icon">C</span><h3>Category card preview</h3><p>Your selected category-card colors appear here after saving and refreshing.</p><span className="text-action">Explore category</span></div>
      </div>
    </section>

    {message && <div className={`status ${message.includes('successfully') ? 'success' : ''}`} style={{ margin: '0 28px 28px' }}>{message}</div>}
  </div>;
}

function LinkEditor({ title, links, onChange }: { title: string; links: NavigationLink[]; onChange: (links: NavigationLink[]) => void }) {
  function patch(index: number, next: Partial<NavigationLink>) {
    onChange(links.map((link, itemIndex) => itemIndex === index ? { ...link, ...next } : link));
  }
  function add() {
    onChange([...links, { id: `link_${Date.now()}`, label: 'New Link', href: '/', visible: true, sortOrder: (links.length + 1) * 10 }]);
  }
  return <div className="cms-nav-editor"><div className="cms-subheading"><h3>{title}</h3><button type="button" className="cms-btn" onClick={add}><Plus size={16}/>Add Link</button></div><div className="cms-nav-list">{links.map((link, index) => <div className="cms-nav-row" key={link.id}><input className="input" aria-label="Link label" value={link.label} onChange={(event) => patch(index, { label: event.target.value })}/><input className="input" aria-label="Link URL" value={link.href} onChange={(event) => patch(index, { href: event.target.value })}/><input className="input cms-order-input" type="number" aria-label="Sort order" value={link.sortOrder} onChange={(event) => patch(index, { sortOrder: Number(event.target.value) || 0 })}/><label className="cms-checkbox compact"><input type="checkbox" checked={link.visible} onChange={(event) => patch(index, { visible: event.target.checked })}/>Show</label><button type="button" className="btn btn-danger cms-icon-danger" onClick={() => onChange(links.filter((_, itemIndex) => itemIndex !== index))} aria-label="Remove link"><Trash2 size={16}/></button></div>)}</div></div>;
}

function FooterColumnsEditor({ columns, onChange }: { columns: FooterColumnSettings[]; onChange: (columns: FooterColumnSettings[]) => void }) {
  function patch(index: number, next: Partial<FooterColumnSettings>) {
    onChange(columns.map((column, itemIndex) => itemIndex === index ? { ...column, ...next } : column));
  }
  function addColumn() {
    onChange([...columns, { id: `column_${Date.now()}`, title: 'New Column', visible: true, sortOrder: (columns.length + 1) * 10, links: [] }]);
  }
  return <div className="cms-footer-editor"><div className="cms-subheading"><h3>Footer columns and links</h3><button type="button" className="cms-btn" onClick={addColumn}><Plus size={16}/>Add Column</button></div>{columns.map((column, index) => <div className="cms-footer-column" key={column.id}><div className="cms-footer-column-head"><input className="input" value={column.title} onChange={(event) => patch(index, { title: event.target.value })}/><input className="input cms-order-input" type="number" value={column.sortOrder} onChange={(event) => patch(index, { sortOrder: Number(event.target.value) || 0 })}/><label className="cms-checkbox compact"><input type="checkbox" checked={column.visible} onChange={(event) => patch(index, { visible: event.target.checked })}/>Show column</label><button type="button" className="btn btn-danger cms-icon-danger" onClick={() => onChange(columns.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={16}/></button></div><LinkEditor title={`${column.title} links`} links={column.links} onChange={(links) => patch(index, { links })}/><p className="help">Static pages set to footer group “{column.id}” are added automatically to this column when the column ID matches company, resources or legal.</p></div>)}</div>;
}

function ColorField({ label, value, set }: { label: string; value: string; set: (value: string) => void }) {
  return <div className="field"><label className="label">{label}</label><div className="cms-color-field"><input className="input" value={value} onChange={(event) => set(event.target.value)}/><input type="color" value={value} onChange={(event) => set(event.target.value)}/></div></div>;
}

function Field({ label, value, set, area = false }: { label: string; value: string; set: (value: string) => void; area?: boolean }) {
  return <div className="field"><label className="label">{label}</label>{area ? <textarea className="textarea" value={value} onChange={(event) => set(event.target.value)}/> : <input className="input" value={value} onChange={(event) => set(event.target.value)}/>}</div>;
}
