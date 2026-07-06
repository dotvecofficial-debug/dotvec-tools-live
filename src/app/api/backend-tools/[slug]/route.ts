import { NextRequest, NextResponse } from 'next/server';
import { createReadStream } from 'node:fs';
import { promises as fs } from 'node:fs';
import { spawn } from 'node:child_process';
import { lookup } from 'node:dns/promises';
import { Readable } from 'node:stream';
import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { getTool } from '@/lib/tools';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const urlTools = new Set(['website-seo-audit', 'broken-link-checker', 'website-meta-checker', 'heading-checker', 'image-alt-checker', 'redirect-checker', 'robots-checker', 'sitemap-checker', 'website-link-extractor', 'page-size-checker']);
const pythonScript = path.join(process.cwd(), 'scripts', 'pdf_ops.py');

function safeName(name: string) { return name.replace(/[^A-Za-z0-9._-]/g, '_').slice(-140) || 'input.bin'; }
function formValue(form: FormData, key: string, fallback = '') { return String(form.get(key) ?? fallback).trim(); }
function numberValue(form: FormData, key: string, fallback: number, min = -Infinity, max = Infinity) { const value = Number(form.get(key)); return Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback; }

async function run(command: string, args: string[], cwd: string, timeoutMs = 10 * 60 * 1000) {
  return await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    let stdout = '', stderr = '';
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error(`${command} timed out.`)); }, timeoutMs);
    child.stdout.on('data', (data) => { stdout += String(data); });
    child.stderr.on('data', (data) => { stderr += String(data); });
    child.on('error', (error) => { clearTimeout(timer); reject(new Error(`${command} is not installed or could not start: ${error.message}`)); });
    child.on('close', (code) => { clearTimeout(timer); code === 0 ? resolve({ stdout, stderr }) : reject(new Error(`${command} failed: ${(stderr || stdout || `exit code ${code}`).slice(-3000)}`)); });
  });
}

async function writeFiles(form: FormData, dir: string) {
  const items = form.getAll('files').filter((item): item is File => item instanceof File);
  const max = (Number(process.env.MAX_BACKEND_UPLOAD_MB) || 750) * 1024 * 1024;
  const paths: string[] = [];
  for (const file of items) {
    if (file.size > max) throw new Error(`File exceeds the ${Math.round(max / 1024 / 1024)} MB VPS limit.`);
    if (file.size === 0) throw new Error(`${file.name} is empty.`);
    const filePath = path.join(dir, `${crypto.randomUUID()}-${safeName(file.name)}`);
    await fs.writeFile(filePath, Buffer.from(await file.arrayBuffer()));
    paths.push(filePath);
  }
  return paths;
}

function contentType(filename: string) {
  const extension = path.extname(filename).toLowerCase();
  const types: Record<string, string> = { '.pdf': 'application/pdf', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation', '.html': 'text/html; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.csv': 'text/csv; charset=utf-8', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime', '.gif': 'image/gif', '.png': 'image/png', '.jpg': 'image/jpeg', '.zip': 'application/zip' };
  return types[extension] || 'application/octet-stream';
}

function streamFile(file: string, cleanupDir: string) {
  const filename = safeName(path.basename(file).replace(/^[a-f0-9-]+-/, ''));
  const stream = createReadStream(file);
  stream.once('close', () => setTimeout(() => fs.rm(cleanupDir, { recursive: true, force: true }).catch(() => {}), 5_000));
  setTimeout(() => fs.rm(cleanupDir, { recursive: true, force: true }).catch(() => {}), 30 * 60 * 1000);
  return new NextResponse(Readable.toWeb(stream) as ReadableStream, { headers: { 'content-type': contentType(filename), 'content-disposition': `attachment; filename="${filename}"`, 'x-filename': filename, 'cache-control': 'no-store' } });
}

async function zipFiles(dir: string, output: string, files: string[]) {
  if (!files.length) throw new Error('No output files were generated.');
  await run('zip', ['-j', '-9', output, ...files], dir, 20 * 60 * 1000);
  return output;
}

async function regularFiles(dir: string, exclude: string[] = []) {
  const entries = await fs.readdir(dir);
  const result: string[] = [];
  for (const entry of entries) {
    const file = path.join(dir, entry);
    const stat = await fs.stat(file);
    if (stat.isFile() && stat.size > 0 && !exclude.includes(file)) result.push(file);
  }
  return result;
}

function isPrivateIp(address: string) {
  if (address.includes(':')) return address === '::1' || address.startsWith('fc') || address.startsWith('fd') || address.startsWith('fe80:');
  const parts = address.split('.').map(Number);
  return parts[0] === 10 || parts[0] === 127 || (parts[0] === 169 && parts[1] === 254) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168) || parts[0] === 0;
}

async function assertHttpUrl(value: string) {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error('Enter a valid public URL.'); }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only HTTP and HTTPS URLs are allowed.');
  if (url.username || url.password) throw new Error('URLs containing credentials are not allowed.');
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.local')) throw new Error('Private network URLs are not allowed.');
  const addresses = await lookup(host, { all: true });
  if (!addresses.length || addresses.some((item) => isPrivateIp(item.address))) throw new Error('Private network URLs are not allowed.');
  return url;
}

async function fetchPublic(url: URL, options: RequestInit = {}) {
  const response = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'DotvecToolsAudit/2.0', accept: 'text/html,application/xml,text/plain,*/*' }, signal: AbortSignal.timeout(25_000), ...options });
  const length = Number(response.headers.get('content-length') || 0);
  if (length > 12 * 1024 * 1024) throw new Error('The response is larger than the 12 MB audit limit.');
  return response;
}

function stripTags(value: string) { return value.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); }
function metaContent(html: string, selector: string) { const patterns = selector === 'description' ? [/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i] : [new RegExp(`<meta[^>]+property=["']${selector}["'][^>]+content=["']([^"']*)`, 'i'), new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${selector}["']`, 'i')]; return patterns.map((pattern) => html.match(pattern)?.[1]).find(Boolean) || ''; }
function parseHtml(html: string, base: URL) {
  const title = stripTags(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
  const description = metaContent(html, 'description');
  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)/i)?.[1] || '';
  const headings = [...html.matchAll(/<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi)].map((match) => ({ level: match[1].toLowerCase(), text: stripTags(match[2]) })).slice(0, 200);
  const images = [...html.matchAll(/<img\b([^>]*)>/gi)].map((match) => { const attrs = match[1]; return { src: attrs.match(/\bsrc=["']([^"']*)/i)?.[1] || '', alt: attrs.match(/\balt=["']([^"']*)/i)?.[1] ?? null }; }).slice(0, 500);
  const links = new Set<string>();
  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["']/gi)) { try { const url = new URL(match[1], base); if (['http:', 'https:'].includes(url.protocol)) links.add(url.toString()); } catch {} }
  return { title, description, canonical, headings, images, links: [...links].slice(0, 500), openGraph: { title: metaContent(html, 'og:title'), description: metaContent(html, 'og:description'), image: metaContent(html, 'og:image') } };
}

async function handleUrlTool(slug: string, form: FormData) {
  const url = await assertHttpUrl(formValue(form, 'url'));
  if (slug === 'redirect-checker') {
    const chain: Array<{ url: string; status: number; location: string | null }> = [];
    let current = url;
    for (let index = 0; index < 10; index++) {
      const response = await fetch(current, { redirect: 'manual', headers: { 'user-agent': 'DotvecToolsAudit/2.0' }, signal: AbortSignal.timeout(20_000) });
      const location = response.headers.get('location'); chain.push({ url: current.toString(), status: response.status, location });
      if (!location || response.status < 300 || response.status >= 400) break;
      current = await assertHttpUrl(new URL(location, current).toString());
    }
    return NextResponse.json({ chain, finalUrl: chain.at(-1)?.url });
  }
  if (slug === 'robots-checker') { const target = new URL('/robots.txt', url); const response = await fetchPublic(target); return NextResponse.json({ url: target.toString(), status: response.status, contentType: response.headers.get('content-type'), content: (await response.text()).slice(0, 200_000) }); }
  if (slug === 'sitemap-checker') { const target = url.pathname.endsWith('.xml') ? url : new URL('/sitemap.xml', url); const response = await fetchPublic(target); const content = await response.text(); return NextResponse.json({ url: target.toString(), status: response.status, contentType: response.headers.get('content-type'), urlCount: (content.match(/<loc>/gi) || []).length, preview: content.slice(0, 100_000) }); }

  const response = await fetchPublic(url);
  const html = await response.text();
  const parsed = parseHtml(html, new URL(response.url));
  if (slug === 'broken-link-checker') {
    const results: Array<{ url: string; status: number; ok: boolean }> = [];
    for (const link of parsed.links.slice(0, 75)) { try { let checked = await fetch(link, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(12_000), headers: { 'user-agent': 'DotvecToolsAudit/2.0' } }); if (checked.status === 405) checked = await fetch(link, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(12_000), headers: { 'user-agent': 'DotvecToolsAudit/2.0' } }); results.push({ url: link, status: checked.status, ok: checked.ok }); } catch { results.push({ url: link, status: 0, ok: false }); } }
    return NextResponse.json({ page: response.url, total: results.length, broken: results.filter((item) => !item.ok), results });
  }
  if (slug === 'website-meta-checker') return NextResponse.json({ url: response.url, status: response.status, title: parsed.title, description: parsed.description, canonical: parsed.canonical, openGraph: parsed.openGraph });
  if (slug === 'heading-checker') return NextResponse.json({ url: response.url, headings: parsed.headings, counts: Object.fromEntries(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((level) => [level, parsed.headings.filter((heading) => heading.level === level).length])) });
  if (slug === 'image-alt-checker') return NextResponse.json({ url: response.url, total: parsed.images.length, missing: parsed.images.filter((image) => image.alt === null || image.alt.trim() === ''), images: parsed.images });
  if (slug === 'website-link-extractor') { const origin = new URL(response.url).origin; return NextResponse.json({ url: response.url, total: parsed.links.length, internal: parsed.links.filter((link) => new URL(link).origin === origin), external: parsed.links.filter((link) => new URL(link).origin !== origin) }); }
  if (slug === 'page-size-checker') return NextResponse.json({ url: response.url, status: response.status, htmlBytes: new TextEncoder().encode(html).byteLength, contentType: response.headers.get('content-type'), contentEncoding: response.headers.get('content-encoding'), cacheControl: response.headers.get('cache-control') });
  return NextResponse.json({ url: response.url, status: response.status, contentType: response.headers.get('content-type'), title: parsed.title, titleLength: parsed.title.length, description: parsed.description, descriptionLength: parsed.description.length, canonical: parsed.canonical, h1Count: parsed.headings.filter((heading) => heading.level === 'h1').length, headings: parsed.headings.slice(0, 50), imageCount: parsed.images.length, imagesWithoutAlt: parsed.images.filter((image) => image.alt === null || image.alt.trim() === '').length, linksFound: parsed.links.length, openGraph: parsed.openGraph });
}

async function probeDuration(input: string, dir: string) { const result = await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', input], dir); return Number(result.stdout.trim()) || 0; }
function ffmpegText(value: string) { return value.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\'").replace(/,/g, '\\,').replace(/%/g, '\\%'); }
async function findConverted(dir: string, extension: string, exclude: string[]) { const files = await regularFiles(dir, exclude); const found = files.find((file) => path.extname(file).toLowerCase() === extension.toLowerCase()); if (!found) throw new Error(`The converter did not produce a ${extension} file.`); return found; }

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool || tool.processingMode !== 'server' || tool.category === 'social') return NextResponse.json({ error: 'Unknown backend tool.' }, { status: 404 });
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'dotvec-'));
  let handedOff = false;
  try {
    const form = await request.formData();
    if (urlTools.has(slug)) return await handleUrlTool(slug, form);
    const files = await writeFiles(form, dir);
    if (!files.length) throw new Error('Select the required file or files.');
    const input = files[0];
    let output = path.join(dir, `dotvec-${slug}`);

    switch (slug) {
      case 'real-pdf-compressor': { const preset = ['screen', 'ebook', 'printer', 'prepress'].includes(formValue(form, 'quality')) ? formValue(form, 'quality') : 'ebook'; output += '.pdf'; await run('gs', ['-sDEVICE=pdfwrite', '-dCompatibilityLevel=1.4', `-dPDFSETTINGS=/${preset}`, '-dNOPAUSE', '-dQUIET', '-dBATCH', `-sOutputFile=${output}`, input], dir); break; }
      case 'repair-pdf': case 'linearize-pdf': output += '.pdf'; await run('qpdf', ['--linearize', input, output], dir); break;
      case 'protect-pdf': { const password = formValue(form, 'password'); if (!password) throw new Error('Enter a password.'); output += '.pdf'; await run('qpdf', ['--encrypt', password, password, '256', '--', input, output], dir); break; }
      case 'unlock-pdf': { output += '.pdf'; await run('qpdf', [`--password=${formValue(form, 'password')}`, '--decrypt', input, output], dir); break; }
      case 'pdf-ocr': output += '.pdf'; await run('ocrmypdf', ['--skip-text', '--optimize', '1', input, output], dir, 30 * 60 * 1000); break;
      case 'pdf-to-pdfa': output += '.pdf'; await run('ocrmypdf', ['--skip-text', '--output-type', 'pdfa-2', input, output], dir, 30 * 60 * 1000); break;
      case 'grayscale-pdf': output += '.pdf'; await run('gs', ['-sDEVICE=pdfwrite', '-dProcessColorModel=/DeviceGray', '-dColorConversionStrategy=/Gray', '-dOverrideICC', '-dNOPAUSE', '-dBATCH', `-sOutputFile=${output}`, input], dir); break;
      case 'redact-pdf': { output += '.pdf'; const page = numberValue(form, 'page', 1, 1); const rect = [numberValue(form, 'x', 40, 0), numberValue(form, 'y', 40, 0), numberValue(form, 'width', 180, 1), numberValue(form, 'height', 40, 1)].map(String); await run('python3', [pythonScript, 'redact', input, output, '--page', String(page), '--rect', ...rect], dir); break; }
      case 'compare-pdf': if (files.length < 2) throw new Error('Select two PDF files.'); output += '.txt'; await run('python3', [pythonScript, 'compare', files[0], files[1], output], dir); break;
      case 'extract-images-pdf': { const prefix = path.join(dir, 'image'); await run('pdfimages', ['-all', input, prefix], dir); output += '.zip'; const generated = (await regularFiles(dir, files)).filter((file) => file !== output); await zipFiles(dir, output, generated); break; }
      case 'pdf-to-html': { const htmlOutput = path.join(dir, 'document.html'); await run('pdftohtml', ['-c', '-hidden', '-noframes', input, htmlOutput], dir); output += '.zip'; const generated = (await regularFiles(dir, files)).filter((file) => file !== output); await zipFiles(dir, output, generated); break; }
      case 'pdf-info': { const result = await run('pdfinfo', [input], dir); return NextResponse.json({ report: result.stdout }); }
      case 'pdf-fonts-analyzer': { const result = await run('pdffonts', [input], dir); return NextResponse.json({ report: result.stdout }); }
      case 'pdf-to-word': output += '.docx'; await run('python3', [pythonScript, 'pdf-to-word', input, output], dir, 20 * 60 * 1000); break;
      case 'pdf-to-excel': output += '.xlsx'; await run('python3', [pythonScript, 'pdf-to-excel', input, output], dir, 20 * 60 * 1000); break;
      case 'pdf-to-powerpoint': output += '.pptx'; await run('python3', [pythonScript, 'pdf-to-powerpoint', input, output], dir, 30 * 60 * 1000); break;
      case 'high-quality-pdf-to-images': { const dpi = numberValue(form, 'dpi', 200, 72, 600); const prefix = path.join(dir, 'page'); await run('pdftoppm', ['-png', '-r', String(dpi), input, prefix], dir, 30 * 60 * 1000); output += '.zip'; const generated = (await regularFiles(dir, files)).filter((file) => file !== output); await zipFiles(dir, output, generated); break; }
      case 'word-to-pdf': case 'excel-to-pdf': case 'powerpoint-to-pdf': { await run('libreoffice', ['--headless', '--convert-to', 'pdf', '--outdir', dir, input], dir, 20 * 60 * 1000); output = await findConverted(dir, '.pdf', files); break; }
      case 'docx-to-text': output += '.txt'; await run('python3', [pythonScript, 'docx-to-text', input, output], dir); break;
      case 'docx-to-html': { await run('libreoffice', ['--headless', '--convert-to', 'html', '--outdir', dir, input], dir); output = await findConverted(dir, '.html', files); break; }
      case 'xlsx-to-csv': output += '.csv'; await run('python3', [pythonScript, 'xlsx-to-csv', input, output], dir); break;
      case 'csv-to-xlsx': output += '.xlsx'; await run('python3', [pythonScript, 'csv-to-xlsx', input, output], dir); break;
      case 'video-compressor': { output += '.mp4'; const crf = numberValue(form, 'crf', 28, 18, 40); await run('ffmpeg', ['-y', '-i', input, '-c:v', 'libx264', '-crf', String(crf), '-preset', 'medium', '-c:a', 'aac', '-b:a', '128k', output], dir, 30 * 60 * 1000); break; }
      case 'video-converter': { const format = ['mp4', 'webm', 'mov'].includes(formValue(form, 'format')) ? formValue(form, 'format') : 'mp4'; output += `.${format}`; const args = format === 'webm' ? ['-c:v', 'libvpx-vp9', '-c:a', 'libopus'] : ['-c:v', 'libx264', '-c:a', 'aac']; await run('ffmpeg', ['-y', '-i', input, ...args, output], dir, 30 * 60 * 1000); break; }
      case 'video-trimmer': { output += '.mp4'; await run('ffmpeg', ['-y', '-ss', formValue(form, 'start', '0'), '-i', input, '-t', formValue(form, 'duration', '10'), '-c:v', 'libx264', '-c:a', 'aac', output], dir, 30 * 60 * 1000); break; }
      case 'video-cropper': { output += '.mp4'; const filter = `crop=${numberValue(form, 'width', 640, 2)}:${numberValue(form, 'height', 360, 2)}:${numberValue(form, 'x', 0, 0)}:${numberValue(form, 'y', 0, 0)}`; await run('ffmpeg', ['-y', '-i', input, '-vf', filter, '-c:a', 'copy', output], dir, 30 * 60 * 1000); break; }
      case 'video-resizer': { output += '.mp4'; const width = numberValue(form, 'width', 1280, 2), height = numberValue(form, 'height', 720, 2); await run('ffmpeg', ['-y', '-i', input, '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`, '-c:v', 'libx264', '-c:a', 'aac', output], dir, 30 * 60 * 1000); break; }
      case 'video-rotator': { output += '.mp4'; const angle = formValue(form, 'angle', '90'); const filter = angle === '180' ? 'hflip,vflip' : angle === '270' ? 'transpose=2' : 'transpose=1'; await run('ffmpeg', ['-y', '-i', input, '-vf', filter, '-c:a', 'copy', output], dir, 30 * 60 * 1000); break; }
      case 'video-speed-changer': { output += '.mp4'; const speed = numberValue(form, 'speed', 1.25, .5, 2); await run('ffmpeg', ['-y', '-i', input, '-filter_complex', `[0:v]setpts=${1 / speed}*PTS[v];[0:a]atempo=${speed}[a]`, '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-c:a', 'aac', output], dir, 30 * 60 * 1000); break; }
      case 'mute-video': output += '.mp4'; await run('ffmpeg', ['-y', '-i', input, '-c:v', 'copy', '-an', output], dir); break;
      case 'video-to-gif': { output += '.gif'; const width = numberValue(form, 'width', 640, 120, 1200); await run('ffmpeg', ['-y', '-ss', formValue(form, 'start', '0'), '-t', formValue(form, 'duration', '8'), '-i', input, '-vf', `fps=12,scale=${width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`, output], dir, 30 * 60 * 1000); break; }
      case 'extract-video-frames': { const fps = numberValue(form, 'fps', 1, .1, 30); const pattern = path.join(dir, 'frame-%05d.jpg'); await run('ffmpeg', ['-y', '-i', input, '-vf', `fps=${fps}`, '-q:v', '2', pattern], dir, 30 * 60 * 1000); output += '.zip'; const generated = (await regularFiles(dir, files)).filter((file) => file !== output); await zipFiles(dir, output, generated); break; }
      case 'video-watermark': { output += '.mp4'; const value = ffmpegText(formValue(form, 'text', 'Dotvec Tools')); await run('ffmpeg', ['-y', '-i', input, '-vf', `drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='${value}':x=w-tw-24:y=h-th-24:fontsize=28:fontcolor=white@0.8:box=1:boxcolor=black@0.35`, '-c:a', 'copy', output], dir, 30 * 60 * 1000); break; }
      case 'add-audio-to-video': { if (files.length < 2) throw new Error('Select a video and an audio file.'); const video = files.find((file) => /\.(mp4|mov|mkv|webm)$/i.test(file)) || files[0]; const audio = files.find((file) => /\.(mp3|wav|m4a|ogg|aac)$/i.test(file)); if (!audio) throw new Error('An audio file is required.'); output += '.mp4'; await run('ffmpeg', ['-y', '-i', video, '-i', audio, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-shortest', output], dir, 30 * 60 * 1000); break; }
      case 'merge-videos': { if (files.length < 2) throw new Error('Select at least two videos.'); const list = path.join(dir, 'videos.txt'); await fs.writeFile(list, files.map((file) => `file '${file.replace(/'/g, "'\\''")}'`).join('\n')); output += '.mp4'; await run('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', list, '-c:v', 'libx264', '-c:a', 'aac', output], dir, 45 * 60 * 1000); break; }
      case 'add-subtitles': { if (files.length < 2) throw new Error('Select a video and an SRT or VTT file.'); const video = files.find((file) => /\.(mp4|mov|mkv|webm)$/i.test(file)) || files[0]; const subtitle = files.find((file) => /\.(srt|vtt)$/i.test(file)); if (!subtitle) throw new Error('An SRT or VTT subtitle file is required.'); output += '.mp4'; await run('ffmpeg', ['-y', '-i', video, '-vf', `subtitles='${subtitle.replace(/'/g, "\\'")}'`, '-c:a', 'copy', output], dir, 30 * 60 * 1000); break; }
      case 'video-to-mp3': output += '.mp3'; await run('ffmpeg', ['-y', '-i', input, '-vn', '-c:a', 'libmp3lame', '-q:a', '2', output], dir, 30 * 60 * 1000); break;
      case 'audio-converter': { const format = ['mp3', 'wav', 'm4a', 'ogg'].includes(formValue(form, 'format')) ? formValue(form, 'format') : 'mp3'; output += `.${format}`; const codec = format === 'wav' ? ['-c:a', 'pcm_s16le'] : format === 'm4a' ? ['-c:a', 'aac'] : format === 'ogg' ? ['-c:a', 'libvorbis'] : ['-c:a', 'libmp3lame', '-q:a', '2']; await run('ffmpeg', ['-y', '-i', input, ...codec, output], dir); break; }
      case 'audio-compressor': { output += '.mp3'; const bitrate = `${numberValue(form, 'bitrate', 128, 32, 320)}k`; await run('ffmpeg', ['-y', '-i', input, '-c:a', 'libmp3lame', '-b:a', bitrate, output], dir); break; }
      case 'audio-trimmer': output += '.mp3'; await run('ffmpeg', ['-y', '-ss', formValue(form, 'start', '0'), '-i', input, '-t', formValue(form, 'duration', '30'), '-c:a', 'libmp3lame', '-q:a', '2', output], dir); break;
      case 'audio-merger': { if (files.length < 2) throw new Error('Select at least two audio files.'); const list = path.join(dir, 'audio.txt'); await fs.writeFile(list, files.map((file) => `file '${file.replace(/'/g, "'\\''")}'`).join('\n')); output += '.mp3'; await run('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', list, '-c:a', 'libmp3lame', '-q:a', '2', output], dir); break; }
      case 'audio-volume-changer': output += '.mp3'; await run('ffmpeg', ['-y', '-i', input, '-af', `volume=${numberValue(form, 'volume', 1.5, 0, 10)}`, '-c:a', 'libmp3lame', '-q:a', '2', output], dir); break;
      case 'audio-speed-changer': output += '.mp3'; await run('ffmpeg', ['-y', '-i', input, '-af', `atempo=${numberValue(form, 'speed', 1.25, .5, 2)}`, '-c:a', 'libmp3lame', '-q:a', '2', output], dir); break;
      case 'reverse-audio': output += '.mp3'; await run('ffmpeg', ['-y', '-i', input, '-af', 'areverse', '-c:a', 'libmp3lame', '-q:a', '2', output], dir); break;
      case 'fade-audio': { output += '.mp3'; const duration = await probeDuration(input, dir); const fade = numberValue(form, 'fade', 3, .1, Math.max(.1, duration / 2)); await run('ffmpeg', ['-y', '-i', input, '-af', `afade=t=in:st=0:d=${fade},afade=t=out:st=${Math.max(0, duration - fade)}:d=${fade}`, '-c:a', 'libmp3lame', '-q:a', '2', output], dir); break; }
      case 'remove-audio-metadata': { const extension = path.extname(input) || '.mp3'; output += extension; await run('ffmpeg', ['-y', '-i', input, '-map_metadata', '-1', '-c', 'copy', output], dir); break; }
      default: throw new Error('This VPS tool has no processing implementation.');
    }

    await fs.access(output);
    handedOff = true;
    return streamFile(output, dir);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Server processing failed.' }, { status: 400 });
  } finally {
    if (!handedOff) setTimeout(() => fs.rm(dir, { recursive: true, force: true }).catch(() => {}), 1_000);
  }
}
