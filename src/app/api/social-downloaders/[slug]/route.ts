import { NextRequest, NextResponse } from 'next/server';
import { createReadStream } from 'node:fs';
import { promises as fs } from 'node:fs';
import { spawn } from 'node:child_process';
import { Readable } from 'node:stream';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const domains: Record<string, string[]> = {
  'youtube-video-downloader': ['youtube.com', 'youtu.be', 'youtube-nocookie.com'],
  'youtube-shorts-downloader': ['youtube.com', 'youtu.be'],
  'youtube-playlist-downloader': ['youtube.com', 'youtu.be'],
  'youtube-mp3-downloader': ['youtube.com', 'youtu.be', 'youtube-nocookie.com'],
  'youtube-thumbnail-downloader': ['youtube.com', 'youtu.be', 'youtube-nocookie.com'],
  'instagram-post-downloader': ['instagram.com'],
  'instagram-reels-downloader': ['instagram.com'],
  'instagram-story-downloader': ['instagram.com'],
  'facebook-video-downloader': ['facebook.com', 'fb.watch'],
  'facebook-reels-downloader': ['facebook.com', 'fb.watch'],
  'tiktok-video-downloader': ['tiktok.com'],
  'twitter-video-downloader': ['x.com', 'twitter.com'],
  'pinterest-media-downloader': ['pinterest.com', 'pin.it'],
  'reddit-video-downloader': ['reddit.com', 'redd.it'],
  'vimeo-video-downloader': ['vimeo.com'],
  'dailymotion-video-downloader': ['dailymotion.com', 'dai.ly'],
  'soundcloud-audio-downloader': ['soundcloud.com'],
  'twitch-clip-downloader': ['twitch.tv', 'clips.twitch.tv'],
  'threads-media-downloader': ['threads.net', 'threads.com'],
};

const universalDomains = [...new Set(Object.values(domains).flat())];
const knownSlugs = new Set(['universal-media-downloader', ...Object.keys(domains)]);

function hostnameMatches(hostname: string, allowed: string[]): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, '');
  return allowed.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

function validateUrl(raw: string, slug: string): URL {
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error('Enter a valid public media URL.'); }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only HTTP and HTTPS URLs are supported.');
  const allowed = slug === 'universal-media-downloader' ? universalDomains : domains[slug];
  if (!allowed || !hostnameMatches(url.hostname, allowed)) throw new Error('This URL does not match the selected social platform.');
  return url;
}

async function run(command: string, args: string[], cwd: string, timeoutMs = 15 * 60 * 1000): Promise<{ stdout: string; stderr: string }> {
  return await new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('The download timed out. Try a shorter item or lower quality.'));
    }, timeoutMs);
    child.stdout.on('data', (data) => { stdout += String(data); });
    child.stderr.on('data', (data) => { stderr += String(data); });
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(new Error(`${command} is not installed or could not start: ${error.message}`));
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error((stderr || stdout || `Downloader exited with code ${code}`).slice(-3000)));
    });
  });
}

function safeDownloadName(name: string): string {
  return name.replace(/[^A-Za-z0-9._()\- ]/g, '_').slice(-180) || 'dotvec-download.bin';
}

function contentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const types: Record<string, string> = {
    '.mp4': 'video/mp4', '.webm': 'video/webm', '.mkv': 'video/x-matroska', '.mov': 'video/quicktime',
    '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
    '.zip': 'application/zip', '.json': 'application/json',
  };
  return types[ext] || 'application/octet-stream';
}

async function listOutputFiles(dir: string): Promise<string[]> {
  const names = await fs.readdir(dir);
  return names
    .filter((name) => !name.endsWith('.part') && !name.endsWith('.ytdl') && !name.endsWith('.temp'))
    .map((name) => path.join(dir, name));
}

function streamFile(file: string, cleanupDir: string): NextResponse {
  const filename = safeDownloadName(path.basename(file));
  const nodeStream = createReadStream(file);
  nodeStream.once('close', () => setTimeout(() => fs.rm(cleanupDir, { recursive: true, force: true }).catch(() => {}), 5_000));
  setTimeout(() => fs.rm(cleanupDir, { recursive: true, force: true }).catch(() => {}), 30 * 60 * 1000);
  return new NextResponse(Readable.toWeb(nodeStream) as ReadableStream, {
    headers: {
      'content-type': contentType(filename),
      'content-disposition': `attachment; filename="${filename.replace(/"/g, '')}"`,
      'x-filename': filename,
      'cache-control': 'no-store',
    },
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!knownSlugs.has(slug)) return NextResponse.json({ error: 'Unknown social downloader.' }, { status: 404 });

  const dir = await fs.mkdtemp(path.join(os.tmpdir(), `dotvec-social-${crypto.randomUUID()}-`));
  let handedOff = false;
  try {
    const form = await request.formData();
    const url = validateUrl(String(form.get('url') || '').trim(), slug);
    const requestedFormat = String(form.get('format') || 'best');
    const playlist = slug === 'youtube-playlist-downloader';
    const outputTemplate = path.join(dir, 'dotvec-%(extractor)s-%(id)s-%(title).80B.%(ext)s');
    const maxFileSizeMB = Math.max(25, Math.min(Number(process.env.MAX_SOCIAL_DOWNLOAD_MB || 1500), 3000));
    const ytdlp = process.env.YTDLP_BIN || 'yt-dlp';

    const args = [
      '--newline', '--no-warnings', '--restrict-filenames', '--windows-filenames',
      '--socket-timeout', '30', '--retries', '3', '--fragment-retries', '3',
      '--max-filesize', `${maxFileSizeMB}M`, '--output', outputTemplate,
    ];

    if (playlist) args.push('--yes-playlist', '--playlist-end', String(Math.max(1, Math.min(Number(process.env.MAX_PLAYLIST_ITEMS || 20), 50))));
    else args.push('--no-playlist');

    const cookiesFile = process.env.YTDLP_COOKIES_FILE;
    if (cookiesFile) {
      try { await fs.access(cookiesFile); args.push('--cookies', cookiesFile); } catch { /* clear downloader error is preferable to a startup failure */ }
    }

    if (slug === 'youtube-thumbnail-downloader' || requestedFormat === 'thumbnail') {
      args.push('--skip-download', '--write-thumbnail', '--convert-thumbnails', 'jpg');
    } else if (slug === 'youtube-mp3-downloader' || slug === 'soundcloud-audio-downloader' || requestedFormat === 'audio') {
      args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
    } else if (requestedFormat === '720') {
      args.push('-f', 'bv*[height<=720]+ba/b[height<=720]/b', '--merge-output-format', 'mp4');
    } else if (requestedFormat === '480') {
      args.push('-f', 'bv*[height<=480]+ba/b[height<=480]/b', '--merge-output-format', 'mp4');
    } else if (requestedFormat === 'original') {
      args.push('-f', 'b');
    } else {
      args.push('-f', 'bv*+ba/b', '--merge-output-format', 'mp4');
    }

    args.push(url.toString());
    await run(ytdlp, args, dir, playlist ? 30 * 60 * 1000 : 15 * 60 * 1000);

    let outputs = await listOutputFiles(dir);
    outputs = (await Promise.all(outputs.map(async (file) => ({ file, stat: await fs.stat(file) })))).filter((item) => item.stat.isFile() && item.stat.size > 0).map((item) => item.file);
    if (!outputs.length) throw new Error('The platform did not return a downloadable media file. Public access or server cookies may be required.');

    let resultFile = outputs[0];
    if (outputs.length > 1) {
      resultFile = path.join(dir, `dotvec-${slug}.zip`);
      await run('zip', ['-j', '-9', resultFile, ...outputs], dir, 20 * 60 * 1000);
    }

    handedOff = true;
    return streamFile(resultFile, dir);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Social media download failed.' }, { status: 400 });
  } finally {
    if (!handedOff) await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
