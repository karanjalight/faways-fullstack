import type { SupabaseClient } from '@supabase/supabase-js';
import {
  cleanupCommissionInvoicesForCollections,
  DebtDeleteError,
  recalculateAgentTotals,
  recalculateClientTotals,
} from './delete-debt';

const COMMISSION_INVOICE_DOCUMENTS_BUCKET = 'commission-invoice-documents';
const LEGACY_COLLECTION_DOCUMENTS_BUCKET = 'collection-documents';

function storageBucketForCollectionPath(storagePath: string): string {
  return storagePath.startsWith('collections/')
    ? COMMISSION_INVOICE_DOCUMENTS_BUCKET
    : LEGACY_COLLECTION_DOCUMENTS_BUCKET;
}

async function removeStoragePaths(
  admin: SupabaseClient,
  bucket: string,
  paths: string[],
): Promise<void> {
  const unique = [...new Set(paths.filter(Boolean))];
  if (unique.length === 0) return;

  const { error } = await admin.storage.from(bucket).remove(unique);
  if (error) {
    console.error(`Storage cleanup failed for bucket ${bucket}`, error);
  }
}

type DbDebtStatus = 'pending' | 'in_progress' | 'overdue' | 'paid' | 'written_off';

function deriveDebtStatusAfterCollectionChange(
  currentStatus: DbDebtStatus,
  debtAmount: number,
  paidAmount: number,
): DbDebtStatus {
  if (paidAmount >= debtAmount) return 'paid';
  if (paidAmount === 0) {
    if (currentStatus === 'paid') return 'pending';
    return currentStatus;
  }
  if (currentStatus === 'paid') return 'in_progress';
  return currentStatus;
}

function mapDbStatusToClient(status: DbDebtStatus): string {
  if (status === 'in_progress') return 'negotiating';
  return status;
}

export type DeleteCollectionResult = {
  debtId: string;
  paidAmount: number;
  status: string;
};

/**
 * Deletes a single recovery/collection and updates the parent debt totals.
 */
export async function deleteCollectionCascade(
  admin: SupabaseClient,
  collectionId: string,
): Promise<DeleteCollectionResult> {
  const { data: collection, error: collectionError } = await admin
    .from('debt_collections')
    .select('id, debt_id, amount')
    .eq('id', collectionId)
    .maybeSingle();

  if (collectionError) {
    throw new DebtDeleteError(
      'Failed to load recovery record.',
      'COLLECTION_LOOKUP_FAILED',
      500,
    );
  }

  if (!collection) {
    throw new DebtDeleteError('Recovery record not found.', 'COLLECTION_NOT_FOUND', 404);
  }

  const debtId = collection.debt_id as string;

  const { data: debt, error: debtError } = await admin
    .from('debts')
    .select('id, amount, status, client_id, assigned_agent_id')
    .eq('id', debtId)
    .maybeSingle();

  if (debtError || !debt) {
    throw new DebtDeleteError('Parent debt not found.', 'DEBT_NOT_FOUND', 404);
  }

  const { data: invoiceLine } = await admin
    .from('commission_invoice_lines')
    .select('invoice_id, commission_invoices ( status, reference )')
    .eq('debt_collection_id', collectionId)
    .maybeSingle();

  const invoiceMeta = invoiceLine?.commission_invoices as
    | { status: string; reference: string }
    | null
    | undefined;

  if (invoiceMeta?.status === 'paid') {
    throw new DebtDeleteError(
      `This recovery is on paid commission invoice ${invoiceMeta.reference}. Mark the invoice unpaid or adjust billing before deleting.`,
      'COMMISSION_INVOICE_PAID',
      409,
    );
  }

  const { data: collectionDocs } = await admin
    .from('debt_collection_documents')
    .select('storage_path')
    .eq('debt_collection_id', collectionId);

  const collectionDocPaths: { bucket: string; path: string }[] = [];
  for (const doc of collectionDocs ?? []) {
    const path = doc.storage_path as string;
    if (path) {
      collectionDocPaths.push({
        bucket: storageBucketForCollectionPath(path),
        path,
      });
    }
  }

  const invoiceDocPaths = await cleanupCommissionInvoicesForCollections(admin, [collectionId]);

  const { error: deleteDocsError } = await admin
    .from('debt_collection_documents')
    .delete()
    .eq('debt_collection_id', collectionId);

  if (deleteDocsError) {
    console.error('Collection document delete failed', deleteDocsError);
  }

  const { error: deleteCollectionError } = await admin
    .from('debt_collections')
    .delete()
    .eq('id', collectionId);

  if (deleteCollectionError) {
    throw new DebtDeleteError(
      'Could not delete recovery record. It may be locked by billing records.',
      'COLLECTION_DELETE_FAILED',
      500,
    );
  }

  const { data: remainingCollections, error: remainingError } = await admin
    .from('debt_collections')
    .select('amount')
    .eq('debt_id', debtId);

  if (remainingError) {
    throw new DebtDeleteError(
      'Recovery was deleted but totals could not be recalculated.',
      'TOTALS_RECALC_FAILED',
      500,
    );
  }

  const paidAmount = (remainingCollections ?? []).reduce(
    (sum, row) => sum + Number(row.amount ?? 0),
    0,
  );
  const debtAmount = Number(debt.amount ?? 0);
  const currentStatus = (debt.status as DbDebtStatus) ?? 'pending';
  const nextStatus = deriveDebtStatusAfterCollectionChange(
    currentStatus,
    debtAmount,
    paidAmount,
  );

  const { error: updateDebtError } = await admin
    .from('debts')
    .update({ paid_amount: paidAmount, status: nextStatus })
    .eq('id', debtId);

  if (updateDebtError) {
    throw new DebtDeleteError(
      'Recovery was deleted but debt totals could not be updated.',
      'DEBT_UPDATE_FAILED',
      500,
    );
  }

  await removeStoragePaths(admin, COMMISSION_INVOICE_DOCUMENTS_BUCKET, invoiceDocPaths);

  const collectionByBucket = new Map<string, string[]>();
  for (const { bucket, path } of collectionDocPaths) {
    const list = collectionByBucket.get(bucket) ?? [];
    list.push(path);
    collectionByBucket.set(bucket, list);
  }
  for (const [bucket, paths] of collectionByBucket) {
    await removeStoragePaths(admin, bucket, paths);
  }

  if (debt.client_id) {
    await recalculateClientTotals(admin, debt.client_id as string);
  }
  if (debt.assigned_agent_id) {
    await recalculateAgentTotals(admin, debt.assigned_agent_id as string);
  }

  return {
    debtId,
    paidAmount,
    status: mapDbStatusToClient(nextStatus),
  };
}
