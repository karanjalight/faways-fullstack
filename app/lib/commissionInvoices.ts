'use client';

import { supabase } from '@/lib/supabase-client';
import type { CollectionInvoiceRow } from './commissions';
import type {
  CommissionInvoiceDetail,
  CommissionInvoiceDocument,
  CommissionInvoiceLineDetail,
  CommissionInvoiceStatus,
  CommissionInvoiceSummary,
} from '../types/commissionInvoice';

export const COMMISSION_INVOICE_DOCUMENTS_BUCKET = 'commission-invoice-documents';

const SIGNED_URL_SECONDS = 60 * 60 * 12;

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w.\-]+/g, '_').replace(/^\.+/, '').slice(0, 200) || 'file';
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  const kb = n / 1024;
  if (kb < 1024) return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function newReference(): string {
  return `INV-${crypto.randomUUID().replace(/-/g, '').slice(0, 14).toUpperCase()}`;
}

export type CollectionInvoiceLink = { invoiceId: string; reference: string };

/** Map debt_collection.id → saved commission invoice */
export async function fetchCollectionToInvoiceMap(): Promise<
  Map<string, CollectionInvoiceLink>
> {
  const m = new Map<string, CollectionInvoiceLink>();
  const { data, error } = await supabase
    .from('commission_invoice_lines')
    .select('debt_collection_id, commission_invoices ( id, reference )');

  if (error) {
    console.error('fetchCollectionToInvoiceMap', error);
    return m;
  }

  for (const row of data ?? []) {
    const r = row as {
      debt_collection_id: string;
      commission_invoices:
        | { id: string; reference: string }
        | { id: string; reference: string }[]
        | null;
    };
    const inv = r.commission_invoices;
    const invObj = Array.isArray(inv) ? inv[0] : inv;
    if (invObj?.id && r.debt_collection_id) {
      m.set(r.debt_collection_id, {
        invoiceId: invObj.id,
        reference: invObj.reference,
      });
    }
  }
  return m;
}

export async function fetchInvoicedCollectionIds(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('commission_invoice_lines')
    .select('debt_collection_id');

  if (error) {
    console.error('fetchInvoicedCollectionIds', error);
    throw error;
  }

  return new Set(
    (data ?? []).map((r: { debt_collection_id: string }) => r.debt_collection_id),
  );
}

function mapSummaryRow(row: Record<string, unknown>): CommissionInvoiceSummary {
  const clients = row.clients as { name?: string } | null | undefined;
  return {
    id: row.id as string,
    reference: row.reference as string,
    clientId: (row.client_id as string | null) ?? null,
    clientName: clients?.name ?? null,
    periodStart: String(row.period_start).slice(0, 10),
    periodEnd: String(row.period_end).slice(0, 10),
    totalRecovered: Number(row.total_recovered ?? 0),
    totalCommission: Number(row.total_commission ?? 0),
    status: row.status as CommissionInvoiceStatus,
    paidAt: row.paid_at ? String(row.paid_at) : null,
    paidNote: (row.paid_note as string | null) ?? null,
    createdAt: String(row.created_at),
  };
}

export async function listCommissionInvoices(): Promise<CommissionInvoiceSummary[]> {
  const { data, error } = await supabase
    .from('commission_invoices')
    .select(
      `
      id,
      reference,
      client_id,
      period_start,
      period_end,
      total_recovered,
      total_commission,
      status,
      paid_at,
      paid_note,
      created_at,
      clients ( name )
    `,
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('listCommissionInvoices', error);
    throw error;
  }

  return (data ?? []).map((r) => mapSummaryRow(r as Record<string, unknown>));
}

export async function createCommissionInvoicesFromLineItems(
  items: { row: CollectionInvoiceRow; commission: number }[],
): Promise<string[]> {
  if (items.length === 0) return [];

  const invoiced = await fetchInvoicedCollectionIds();
  for (const { row } of items) {
    if (invoiced.has(row.collectionId)) {
      throw new Error(
        `Collection ${row.collectionId.slice(0, 8)}… is already on a saved invoice.`,
      );
    }
  }

  const groups = new Map<string, { row: CollectionInvoiceRow; commission: number }[]>();
  for (const item of items) {
    const key = item.row.clientId ?? '__none__';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }

  const createdIds: string[] = [];

  for (const [, group] of groups) {
    const dates = group.map((g) => g.row.collectionDate.slice(0, 10));
    const periodStart = dates.reduce((a, b) => (a < b ? a : b));
    const periodEnd = dates.reduce((a, b) => (a > b ? a : b));
    const totalRecovered = group.reduce((s, g) => s + g.row.amount, 0);
    const totalCommission = group.reduce((s, g) => s + g.commission, 0);
    const clientId =
      group[0].row.clientId === null || group[0].row.clientId === undefined
        ? null
        : group[0].row.clientId;

    const reference = newReference();

    const { data: inv, error: invErr } = await supabase
      .from('commission_invoices')
      .insert({
        reference,
        client_id: clientId,
        period_start: periodStart,
        period_end: periodEnd,
        total_recovered: totalRecovered,
        total_commission: totalCommission,
        status: 'issued',
      })
      .select('id')
      .single();

    if (invErr || !inv) {
      console.error('insert commission_invoices', invErr);
      throw invErr ?? new Error('Failed to create invoice');
    }

    const invoiceId = inv.id as string;

    for (const g of group) {
      const { error: lineErr } = await supabase.from('commission_invoice_lines').insert({
        invoice_id: invoiceId,
        debt_collection_id: g.row.collectionId,
        amount_recovered: g.row.amount,
        commission_amount: g.commission,
        case_creditor: g.row.creditorName || null,
        case_debtor: g.row.debtorName || null,
        collection_date: g.row.collectionDate.slice(0, 10),
      });
      if (lineErr) {
        console.error('insert commission_invoice_lines', lineErr);
        await supabase.from('commission_invoices').delete().eq('id', invoiceId);
        throw lineErr;
      }
    }

    createdIds.push(invoiceId);
  }

  return createdIds;
}

export async function fetchCommissionInvoiceDocuments(
  invoiceId: string,
): Promise<CommissionInvoiceDocument[]> {
  const { data, error } = await supabase
    .from('commission_invoice_documents')
    .select('id, storage_path, name, mime_type, size_bytes, uploaded_at')
    .eq('invoice_id', invoiceId)
    .order('uploaded_at', { ascending: false });

  if (error) {
    console.error('fetchCommissionInvoiceDocuments', error);
    throw error;
  }

  const rows = (data ?? []) as Array<{
    id: string;
    storage_path: string;
    name: string;
    mime_type: string | null;
    size_bytes: number | null;
    uploaded_at: string;
  }>;

  const out: CommissionInvoiceDocument[] = [];
  for (const row of rows) {
    const { data: signed, error: signError } = await supabase.storage
      .from(COMMISSION_INVOICE_DOCUMENTS_BUCKET)
      .createSignedUrl(row.storage_path, SIGNED_URL_SECONDS);

    if (signError) console.error('Signed URL', signError);

    out.push({
      id: row.id,
      name: row.name,
      sizeLabel: formatBytes(Number(row.size_bytes ?? 0)),
      url: signed?.signedUrl,
      uploadedAt: row.uploaded_at,
      storagePath: row.storage_path,
    });
  }
  return out;
}

export async function fetchCommissionInvoiceDetail(
  invoiceId: string,
): Promise<CommissionInvoiceDetail | null> {
  const { data: inv, error: invErr } = await supabase
    .from('commission_invoices')
    .select(
      `
      id,
      reference,
      client_id,
      period_start,
      period_end,
      total_recovered,
      total_commission,
      status,
      paid_at,
      paid_note,
      created_at,
      clients ( name )
    `,
    )
    .eq('id', invoiceId)
    .maybeSingle();

  if (invErr) {
    console.error('fetchCommissionInvoiceDetail', invErr);
    throw invErr;
  }
  if (!inv) return null;

  const { data: lineRows, error: lineErr } = await supabase
    .from('commission_invoice_lines')
    .select(
      'id, debt_collection_id, amount_recovered, commission_amount, case_creditor, case_debtor, collection_date',
    )
    .eq('invoice_id', invoiceId)
    .order('collection_date', { ascending: false });

  if (lineErr) {
    console.error('invoice lines', lineErr);
    throw lineErr;
  }

  const lines: CommissionInvoiceLineDetail[] = [];

  type LineRaw = {
    id: string;
    debt_collection_id: string;
    amount_recovered: number;
    commission_amount: number;
    case_creditor: string | null;
    case_debtor: string | null;
    collection_date: string | null;
  };

  for (const raw of (lineRows ?? []) as LineRaw[]) {
    lines.push({
      lineId: raw.id,
      collectionId: raw.debt_collection_id,
      collectionDate: raw.collection_date
        ? String(raw.collection_date).slice(0, 10)
        : '',
      amountRecovered: Number(raw.amount_recovered),
      commissionAmount: Number(raw.commission_amount),
      creditorName: raw.case_creditor ?? '',
      debtorName: raw.case_debtor ?? '',
    });
  }

  const documents = await fetchCommissionInvoiceDocuments(invoiceId);
  const summary = mapSummaryRow(inv as Record<string, unknown>);

  return { ...summary, lines, documents };
}

export async function updateCommissionInvoicePayment(
  invoiceId: string,
  status: CommissionInvoiceStatus,
  paidNote?: string | null,
): Promise<void> {
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    status,
    updated_at: now,
  };
  if (status === 'paid') {
    patch.paid_at = now;
    patch.paid_note = paidNote?.trim() || null;
  } else {
    patch.paid_at = null;
    patch.paid_note = null;
  }

  const { error } = await supabase
    .from('commission_invoices')
    .update(patch)
    .eq('id', invoiceId);

  if (error) {
    console.error('updateCommissionInvoicePayment', error);
    throw error;
  }
}

export async function uploadCommissionInvoiceDocument(
  invoiceId: string,
  file: File,
  displayName: string,
): Promise<void> {
  const safeBase = sanitizeFilename(file.name);
  const storagePath = `${invoiceId}/${crypto.randomUUID()}-${safeBase}`;

  const { error: upError } = await supabase.storage
    .from(COMMISSION_INVOICE_DOCUMENTS_BUCKET)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    });

  if (upError) {
    console.error('Storage upload failed', upError);
    throw upError;
  }

  const label = displayName.trim() || file.name;
  const { error: insError } = await supabase.from('commission_invoice_documents').insert({
    invoice_id: invoiceId,
    storage_path: storagePath,
    name: label,
    mime_type: file.type || null,
    size_bytes: file.size,
  });

  if (insError) {
    console.error('commission_invoice_documents insert', insError);
    throw insError;
  }
}

export class CommissionInvoiceClientError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status = 400) {
    super(message);
    this.name = 'CommissionInvoiceClientError';
    this.code = code;
    this.status = status;
  }
}

async function parseInvoiceApiError(
  response: Response,
  fallback: string,
): Promise<CommissionInvoiceClientError> {
  let payload: { error?: string; code?: string } = {};
  try {
    payload = (await response.json()) as { error?: string; code?: string };
  } catch {
    // ignore
  }

  return new CommissionInvoiceClientError(
    payload.error ?? fallback,
    payload.code ?? 'REQUEST_FAILED',
    response.status,
  );
}

export async function deleteCommissionInvoice(invoiceId: string): Promise<void> {
  const response = await fetch(`/api/invoices/${encodeURIComponent(invoiceId)}`, {
    method: 'DELETE',
  });

  if (response.ok) return;

  throw await parseInvoiceApiError(
    response,
    response.status === 404
      ? 'Invoice not found. It may have already been deleted.'
      : 'Failed to delete invoice. Please try again.',
  );
}

export type MergeCommissionInvoicesResponse = {
  success: boolean;
  mergedInvoiceId: string;
  mergedReference: string;
  removedInvoiceIds: string[];
  removedReferences: string[];
  lineCount: number;
  totalRecovered: number;
  totalCommission: number;
};

export async function mergeCommissionInvoices(
  invoiceIds: string[],
  targetInvoiceId?: string,
): Promise<MergeCommissionInvoicesResponse> {
  const response = await fetch('/api/invoices/merge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ invoiceIds, targetInvoiceId }),
  });

  if (response.ok) {
    return (await response.json()) as MergeCommissionInvoicesResponse;
  }

  throw await parseInvoiceApiError(
    response,
    'Failed to merge invoices. Please try again.',
  );
}

export async function deleteCommissionInvoiceDocument(documentId: string): Promise<void> {
  const { data: row, error: fetchError } = await supabase
    .from('commission_invoice_documents')
    .select('storage_path')
    .eq('id', documentId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!row) throw new Error('Document not found');

  const path = row.storage_path as string;
  if (path) {
    const { error: storageError } = await supabase.storage
      .from(COMMISSION_INVOICE_DOCUMENTS_BUCKET)
      .remove([path]);
    if (storageError) throw storageError;
  }

  const { error: delError } = await supabase
    .from('commission_invoice_documents')
    .delete()
    .eq('id', documentId);

  if (delError) throw delError;
}
