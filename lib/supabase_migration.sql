-- Supabase full schema migration for Faways Debt Management
-- Run this in Supabase SQL editor or as an initial migration.

-- =========================
-- ENUM TYPES
-- =========================

create type public.debt_status as enum ('pending','in_progress','overdue','paid','written_off');

create type public.debt_stage as enum ('new','in-review','escalated','legal','closed');

create type public.debt_priority as enum ('low','medium','high');

create type public.debt_category as enum ('quick','valid','bad');

create type public.contact_type as enum ('debtor','client','insurer','lawyer','other');

create type public.interaction_channel as enum ('call','email','sms','whatsapp','portal_message');

create type public.event_category as enum ('auth','debt','invoice','communication','admin','analytics');

create type public.invoice_status as enum ('draft','sent','partially_paid','paid','cancelled');

create type public.payment_method as enum ('bank_transfer','mpesa','card','cash','other');

-- =========================
-- CORE ENTITIES & AUTH-RELATED
-- =========================

-- Organizations / companies (Faways internal, client companies, partners)
create table if not exists public.organizations (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  type           text check (type in ('faways_internal','client','partner')) default 'client',
  region         text,
  created_at     timestamptz not null default now()
);

-- User profile extending auth.users
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id),
  full_name       text,
  role            text not null check (role in ('admin','agent','client','finance')),
  phone           text,
  job_title       text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

-- User security / 2FA metadata
create table if not exists public.user_security (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  twofa_enabled boolean not null default false,
  twofa_secret  text,
  backup_codes  text[],
  updated_at    timestamptz not null default now()
);

-- =========================
-- AGENTS, PARTNERS, CLIENTS
-- =========================

-- Internal or external collection agents
create table if not exists public.agents (
  id               uuid primary key default gen_random_uuid(),
  profile_id       uuid not null references public.profiles(id) on delete cascade,
  name             text,
  email            text,
  phone            text,
  department       text,
  status           text not null default 'active' check (status in ('active','inactive','on-leave')),
  assigned_debts   integer not null default 0,
  total_collected  numeric(18,2) not null default 0,
  performance_score numeric(5,2),
  join_date        date not null default current_date,
  created_at       timestamptz not null default now()
);

-- Insurance partners
create table if not exists public.insurance_partners (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text,
  phone       text,
  region      text,
  notes       text,
  created_at  timestamptz not null default now()
);

-- Detailed insurance contacts used by the Insurance page
create table if not exists public.insurance_contacts (
  id             uuid primary key default gen_random_uuid(),
  company        text not null,
  contact_person text not null,
  email          text not null,
  phone          text not null,
  policy_number  text,
  coverage_type  text not null,
  status         text not null default 'active' check (status in ('active','expired','pending')),
  expiry_date    date,
  notes          text,
  created_at     timestamptz not null default now()
);

-- Legal partners
create table if not exists public.legal_partners (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text,
  phone       text,
  region      text,
  notes       text,
  created_at  timestamptz not null default now()
);

-- Client organizations using the platform
create table if not exists public.clients (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id),
  name             text not null,
  email            text,
  phone            text,
  status           text not null default 'active' check (status in ('active','inactive','closed')),
  sector           text,
  region           text,
  assigned_agent_id uuid references public.agents(id),
  total_debt       numeric(18,2) default 0,
  total_paid       numeric(18,2) default 0,
  last_contact_at  timestamptz,
  -- Commission on recoveries for all debts under this client (% of each collection or flat per collection)
  recovery_commission_type    text not null default 'percent'
    check (recovery_commission_type in ('percent','flat')),
  recovery_commission_percent numeric(7,4),
  recovery_commission_flat    numeric(18,2),
  created_at       timestamptz not null default now()
);

-- =========================
-- CONTACT DIRECTORY & CRM
-- =========================

-- Unified contact directory for debtors, client reps, insurers, lawyers, etc.
create table if not exists public.contacts (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id),
  type            public.contact_type not null,
  name            text not null,
  email           text,
  phone           text,
  company         text,
  position        text,
  region          text,
  is_primary      boolean not null default false,
  created_at      timestamptz not null default now()
);

-- Link multiple contacts to a client with roles
create table if not exists public.client_contacts (
  client_id  uuid not null references public.clients(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  role       text,
  primary key (client_id, contact_id)
);

-- =========================
-- DEBT MANAGEMENT
-- =========================

create table if not exists public.debts (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid references public.clients(id),
  debtor_name       text,
  debtor_contact_id uuid references public.contacts(id),
  primary_contact_id uuid references public.contacts(id),
  creditor_name     text,
  amount            numeric(18,2) not null,
  paid_amount       numeric(18,2) not null default 0,
  currency          text not null default 'KES',
  status            public.debt_status not null default 'pending',
  stage             public.debt_stage not null default 'new',
  priority          public.debt_priority not null default 'medium',
  category          public.debt_category not null default 'valid',
  reference_no      text,
  service_line      text,
  region            text,
  owner             text,
  assigned_agent_id uuid references public.agents(id),
  insurance_id      uuid references public.insurance_partners(id),
  due_date          date,
  description       text,
  opened_at         timestamptz not null default now(),
  closed_at         timestamptz,
  created_by        uuid references public.profiles(id),
  updated_at        timestamptz not null default now()
);

-- Documents attached to debts (contracts, receipts, letters, etc.)
create table if not exists public.debt_documents (
  id           uuid primary key default gen_random_uuid(),
  debt_id      uuid not null references public.debts(id) on delete cascade,
  storage_path text not null,
  name         text not null,
  mime_type    text,
  size_bytes   bigint,
  category     text,
  uploaded_by  uuid references public.profiles(id),
  uploaded_at  timestamptz not null default now(),
  is_reviewed  boolean not null default false
);

-- Individual cash collections / recoveries against a debt
create table if not exists public.debt_collections (
  id              uuid primary key default gen_random_uuid(),
  debt_id         uuid not null references public.debts(id) on delete cascade,
  collection_date date not null default current_date,
  amount          numeric(18,2) not null,
  insurance_name  text,
  method          text,
  reference       text,
  notes           text,
  created_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now()
);

-- Remittance / proof files tied to a specific collection event
create table if not exists public.debt_collection_documents (
  id                   uuid primary key default gen_random_uuid(),
  debt_collection_id   uuid not null references public.debt_collections(id) on delete cascade,
  storage_path         text not null,
  name                 text not null,
  mime_type            text,
  size_bytes           bigint,
  uploaded_at          timestamptz not null default now()
);

-- Notes, disputes, threaded comments on each debt
create table if not exists public.debt_notes (
  id             uuid primary key default gen_random_uuid(),
  debt_id        uuid not null references public.debts(id) on delete cascade,
  parent_id      uuid references public.debt_notes(id),
  author_id      uuid not null references public.profiles(id),
  kind           text not null default 'general' check (kind in ('general','dispute','resolution','internal')),
  body           text not null,
  is_client_visible boolean not null default true,
  created_at     timestamptz not null default now()
);

-- Interaction / call / email history
create table if not exists public.contact_interactions (
  id             uuid primary key default gen_random_uuid(),
  contact_id     uuid not null references public.contacts(id),
  debt_id        uuid references public.debts(id),
  client_id      uuid references public.clients(id),
  performed_by   uuid references public.profiles(id),
  channel        public.interaction_channel not null,
  direction      text not null check (direction in ('inbound','outbound')),
  subject        text,
  notes          text,
  outcome        text,
  next_action_at timestamptz,
  created_at     timestamptz not null default now()
);

-- =========================
-- MESSAGING & EMAIL FEEDBACK
-- =========================

-- Internal messages between Faways staff and client reps
create table if not exists public.internal_messages (
  id            uuid primary key default gen_random_uuid(),
  thread_id     uuid,
  sender_id     uuid not null references public.profiles(id),
  recipient_id  uuid references public.profiles(id),
  client_id     uuid references public.clients(id),
  debt_id       uuid references public.debts(id),
  subject       text,
  body          text not null,
  is_read       boolean not null default false,
  created_at    timestamptz not null default now()
);

-- In-app notifications
create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id),
  type          text not null,
  payload       jsonb not null,
  is_read       boolean not null default false,
  created_at    timestamptz not null default now()
);

-- Email send logs (automatic or manual)
create table if not exists public.email_logs (
  id                uuid primary key default gen_random_uuid(),
  to_email          text not null,
  cc_emails         text[],
  subject           text not null,
  body              text not null,
  related_debt_id   uuid references public.debts(id),
  related_client_id uuid references public.clients(id),
  sent_by           uuid references public.profiles(id),
  status            text not null default 'queued' check (status in ('queued','sent','failed')),
  error_message     text,
  sent_at           timestamptz
);

-- =========================
-- COMMISSION, INVOICES & PAYMENTS
-- =========================

-- Commission rules used to compute fees
create table if not exists public.commission_rules (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  rate_percent  numeric(5,2) not null,
  applies_to    text default 'all',
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- Client invoices
create table if not exists public.invoices (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references public.clients(id),
  commission_rule_id uuid references public.commission_rules(id),
  number           text not null,
  issue_date       date not null default current_date,
  due_date         date,
  status           public.invoice_status not null default 'draft',
  currency         text not null default 'KES',
  subtotal         numeric(18,2) not null default 0,
  tax_amount       numeric(18,2) not null default 0,
  total_amount     numeric(18,2) not null default 0,
  paid_amount      numeric(18,2) not null default 0,
  created_by       uuid references public.profiles(id),
  approved_by      uuid references public.profiles(id),
  approved_at      timestamptz,
  created_at       timestamptz not null default now()
);

-- Invoice line items (typically per debt)
create table if not exists public.invoice_items (
  id          uuid primary key default gen_random_uuid(),
  invoice_id  uuid not null references public.invoices(id) on delete cascade,
  debt_id     uuid references public.debts(id),
  description text not null,
  quantity    numeric(12,2) not null default 1,
  unit_price  numeric(18,2) not null,
  amount      numeric(18,2) not null
);

-- Payments against invoices
create table if not exists public.payments (
  id            uuid primary key default gen_random_uuid(),
  invoice_id    uuid not null references public.invoices(id),
  amount        numeric(18,2) not null,
  currency      text not null default 'KES',
  method        public.payment_method not null,
  reference     text,
  received_at   timestamptz not null default now(),
  received_by   uuid references public.profiles(id),
  created_at    timestamptz not null default now()
);

-- =========================
-- ANALYTICS & REPORTING
-- =========================

-- Generic event log for web analytics and business events
create table if not exists public.events (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.profiles(id),
  organization_id uuid references public.organizations(id),
  category        public.event_category not null,
  action          text not null,
  entity_type     text,
  entity_id       uuid,
  metadata        jsonb,
  ip_address      inet,
  user_agent      text,
  created_at      timestamptz not null default now()
);

-- Daily aggregated metrics per organization (for fast reports)
create table if not exists public.daily_metrics (
  metric_date     date not null,
  organization_id uuid references public.organizations(id),
  total_debts     integer not null default 0,
  total_recovered numeric(18,2) not null default 0,
  new_debts       integer not null default 0,
  closed_debts    integer not null default 0,
  primary key (metric_date, organization_id)
);

-- =========================
-- AUDIT LOGGING
-- =========================

create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles(id),
  action      text not null,
  table_name  text not null,
  record_id   uuid,
  old_values  jsonb,
  new_values  jsonb,
  ip_address  inet,
  user_agent  text,
  created_at  timestamptz not null default now()
);

-- =========================
-- STORAGE (debt documents)
-- =========================
-- The app uploads to bucket id/name: debt-documents (private).
-- In Supabase Dashboard: Storage → New bucket → name "debt-documents", disable public access.
-- Add policies so authenticated users can upload/read under path prefix matching their access model,
-- for example:
--   insert into storage.buckets (id, name, public) values ('debt-documents', 'debt-documents', false)
--   on conflict (id) do nothing;
-- Then create storage.objects policies for SELECT and INSERT on bucket_id = 'debt-documents'.

-- Commission columns on clients (run on existing databases)
alter table public.clients
  add column if not exists recovery_commission_type text default 'percent';
alter table public.clients
  add column if not exists recovery_commission_percent numeric(7,4);
alter table public.clients
  add column if not exists recovery_commission_flat numeric(18,2);

-- Saved commission invoices (billing batches over debt_collections)
create table if not exists public.commission_invoices (
  id                uuid primary key default gen_random_uuid(),
  reference         text not null unique,
  client_id         uuid references public.clients(id),
  period_start      date not null,
  period_end        date not null,
  total_recovered   numeric(18,2) not null default 0,
  total_commission  numeric(18,2) not null default 0,
  currency          text not null default 'KES',
  status            text not null default 'issued' check (status in ('issued','paid')),
  paid_at           timestamptz,
  paid_note         text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists public.commission_invoice_lines (
  id                  uuid primary key default gen_random_uuid(),
  invoice_id          uuid not null references public.commission_invoices(id) on delete cascade,
  debt_collection_id  uuid not null references public.debt_collections(id) on delete restrict,
  amount_recovered    numeric(18,2) not null,
  commission_amount   numeric(18,2) not null,
  case_creditor       text,
  case_debtor         text,
  case_insurance      text,
  collection_date     date,
  unique (debt_collection_id)
);

create table if not exists public.commission_invoice_documents (
  id             uuid primary key default gen_random_uuid(),
  invoice_id     uuid not null references public.commission_invoices(id) on delete cascade,
  storage_path   text not null,
  name           text not null,
  mime_type      text,
  size_bytes     bigint,
  uploaded_at    timestamptz not null default now()
);

-- Storage bucket: commission-invoice-documents (private), same policy pattern as debt-documents.
--   - Commission invoice uploads: storage_path like "{invoice_id}/{uuid}-filename"
--   - Collection history proof: storage_path like "collections/{debt_collection_id}/{uuid}-filename"
-- Legacy bucket collection-documents may still exist for older paths without the "collections/" prefix.

alter table public.commission_invoice_lines
  add column if not exists case_creditor text;
alter table public.commission_invoice_lines
  add column if not exists case_debtor text;
alter table public.commission_invoice_lines
  add column if not exists collection_date date;
alter table public.commission_invoice_lines
  add column if not exists case_insurance text;

-- =========================
-- RLS: collection proof metadata (required for uploads from the app)
-- =========================
-- If you run only this block (not the full file), the table must exist. Requires
-- public.debt_collections (and public.debts) from earlier in this migration.
create table if not exists public.debt_collection_documents (
  id                   uuid primary key default gen_random_uuid(),
  debt_collection_id   uuid not null references public.debt_collections(id) on delete cascade,
  storage_path         text not null,
  name                 text not null,
  mime_type            text,
  size_bytes           bigint,
  uploaded_at          timestamptz not null default now()
);

-- If this table has RLS enabled without policies, inserts from the dashboard will fail
-- even when the Storage upload succeeds.
alter table public.debt_collection_documents enable row level security;

drop policy if exists "debt_collection_documents_authenticated_all" on public.debt_collection_documents;
create policy "debt_collection_documents_authenticated_all"
  on public.debt_collection_documents
  for all
  to authenticated
  using (true)
  with check (true);

-- =========================
-- Storage RLS: commission-invoice-documents bucket
-- =========================
-- Create the bucket in Dashboard (or SQL) first. Names must match the app constant
-- 'commission-invoice-documents' exactly.
-- Path layout: "{invoice_id}/…" and "collections/{debt_collection_id}/…"
insert into storage.buckets (id, name, public)
values ('commission-invoice-documents', 'commission-invoice-documents', false)
on conflict (id) do nothing;

drop policy if exists "storage_commission_invoice_select_auth" on storage.objects;
create policy "storage_commission_invoice_select_auth"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'commission-invoice-documents');

drop policy if exists "storage_commission_invoice_insert_auth" on storage.objects;
create policy "storage_commission_invoice_insert_auth"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'commission-invoice-documents');

drop policy if exists "storage_commission_invoice_update_auth" on storage.objects;
create policy "storage_commission_invoice_update_auth"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'commission-invoice-documents')
  with check (bucket_id = 'commission-invoice-documents');

drop policy if exists "storage_commission_invoice_delete_auth" on storage.objects;
create policy "storage_commission_invoice_delete_auth"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'commission-invoice-documents');

-- =========================
-- REALTIME IN-APP NOTIFICATIONS
-- =========================
-- Debt inserts create notification rows automatically:
--   - client-created debts alert active Faways staff
--   - staff-created debts linked to a client alert active users in that client organization
create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index if not exists profiles_role_active_idx
  on public.profiles (role, is_active);

create index if not exists profiles_organization_role_idx
  on public.profiles (organization_id, role);

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "notifications_insert_authenticated" on public.notifications;

create or replace function public.create_debt_insert_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  creator_role text;
  client_name text;
begin
  select lower(role)
    into creator_role
  from public.profiles
  where id = new.created_by;

  select name
    into client_name
  from public.clients
  where id = new.client_id;

  if creator_role = 'client' then
    insert into public.notifications (user_id, type, payload)
    select
      p.id,
      'client_debt_submitted',
      jsonb_build_object(
        'title', 'New client debt submitted',
        'body', concat_ws(
          ' ',
          coalesce(client_name, new.creditor_name, 'A client'),
          'submitted a new debt for',
          coalesce(new.debtor_name, 'a debtor')
        ),
        'debtId', new.id,
        'clientId', new.client_id,
        'clientName', coalesce(client_name, new.creditor_name),
        'debtorName', new.debtor_name,
        'amount', new.amount,
        'priority', new.priority,
        'createdBy', new.created_by
      )
    from public.profiles p
    where p.is_active = true
      and lower(p.role) in ('admin', 'agent', 'finance')
      and p.id <> new.created_by;
  elsif new.client_id is not null then
    insert into public.notifications (user_id, type, payload)
    select
      p.id,
      'debt_assigned_to_client',
      jsonb_build_object(
        'title', 'New debt added to your account',
        'body', concat_ws(
          ' ',
          'Faways added a new debt for',
          coalesce(new.debtor_name, 'your account')
        ),
        'debtId', new.id,
        'clientId', new.client_id,
        'clientName', coalesce(c.name, new.creditor_name),
        'debtorName', new.debtor_name,
        'amount', new.amount,
        'priority', new.priority,
        'createdBy', new.created_by
      )
    from public.clients c
    join public.profiles p
      on p.organization_id = c.organization_id
    where c.id = new.client_id
      and p.is_active = true
      and lower(p.role) = 'client'
      and (new.created_by is null or p.id <> new.created_by);
  end if;

  return new;
end;
$$;

drop trigger if exists debt_insert_notifications on public.debts;
create trigger debt_insert_notifications
  after insert on public.debts
  for each row
  execute function public.create_debt_insert_notifications();

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

