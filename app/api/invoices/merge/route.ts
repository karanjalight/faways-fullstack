import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import {
  CommissionInvoiceOperationError,
  mergeCommissionInvoices,
} from '@/lib/commission-invoice-operations';

function notConfigured() {
  return NextResponse.json(
    {
      error:
        'Database is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SERVICE_ROLE_KEY to your environment.',
    },
    { status: 503 },
  );
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return notConfigured();

  let body: { invoiceIds?: string[]; targetInvoiceId?: string };
  try {
    body = (await req.json()) as { invoiceIds?: string[]; targetInvoiceId?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const invoiceIds = body.invoiceIds ?? [];
  if (!Array.isArray(invoiceIds) || invoiceIds.length < 2) {
    return NextResponse.json(
      { error: 'Provide at least two invoice ids to merge.' },
      { status: 400 },
    );
  }

  try {
    const result = await mergeCommissionInvoices(
      supabaseAdmin,
      invoiceIds,
      body.targetInvoiceId,
    );
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof CommissionInvoiceOperationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }

    console.error('Unexpected invoice merge error', error);
    return NextResponse.json(
      { error: 'Failed to merge invoices', code: 'UNKNOWN_ERROR' },
      { status: 500 },
    );
  }
}
