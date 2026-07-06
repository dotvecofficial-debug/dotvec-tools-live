'use client';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ToolDefinition } from '@/lib/tools';
import { ToolCard } from './ToolCard';

const categoryOptions: Array<[string, string]> = [
  ['all', 'All'], ['image', 'Image'], ['pdf', 'PDF'], ['video', 'Video'], ['audio', 'Audio'], ['document', 'Documents'],
  ['social', 'Social'], ['text', 'Text'], ['developer', 'Developer'], ['seo', 'SEO'], ['calculator', 'Calculators'], ['ocr', 'OCR'],
];

export function ToolDirectory({ tools, initialCategory = 'all' }: { tools: ToolDefinition[]; initialCategory?: string }) {
  const [query, setQuery] = useState(''); const [category, setCategory] = useState(initialCategory); const [mode, setMode] = useState<'all' | 'browser' | 'server'>('all');
  const filtered = useMemo(() => tools.filter((tool) => {
    const q = query.trim().toLowerCase();
    const matchQ = !q || [tool.title, tool.shortDescription, tool.categoryLabel, ...tool.keywords, ...tool.alternativeNames].join(' ').toLowerCase().includes(q);
    const matchC = category === 'all' || tool.category === category;
    const matchM = mode === 'all' || tool.processingMode === mode;
    return matchQ && matchC && matchM && tool.status !== 'disabled';
  }), [tools, query, category, mode]);
  return <div><div className="search-shell" style={{ margin: '24px 0' }}><Search className="search-icon" size={20} /><input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tools by name, category or keyword" /><span className="search-count badge">{filtered.length} tools</span></div><div className="filters">{categoryOptions.map(([id, label]) => <button key={id} onClick={() => setCategory(id)} className={`btn btn-sm ${category === id ? 'btn-primary' : 'btn-secondary'}`}>{label}</button>)}<select className="select" style={{ width: 180, minHeight: 40 }} value={mode} onChange={(event) => setMode(event.target.value as typeof mode)}><option value="all">All processing</option><option value="browser">Browser only</option><option value="server">VPS only</option></select></div>{filtered.length ? <div className="tool-grid">{filtered.map((tool) => <ToolCard key={tool.slug} tool={tool} />)}</div> : <div className="card" style={{ padding: 40, textAlign: 'center' }}><h3>No tools found</h3><p className="muted">Try a shorter keyword or another category.</p></div>}</div>;
}
