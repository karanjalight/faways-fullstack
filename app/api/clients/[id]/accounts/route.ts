import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

function notConfigured() {
  return NextResponse.json(
    {
      error:
        'Database is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SERVICE_ROLE_KEY to your environment.',
    },
    { status: 503 },
  );
}

async function getClientOrganization(supabaseAdmin: NonNullable<ReturnType<typeof getSupabaseAdmin>>, clientId: string) {
  const { data, error } = await supabaseAdmin
    .from('clients')
    .select('id, name, organization_id')
    .eq('id', clientId)
    .maybeSingle();

  if (error) {
    console.error('Error loading client', error);
    return { error: NextResponse.json({ error: 'Failed to load client' }, { status: 500 }) };
  }

  if (!data?.organization_id) {
    return { error: NextResponse.json({ error: 'Client not found' }, { status: 404 }) };
  }

  return { client: data };
}

function mapAccount(
  profile: { id: string; full_name: string | null; is_active: boolean; created_at: string },
  email: string,
) {
  return {
    id: profile.id,
    email,
    fullName: profile.full_name ?? '',
    isActive: profile.is_active,
    createdAt: profile.created_at,
  };
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return notConfigured();

  const { id: clientId } = await context.params;
  if (!clientId) {
    return NextResponse.json({ error: 'Missing client id' }, { status: 400 });
  }

  const clientResult = await getClientOrganization(supabaseAdmin, clientId);
  if ('error' in clientResult && clientResult.error) return clientResult.error;
  const { client } = clientResult as { client: { organization_id: string } };

  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, is_active, created_at')
    .eq('organization_id', client.organization_id)
    .eq('role', 'client')
    .order('created_at', { ascending: true });

  if (profilesError) {
    console.error('Error loading client accounts', profilesError);
    return NextResponse.json({ error: 'Failed to load portal accounts' }, { status: 500 });
  }

  const accounts = await Promise.all(
    (profiles ?? []).map(async (profile) => {
      const { data: authData } = await supabaseAdmin.auth.admin.getUserById(profile.id);
      return mapAccount(profile, authData.user?.email ?? '');
    }),
  );

  return NextResponse.json(accounts);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return notConfigured();

  const { id: clientId } = await context.params;
  if (!clientId) {
    return NextResponse.json({ error: 'Missing client id' }, { status: 400 });
  }

  const body = await req.json();
  const { contactName, email, phone, password } = body as {
    contactName: string;
    email: string;
    phone?: string;
    password: string;
  };

  if (!contactName?.trim() || !email?.trim() || !password?.trim()) {
    return NextResponse.json(
      { error: 'contactName, email and password are required' },
      { status: 400 },
    );
  }

  if (password.trim().length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters' },
      { status: 400 },
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  const clientResult = await getClientOrganization(supabaseAdmin, clientId);
  if ('error' in clientResult && clientResult.error) return clientResult.error;
  const { client } = clientResult as { client: { organization_id: string } };

  const chosenPassword = password.trim();

  const {
    data: authResult,
    error: authError,
  } = await supabaseAdmin.auth.admin.createUser({
    email: normalizedEmail,
    password: chosenPassword,
    email_confirm: true,
    user_metadata: {
      full_name: contactName.trim(),
      role: 'client',
    },
  });

  if (authError || !authResult.user) {
    console.error('Error creating auth user', authError);
    const message =
      authError?.message?.toLowerCase().includes('already') ||
      authError?.message?.toLowerCase().includes('registered')
        ? 'An account with this email already exists'
        : 'Failed to create portal user';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const userId = authResult.user.id;

  const { error: profileError } = await supabaseAdmin.from('profiles').insert({
    id: userId,
    organization_id: client.organization_id,
    full_name: contactName.trim(),
    role: 'client',
    phone: phone?.trim() || null,
    is_active: true,
  });

  if (profileError) {
    console.error('Error creating profile', profileError);
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: 'Failed to create portal profile' }, { status: 500 });
  }

  const account = mapAccount(
    {
      id: userId,
      full_name: contactName.trim(),
      is_active: true,
      created_at: new Date().toISOString(),
    },
    normalizedEmail,
  );

  return NextResponse.json(
    {
      account,
      credentials: { email: normalizedEmail, password: chosenPassword },
    },
    { status: 201 },
  );
}
