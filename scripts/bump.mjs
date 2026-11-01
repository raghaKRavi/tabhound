// Usage: pnpm bump <patch|minor|major|x.y.z>
// Keeps the root and extension package.json versions in sync (the extension's is what
// ships in the manifest). Store uploads need a strictly higher version each time.
import { readFileSync, writeFileSync } from 'node:fs';

const files = ['package.json', 'apps/extension/package.json'];
const arg = process.argv[2];
if (!arg) {
  console.error('Usage: pnpm bump <patch|minor|major|x.y.z>');
  process.exit(1);
}

const current = JSON.parse(readFileSync(files[1], 'utf8')).version;
const [maj, min, pat] = current.split('.').map(Number);
const next =
  arg === 'major' ? `${maj + 1}.0.0`
  : arg === 'minor' ? `${maj}.${min + 1}.0`
  : arg === 'patch' ? `${maj}.${min}.${pat + 1}`
  : /^\d+\.\d+\.\d+$/.test(arg) ? arg
  : null;
if (!next) {
  console.error(`Unknown bump "${arg}"`);
  process.exit(1);
}

for (const f of files) {
  const json = JSON.parse(readFileSync(f, 'utf8'));
  json.version = next;
  writeFileSync(f, JSON.stringify(json, null, 2) + '\n');
}
console.log(`${current} -> ${next}`);
