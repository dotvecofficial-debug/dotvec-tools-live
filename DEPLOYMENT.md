# Dotvec Tools V6 — VPS Deployment

## Recommended server

For testing: 4 vCPU, 8 GB RAM and 80+ GB SSD. For public traffic or simultaneous video/PDF jobs, use more CPU/RAM and separate workers.

The supplied Docker image installs:

- FFmpeg
- Ghostscript
- qpdf
- Poppler
- LibreOffice Headless
- ImageMagick
- Tesseract and OCRmyPDF
- Python 3 with PyMuPDF, python-docx, openpyxl, python-pptx and Pillow
- yt-dlp
- zip

## Deployment steps

1. Install Docker Engine and Docker Compose on an Ubuntu VPS.
2. Upload/extract the project.
3. Copy the environment template:

```bash
cp .env.example .env
```

4. Edit `.env` and set a strong admin email/password and a long random `AUTH_SECRET`.
5. Build and start:

```bash
docker compose up -d --build
```

6. Check logs:

```bash
docker compose logs -f dotvec-tools
```

7. Reverse proxy your domain to `127.0.0.1:3000` using Nginx or Caddy and enable HTTPS.
8. Add reverse-proxy request-size, concurrency and rate limits.

## Social downloader cookies

Public downloads may work without cookies. Instagram Stories and some age/login-gated but otherwise accessible content may require cookies belonging to an account that is authorized to view that content.

1. Create `private-cookies/cookies.txt` in Netscape cookie format.
2. Keep this folder private and never commit/share it.
3. Set in `.env`:

```env
YTDLP_COOKIES_FILE=/app/private-cookies/cookies.txt
```

4. Restart:

```bash
docker compose up -d
```

Do not use the service to bypass DRM, private-access controls or copyright restrictions.

## Limits

The default environment supports:

```env
MAX_BACKEND_UPLOAD_MB=750
MAX_SOCIAL_DOWNLOAD_MB=1500
MAX_PLAYLIST_ITEMS=20
```

Lower these values on a smaller server. Docker uses a temporary in-memory filesystem for working files; ensure RAM is sufficient.

## Data and privacy

- `data/` stores admin/CMS/settings data and should be backed up.
- Public processing files are temporary and are not stored in `data/`.
- The `private-cookies/` directory is mounted read-only.
- Do not expose PostgreSQL/Redis publicly if those services are added later.

## Production scaling

Before high traffic:

- Move heavy jobs to Redis/BullMQ workers.
- Use object storage for temporary outputs when multiple nodes are used.
- Add antivirus scanning hooks and stricter MIME validation.
- Apply per-IP and per-tool rate limits.
- Monitor CPU, RAM, disk, job duration, failed jobs and cleanup.
- Keep yt-dlp and native packages updated.
