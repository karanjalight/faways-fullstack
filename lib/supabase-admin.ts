import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client using the service role key.
// IMPORTANT: This file must only ever be imported from server-only code
// such as route handlers or server actions so the service key is not exposed
// to the browser bundle.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

