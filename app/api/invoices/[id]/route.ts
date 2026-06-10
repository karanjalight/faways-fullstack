import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import {
  CommissionInvoiceOperationError,
  deleteCommissionInvoiceCascade,
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

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return notConfigured();

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: 'Missing invoice id' }, { status: 400 });
  }

  try {
    await deleteCommissionInvoiceCascade(supabaseAdmin, id);
    return NextResponse.json({ success: true, id });
  } catch (error) {
    if (error instanceof CommissionInvoiceOperationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }

    console.error('Unexpected invoice delete error', error);
    return NextResponse.json(
      { error: 'Failed to delete invoice', code: 'UNKNOWN_ERROR' },
      { status: 500 },
    );
  }
}
