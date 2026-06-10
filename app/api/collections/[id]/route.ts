import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { DebtDeleteError } from '@/lib/delete-debt';
import { deleteCollectionCascade } from '@/lib/delete-collection';

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
    return NextResponse.json({ error: 'Missing collection id' }, { status: 400 });
  }

  try {
    const result = await deleteCollectionCascade(supabaseAdmin, id);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof DebtDeleteError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }

    console.error('Unexpected collection delete error', error);
    return NextResponse.json(
      { error: 'Failed to delete recovery', code: 'UNKNOWN_ERROR' },
      { status: 500 },
    );
  }
}
