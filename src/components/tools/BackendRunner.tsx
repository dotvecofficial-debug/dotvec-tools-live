'use client';

import { useMemo, useState } from 'react';
import type { ToolCategory } from '@/lib/tools';
import { FileInput, Message, PrivacyNote, ResetButton } from './ToolShell';
import { useToolRunnerText } from './ToolRunnerCustomization';

const urlTools = new Set(['website-seo-audit', 'broken-link-checker', 'website-meta-checker', 'heading-checker', 'image-alt-checker', 'redirect-checker', 'robots-checker', 'sitemap-checker', 'website-link-extractor', 'page-size-checker']);
const multipleTools = new Set(['compare-pdf', 'merge-videos', 'add-subtitles', 'add-audio-to-video', 'audio-merger']);

function acceptFor(slug: string, category: ToolCategory) {
  if (slug === 'compare-pdf' || category === 'pdf') return '.pdf,application/pdf';
  if (slug === 'word-to-pdf' || slug === 'docx-to-text' || slug === 'docx-to-html') return '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (slug === 'excel-to-pdf' || slug === 'xlsx-to-csv') return '.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (slug === 'powerpoint-to-pdf') return '.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation';
  if (slug === 'csv-to-xlsx') return '.csv,text/csv';
  if (slug === 'add-subtitles') return '.mp4,.mov,.mkv,.webm,.srt,.vtt';
  if (slug === 'add-audio-to-video') return '.mp4,.mov,.mkv,.webm,.mp3,.wav,.m4a,.ogg,.aac';
  if (category === 'video') return '.mp4,.mov,.mkv,.webm,.avi,.m4v';
  if (category === 'audio') return '.mp3,.wav,.m4a,.ogg,.aac,.flac,.mp4,.mov,.mkv,.webm';
  return '*/*';
}

type FieldConfig = { key: string; label: string; type?: 'text' | 'number' | 'password' | 'select'; defaultValue?: string; options?: Array<[string, string]>; help?: string };



function titleize(value: string) {
  return value.replace(/([A-Z])/g, ' $1').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/^./, (s) => s.toUpperCase());
}

function renderResultValue(value: unknown, keyPrefix = 'result'): React.ReactNode {
  if (value == null || value === '') return <span className="muted">—</span>;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return <span>{String(value)}</span>;
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="muted">No items returned.</span>;
    return <div className="result-stack">{value.map((item, index) => <div className="result-item" key={`${keyPrefix}-${index}`}>{renderResultValue(item, `${keyPrefix}-${index}`)}</div>)}</div>;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    return <div className="result-stack">{entries.map(([key, nested]) => <div className="result-item" key={`${keyPrefix}-${key}`}><strong>{titleize(key)}</strong><div>{renderResultValue(nested, `${keyPrefix}-${key}`)}</div></div>)}</div>;
  }
  return <span>{String(value)}</span>;
}

function ResultSummary({ result, emptyText, successText }: { result: unknown; emptyText?: string; successText?: string }) {
  if (!result) return <Message>{emptyText || 'Upload the required input and run the tool to view the result.'}</Message>;

  if (typeof result === 'object' && result !== null) {
    const data = result as Record<string, unknown>;
    const message = successText || (typeof data.message === 'string' ? data.message : 'Task completed successfully.');
    const primaryEntries = Object.entries(data).filter(([key]) => key !== 'message');

    return <>
      <Message type="success">{message}</Message>
      {primaryEntries.length > 0 && <div className="result-summary">{primaryEntries.map(([key, value]) => <div className="result-summary-card" key={key}><span>{titleize(key)}</span><div>{renderResultValue(value, key)}</div></div>)}</div>}
    </>;
  }

  return <Message type="success">{String(result)}</Message>;
}

function fieldsFor(slug: string): FieldConfig[] {
  const map: Record<string, FieldConfig[]> = {
    'real-pdf-compressor': [{ key: 'quality', label: 'Compression preset', type: 'select', defaultValue: 'ebook', options: [['screen', 'Smallest / screen'], ['ebook', 'Balanced / ebook'], ['printer', 'High / printer'], ['prepress', 'Highest / prepress']] }],
    'protect-pdf': [{ key: 'password', label: 'New PDF password', type: 'password' }],
    'unlock-pdf': [{ key: 'password', label: 'Current PDF password', type: 'password' }],
    'redact-pdf': [{ key: 'page', label: 'Page number', type: 'number', defaultValue: '1' }, { key: 'x', label: 'X position', type: 'number', defaultValue: '40' }, { key: 'y', label: 'Y position', type: 'number', defaultValue: '40' }, { key: 'width', label: 'Redaction width', type: 'number', defaultValue: '180' }, { key: 'height', label: 'Redaction height', type: 'number', defaultValue: '40', help: 'Coordinates use PDF points. The redaction is permanent.' }],
    'high-quality-pdf-to-images': [{ key: 'dpi', label: 'Resolution DPI', type: 'select', defaultValue: '200', options: [['150', '150 DPI'], ['200', '200 DPI'], ['300', '300 DPI'], ['600', '600 DPI']] }],
    'video-compressor': [{ key: 'crf', label: 'Compression quality (lower is higher quality)', type: 'select', defaultValue: '28', options: [['23', 'High quality'], ['28', 'Balanced'], ['32', 'Smaller file'], ['36', 'Maximum compression']] }],
    'video-converter': [{ key: 'format', label: 'Output format', type: 'select', defaultValue: 'mp4', options: [['mp4', 'MP4'], ['webm', 'WebM'], ['mov', 'MOV']] }],
    'video-trimmer': [{ key: 'start', label: 'Start time (seconds or HH:MM:SS)', defaultValue: '0' }, { key: 'duration', label: 'Duration', defaultValue: '10' }],
    'video-cropper': [{ key: 'width', label: 'Crop width', type: 'number', defaultValue: '640' }, { key: 'height', label: 'Crop height', type: 'number', defaultValue: '360' }, { key: 'x', label: 'X offset', type: 'number', defaultValue: '0' }, { key: 'y', label: 'Y offset', type: 'number', defaultValue: '0' }],
    'video-resizer': [{ key: 'width', label: 'Output width', type: 'number', defaultValue: '1280' }, { key: 'height', label: 'Output height', type: 'number', defaultValue: '720' }],
    'video-rotator': [{ key: 'angle', label: 'Rotation', type: 'select', defaultValue: '90', options: [['90', '90° clockwise'], ['180', '180°'], ['270', '270°']] }],
    'video-speed-changer': [{ key: 'speed', label: 'Speed', type: 'select', defaultValue: '1.25', options: [['0.5', '0.5×'], ['0.75', '0.75×'], ['1.25', '1.25×'], ['1.5', '1.5×'], ['2', '2×']] }],
    'video-to-gif': [{ key: 'start', label: 'Start time', defaultValue: '0' }, { key: 'duration', label: 'Duration', defaultValue: '8' }, { key: 'width', label: 'GIF width', type: 'number', defaultValue: '640' }],
    'extract-video-frames': [{ key: 'fps', label: 'Frames per second', type: 'number', defaultValue: '1' }],
    'video-watermark': [{ key: 'text', label: 'Watermark text', defaultValue: 'Dotvec Tools' }],
    'audio-converter': [{ key: 'format', label: 'Output format', type: 'select', defaultValue: 'mp3', options: [['mp3', 'MP3'], ['wav', 'WAV'], ['m4a', 'M4A'], ['ogg', 'OGG']] }],
    'audio-compressor': [{ key: 'bitrate', label: 'MP3 bitrate', type: 'select', defaultValue: '128', options: [['64', '64 kbps'], ['96', '96 kbps'], ['128', '128 kbps'], ['192', '192 kbps'], ['256', '256 kbps'], ['320', '320 kbps']] }],
    'audio-trimmer': [{ key: 'start', label: 'Start time', defaultValue: '0' }, { key: 'duration', label: 'Duration', defaultValue: '30' }],
    'audio-volume-changer': [{ key: 'volume', label: 'Volume multiplier', type: 'select', defaultValue: '1.5', options: [['0.25', '25%'], ['0.5', '50%'], ['1.5', '150%'], ['2', '200%'], ['3', '300%']] }],
    'audio-speed-changer': [{ key: 'speed', label: 'Speed', type: 'select', defaultValue: '1.25', options: [['0.5', '0.5×'], ['0.75', '0.75×'], ['1.25', '1.25×'], ['1.5', '1.5×'], ['2', '2×']] }],
    'fade-audio': [{ key: 'fade', label: 'Fade duration in seconds', type: 'number', defaultValue: '3' }],
  };
  return map[slug] || [];
}

export function BackendRunner({ slug, maxMB, category }: { slug: string; maxMB: number; category: ToolCategory }) {
  const labels = useToolRunnerText();
  const fields = useMemo(() => fieldsFor(slug), [slug]);
  const initial = useMemo(() => Object.fromEntries(fields.map((field) => [field.key, field.defaultValue || ''])), [fields]);
  const [files, setFiles] = useState<File[]>([]);
  const [url, setUrl] = useState('');
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<unknown>(null);

  async function run() {
    setBusy(true); setError(''); setResult(null);
    try {
      const form = new FormData();
      files.forEach((file) => form.append('files', file));
      if (url) form.append('url', url);
      Object.entries(values).forEach(([key, value]) => form.append(key, value));
      const response = await fetch(`/api/backend-tools/${slug}`, { method: 'POST', body: form });
      const type = response.headers.get('content-type') || '';
      if (!response.ok) {
        const message = type.includes('json') ? (await response.json()).error : await response.text();
        throw new Error(message || 'Server processing failed.');
      }
      if (type.includes('application/json')) setResult(await response.json());
      else {
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = response.headers.get('x-filename') || `dotvec-${slug}`;
        document.body.appendChild(anchor); anchor.click(); anchor.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
        setResult({ message: 'Download prepared successfully.', size: `${(blob.size / 1024 / 1024).toFixed(2)} MB` });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Server processing failed.');
    } finally { setBusy(false); }
  }

  const isUrl = urlTools.has(slug);
  const multiple = multipleTools.has(slug);
  const canRun = isUrl ? Boolean(url.trim()) : files.length > 0;

  function reset() {
    setFiles([]); setUrl(''); setValues(initial); setResult(null); setError('');
  }

  return <div className="card tool-workspace">
    <div className="panel tool-controls">
      {isUrl ? <div className="field"><label className="label">Public website URL</label><input className="input" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com" inputMode="url" /></div> : <FileInput accept={acceptFor(slug, category)} multiple={multiple} maxMB={maxMB} onFiles={setFiles} />}
      {files.length > 0 && <div className="status">{files.map((file) => `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`).join(' | ')}</div>}
      <div className={fields.length > 2 ? 'grid grid-2' : undefined}>{fields.map((field) => <div className="field" key={field.key}><label className="label" htmlFor={`field-${field.key}`}>{field.label}</label>{field.type === 'select' ? <select id={`field-${field.key}`} className="select" value={values[field.key] || ''} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}>{field.options?.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select> : <input id={`field-${field.key}`} className="input" type={field.type === 'password' ? 'password' : field.type === 'number' ? 'number' : 'text'} value={values[field.key] || ''} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))} />}{field.help && <span className="help">{field.help}</span>}</div>)}</div>
      <div className="action-row"><button className="btn btn-primary" disabled={busy || !canRun} onClick={run}>{busy ? (labels.processingButtonText || 'Processing…') : (labels.actionButtonText || (isUrl ? 'Analyze website' : 'Run tool'))}</button><ResetButton onClick={reset} /></div>
      {error && <Message type="error">{error}</Message>}
      <PrivacyNote server />
    </div>
    <div className="panel"><h3>{labels.resultTitle || 'Result'}</h3><ResultSummary result={result} emptyText={labels.resultEmptyText} successText={labels.resultSuccessText} /></div>
  </div>;
}
