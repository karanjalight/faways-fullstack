import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Lazy init so importing this module during `next build` / prerender does not
// call createClient() when NEXT_PUBLIC_* vars are unset (e.g. missing Vercel env).

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  if (!_client) {
    _client = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client as unknown as object, prop, receiver);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

