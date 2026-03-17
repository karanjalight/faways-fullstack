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

