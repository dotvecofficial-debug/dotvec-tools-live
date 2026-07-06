'use client';

import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import Papa from 'papaparse';
import QRCode from 'qrcode';
import { useMemo, useState } from 'react';
import { copyText, downloadText, FileInput, Message, OutputCode, PrivacyNote, ResetButton } from './ToolShell';

const encoder = new TextEncoder();
const safeJson = (input: string) => JSON.parse(input);
const htmlEncode = (value: string) => value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character] || character));
function htmlDecode(value: string) { const element = document.createElement('textarea'); element.innerHTML = value; return element.value; }
function strength(password: string) { let score = 0; if (password.length >= 12) score++; if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++; if (/\d/.test(password)) score++; if (/[^A-Za-z0-9]/.test(password)) score++; return ['Very weak', 'Weak', 'Medium', 'Strong', 'Very strong'][score]; }

export function DeveloperRunner({ slug }: { slug: string }) {
  if (slug === 'regex-tester') return <RegexTool />;
  if (slug === 'password-generator') return <PasswordTool />;
  if (slug === 'file-checksum') return <FileChecksum />;
  if (slug === 'cron-expression-generator') return <CronGenerator />;

  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [option, setOption] = useState('');
  const [qr, setQr] = useState('');

  async function process() {
    setError('');
    try {
      let out = '';
      switch (slug) {
        case 'json-formatter': { const data = safeJson(input); out = JSON.stringify(option === 'sort' ? sortObject(data) : data, null, option === '4' ? 4 : 2); break; }
        case 'json-minifier': out = JSON.stringify(safeJson(input)); break;
        case 'json-to-csv': { const data = safeJson(input); if (!Array.isArray(data)) throw new Error('JSON must be an array of objects.'); out = Papa.unparse(data); break; }
        case 'csv-to-json': { const result = Papa.parse(input, { header: true, skipEmptyLines: true }); if (result.errors.length) throw new Error(result.errors[0].message); out = JSON.stringify(result.data, null, 2); break; }
        case 'xml-formatter': { const parser = new XMLParser({ ignoreAttributes: false }); const object = parser.parse(input); const builder = new XMLBuilder({ ignoreAttributes: false, format: option !== 'minify', indentBy: '  ' }); out = builder.build(object); break; }
        case 'xml-to-json': { const parser = new XMLParser({ ignoreAttributes: false }); out = JSON.stringify(parser.parse(input), null, 2); break; }
        case 'base64-tool': out = option === 'decode' ? new TextDecoder().decode(Uint8Array.from(atob(input.trim()), (character) => character.charCodeAt(0))) : btoa(String.fromCharCode(...encoder.encode(input))); break;
        case 'url-encoder': out = option === 'decode' ? decodeURIComponent(input) : encodeURIComponent(input); break;
        case 'html-encoder': out = option === 'decode' ? htmlDecode(input) : htmlEncode(input); break;
        case 'uuid-generator': { const count = Math.min(100, Math.max(1, Number(option) || 1)); out = Array.from({ length: count }, () => crypto.randomUUID()).join('\n'); break; }
        case 'hash-generator': { const algorithm = option || 'SHA-256'; const digest = await crypto.subtle.digest(algorithm, encoder.encode(input)); out = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join(''); break; }
        case 'unix-timestamp': { if (option === 'toDate') { const value = Number(input); if (!Number.isFinite(value)) throw new Error('Enter a valid timestamp.'); out = new Date(value < 1e12 ? value * 1000 : value).toISOString(); } else { const date = new Date(input); if (Number.isNaN(date.getTime())) throw new Error('Enter a valid date.'); out = `Seconds: ${Math.floor(date.getTime() / 1000)}\nMilliseconds: ${date.getTime()}\nUTC: ${date.toISOString()}\nLocal: ${date.toString()}`; } break; }
        case 'qr-code-generator': { const data = await QRCode.toDataURL(input || 'https://example.com', { width: Number(option) || 320, margin: 2, errorCorrectionLevel: 'M' }); setQr(data); out = data; break; }
        case 'jwt-decoder': out = decodeJwt(input); break;
        case 'color-converter': out = convertColor(input); break;
        case 'html-minifier': out = input.replace(/<!--(?!\[if)[\s\S]*?-->/g, '').replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim(); break;
        case 'css-minifier': out = input.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s*([{}:;,>])\s*/g, '$1').replace(/;}/g, '}').trim(); break;
        case 'javascript-minifier': out = input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).join(' '); break;
        case 'html-formatter': out = formatHtml(input); break;
        default: out = input;
      }
      setOutput(out);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Processing failed.');
      setOutput('');
    }
  }

  if (slug === 'qr-code-generator') return <div className="card tool-workspace"><div className="panel tool-controls"><div className="field"><label className="label">Text or URL</label><textarea className="textarea" value={input} onChange={(event) => setInput(event.target.value)} /></div><div className="field"><label className="label">Size</label><input className="input" type="number" min="128" max="1024" value={option || '320'} onChange={(event) => setOption(event.target.value)} /></div><div className="action-row"><button className="btn btn-primary" onClick={process}>Generate QR code</button><ResetButton onClick={() => { setInput(''); setQr(''); setOutput(''); }} /></div>{error && <Message type="error">{error}</Message>}</div><div className="panel"><div className="preview-box">{qr ? <img src={qr} alt="Generated QR code" /> : <span className="muted">QR preview</span>}</div>{qr && <a className="btn btn-primary" style={{ marginTop: 14 }} href={qr} download="dotvec-qr-code.png">Download PNG</a>}</div></div>;

  return <div className="card tool-workspace"><div className="panel tool-controls"><div className="field"><label className="label">Input</label><textarea className="textarea" value={input} onChange={(event) => setInput(event.target.value)} placeholder={placeholder(slug)} /></div><Options slug={slug} option={option} setOption={setOption} /><div className="action-row"><button className="btn btn-primary" onClick={process}>Process</button><button className="btn btn-secondary" disabled={!output} onClick={() => copyText(output)}>Copy output</button><ResetButton onClick={() => { setInput(''); setOutput(''); setError(''); }} /></div>{error && <Message type="error">{error}</Message>}</div><div className="panel"><h3>Output</h3><OutputCode value={output} />{output && <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={() => downloadText(output, `dotvec-${slug}.${slug.includes('json') || slug === 'jwt-decoder' ? 'json' : slug.includes('csv') ? 'csv' : slug.includes('xml') ? 'xml' : slug.includes('html') ? 'html' : slug.includes('css') ? 'css' : slug.includes('javascript') ? 'js' : 'txt'}`)}>Download</button>}</div></div>;
}

function decodeJwt(value: string): string {
  const parts = value.trim().split('.');
  if (parts.length < 2) throw new Error('A JWT must contain at least a header and payload.');
  const decode = (part: string) => JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=')), (character) => character.charCodeAt(0))));
  return JSON.stringify({ header: decode(parts[0]), payload: decode(parts[1]), signaturePresent: Boolean(parts[2]) }, null, 2);
}

function convertColor(value: string): string {
  const input = value.trim();
  if (/^#?[0-9a-f]{6}$/i.test(input)) {
    const hex = input.replace('#', ''); const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
    const [h, s, l] = rgbToHsl(r, g, b);
    return `HEX: #${hex.toUpperCase()}\nRGB: rgb(${r}, ${g}, ${b})\nHSL: hsl(${h}, ${s}%, ${l}%)`;
  }
  const match = input.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (match) { const [r, g, b] = match.slice(1).map(Number); if ([r, g, b].some((number) => number > 255)) throw new Error('RGB values must be between 0 and 255.'); const hex = `#${[r, g, b].map((number) => number.toString(16).padStart(2, '0')).join('').toUpperCase()}`; const [h, s, l] = rgbToHsl(r, g, b); return `HEX: ${hex}\nRGB: rgb(${r}, ${g}, ${b})\nHSL: hsl(${h}, ${s}%, ${l}%)`; }
  throw new Error('Enter a six-digit HEX color or rgb(r,g,b).');
}
function rgbToHsl(r: number, g: number, b: number): [number, number, number] { r /= 255; g /= 255; b /= 255; const max = Math.max(r, g, b), min = Math.min(r, g, b); let h = 0, s = 0; const l = (max + min) / 2; if (max !== min) { const d = max - min; s = l > .5 ? d / (2 - max - min) : d / (max + min); switch (max) { case r: h = (g - b) / d + (g < b ? 6 : 0); break; case g: h = (b - r) / d + 2; break; default: h = (r - g) / d + 4; } h /= 6; } return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]; }

function formatHtml(input: string) { const tokens = input.replace(/>\s+</g, '><').split(/(?=<)|(?<=>)/).filter(Boolean); let depth = 0; const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']); return tokens.map((token) => { const trimmed = token.trim(); if (/^<\//.test(trimmed)) depth = Math.max(0, depth - 1); const line = `${'  '.repeat(depth)}${trimmed}`; const tag = trimmed.match(/^<([a-z0-9-]+)/i)?.[1]?.toLowerCase(); if (tag && !trimmed.startsWith('</') && !trimmed.endsWith('/>') && !voidTags.has(tag) && !trimmed.startsWith('<!')) depth++; return line; }).join('\n'); }
function sortObject(value: unknown): unknown { if (Array.isArray(value)) return value.map(sortObject); if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, sortObject(child)])); return value; }
function placeholder(slug: string) { if (slug.includes('json')) return '[{"name":"Dotvec","type":"tool"}]'; if (slug.includes('csv')) return 'name,type\nDotvec,tool'; if (slug.includes('xml')) return '<root><item>Value</item></root>'; if (slug === 'unix-timestamp') return new Date().toISOString(); if (slug === 'jwt-decoder') return 'eyJ...'; if (slug === 'color-converter') return '#6D5DFB or rgb(109,93,251)'; return 'Enter input…'; }
function Options({ slug, option, setOption }: { slug: string; option: string; setOption: (value: string) => void }) { if (slug === 'json-formatter') return <div className="field"><label className="label">Formatting option</label><select className="select" value={option || '2'} onChange={(event) => setOption(event.target.value)}><option value="2">2-space indentation</option><option value="4">4-space indentation</option><option value="sort">Sort keys</option></select></div>; if (['base64-tool', 'url-encoder', 'html-encoder'].includes(slug)) return <div className="field"><label className="label">Mode</label><select className="select" value={option || 'encode'} onChange={(event) => setOption(event.target.value)}><option value="encode">Encode</option><option value="decode">Decode</option></select></div>; if (slug === 'xml-formatter') return <div className="field"><label className="label">Mode</label><select className="select" value={option || 'format'} onChange={(event) => setOption(event.target.value)}><option value="format">Format</option><option value="minify">Minify</option></select></div>; if (slug === 'uuid-generator') return <div className="field"><label className="label">Quantity</label><input className="input" type="number" min="1" max="100" value={option || '5'} onChange={(event) => setOption(event.target.value)} /></div>; if (slug === 'hash-generator') return <div className="field"><label className="label">Algorithm</label><select className="select" value={option || 'SHA-256'} onChange={(event) => setOption(event.target.value)}><option>SHA-1</option><option>SHA-256</option><option>SHA-384</option><option>SHA-512</option></select></div>; if (slug === 'unix-timestamp') return <div className="field"><label className="label">Conversion</label><select className="select" value={option || 'toTimestamp'} onChange={(event) => setOption(event.target.value)}><option value="toTimestamp">Date to timestamp</option><option value="toDate">Timestamp to date</option></select></div>; return null; }

function RegexTool() { const [pattern, setPattern] = useState('\\btool\\w*'); const [flags, setFlags] = useState('gi'); const [text, setText] = useState('Dotvec Tools contains useful tools.'); const result = useMemo(() => { try { const regex = new RegExp(pattern, flags.includes('g') ? flags : `${flags}g`); return { matches: [...text.matchAll(regex)].map((match) => ({ value: match[0], index: match.index ?? 0 })), error: '' }; } catch (cause) { return { matches: [], error: cause instanceof Error ? cause.message : 'Invalid regular expression' }; } }, [pattern, flags, text]); return <div className="card tool-workspace"><div className="panel tool-controls"><div className="field"><label className="label">Pattern</label><input className="input" value={pattern} onChange={(event) => setPattern(event.target.value)} /></div><div className="field"><label className="label">Flags</label><input className="input" value={flags} onChange={(event) => setFlags(event.target.value)} /></div><div className="field"><label className="label">Test text</label><textarea className="textarea" value={text} onChange={(event) => setText(event.target.value)} /></div>{result.error && <Message type="error">{result.error}</Message>}</div><div className="panel"><h3>{result.matches.length} matches</h3><OutputCode value={result.matches.map((match) => `${match.index}: ${match.value}`).join('\n')} /></div></div>; }
function PasswordTool() { const [length, setLength] = useState(20); const [value, setValue] = useState(''); function generate() { const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()-_=+'; const random = new Uint32Array(length); crypto.getRandomValues(random); setValue([...random].map((number) => chars[number % chars.length]).join('')); } return <div className="card tool-workspace"><div className="panel tool-controls"><div className="field"><label className="label">Length: {length}</label><input className="range" type="range" min="8" max="64" value={length} onChange={(event) => setLength(Number(event.target.value))} /></div><div className="action-row"><button className="btn btn-primary" onClick={generate}>Generate password</button><button className="btn btn-secondary" disabled={!value} onClick={() => copyText(value)}>Copy</button></div><Message>Passwords are generated locally and are never stored.</Message></div><div className="panel"><h3>{value ? strength(value) : 'Password result'}</h3><OutputCode value={value} /></div></div>; }
function FileChecksum() { const [file, setFile] = useState<File | null>(null); const [algorithm, setAlgorithm] = useState('SHA-256'); const [output, setOutput] = useState(''); const [busy, setBusy] = useState(false); async function run() { if (!file) return; setBusy(true); const digest = await crypto.subtle.digest(algorithm, await file.arrayBuffer()); setOutput([...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')); setBusy(false); } return <div className="card tool-workspace"><div className="panel"><FileInput maxMB={500} onFiles={(files) => setFile(files[0])} /><div className="field"><label className="label">Algorithm</label><select className="select" value={algorithm} onChange={(event) => setAlgorithm(event.target.value)}><option>SHA-1</option><option>SHA-256</option><option>SHA-384</option><option>SHA-512</option></select></div><button className="btn btn-primary" disabled={!file || busy} onClick={run}>{busy ? 'Calculating…' : 'Calculate checksum'}</button><PrivacyNote /></div><div className="panel"><OutputCode value={output} />{output && <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={() => copyText(output)}>Copy checksum</button>}</div></div>; }
function CronGenerator() { const [frequency, setFrequency] = useState('daily'); const [minute, setMinute] = useState(0); const [hour, setHour] = useState(9); const [day, setDay] = useState(1); const expression = frequency === 'hourly' ? `${minute} * * * *` : frequency === 'weekly' ? `${minute} ${hour} * * ${day}` : frequency === 'monthly' ? `${minute} ${hour} ${day} * *` : `${minute} ${hour} * * *`; return <div className="card tool-workspace"><div className="panel"><div className="field"><label className="label">Frequency</label><select className="select" value={frequency} onChange={(event) => setFrequency(event.target.value)}><option value="hourly">Hourly</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></div><div className="grid grid-3"><div className="field"><label className="label">Minute</label><input className="input" type="number" min="0" max="59" value={minute} onChange={(event) => setMinute(Number(event.target.value))} /></div>{frequency !== 'hourly' && <div className="field"><label className="label">Hour</label><input className="input" type="number" min="0" max="23" value={hour} onChange={(event) => setHour(Number(event.target.value))} /></div>}{['weekly', 'monthly'].includes(frequency) && <div className="field"><label className="label">{frequency === 'weekly' ? 'Weekday 0–6' : 'Day 1–31'}</label><input className="input" type="number" value={day} onChange={(event) => setDay(Number(event.target.value))} /></div>}</div></div><div className="panel"><OutputCode value={expression} /><button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={() => copyText(expression)}>Copy expression</button></div></div>; }
