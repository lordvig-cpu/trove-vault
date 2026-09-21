import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  const message =
    'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and ' +
    'NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, then restart the dev server.';
  // In development a missing key is a setup mistake: stop with a clear message instead of failing
  // later with confusing network errors. Builds without the variables (e.g. CI) still compile.
  if (process.env.NODE_ENV === 'development') throw new Error(message);
  console.error(message);
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);
