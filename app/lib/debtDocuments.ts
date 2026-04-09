'use client';

import { supabase } from '@/lib/supabase-client';
import type { DebtDocument } from '../types/debt';

/** Create this bucket in Supabase (private). Path pattern: `{debtId}/{uuid}-{filename}` */
export const DEBT_DOCUMENTS_BUCKET = 'debt-documents';

const SIGNED_URL_SECONDS = 60 * 60 * 12;

type DebtDocumentRow = {
  id: string;
  debt_id: string;
  storage_path: string;
  name: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_at: string;
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  const kb = n / 1024;
  if (kb < 1024) return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function mimeToType(mime: string | null): DebtDocument['type'] {
  if (!mime) return 'other';
  if (mime.includes('pdf')) return 'pdf';
  if (mime.startsWith('image/')) return 'image';
  return 'other';
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w.\-]+/g, '_').replace(/^\.+/, '').slice(0, 200) || 'file';
}

export async function fetchDebtDocumentsWithUrls(debtId: string): Promise<DebtDocument[]> {
  const { data, error } = await supabase
    .from('debt_documents')
    .select('id, debt_id, storage_path, name, mime_type, size_bytes, uploaded_at')
    .eq('debt_id', debtId)
    .order('uploaded_at', { ascending: false });

  if (error) {
    console.error('Error fetching debt documents', error);
    throw error;
  }

  const rows = (data ?? []) as DebtDocumentRow[];
  const results: DebtDocument[] = [];

  for (const row of rows) {
    const { data: signed, error: signError } = await supabase.storage
      .from(DEBT_DOCUMENTS_BUCKET)
      .createSignedUrl(row.storage_path, SIGNED_URL_SECONDS);

    if (signError) {
      console.error('Signed URL error', signError);
    }

    const sizeBytes = Number(row.size_bytes ?? 0);
    results.push({
      id: row.id,
      name: row.name,
      type: mimeToType(row.mime_type),
      size: formatBytes(sizeBytes),
      uploadedAt: row.uploaded_at,
      uploadedBy: '',
      url: signed?.signedUrl,
      storagePath: row.storage_path,
      mimeType: row.mime_type ?? undefined,
    });
  }

  return results;
}

export async function uploadDebtDocumentsForDebt(
  debtId: string,
  items: { file: File; displayName: string }[],
): Promise<void> {
  for (const item of items) {
    const safeBase = sanitizeFilename(item.file.name);
    const storagePath = `${debtId}/${crypto.randomUUID()}-${safeBase}`;

    const { error: upError } = await supabase.storage
      .from(DEBT_DOCUMENTS_BUCKET)
      .upload(storagePath, item.file, {
        cacheControl: '3600',
        upsert: false,
        contentType: item.file.type || undefined,
      });

    if (upError) {
      console.error('Storage upload failed', upError);
      throw upError;
    }

    const label = item.displayName.trim() || item.file.name;
    const { error: insError } = await supabase.from('debt_documents').insert({
      debt_id: debtId,
      storage_path: storagePath,
      name: label,
      mime_type: item.file.type || null,
      size_bytes: item.file.size,
    });

    if (insError) {
      console.error('debt_documents insert failed', insError);
      throw insError;
    }
  }
}

export async function deleteDebtDocument(documentId: string): Promise<void> {
  const { data: row, error: fetchError } = await supabase
    .from('debt_documents')
    .select('storage_path')
    .eq('id', documentId)
    .maybeSingle();

  if (fetchError) {
    console.error('Error loading document row', fetchError);
    throw fetchError;
  }

  if (!row) {
    throw new Error('Document not found');
  }

  const path = row.storage_path as string;
  if (path) {
    const { error: storageError } = await supabase.storage
      .from(DEBT_DOCUMENTS_BUCKET)
      .remove([path]);

    if (storageError) {
      console.error('Storage remove failed', storageError);
      throw storageError;
    }
  }

  const { error: delError } = await supabase
    .from('debt_documents')
    .delete()
    .eq('id', documentId);

  if (delError) {
    console.error('debt_documents delete failed', delError);
    throw delError;
  }
}
