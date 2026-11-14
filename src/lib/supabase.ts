import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = (rawUrl && typeof rawUrl === 'string' && rawUrl.startsWith('http')) 
  ? rawUrl 
  : 'https://placeholder.supabase.co';

const supabaseAnonKey = (rawKey && typeof rawKey === 'string' && rawKey.length > 0)
  ? rawKey
  : 'placeholder-anon-key';

function getSafeClient(url: string, key: string, options?: any): SupabaseClient {
  try {
    return createClient(url, key, options);
  } catch (e) {
    console.warn('Failed to initialize Supabase client:', e);
    return createClient('https://placeholder.supabase.co', 'placeholder-anon-key', options);
  }
}

// Function to create an authenticated Supabase client using a Clerk JWT
export const createClerkSupabaseClient = (clerkToken: string) => {
  return getSafeClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${clerkToken}`,
      },
    },
  });
};

// Global anonymous client for public data (if RLS allows)
export const supabase = getSafeClient(supabaseUrl, supabaseAnonKey);
