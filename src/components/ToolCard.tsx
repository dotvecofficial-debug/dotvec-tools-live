import Link from 'next/link';
import { ArrowRight, FileCog, Image, Code2, SearchCheck, Calculator, ScanText, Server, Video, AudioLines, FileText, DownloadCloud } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { ToolDefinition } from '@/lib/tools';

const icons={image:Image,pdf:FileCog,text:ScanText,developer:Code2,seo:SearchCheck,calculator:Calculator,ocr:ScanText,backend:Server,video:Video,audio:AudioLines,document:FileText,social:DownloadCloud};

export function ToolCard({tool}:{tool:ToolDefinition}){
  const Icon=icons[tool.category];
  const style = { '--tool-card-color': tool.cardButtonColor || 'var(--tool-card-action)' } as CSSProperties;
  return <Link href={`/tools/${tool.slug}`} className="card tool-card" style={style}>
    <span className="tool-icon"><Icon size={23}/></span>
    <h3>{tool.title}</h3>
    <p>{tool.shortDescription}</p>
    <div className="tool-card-footer"><span className="tool-card-cta">{tool.cardButtonText || 'Get Started'}</span><ArrowRight size={18}/></div>
  </Link>;
}
