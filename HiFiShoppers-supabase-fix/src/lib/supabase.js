import { createClient } from '@supabase/supabase-js';
import { resolveSupabaseConfig } from './supabaseConfig';

// Vite replaces import.meta.env.VITE_* with the values present WHEN THE BUILD RUNS.
// Changing a variable later (e.g. in Netlify) has no effect until the site is rebuilt.
const config = resolveSupabaseConfig({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
});

export const supabaseConfigProblems = config.problems;

export const supabase = config.ok
  ? createClient(config.url, config.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

if (!supabase && typeof console !== 'undefined') {
  console.warn('[HiFiShoppers] Supabase is not configured:', config.problems.join(' | '));
}
