# Dotvec Tools V6

Dotvec Tools is a self-hosted, all-in-one tools platform built with **Next.js, React, TypeScript and Node.js**. The public website requires no account, subscription, credits or paid processing API.

## Included tools

V6 registers **206 tools**:

| Category | Count | Processing |
|---|---:|---|
| Image | 26 | Browser |
| PDF | 42 | Browser + VPS |
| Text | 25 | Browser |
| Developer | 23 | Browser |
| SEO | 20 | Browser + VPS crawler |
| Calculators | 18 | Browser |
| OCR | 1 | Browser |
| Video | 14 | VPS / FFmpeg |
| Audio | 10 | VPS / FFmpeg |
| Document | 7 | VPS / LibreOffice/Python |
| Social downloaders | 20 | VPS / yt-dlp |
| **Total** | **206** | **127 browser + 79 VPS** |

The full category-by-category inventory is in `TOOLS_LIST.md`.

Browser tools process content on the visitor's device. VPS tools upload files temporarily to the self-hosted server, produce a result, stream it to the visitor and clean temporary files.

## Social downloaders

The project contains self-hosted downloader pages for YouTube, Shorts, playlists, thumbnails, Instagram posts/Reels/Stories, Facebook videos/Reels, TikTok, X/Twitter, Pinterest, Reddit, Vimeo, Dailymotion, SoundCloud, Twitch clips, Threads and a universal supported-platform downloader.

They use **yt-dlp and FFmpeg on your own VPS**, not a paid downloader API. Platform websites change frequently, so keep the Docker image and yt-dlp updated. Some accessible content may require a cookies file. Private, DRM-protected or otherwise restricted content is not bypassed. Only download content you own or are authorized to download.

## Windows live preview

1. Extract the ZIP completely. Do not run it from inside the ZIP viewer.
2. Move the folder to a short path such as `C:\dotvec-tools-v6` when possible.
3. Double-click `START_DOTVEC.bat`.
4. Keep the Command Prompt window open while using the website.
5. The first run installs JavaScript dependencies from the official npm registry.
6. The browser opens automatically when Next.js is ready.

The terminal prints the exact preview URL, normally `http://localhost:3000`. Code changes refresh automatically.

### Repair and diagnostics

- `REPAIR_DOTVEC.bat` removes installed dependencies and the Next.js cache, then performs a clean installation.
- `DIAGNOSE_DOTVEC.bat` creates `DOTVEC_DIAGNOSTICS.txt`.
- Startup details are saved to `dotvec-startup.log`.

The package includes a local PNPM launcher at `.dotvec-pnpm/bin/pnpm.cjs`; it does not need Corepack or a global PNPM installation.

## Manual development commands

```bat
node .dotvec-pnpm\bin\pnpm.cjs install --frozen-lockfile
node .dotvec-pnpm\bin\pnpm.cjs run dev
```

Linux/macOS:

```bash
node .dotvec-pnpm/bin/pnpm.cjs install --frozen-lockfile
node .dotvec-pnpm/bin/pnpm.cjs run dev
```

## Admin

The private admin area is at `/admin/login`. Before production deployment, set a strong `ADMIN_EMAIL`, `ADMIN_PASSWORD` and `AUTH_SECRET` in `.env`.

The dashboard manages tool status/maintenance, content, blog posts, SEO settings, redirects, feedback and privacy-safe error reports. Processing source-code bugs still require a code update and redeployment.

## VPS deployment

Read `DEPLOYMENT.md`. Docker installs the native processing stack needed by the PDF, media, document, crawler and social downloader routes.

## Important production notes

- Browser tools can be tested on Windows immediately.
- Native VPS tools require Docker/Linux binaries; they will not all run in a plain Windows Next.js preview.
- Social platform extraction must be tested from the target VPS because platform availability, geography, cookies and anti-bot behavior vary.
- For high traffic, move heavy processing into queues/workers and add rate limits, storage limits, monitoring and abuse protection.


## CMS Pro (2.2)

The supplied project now includes a protected CMS dashboard, rich HTML blog editor with anchor links/headings/FAQs, fully editable tool-page content and per-tool button colors/text, plus database-backed light/dark theme settings. Admin routes are normalized under `src/app/admin/(protected)` to avoid duplicate-route build errors.
