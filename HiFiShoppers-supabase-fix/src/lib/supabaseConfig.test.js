import { describe, expect, it } from 'vitest';
import { resolveSupabaseConfig } from './supabaseConfig';

const b64 = (o) => btoa(JSON.stringify(o)).replace(/=+$/, '');
const jwt = (role) => `${b64({ alg: 'HS256' })}.${b64({ role })}.sig`;

describe('resolveSupabaseConfig', () => {
  it('accepts a valid URL and anon key', () => {
    const r = resolveSupabaseConfig({ VITE_SUPABASE_URL: 'https://abc.supabase.co/', VITE_SUPABASE_ANON_KEY: jwt('anon') });
    expect(r.ok).toBe(true);
    expect(r.url).toBe('https://abc.supabase.co');
  });

  it('accepts the newer publishable key variable', () => {
    const r = resolveSupabaseConfig({ VITE_SUPABASE_URL: 'https://abc.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_abc123' });
    expect(r.ok).toBe(true);
  });

  it('reports both variables when missing', () => {
    const r = resolveSupabaseConfig({});
    expect(r.ok).toBe(false);
    expect(r.problems).toHaveLength(2);
  });

  it('trims whitespace and quotes pasted into Netlify', () => {
    const r = resolveSupabaseConfig({ VITE_SUPABASE_URL: ' "https://abc.supabase.co" ', VITE_SUPABASE_ANON_KEY: ` ${jwt('anon')} ` });
    expect(r.ok).toBe(true);
  });

  it('rejects placeholders from .env.example', () => {
    const r = resolveSupabaseConfig({ VITE_SUPABASE_URL: 'https://your-project-id.supabase.co', VITE_SUPABASE_ANON_KEY: 'your-anon-or-publishable-key' });
    expect(r.ok).toBe(false);
  });

  it('refuses service_role and sb_secret keys', () => {
    expect(resolveSupabaseConfig({ VITE_SUPABASE_URL: 'https://abc.supabase.co', VITE_SUPABASE_ANON_KEY: jwt('service_role') }).ok).toBe(false);
    expect(resolveSupabaseConfig({ VITE_SUPABASE_URL: 'https://abc.supabase.co', VITE_SUPABASE_ANON_KEY: 'sb_secret_abc' }).ok).toBe(false);
  });

  it('rejects a URL with a path such as /rest/v1', () => {
    expect(resolveSupabaseConfig({ VITE_SUPABASE_URL: 'https://abc.supabase.co/rest/v1', VITE_SUPABASE_ANON_KEY: jwt('anon') }).ok).toBe(false);
  });
});
