import type { SupabaseClient } from '@supabase/supabase-js';

const DEBT_DOCUMENTS_BUCKET = 'debt-documents';
const COMMISSION_INVOICE_DOCUMENTS_BUCKET = 'commission-invoice-documents';
const LEGACY_COLLECTION_DOCUMENTS_BUCKET = 'collection-documents';

export class DebtDeleteError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status = 400) {
    super(message);
    this.name = 'DebtDeleteError';
    this.code = code;
    this.status = status;
  }
}

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

async function recalculateClientTotals(
  admin: SupabaseClient,
  clientId: string,
): Promise<void> {
  const { data: debts, error } = await admin
    .from('debts')
    .select('amount, paid_amount')
    .eq('client_id', clientId);

  if (error) {
    console.error('Failed to recalculate client totals', error);
    return;
  }

  const totalDebt = (debts ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
  const totalPaid = (debts ?? []).reduce((sum, row) => sum + Number(row.paid_amount ?? 0), 0);

  await admin
    .from('clients')
    .update({ total_debt: totalDebt, total_paid: totalPaid })
    .eq('id', clientId);
}

async function recalculateAgentTotals(
  admin: SupabaseClient,
  agentId: string,
): Promise<void> {
  const { data: debts, error } = await admin
    .from('debts')
    .select('paid_amount, status')
    .eq('assigned_agent_id', agentId);

  if (error) {
    console.error('Failed to recalculate agent totals', error);
    return;
  }

  const rows = debts ?? [];
  const assignedDebts = rows.filter(
    (row) => row.status !== 'paid' && row.status !== 'written_off',
  ).length;
  const totalCollected = rows.reduce((sum, row) => sum + Number(row.paid_amount ?? 0), 0);

  await admin
    .from('agents')
    .update({ assigned_debts: assignedDebts, total_collected: totalCollected })
    .eq('id', agentId);
}

async function cleanupCommissionInvoicesForCollections(
  admin: SupabaseClient,
  collectionIds: string[],
): Promise<string[]> {
  if (collectionIds.length === 0) return [];

  const { data: lines, error: linesError } = await admin
    .from('commission_invoice_lines')
    .select('id, invoice_id, debt_collection_id')
    .in('debt_collection_id', collectionIds);

  if (linesError) {
    throw new DebtDeleteError(
      'Could not verify commission invoices for this debt.',
      'COMMISSION_LOOKUP_FAILED',
      500,
    );
  }

  const invoiceIds = [...new Set((lines ?? []).map((line) => line.invoice_id as string))];
  if (invoiceIds.length === 0) return [];

  const { error: deleteLinesError } = await admin
    .from('commission_invoice_lines')
    .delete()
    .in('debt_collection_id', collectionIds);

  if (deleteLinesError) {
    throw new DebtDeleteError(
      'Could not remove commission invoice lines linked to this debt.',
      'COMMISSION_LINE_DELETE_FAILED',
      500,
    );
  }

  const invoiceDocPaths: string[] = [];

  for (const invoiceId of invoiceIds) {
    const { count, error: countError } = await admin
      .from('commission_invoice_lines')
      .select('id', { count: 'exact', head: true })
      .eq('invoice_id', invoiceId);

    if (countError) {
      console.error('Failed to count invoice lines', countError);
      continue;
    }

    if ((count ?? 0) === 0) {
      const { data: docs } = await admin
        .from('commission_invoice_documents')
        .select('storage_path')
        .eq('invoice_id', invoiceId);

      for (const doc of docs ?? []) {
        if (doc.storage_path) invoiceDocPaths.push(doc.storage_path as string);
      }

      const { error: deleteInvoiceError } = await admin
        .from('commission_invoices')
        .delete()
        .eq('id', invoiceId);

      if (deleteInvoiceError) {
        console.error('Failed to delete empty commission invoice', deleteInvoiceError);
      }
    } else {
      const { data: remainingLines, error: remainingError } = await admin
        .from('commission_invoice_lines')
        .select('amount_recovered, commission_amount')
        .eq('invoice_id', invoiceId);

      if (remainingError || !remainingLines) continue;

      const totalRecovered = remainingLines.reduce(
        (sum, line) => sum + Number(line.amount_recovered ?? 0),
        0,
      );
      const totalCommission = remainingLines.reduce(
        (sum, line) => sum + Number(line.commission_amount ?? 0),
        0,
      );

      await admin
        .from('commission_invoices')
        .update({
          total_recovered: totalRecovered,
          total_commission: totalCommission,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);
    }
  }

  return invoiceDocPaths;
}

/**
 * Deletes a debt and all dependent records (collections, documents, commission
 * lines, notifications, etc.). Storage cleanup is best-effort after DB deletes.
 */
export async function deleteDebtCascade(
  admin: SupabaseClient,
  debtId: string,
): Promise<void> {
  const { data: debt, error: debtError } = await admin
    .from('debts')
    .select('id, client_id, assigned_agent_id')
    .eq('id', debtId)
    .maybeSingle();

  if (debtError) {
    throw new DebtDeleteError('Failed to load debt.', 'DEBT_LOOKUP_FAILED', 500);
  }

  if (!debt) {
    throw new DebtDeleteError('Debt not found.', 'DEBT_NOT_FOUND', 404);
  }

  const { data: collections, error: collectionsError } = await admin
    .from('debt_collections')
    .select('id')
    .eq('debt_id', debtId);

  if (collectionsError) {
    throw new DebtDeleteError(
      'Failed to load collections for this debt.',
      'COLLECTIONS_LOOKUP_FAILED',
      500,
    );
  }

  const collectionIds = (collections ?? []).map((row) => row.id as string);

  const collectionDocPaths: { bucket: string; path: string }[] = [];
  if (collectionIds.length > 0) {
    const { data: collectionDocs } = await admin
      .from('debt_collection_documents')
      .select('storage_path')
      .in('debt_collection_id', collectionIds);

    for (const doc of collectionDocs ?? []) {
      const path = doc.storage_path as string;
      if (path) {
        collectionDocPaths.push({
          bucket: storageBucketForCollectionPath(path),
          path,
        });
      }
    }
  }

  const invoiceDocPaths = await cleanupCommissionInvoicesForCollections(
    admin,
    collectionIds,
  );

  const { data: debtDocs } = await admin
    .from('debt_documents')
    .select('storage_path')
    .eq('debt_id', debtId);

  const debtDocPaths = (debtDocs ?? [])
    .map((doc) => doc.storage_path as string)
    .filter(Boolean);

  const relatedDeletes = [
    admin.from('invoice_items').delete().eq('debt_id', debtId),
    admin.from('contact_interactions').delete().eq('debt_id', debtId),
    admin.from('internal_messages').delete().eq('debt_id', debtId),
    admin.from('email_logs').delete().eq('related_debt_id', debtId),
    admin.from('debt_notes').delete().eq('debt_id', debtId),
    admin.from('debt_documents').delete().eq('debt_id', debtId),
  ];

  if (collectionIds.length > 0) {
    relatedDeletes.push(
      admin.from('debt_collection_documents').delete().in('debt_collection_id', collectionIds),
      admin.from('debt_collections').delete().eq('debt_id', debtId),
    );
  }

  const relatedResults = await Promise.all(relatedDeletes);
  for (const result of relatedResults) {
    if (result.error) {
      console.error('Related record cleanup error', result.error);
    }
  }

  const { error: notificationsError } = await admin
    .from('notifications')
    .delete()
    .or(
      `type.in.(client_debt_submitted,debt_assigned_to_client),payload->>debtId.eq.${debtId}`,
    );

  if (notificationsError) {
    console.error('Notification cleanup error', notificationsError);
  }

  const { error: deleteDebtError } = await admin.from('debts').delete().eq('id', debtId);

  if (deleteDebtError) {
    console.error('Debt delete failed', deleteDebtError);
    throw new DebtDeleteError(
      'Could not delete the debt. It may still be referenced by other records.',
      'DEBT_DELETE_FAILED',
      500,
    );
  }

  await removeStoragePaths(admin, DEBT_DOCUMENTS_BUCKET, debtDocPaths);
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
}
