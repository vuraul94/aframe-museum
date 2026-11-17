/**
 * `npm run cert` — generates a self-signed certificate in ./certs to serve
 * over HTTPS (WebXR requires a secure context outside localhost, e.g. a phone
 * or a Quest headset on the same Wi-Fi network). Requires `openssl`.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'certs');
fs.mkdirSync(dir, { recursive: true });

const ips = Object.values(os.networkInterfaces()).flat()
  .filter(i => i && i.family === 'IPv4').map(i => `IP:${i.address}`);
const san = ['DNS:localhost', ...ips].join(',');

try {
  execFileSync('openssl', [
    'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-sha256', '-days', '365',
    '-keyout', path.join(dir, 'key.pem'), '-out', path.join(dir, 'cert.pem'),
    '-subj', '/CN=aframe-museum.local', '-addext', `subjectAltName=${san}`
  ], { stdio: 'inherit' });
  console.log(`\n  ✔ Certificate created in ${dir}\n  Restart with \`npm start\`: the server will use HTTPS.`);
  console.log('  ℹ  The browser will show a warning (self-signed certificate): accept it once.\n');
} catch {
  console.error('\n  ✖ Could not run openssl. Install it, or use port forwarding in');
  console.error('    chrome://inspect (Port forwarding 8080 → localhost:8080) to test on a phone.\n');
  process.exit(1);
}
