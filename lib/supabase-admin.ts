import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Server-side Supabase client using the service role key.
// IMPORTANT: This file must only ever be imported from server-only code
// such as route handlers or server actions so the service key is not exposed
// to the browser bundle.

// Lazy init so `next build` does not call createClient() when env vars are
// unset (e.g. Vercel preview without secrets). Set NEXT_PUBLIC_SUPABASE_URL
// and NEXT_PUBLIC_SERVICE_ROLE_KEY in the project Environment Variables.

let _admin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }
  if (!_admin) {
    _admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _admin;
}

