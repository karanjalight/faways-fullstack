-- =============================================================================
-- CLEAR ALL DEBT DATA (Faways)
-- =============================================================================
-- Run in Supabase SQL Editor (or psql) against your project database.
--
-- What this removes:
--   - debts and all dependent rows (documents, collections, notes, etc.)
--   - commission invoices/lines tied to debt collections
--   - invoice line items linked to debts
--   - debt-related notifications
--
-- What this keeps:
--   - clients, agents, profiles, organizations, insurance contacts, etc.
--
-- Optional: uncomment the storage cleanup block at the bottom to remove files
-- from the "debt-documents" bucket (does not remove commission-invoice files).
--
-- WARNING: This is destructive and cannot be undone. Take a backup first.
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1) Commission billing that references debt_collections (ON DELETE RESTRICT)
-- ---------------------------------------------------------------------------
delete from public.commission_invoice_lines;

delete from public.commission_invoice_documents;

delete from public.commission_invoices;

-- ---------------------------------------------------------------------------
-- 2) Collection proof files, then collections
-- ---------------------------------------------------------------------------
delete from public.debt_collection_documents;

delete from public.debt_collections;

-- ---------------------------------------------------------------------------
-- 3) Invoice items that point at debts (FK has no cascade on debts)
-- ---------------------------------------------------------------------------
delete from public.invoice_items
where debt_id is not null;

-- ---------------------------------------------------------------------------
-- 4) Other tables with optional debt_id references
-- ---------------------------------------------------------------------------
delete from public.contact_interactions
where debt_id is not null;

delete from public.internal_messages
where debt_id is not null;

delete from public.email_logs
where related_debt_id is not null;

-- ---------------------------------------------------------------------------
-- 5) Debt child tables (also cascade when debts are deleted, but explicit is safer)
-- ---------------------------------------------------------------------------
delete from public.debt_documents;

delete from public.debt_notes;

-- ---------------------------------------------------------------------------
-- 6) Debt-related in-app notifications
-- ---------------------------------------------------------------------------
delete from public.notifications
where type in ('client_debt_submitted', 'debt_assigned_to_client')
   or payload ? 'debtId';

-- ---------------------------------------------------------------------------
-- 7) Debts
-- ---------------------------------------------------------------------------
delete from public.debts;

-- ---------------------------------------------------------------------------
-- 8) Reset denormalized counters
-- ---------------------------------------------------------------------------
update public.clients
set
  total_debt = 0,
  total_paid = 0,
  last_contact_at = null;

update public.agents
set
  assigned_debts = 0,
  total_collected = 0;

update public.daily_metrics
set
  total_debts = 0,
  total_recovered = 0,
  new_debts = 0,
  closed_debts = 0;

commit;

-- ---------------------------------------------------------------------------
-- OPTIONAL: clear uploaded debt document files from Storage
-- ---------------------------------------------------------------------------
-- Uncomment to also remove objects in the debt-documents bucket.
--
-- delete from storage.objects
-- where bucket_id = 'debt-documents';

-- ---------------------------------------------------------------------------
-- Verify (run separately after commit)
-- ---------------------------------------------------------------------------
-- select 'debts' as table_name, count(*) from public.debts
-- union all select 'debt_documents', count(*) from public.debt_documents
-- union all select 'debt_collections', count(*) from public.debt_collections
-- union all select 'debt_collection_documents', count(*) from public.debt_collection_documents
-- union all select 'commission_invoices', count(*) from public.commission_invoices
-- union all select 'commission_invoice_lines', count(*) from public.commission_invoice_lines;
