const fs = require('fs');
const path = require('path');

const projectDir = path.resolve(__dirname, '..');
const lockPath = path.join(projectDir, 'pnpm-lock.yaml');

if (!fs.existsSync(lockPath)) {
  console.error('[registry-check] pnpm-lock.yaml is missing.');
  process.exit(1);
}

let text = fs.readFileSync(lockPath, 'utf8');
const before = text;

// Remove environment-specific tarball URLs that are unreachable outside the build environment.
text = text
  .replace(/,\s*tarball:\s*https:\/\/packages\.applied-caas-gateway1\.internal\.api\.openai\.org\/artifactory\/api\/npm\/npm-public\/[^}\s]+/g, '')
  .replace(/tarball:\s*https:\/\/packages\.applied-caas-gateway1\.internal\.api\.openai\.org\/artifactory\/api\/npm\/npm-public\/[^}\s]+,?\s*/g, '');

if (text.includes('internal.api.openai.org') || text.includes('applied-caas-gateway')) {
  console.error('[registry-check] An internal package URL still exists in pnpm-lock.yaml.');
  process.exit(1);
}

if (text !== before) {
  fs.writeFileSync(lockPath, text, 'utf8');
  console.log('[registry-check] Removed inaccessible internal package URLs from pnpm-lock.yaml.');
} else {
  console.log('[registry-check] Lockfile registry URLs are clean.');
}
