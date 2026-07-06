const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const src = path.join(root, 'src');
const errors = [];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

for (const file of walk(src).filter((file) => /\.(ts|tsx)$/.test(file))) {
  const text = fs.readFileSync(file, 'utf8');
  const relative = path.relative(root, file);
  const firstNonEmpty = text.split(/\r?\n/).find((line) => line.trim()) || '';

  if (/^\s*use client['"]?;?\s*$/.test(firstNonEmpty)) {
    errors.push(`${relative}: malformed client directive. It must be exactly 'use client';`);
  }

  if (/\\n\s*$/.test(text)) {
    errors.push(`${relative}: ends with a literal \\n instead of a real newline.`);
  }
}

const app = path.join(src, 'app');
const routes = new Map();
for (const file of walk(app).filter((file) => path.basename(file) === 'page.tsx')) {
  const relative = path.relative(app, path.dirname(file));
  const routeParts = relative === '' ? [] : relative.split(path.sep).filter((part) => !(part.startsWith('(') && part.endsWith(')')));
  const route = `/${routeParts.join('/')}`.replace(/\/$/, '') || '/';
  if (!routes.has(route)) routes.set(route, []);
  routes.get(route).push(path.relative(root, file));
}

for (const [route, files] of routes) {
  if (files.length > 1) errors.push(`Duplicate route ${route}: ${files.join(', ')}`);
}

const dataDir = path.join(root, 'data');
try {
  fs.mkdirSync(dataDir, { recursive: true });
  const probe = path.join(dataDir, `.write-test-${process.pid}.tmp`);
  fs.writeFileSync(probe, 'ok', 'utf8');
  fs.rmSync(probe, { force: true });
} catch (error) {
  errors.push(`The data folder is not writable, so CMS changes cannot be saved: ${error instanceof Error ? error.message : String(error)}`);
}

if (errors.length) {
  console.error('[project-check] Validation failed:');
  for (const error of errors) console.error(` - ${error}`);
  process.exit(1);
}

console.log('[project-check] Source syntax markers and route structure are clean.');
