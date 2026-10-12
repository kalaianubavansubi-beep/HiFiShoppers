// Pure helper (no Supabase import) that validates the PUBLIC browser configuration.
// It never returns or logs secret values – only which variable is wrong and why.

const PLACEHOLDER = /your-project|your-anon|your_anon|your-publishable|placeholder|changeme|example/i;

const clean = (value) => String(value ?? '').trim().replace(/^['"]|['"]$/g, '');

// Decodes the payload of a legacy JWT key (anon / service_role) without verifying it.
function jwtRole(key) {
  try {
    const part = key.split('.')[1];
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json).role;
  } catch {
    return null;
  }
}

export function resolveSupabaseConfig(env = {}) {
  const url = clean(env.VITE_SUPABASE_URL).replace(/\/+$/, '');
  // New projects call the public key a "publishable key"; older ones call it the "anon key". Both are public.
  const key = clean(env.VITE_SUPABASE_ANON_KEY) || clean(env.VITE_SUPABASE_PUBLISHABLE_KEY);
  const problems = [];

  if (!url) problems.push('VITE_SUPABASE_URL is missing or empty in this build.');
  else if (PLACEHOLDER.test(url)) problems.push('VITE_SUPABASE_URL still contains the placeholder from .env.example.');
  else if (!/^https:\/\/[^/\s]+\.[^/\s]+$/.test(url)) {
    problems.push('VITE_SUPABASE_URL must look like https://<project-ref>.supabase.co (no /rest/v1, no spaces).');
  }

  if (!key) problems.push('VITE_SUPABASE_ANON_KEY (public/publishable key) is missing or empty in this build.');
  else if (PLACEHOLDER.test(key)) problems.push('VITE_SUPABASE_ANON_KEY still contains the placeholder from .env.example.');
  else if (key.startsWith('sb_secret_') || jwtRole(key) === 'service_role') {
    problems.push('The key provided is a SECRET / service_role key. Never use it in the browser – use the anon or publishable key.');
  } else if (/\s/.test(key)) {
    problems.push('VITE_SUPABASE_ANON_KEY contains spaces or line breaks – re-paste it as a single line.');
  }

  return { url, key, problems, ok: problems.length === 0 };
}
