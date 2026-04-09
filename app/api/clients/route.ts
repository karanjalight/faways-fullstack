import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

type RecoveryCommissionType = 'percent' | 'flat';

function mapClientRow(row: Record<string, unknown>) {
  const totalDebt = Number(row.total_debt ?? 0);
  const paidAmount = Number(row.total_paid ?? 0);
  const rawType = row.recovery_commission_type as string | null | undefined;
  const commissionType: RecoveryCommissionType =
    rawType === 'flat' ? 'flat' : 'percent';

  return {
    id: row.id as string,
    name: row.name as string,
    email: (row.email as string) ?? '',
    phone: (row.phone as string) ?? '',
    company: (row.region as string) ?? '',
    totalDebt,
    paidAmount,
    remainingAmount: totalDebt - paidAmount,
    status: (row.status as 'active' | 'inactive' | 'closed') ?? 'active',
    assignedAgent: undefined,
    lastContact:
      (row.last_contact_at as string) ?? new Date().toISOString().slice(0, 10),
    createdAt: row.created_at
      ? new Date(row.created_at as string).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    recoveryCommissionType: commissionType,
    recoveryCommissionPercent:
      row.recovery_commission_percent != null
        ? Number(row.recovery_commission_percent)
        : null,
    recoveryCommissionFlat:
      row.recovery_commission_flat != null
        ? Number(row.recovery_commission_flat)
        : null,
  };
}

function notConfigured() {
  return NextResponse.json(
    {
      error:
        'Database is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SERVICE_ROLE_KEY to your environment.',
    },
    { status: 503 },
  );
}

// Helper to generate a random password
function generatePassword(length = 16) {
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+';
  let pwd = '';
  for (let i = 0; i < length; i++) {
    pwd += charset[Math.floor(Math.random() * charset.length)];
  }
  return pwd;
}

export async function GET(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return notConfigured();
  const email = req.nextUrl.searchParams.get('email')?.trim().toLowerCase();

  if (email) {
    const { data, error } = await supabaseAdmin
      .from('clients')
      .select(
        `
          id,
          name,
          email,
          phone,
          status,
          region,
          total_debt,
          total_paid,
          last_contact_at,
          created_at,
          recovery_commission_type,
          recovery_commission_percent,
          recovery_commission_flat
        `,
      )
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('Error loading client by email', error);
      return NextResponse.json(
        { error: 'Failed to load client by email' },
        { status: 500 },
      );
    }

    if (!data) return NextResponse.json(null);

    return NextResponse.json(mapClientRow(data as Record<string, unknown>));
  }

  // Fetch clients with simple aggregates from debts
  const { data, error } = await supabaseAdmin
    .from('clients')
    .select(
      `
        id,
        name,
        email,
        phone,
        status,
        region,
        total_debt,
        total_paid,
        last_contact_at,
        created_at,
        recovery_commission_type,
        recovery_commission_percent,
        recovery_commission_flat
      `,
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading clients', error);
    return NextResponse.json({ error: 'Failed to load clients' }, { status: 500 });
  }

  const clients = (data ?? []).map((row) =>
    mapClientRow(row as Record<string, unknown>),
  );

  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return notConfigured();

  const body = await req.json();
  const {
    clientName,
    contactName,
    email,
    phone,
    region,
    recoveryCommissionType,
    recoveryCommissionPercent,
    recoveryCommissionFlat,
  } = body as {
    clientName: string;
    contactName: string;
    email: string;
    phone?: string;
    region?: string;
    recoveryCommissionType?: RecoveryCommissionType;
    recoveryCommissionPercent?: number | null;
    recoveryCommissionFlat?: number | null;
  };

  if (!clientName || !contactName || !email) {
    return NextResponse.json(
      { error: 'clientName, contactName and email are required' },
      { status: 400 },
    );
  }

  const password = generatePassword();

  // 1) Create auth user
  const {
    data: authResult,
    error: authError,
  } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: contactName,
      role: 'client',
    },
  });

  if (authError || !authResult.user) {
    console.error('Error creating auth user', authError);
    return NextResponse.json(
      { error: 'Failed to create client user' },
      { status: 500 },
    );
  }

  const userId = authResult.user.id;

  // 2) Ensure an organization exists for this client
  const { data: org, error: orgError } = await supabaseAdmin
    .from('organizations')
    .insert({
      name: clientName,
      type: 'client',
      region: region ?? null,
    })
    .select('id')
    .single();

  if (orgError || !org) {
    console.error('Error creating organization', orgError);
    return NextResponse.json(
      { error: 'Failed to create client organization' },
      { status: 500 },
    );
  }

  const organizationId = org.id as string;

  // 3) Create profile with role client
  const { error: profileError } = await supabaseAdmin.from('profiles').insert({
    id: userId,
    organization_id: organizationId,
    full_name: contactName,
    role: 'client',
    phone: phone ?? null,
    is_active: true,
  });

  if (profileError) {
    console.error('Error creating profile', profileError);
    return NextResponse.json(
      { error: 'Failed to create client profile' },
      { status: 500 },
    );
  }

  // 4) Create client record
  const commissionType: RecoveryCommissionType =
    recoveryCommissionType === 'flat' ? 'flat' : 'percent';

  const { data: clientRow, error: clientError } = await supabaseAdmin
    .from('clients')
    .insert({
      organization_id: organizationId,
      name: clientName,
      email,
      phone: phone ?? null,
      status: 'active',
      region: region ?? null,
      total_debt: 0,
      total_paid: 0,
      recovery_commission_type: commissionType,
      recovery_commission_percent:
        commissionType === 'percent' && recoveryCommissionPercent != null
          ? recoveryCommissionPercent
          : null,
      recovery_commission_flat:
        commissionType === 'flat' && recoveryCommissionFlat != null
          ? recoveryCommissionFlat
          : null,
    })
    .select(
      `
        id,
        name,
        email,
        phone,
        status,
        region,
        total_debt,
        total_paid,
        last_contact_at,
        created_at,
        recovery_commission_type,
        recovery_commission_percent,
        recovery_commission_flat
      `,
    )
    .single();

  if (clientError || !clientRow) {
    console.error('Error creating client', clientError);
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      client: mapClientRow(clientRow as Record<string, unknown>),
      credentials: {
        email,
        password,
      },
    },
    { status: 201 },
  );
}

