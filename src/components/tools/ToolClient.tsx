'use client';
import dynamic from 'next/dynamic';
import type { ToolDefinition } from '@/lib/tools';

const ImageRunner = dynamic(() => import('./ImageRunner').then((m) => m.ImageRunner), { ssr: false, loading: () => <div className="status">Loading image engine…</div> });
const PdfRunner = dynamic(() => import('./PdfRunner').then((m) => m.PdfRunner), { ssr: false, loading: () => <div className="status">Loading PDF engine…</div> });
const TextRunner = dynamic(() => import('./TextRunner').then((m) => m.TextRunner), { ssr: false });
const DeveloperRunner = dynamic(() => import('./DeveloperRunner').then((m) => m.DeveloperRunner), { ssr: false });
const SeoRunner = dynamic(() => import('./SeoRunner').then((m) => m.SeoRunner), { ssr: false });
const CalculatorRunner = dynamic(() => import('./CalculatorRunner').then((m) => m.CalculatorRunner), { ssr: false });
const OcrRunner = dynamic(() => import('./OcrRunner').then((m) => m.OcrRunner), { ssr: false });
const BackendRunner = dynamic(() => import('./BackendRunner').then((m) => m.BackendRunner), { ssr: false });
const SocialDownloaderRunner = dynamic(() => import('./SocialDownloaderRunner').then((m) => m.SocialDownloaderRunner), { ssr: false });

export function ToolClient({ tool }: { tool: ToolDefinition }) {
  if (tool.status === 'disabled') {
    return <div className="card" style={{ padding: 32 }}><h2>Tool disabled</h2><p className="muted">This tool has been disabled by the administrator.</p></div>;
  }
  if (tool.status === 'coming-soon') {
    return <div className="card" style={{ padding: 32 }}><h2>Coming soon</h2><p className="muted">This tool is listed but not yet published as functional.</p></div>;
  }
  if (tool.status === 'maintenance') {
    return <div className="card" style={{ padding: 32 }}><h2>Under maintenance</h2><p className="muted">{tool.maintenanceMessage || 'The administrator has temporarily paused this tool.'}</p></div>;
  }

  const props = { slug: tool.slug, maxMB: tool.maximumFileSize };
  if (tool.category === 'social') return <SocialDownloaderRunner {...props} />;
  if (tool.processingMode === 'server') return <BackendRunner {...props} category={tool.category} />;

  switch (tool.category) {
    case 'image': return <ImageRunner {...props} />;
    case 'pdf': return <PdfRunner {...props} />;
    case 'text': return <TextRunner slug={tool.slug} />;
    case 'developer': return <DeveloperRunner slug={tool.slug} />;
    case 'seo': return <SeoRunner slug={tool.slug} />;
    case 'calculator': return <CalculatorRunner slug={tool.slug} />;
    case 'ocr': return <OcrRunner maxMB={tool.maximumFileSize} />;
    default: return <div className="status error">This browser tool does not have a runner.</div>;
  }
}
