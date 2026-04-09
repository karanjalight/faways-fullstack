'use client';

import { supabase } from '@/lib/supabase-client';
import type { CollectionAttachment } from '../types/collectionDocument';
import { COMMISSION_INVOICE_DOCUMENTS_BUCKET } from './commissionInvoices';

/**
 * Collection proof files are stored in the same private bucket as commission invoice PDFs,
 * under `collections/{debtCollectionId}/…` so they stay separate from invoice uploads
 * (`{invoiceId}/…`).
 */
export const COLLECTION_DOCUMENTS_BUCKET = COMMISSION_INVOICE_DOCUMENTS_BUCKET;

/** Older rows may still point at the legacy bucket with paths `{collectionId}/…`. */
const LEGACY_COLLECTION_DOCUMENTS_BUCKET = 'collection-documents';

function storageBucketForPath(storagePath: string): string {
  return storagePath.startsWith('collections/')
    ? COMMISSION_INVOICE_DOCUMENTS_BUCKET
    : LEGACY_COLLECTION_DOCUMENTS_BUCKET;
}

const SIGNED_URL_SECONDS = 60 * 60 * 12;

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w.\-]+/g, '_').replace(/^\.+/, '').slice(0, 200) || 'file';
}

export async function fetchCollectionDocumentsMap(
  collectionIds: string[],
): Promise<Map<string, CollectionAttachment[]>> {
  const map = new Map<string, CollectionAttachment[]>();
  if (collectionIds.length === 0) return map;

  const { data, error } = await supabase
    .from('debt_collection_documents')
    .select('id, debt_collection_id, storage_path, name, uploaded_at')
    .in('debt_collection_id', collectionIds)
    .order('uploaded_at', { ascending: false });

  if (error) {
    console.error('fetchCollectionDocumentsMap', error);
    throw error;
  }

  type Row = {
    id: string;
    debt_collection_id: string;
    storage_path: string;
    name: string;
    uploaded_at: string;
  };

  for (const row of (data ?? []) as Row[]) {
    const bucket = storageBucketForPath(row.storage_path);
    const { data: signed, error: signError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(row.storage_path, SIGNED_URL_SECONDS);

    if (signError) console.error('collection doc signed url', signError);

    const att: CollectionAttachment = {
      id: row.id,
      debtCollectionId: row.debt_collection_id,
      name: row.name,
      url: signed?.signedUrl,
      uploadedAt: row.uploaded_at,
      storagePath: row.storage_path,
    };
    const list = map.get(row.debt_collection_id) ?? [];
    list.push(att);
    map.set(row.debt_collection_id, list);
  }

  return map;
}

export async function uploadCollectionDocuments(
  debtCollectionId: string,
  items: { file: File; displayName: string }[],
): Promise<void> {
  for (const item of items) {
    const safeBase = sanitizeFilename(item.file.name);
    const storagePath = `collections/${debtCollectionId}/${crypto.randomUUID()}-${safeBase}`;

    const { error: upError } = await supabase.storage
      .from(COMMISSION_INVOICE_DOCUMENTS_BUCKET)
      .upload(storagePath, item.file, {
        cacheControl: '3600',
        upsert: false,
        contentType: item.file.type || undefined,
      });

    if (upError) {
      console.error('collection storage upload', upError);
      throw new Error(
        `Storage upload failed: ${upError.message}. In Supabase → Storage → commission-invoice-documents → Policies, allow authenticated INSERT (and SELECT for signed URLs).`,
      );
    }

    const label = item.displayName.trim() || item.file.name;
    const { error: insError } = await supabase.from('debt_collection_documents').insert({
      debt_collection_id: debtCollectionId,
      storage_path: storagePath,
      name: label,
      mime_type: item.file.type || null,
      size_bytes: item.file.size,
    });

    if (insError) {
      console.error('debt_collection_documents insert', insError);
      await supabase.storage.from(COMMISSION_INVOICE_DOCUMENTS_BUCKET).remove([storagePath]);
      throw new Error(
        `Saved file to storage but database row failed: ${insError.message}. Add RLS policies on public.debt_collection_documents for the authenticated role (see lib/supabase_migration.sql).`,
      );
    }
  }
}

export async function deleteCollectionDocument(documentId: string): Promise<void> {
  const { data: row, error: fetchError } = await supabase
    .from('debt_collection_documents')
    .select('storage_path')
    .eq('id', documentId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!row) throw new Error('Document not found');

  const path = row.storage_path as string;
  if (path) {
    const bucket = storageBucketForPath(path);
    const { error: storageError } = await supabase.storage.from(bucket).remove([path]);
    if (storageError) throw storageError;
  }

  const { error: delError } = await supabase
    .from('debt_collection_documents')
    .delete()
    .eq('id', documentId);

  if (delError) throw delError;
}
