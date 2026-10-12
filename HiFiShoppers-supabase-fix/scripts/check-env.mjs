// Runs automatically before `npm run build` (npm "prebuild" hook), including on Netlify.
// Prints which public Supabase variables the build can see. It never prints their values.
// Set REQUIRE_SUPABASE_ENV=true in Netlify to make a missing/invalid value FAIL the build.
import fs from 'node:fs';
import path from 'node:path';

const files = ['.env', '.env.local', '.env.production', '.env.production.local'];
const fromFiles = {};
for (const file of files) {
  const full = path.resolve(process.cwd(), file);
  if (!fs.existsSync(full)) continue;
  for (const line of fs.readFileSync(full, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*(VITE_[A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match) fromFiles[match[1]] = match[2];
  }
}
const read = (name) => (process.env[name] ?? fromFiles[name] ?? '').toString().trim().replace(/^['"]|['"]$/g, '');

const url = read('VITE_SUPABASE_URL');
const key = read('VITE_SUPABASE_ANON_KEY') || read('VITE_SUPABASE_PUBLISHABLE_KEY');
const issues = [];
if (!url) issues.push('VITE_SUPABASE_URL is not set for this build');
else if (!/^https:\/\/[^/\s]+\.[^/\s]+$/.test(url)) issues.push('VITE_SUPABASE_URL is not a plain https://<ref>.supabase.co address');
if (!key) issues.push('VITE_SUPABASE_ANON_KEY (public/publishable key) is not set for this build');
else if (key.startsWith('sb_secret_')) issues.push('the key is a SECRET key – use the publishable/anon key');
if (/your-project|your-anon/i.test(url + key)) issues.push('a placeholder value from .env.example is still in use');

const tag = '[check-env]';
if (issues.length === 0) {
  console.log(`${tag} Supabase public config found (URL set, key set). Admin login, products and checkout will be enabled.`);
} else {
  console.warn(`\n${tag} WARNING – Supabase will be DISABLED in this build:`);
  for (const issue of issues) console.warn(`${tag}   - ${issue}`);
  console.warn(`${tag} In Netlify: Site configuration > Environment variables (scope must include "Builds"), then redeploy.\n`);
  if (process.env.REQUIRE_SUPABASE_ENV === 'true') {
    console.error(`${tag} REQUIRE_SUPABASE_ENV=true, failing the build.`);
    process.exit(1);
  }
}
