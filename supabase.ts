import { createClient } from '@supabase/supabase-js';

// Explicit static resolution required for Vite's build-time AST string replacement
const staticViteUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const staticViteKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const staticProcessUrl = typeof process !== 'undefined' ? ((process.env as any)?.VITE_SUPABASE_URL || (process.env as any)?.NEXT_PUBLIC_SUPABASE_URL) : undefined;
const staticProcessKey = typeof process !== 'undefined' ? ((process.env as any)?.VITE_SUPABASE_ANON_KEY || (process.env as any)?.NEXT_PUBLIC_SUPABASE_ANON_KEY) : undefined;

const getStoredConfig = (key: string): string => {
  if (typeof window === 'undefined') return '';
  try {
    const val = localStorage.getItem(key) || localStorage.getItem(`duyar_${key.toLowerCase()}`);
    if (val && typeof val === 'string' && val.trim().length > 0) return val.trim();
  } catch {}
  return '';
};

const resolveCredential = (viteVal?: string, processVal?: string, storageKey?: string): string => {
  if (viteVal && typeof viteVal === 'string' && viteVal.trim().length > 0 && !viteVal.includes('placeholder')) {
    return viteVal.trim();
  }
  if (processVal && typeof processVal === 'string' && processVal.trim().length > 0 && !processVal.includes('placeholder')) {
    return processVal.trim();
  }
  if (storageKey) {
    const fromStorage = getStoredConfig(storageKey);
    if (fromStorage && !fromStorage.includes('placeholder')) return fromStorage;
  }
  return '';
};

export const supabaseUrl = resolveCredential(staticViteUrl, staticProcessUrl, 'duyar_supabase_url');
export const supabaseKey = resolveCredential(staticViteKey, staticProcessKey, 'duyar_supabase_anon_key');

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  !supabaseUrl.includes('placeholder') &&
  supabaseKey !== 'placeholder' &&
  supabaseUrl.startsWith('https://')
);

export const setRuntimeSupabaseConfig = (url: string, key: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('duyar_supabase_url', url.trim());
    localStorage.setItem('duyar_supabase_anon_key', key.trim());
    window.location.reload();
  }
};

export const clearRuntimeSupabaseConfig = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('duyar_supabase_url');
    localStorage.removeItem('duyar_supabase_anon_key');
    window.location.reload();
  }
};

if (!isSupabaseConfigured) {
  console.warn(
    "⚠️ Duyar App: Supabase credentials not detected.\n" +
    "To connect your live database on Vercel:\n" +
    "1. Go to Vercel Project Settings -> Environment Variables\n" +
    "2. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY\n" +
    "3. Redeploy the project.\n" +
    "Or use the Quick Connect button on the login screen."
  );
}

// Fallback safe fetch wrapper only when credentials are not yet configured
const safeFetch: typeof fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  if (!isSupabaseConfigured) {
    const urlStr =
      typeof input === 'string'
        ? input
        : input instanceof URL
        ? input.toString()
        : (input as Request)?.url || '';

    // Auth endpoints (e.g. /auth/v1/session, /auth/v1/user)
    if (urlStr.includes('/auth/v1/')) {
      return new Response(JSON.stringify({ session: null, user: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // PostgREST REST endpoints
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'content-range': '0-0/0',
      },
    });
  }

  return window.fetch(input, init);
};

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://dummy-local-db.supabase.co',
  isSupabaseConfigured ? supabaseKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy',
  {
    auth: {
      autoRefreshToken: isSupabaseConfigured,
      persistSession: true,
      detectSessionInUrl: false,
    },
    global: {
      fetch: safeFetch,
    },
  }
);
