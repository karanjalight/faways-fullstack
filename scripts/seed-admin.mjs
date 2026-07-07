// Seed (or update) an admin account that can access the dashboard.
//
// Creates a Supabase Auth user with an email-confirmed password and an
// `admin` role, then upserts the matching `public.profiles` row so the
// Sidebar/nav unlocks the full admin experience. Mirrors the admin-created
// user flow in app/api/clients/route.ts, but with role: 'admin'.
//
// Usage (Node 20.6+ loads .env.local for the service role key):
//   node --env-file=.env.local scripts/seed-admin.mjs
//   npm run seed:admin
//
// Override the defaults with env vars or CLI flags:
//   SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_ADMIN_NAME
//   node --env-file=.env.local scripts/seed-admin.mjs \
//     --email you@faways.com --password 'S3cret!' --name 'Jane Admin'
//
// The script is idempotent: run it again and it updates the existing user's
// password/metadata and profile instead of failing.

import { createClient } from '@supabase/supabase-js';

// --- Parse CLI flags (--email, --password, --name) -------------------------
function flag(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

const email =
  flag('email') || process.env.SEED_ADMIN_EMAIL || 'admin@faways.com';
const password =
  flag('password') || process.env.SEED_ADMIN_PASSWORD || 'Admin@Faways2026';
const fullName =
  flag('name') || process.env.SEED_ADMIN_NAME || 'Faways Admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    'Missing env. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SERVICE_ROLE_KEY.\n' +
      'Run with: node --env-file=.env.local scripts/seed-admin.mjs',
  );
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Find an existing auth user by email (listUsers is paginated).
async function findUserByEmail(targetEmail) {
  const wanted = targetEmail.toLowerCase();
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === wanted);
    if (match) return match;
    if (data.users.length < 1000) break; // last page
  }
  return null;
}

async function main() {
  const metadata = { full_name: fullName, role: 'admin' };

  // 1) Create the auth user, or update it if the email already exists.
  let userId;
  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    });

  if (createError) {
    // Most likely "email already registered" — fall back to update.
    const existing = await findUserByEmail(email);
    if (!existing) throw createError;

    const { error: updateError } = await admin.auth.admin.updateUserById(
      existing.id,
      { password, email_confirm: true, user_metadata: metadata },
    );
    if (updateError) throw updateError;

    userId = existing.id;
    console.log(`↻ Updated existing auth user (${email})`);
  } else {
    userId = created.user.id;
    console.log(`✓ Created auth user (${email})`);
  }

  // 2) Mirror the role into public.profiles (best-effort).
  //
  // Admin dashboard access is gated by auth user_metadata.role (see
  // app/components/DashboardLayout.tsx getUserState), so the account is fully
  // functional even if this write fails. The profiles table currently has no
  // GRANT for the service_role/authenticated DB roles, so this upsert may hit
  // "permission denied for table profiles" — the app's own ensureProfile()
  // swallows the same error. We warn rather than fail.
  const { error: profileError } = await admin.from('profiles').upsert(
    {
      id: userId,
      full_name: fullName,
      role: 'admin',
      is_active: true,
    },
    { onConflict: 'id' },
  );
  if (profileError) {
    console.warn(
      `⚠ Could not upsert public.profiles row (${profileError.message}).\n` +
        `  This is non-fatal: dashboard role is read from auth user_metadata.\n` +
        `  To fix the mirror, grant table privileges to the DB roles, e.g.:\n` +
        `    grant all on public.profiles to service_role, authenticated;`,
    );
  } else {
    console.log(`✓ Upserted admin profile`);
  }

  console.log('\nAdmin account ready. Log in at /login with:');
  console.log(`  email:    ${email}`);
  console.log(`  password: ${password}`);
}

main().catch((err) => {
  console.error('\nSeed failed:', err.message || err);
  process.exit(1);
});
