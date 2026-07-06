const base = process.env.BASE_URL || 'http://127.0.0.1:3000';
const routes = [
  '/', '/all-tools', '/image-tools', '/pdf-tools', '/text-tools', '/developer-tools',
  '/seo-tools', '/calculators', '/ocr-tools', '/video-tools', '/audio-tools',
  '/document-tools', '/social-downloaders', '/server-tools', '/blog',
  '/tools/image-compressor', '/tools/merge-pdf', '/tools/add-image-pdf',
  '/tools/pdf-to-word', '/tools/json-formatter', '/tools/image-to-text',
  '/tools/video-compressor', '/tools/instagram-reels-downloader', '/admin/login',
];
let failed = 0;
for (const route of routes) {
  const response = await fetch(base + route, { redirect: 'manual' });
  const accepted = response.status >= 200 && response.status < 400;
  console.log(response.status, route);
  if (!accepted) failed += 1;
}
if (failed) process.exit(1);
