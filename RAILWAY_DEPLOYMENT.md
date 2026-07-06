# Dotvec Tools — Railway Deployment

## Required Railway service variables

Add these in **Service → Variables → Raw Editor**:

```env
ADMIN_EMAIL=your-admin-email@example.com
ADMIN_PASSWORD=replace-with-a-strong-password
AUTH_SECRET=replace-with-a-long-random-secret
NEXT_PUBLIC_SITE_URL=https://temporary.example.com
MAX_BACKEND_UPLOAD_MB=100
MAX_SOCIAL_DOWNLOAD_MB=250
MAX_PLAYLIST_ITEMS=5
YTDLP_COOKIES_FILE=
```

After Railway generates the public domain, replace `NEXT_PUBLIC_SITE_URL` with the real HTTPS domain and redeploy.

## Persistent CMS data

Create a Railway Volume and mount it at:

```text
/app/data
```

This is required to keep CMS, blog, page, SEO and admin settings across restarts/deployments.

## Public domain

Go to **Service → Settings → Networking → Generate Domain**.

## Health endpoint

```text
/api/health
```

## Free/Trial testing limits

Use small files during testing. Recommended:

- PDFs: under 10 MB
- Audio/video: under 25 MB
- One heavy conversion at a time
- Playlist item limit: 5

The free plan has limited RAM and ephemeral disk. Large FFmpeg, LibreOffice or OCR jobs can fail from memory limits even when the website itself is deployed correctly.
