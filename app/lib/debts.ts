'use client';

import { supabase } from '@/lib/supabase-client';
import type { Debt, DebtStatus, CollectionStage } from '../types/debt';

// Shape of the debts table we care about
type DebtRow = {
  id: string;
  client_id: string | null;
  creditor_name: string | null;
  debtor_name: string | null;
  service_line: string | null;
  owner: string | null;
  stage: 'new' | 'in-review' | 'escalated' | 'legal' | 'closed';
  amount: number;
  paid_amount: number;
  due_date: string | null;
  status: 'pending' | 'in_progress' | 'overdue' | 'paid' | 'written_off';
  priority: 'low' | 'medium' | 'high' | null;
  opened_at: string | null;
  description: string | null;
};

const mapStatusFromDb = (status: DebtRow['status']): DebtStatus => {
  switch (status) {
    case 'paid':
      return 'paid';
    case 'overdue':
      return 'overdue';
    case 'in_progress':
      return 'negotiating';
    case 'pending':
    default:
      return 'pending';
  }
};

const mapStatusToDb = (status: DebtStatus): DebtRow['status'] => {
  switch (status) {
    case 'paid':
      return 'paid';
    case 'overdue':
      return 'overdue';
    case 'negotiating':
      return 'in_progress';
    case 'pending':
    default:
      return 'pending';
  }
};

const mapStageFromDb = (stage: DebtRow['stage']): CollectionStage => {
  switch (stage) {
    case 'in-review':
      return 'in-review';
    case 'escalated':
      return 'escalated';
    case 'legal':
    case 'closed':
      return 'legal';
    case 'new':
    default:
      return 'new';
  }
};

const mapStageToDb = (stage: CollectionStage): DebtRow['stage'] => {
  switch (stage) {
    case 'in-review':
      return 'in-review';
    case 'escalated':
      return 'escalated';
    case 'legal':
      return 'legal';
    case 'new':
    default:
      return 'new';
  }
};

const mapRowToDebt = (row: DebtRow): Debt => {
  const openedAt =
    row.opened_at ??
    (row.due_date
      ? new Date(row.due_date).toISOString()
      : new Date().toISOString());

  return {
    id: row.id,
    clientId: row.client_id ?? undefined,
    creditor: row.creditor_name ?? '',
    clientType: 'hospital',
    patientName: row.debtor_name ?? '',
    patientId: '',
    serviceLine: row.service_line ?? '',
    payer: '',
    owner: row.owner ?? '',
    stage: mapStageFromDb(row.stage),
    amount: row.amount,
    paidAmount: row.paid_amount,
    dueDate: row.due_date ?? new Date().toISOString().slice(0, 10),
    status: mapStatusFromDb(row.status),
    description: row.description ?? undefined,
    documents: [],
    serviceDate: openedAt.slice(0, 10),
    createdAt: openedAt,
    priority: (row.priority as Debt['priority']) ?? 'medium',
  };
};

const mapDebtToDb = (debt: Debt) => ({
  client_id: debt.clientId ?? null,
  creditor_name: debt.creditor,
  debtor_name: debt.patientName,
  service_line: debt.serviceLine,
  owner: debt.owner,
  stage: mapStageToDb(debt.stage),
  amount: debt.amount,
  paid_amount: debt.paidAmount,
  due_date: debt.dueDate,
  status: mapStatusToDb(debt.status),
  priority: debt.priority,
  opened_at: debt.createdAt,
  description: debt.description ?? null,
});

export async function fetchDebts(): Promise<Debt[]> {
  // Scope debts based on current user's role: clients only see their own debts
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from('debts')
    .select(
      'id, client_id, creditor_name, debtor_name, service_line, owner, stage, amount, paid_amount, due_date, status, priority, opened_at, description',
    )
    .order('due_date', { ascending: true });

  const role = (user?.user_metadata?.role as string | undefined)?.toLowerCase();

  if (user && role === 'client') {
    // Try to find matching client record by email
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, email')
      .eq('email', user.email)
      .maybeSingle();

    if (!clientError && client) {
      query = query.eq('client_id', client.id);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching debts', error);
    throw error;
  }

  return (data as DebtRow[]).map(mapRowToDebt);
}

export async function fetchDebtById(id: string): Promise<Debt | null> {
  const { data, error } = await supabase
    .from('debts')
    .select(
      'id, client_id, creditor_name, debtor_name, service_line, owner, stage, amount, paid_amount, due_date, status, priority, opened_at, description',
    )
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching debt', error);
    throw error;
  }

  if (!data) return null;
  return mapRowToDebt(data as DebtRow);
}

export async function createDebt(
  payload: Omit<Debt, 'id' | 'createdAt'>,
): Promise<Debt> {
  const now = new Date().toISOString();
  const toInsert = mapDebtToDb({
    ...payload,
    id: '',
    createdAt: now,
  } as Debt);

  const { data, error } = await supabase
    .from('debts')
    .insert(toInsert)
    .select(
      'id, creditor_name, debtor_name, service_line, owner, stage, amount, paid_amount, due_date, status, priority, opened_at, description',
    )
    .single();

  if (error) {
    console.error('Error creating debt', error);
    throw error;
  }

  return mapRowToDebt(data as DebtRow);
}

export async function updateDebt(
  id: string,
  fields: Partial<Debt>,
): Promise<void> {
  const partialDb: Record<string, unknown> = {};

  if (fields.creditor !== undefined) partialDb.creditor_name = fields.creditor;
  if (fields.patientName !== undefined) partialDb.debtor_name = fields.patientName;
  if (fields.serviceLine !== undefined) partialDb.service_line = fields.serviceLine;
  if (fields.owner !== undefined) partialDb.owner = fields.owner;
  if (fields.stage !== undefined) partialDb.stage = mapStageToDb(fields.stage);
  if (fields.amount !== undefined) partialDb.amount = fields.amount;
  if (fields.paidAmount !== undefined) partialDb.paid_amount = fields.paidAmount;
  if (fields.dueDate !== undefined) partialDb.due_date = fields.dueDate;
  if (fields.status !== undefined) partialDb.status = mapStatusToDb(fields.status);
  if (fields.priority !== undefined) partialDb.priority = fields.priority;
  if (fields.description !== undefined)
    partialDb.description = fields.description ?? null;

  if (Object.keys(partialDb).length === 0) return;

  const { error } = await supabase.from('debts').update(partialDb).eq('id', id);

  if (error) {
    console.error('Error updating debt', error);
    throw error;
  }
}

export async function deleteDebt(id: string): Promise<void> {
  const { error } = await supabase.from('debts').delete().eq('id', id);

  if (error) {
    console.error('Error deleting debt', error);
    throw error;
  }
}

