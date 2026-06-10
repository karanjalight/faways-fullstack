import type { SupabaseClient } from '@supabase/supabase-js';

const COMMISSION_INVOICE_DOCUMENTS_BUCKET = 'commission-invoice-documents';

export class CommissionInvoiceOperationError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status = 400) {
    super(message);
    this.name = 'CommissionInvoiceOperationError';
    this.code = code;
    this.status = status;
  }
}

type InvoiceRow = {
  id: string;
  reference: string;
  client_id: string | null;
  status: string;
  created_at: string;
};

async function removeStoragePaths(
  admin: SupabaseClient,
  paths: string[],
): Promise<void> {
  const unique = [...new Set(paths.filter(Boolean))];
  if (unique.length === 0) return;

  const { error } = await admin.storage
    .from(COMMISSION_INVOICE_DOCUMENTS_BUCKET)
    .remove(unique);

  if (error) {
    console.error('Commission invoice storage cleanup failed', error);
  }
}

async function recalculateInvoiceTotals(
  admin: SupabaseClient,
  invoiceId: string,
): Promise<void> {
  const { data: lines, error } = await admin
    .from('commission_invoice_lines')
    .select('amount_recovered, commission_amount, collection_date')
    .eq('invoice_id', invoiceId);

  if (error) {
    throw new CommissionInvoiceOperationError(
      'Could not recalculate invoice totals.',
      'INVOICE_RECALC_FAILED',
      500,
    );
  }

  const rows = lines ?? [];
  const totalRecovered = rows.reduce(
    (sum, line) => sum + Number(line.amount_recovered ?? 0),
    0,
  );
  const totalCommission = rows.reduce(
    (sum, line) => sum + Number(line.commission_amount ?? 0),
    0,
  );

  const dates = rows
    .map((line) => (line.collection_date ? String(line.collection_date).slice(0, 10) : ''))
    .filter(Boolean);

  const periodStart = dates.length > 0 ? dates.reduce((a, b) => (a < b ? a : b)) : null;
  const periodEnd = dates.length > 0 ? dates.reduce((a, b) => (a > b ? a : b)) : null;

  const patch: Record<string, unknown> = {
    total_recovered: totalRecovered,
    total_commission: totalCommission,
    updated_at: new Date().toISOString(),
  };

  if (periodStart) patch.period_start = periodStart;
  if (periodEnd) patch.period_end = periodEnd;

  const { error: updateError } = await admin
    .from('commission_invoices')
    .update(patch)
    .eq('id', invoiceId);

  if (updateError) {
    throw new CommissionInvoiceOperationError(
      'Could not update merged invoice totals.',
      'INVOICE_UPDATE_FAILED',
      500,
    );
  }
}

/**
 * Deletes a saved commission invoice. Collections become uninvoiced again.
 */
export async function deleteCommissionInvoiceCascade(
  admin: SupabaseClient,
  invoiceId: string,
): Promise<void> {
  const { data: invoice, error: invoiceError } = await admin
    .from('commission_invoices')
    .select('id, reference, status')
    .eq('id', invoiceId)
    .maybeSingle();

  if (invoiceError) {
    throw new CommissionInvoiceOperationError(
      'Failed to load invoice.',
      'INVOICE_LOOKUP_FAILED',
      500,
    );
  }

  if (!invoice) {
    throw new CommissionInvoiceOperationError('Invoice not found.', 'INVOICE_NOT_FOUND', 404);
  }

  if (invoice.status === 'paid') {
    throw new CommissionInvoiceOperationError(
      `Invoice ${invoice.reference} is marked paid. Mark it unpaid before deleting.`,
      'INVOICE_PAID',
      409,
    );
  }

  const { data: docs } = await admin
    .from('commission_invoice_documents')
    .select('storage_path')
    .eq('invoice_id', invoiceId);

  const storagePaths = (docs ?? [])
    .map((doc) => doc.storage_path as string)
    .filter(Boolean);

  const { error: deleteError } = await admin
    .from('commission_invoices')
    .delete()
    .eq('id', invoiceId);

  if (deleteError) {
    throw new CommissionInvoiceOperationError(
      'Could not delete invoice.',
      'INVOICE_DELETE_FAILED',
      500,
    );
  }

  await removeStoragePaths(admin, storagePaths);
}

export type MergeCommissionInvoicesResult = {
  mergedInvoiceId: string;
  mergedReference: string;
  removedInvoiceIds: string[];
  removedReferences: string[];
  lineCount: number;
  totalRecovered: number;
  totalCommission: number;
};

/**
 * Merges multiple saved commission invoices for the same client into one.
 */
export async function mergeCommissionInvoices(
  admin: SupabaseClient,
  invoiceIds: string[],
  targetInvoiceId?: string,
): Promise<MergeCommissionInvoicesResult> {
  const uniqueIds = [...new Set(invoiceIds.filter(Boolean))];

  if (uniqueIds.length < 2) {
    throw new CommissionInvoiceOperationError(
      'Select at least two invoices to merge.',
      'MERGE_TOO_FEW',
      400,
    );
  }

  const { data: invoices, error: invoicesError } = await admin
    .from('commission_invoices')
    .select('id, reference, client_id, status, created_at')
    .in('id', uniqueIds);

  if (invoicesError) {
    throw new CommissionInvoiceOperationError(
      'Failed to load invoices for merge.',
      'INVOICE_LOOKUP_FAILED',
      500,
    );
  }

  const rows = (invoices ?? []) as InvoiceRow[];

  if (rows.length !== uniqueIds.length) {
    throw new CommissionInvoiceOperationError(
      'One or more invoices could not be found.',
      'INVOICE_NOT_FOUND',
      404,
    );
  }

  const paid = rows.filter((row) => row.status === 'paid');
  if (paid.length > 0) {
    throw new CommissionInvoiceOperationError(
      `Cannot merge paid invoices: ${paid.map((row) => row.reference).join(', ')}. Mark them unpaid first.`,
      'INVOICE_PAID',
      409,
    );
  }

  const clientKeys = [...new Set(rows.map((row) => row.client_id ?? '__none__'))];
  if (clientKeys.length > 1) {
    throw new CommissionInvoiceOperationError(
      'Invoices must belong to the same client to merge.',
      'MERGE_CLIENT_MISMATCH',
      400,
    );
  }

  let target = rows.find((row) => row.id === targetInvoiceId);
  if (targetInvoiceId && !target) {
    throw new CommissionInvoiceOperationError(
      'Target invoice is not in the selected set.',
      'MERGE_INVALID_TARGET',
      400,
    );
  }

  if (!target) {
    target = [...rows].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    )[0];
  }

  const sourceIds = rows.filter((row) => row.id !== target!.id).map((row) => row.id);

  const { error: moveLinesError } = await admin
    .from('commission_invoice_lines')
    .update({ invoice_id: target.id })
    .in('invoice_id', sourceIds);

  if (moveLinesError) {
    throw new CommissionInvoiceOperationError(
      'Could not move invoice line items during merge.',
      'MERGE_LINES_FAILED',
      500,
    );
  }

  const { error: moveDocsError } = await admin
    .from('commission_invoice_documents')
    .update({ invoice_id: target.id })
    .in('invoice_id', sourceIds);

  if (moveDocsError) {
    console.error('Move invoice documents during merge', moveDocsError);
  }

  await recalculateInvoiceTotals(admin, target.id);

  const { data: finalLines } = await admin
    .from('commission_invoice_lines')
    .select('amount_recovered, commission_amount')
    .eq('invoice_id', target.id);

  const lineRows = finalLines ?? [];
  const totalRecovered = lineRows.reduce(
    (sum, line) => sum + Number(line.amount_recovered ?? 0),
    0,
  );
  const totalCommission = lineRows.reduce(
    (sum, line) => sum + Number(line.commission_amount ?? 0),
    0,
  );

  const { error: deleteSourcesError } = await admin
    .from('commission_invoices')
    .delete()
    .in('id', sourceIds);

  if (deleteSourcesError) {
    throw new CommissionInvoiceOperationError(
      'Lines were merged but empty invoices could not be removed.',
      'MERGE_CLEANUP_FAILED',
      500,
    );
  }

  return {
    mergedInvoiceId: target.id,
    mergedReference: target.reference,
    removedInvoiceIds: sourceIds,
    removedReferences: rows
      .filter((row) => sourceIds.includes(row.id))
      .map((row) => row.reference),
    lineCount: lineRows.length,
    totalRecovered,
    totalCommission,
  };
}
