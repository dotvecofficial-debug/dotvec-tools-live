'use client';

import { Download, Link2, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { Message, ResetButton } from './ToolShell';

const audioOnly = new Set(['youtube-mp3-downloader', 'soundcloud-audio-downloader']);
const thumbnailOnly = new Set(['youtube-thumbnail-downloader']);
const playlistTools = new Set(['youtube-playlist-downloader']);

export function SocialDownloaderRunner({ slug, maxMB }: { slug: string; maxMB: number }) {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState(audioOnly.has(slug) ? 'audio' : thumbnailOnly.has(slug) ? 'thumbnail' : 'best');
  const [authorized, setAuthorized] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function download() {
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const body = new FormData();
      body.append('url', url.trim());
      body.append('format', format);
      const response = await fetch(`/api/social-downloaders/${slug}`, { method: 'POST', body });
      const type = response.headers.get('content-type') || '';
      if (!response.ok) {
        const message = type.includes('application/json') ? (await response.json()).error : await response.text();
        throw new Error(message || 'The download failed.');
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = response.headers.get('x-filename') || `dotvec-${slug}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
      setSuccess('The VPS prepared the media download successfully.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The download failed.');
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setUrl('');
    setFormat(audioOnly.has(slug) ? 'audio' : thumbnailOnly.has(slug) ? 'thumbnail' : 'best');
    setAuthorized(false);
    setError('');
    setSuccess('');
  }

  return <div className="card tool-workspace">
    <div className="panel tool-controls">
      <div className="field">
        <label className="label" htmlFor="social-url">Public media URL</label>
        <div style={{ position: 'relative' }}>
          <Link2 size={18} style={{ position: 'absolute', left: 14, top: 15, color: 'var(--muted)' }} />
          <input id="social-url" className="input" style={{ paddingLeft: 42 }} value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Paste a public post, video, Reel, Short or track URL" inputMode="url" />
        </div>
        <span className="help">Only public or otherwise accessible media can be processed. Private and DRM-protected content is not bypassed.</span>
      </div>

      {!audioOnly.has(slug) && !thumbnailOnly.has(slug) && <div className="field">
        <label className="label" htmlFor="social-format">Output preference</label>
        <select id="social-format" className="select" value={format} onChange={(event) => setFormat(event.target.value)}>
          <option value="best">Best available video</option>
          <option value="720">MP4 up to 720p</option>
          <option value="480">MP4 up to 480p</option>
          <option value="audio">MP3 audio</option>
          <option value="thumbnail">Thumbnail only</option>
          <option value="original">Single best original format</option>
        </select>
      </div>}

      <label className="status" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
        <input type="checkbox" checked={authorized} onChange={(event) => setAuthorized(event.target.checked)} style={{ marginTop: 3 }} />
        <span>I own this media or have permission to download it, and I will follow the platform rules and applicable law.</span>
      </label>

      <div className="action-row">
        <button className="btn btn-primary" disabled={busy || !url.trim() || !authorized} onClick={download}>
          <Download size={18} /> {busy ? 'Preparing download…' : playlistTools.has(slug) ? 'Download playlist ZIP' : 'Download media'}
        </button>
        <ResetButton onClick={reset} />
      </div>

      {error && <Message type="error">{error}</Message>}
      {success && <Message type="success">{success}</Message>}
      <div className="status"><ShieldAlert size={16} style={{ verticalAlign: 'middle', marginRight: 7 }} />This tool uses self-hosted yt-dlp and FFmpeg on your VPS, not a paid download API. Maximum configured output: {maxMB} MB.</div>
    </div>

    <div className="panel">
      <h3>Downloader requirements</h3>
      <div className="grid" style={{ gap: 12 }}>
        <div className="status">The VPS Docker image installs yt-dlp, FFmpeg and ZIP support.</div>
        <div className="status">Some Instagram Stories, Facebook posts or age-restricted media may require a server-side cookies file configured by the administrator.</div>
        <div className="status">Platforms change frequently. Update yt-dlp regularly from the admin/VPS maintenance process.</div>
        <div className="status">Playlists are limited by the VPS environment setting to prevent excessive resource use.</div>
      </div>
    </div>
  </div>;
}
