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

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string; userId: string }> },
) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return notConfigured();

  const { id: clientId, userId } = await context.params;
  if (!clientId || !userId) {
    return NextResponse.json({ error: 'Missing client or user id' }, { status: 400 });
  }

  const { data: client, error: clientError } = await supabaseAdmin
    .from('clients')
    .select('organization_id')
    .eq('id', clientId)
    .maybeSingle();

  if (clientError) {
    console.error('Error loading client', clientError);
    return NextResponse.json({ error: 'Failed to load client' }, { status: 500 });
  }

  if (!client?.organization_id) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, is_active, created_at, organization_id, role')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) {
    console.error('Error loading profile', profileError);
    return NextResponse.json({ error: 'Failed to load account' }, { status: 500 });
  }

  if (
    !profile ||
    profile.organization_id !== client.organization_id ||
    profile.role !== 'client'
  ) {
    return NextResponse.json({ error: 'Account not found for this client' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const { password } = body as { password?: string };

  if (!password?.trim()) {
    return NextResponse.json({ error: 'password is required' }, { status: 400 });
  }

  if (password.trim().length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters' },
      { status: 400 },
    );
  }

  const chosenPassword = password.trim();

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    { password: chosenPassword },
  );

  if (authError || !authData.user) {
    console.error('Error resetting password', authError);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }

  const email = authData.user.email ?? '';

  return NextResponse.json({
    credentials: { email, password: chosenPassword },
    account: {
      id: profile.id,
      email,
      fullName: profile.full_name ?? '',
      isActive: profile.is_active,
      createdAt: profile.created_at,
    },
  });
}
