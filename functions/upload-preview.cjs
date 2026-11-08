// Run only as the non-production Cloudflare version command.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
if (process.env.WORKERS_CI_BRANCH !== 'sun-movers-launch-2026') {
  throw new Error('This uploader only supports the Sun Movers development branch.');
}
if (!process.env.RESEND_API_KEY) throw new Error('Missing Resend build secret.');
// Keep plaintext secret material outside the static assets directory and logs.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sun-movers-secrets-'));
try {
  const file = path.join(dir, 'secrets.json');
  fs.writeFileSync(file, JSON.stringify({ RESEND_API_KEY: process.env.RESEND_API_KEY }), { mode: 0o600 });
  execFileSync('npx', ['wrangler', 'versions', 'upload', '--name', 'coming-soon',
    '--preview-alias', 'sun-movers-launch-2026',
    '--var', 'QUOTE_FROM_EMAIL:quotes@mail.sunre.ca', '--secrets-file', file],
    { stdio: 'inherit' });
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
