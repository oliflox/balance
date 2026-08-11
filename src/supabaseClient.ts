import { createClient } from '@supabase/supabase-js';

// Typed as string by vite-env.d.ts, but still absent at runtime if unset.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Supabase non configuré : renseigne VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env.local (voir .env.example).'
  );
}

export const supabase = createClient(url, anonKey);
