import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

type RecoveryCommissionType = 'percent' | 'flat';

function notConfigured() {
  return NextResponse.json(
    {
      error:
        'Database is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SERVICE_ROLE_KEY to your environment.',
    },
    { status: 503 },
  );
}

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

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return notConfigured();

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: 'Missing client id' }, { status: 400 });
  }

  const body = await req.json();
  const {
    name,
    email,
    phone,
    region,
    status,
    recoveryCommissionType,
    recoveryCommissionPercent,
    recoveryCommissionFlat,
  } = body as {
    name?: string;
    email?: string;
    phone?: string;
    region?: string;
    status?: 'active' | 'inactive' | 'closed';
    recoveryCommissionType?: RecoveryCommissionType;
    recoveryCommissionPercent?: number | null;
    recoveryCommissionFlat?: number | null;
  };

  const patch: Record<string, unknown> = {};
  if (name !== undefined) patch.name = name;
  if (email !== undefined) patch.email = email;
  if (phone !== undefined) patch.phone = phone;
  if (region !== undefined) patch.region = region;
  if (status !== undefined) patch.status = status;

  if (recoveryCommissionType !== undefined) {
    const t: RecoveryCommissionType =
      recoveryCommissionType === 'flat' ? 'flat' : 'percent';
    patch.recovery_commission_type = t;
    patch.recovery_commission_percent =
      t === 'percent' ? (recoveryCommissionPercent ?? null) : null;
    patch.recovery_commission_flat =
      t === 'flat' ? (recoveryCommissionFlat ?? null) : null;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('clients')
    .update(patch)
    .eq('id', id)
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
    .maybeSingle();

  if (error) {
    console.error('Error updating client', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  return NextResponse.json(mapClientRow(data as Record<string, unknown>));
}
