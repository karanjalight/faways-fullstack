'use client';

import { supabase } from '@/lib/supabase-client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Debt, DebtStatus, CollectionStage } from '../types/debt';
import { fetchDebtDocumentsWithUrls } from './debtDocuments';

// Shape of the debts table we care about
type DebtRow = {
  id: string;
  client_id: string | null;
  assigned_agent_id: string | null;
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

const PATIENT_ID_TAG = 'Patient ID:';
const INSURANCE_TAG = 'Insurance:';
type ProfileRole = 'admin' | 'agent' | 'client' | 'finance';

const normalizeProfileRole = (role: unknown): ProfileRole => {
  const normalized = typeof role === 'string' ? role.toLowerCase() : '';
  if (
    normalized === 'admin' ||
    normalized === 'agent' ||
    normalized === 'client' ||
    normalized === 'finance'
  ) {
    return normalized;
  }
  return 'client';
};

const ensureCurrentProfile = async (user: SupabaseUser): Promise<string | null> => {
  const fullName =
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split('@')[0] ||
    'User';

  const { error } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      full_name: fullName,
      role: normalizeProfileRole(user.user_metadata?.role),
    },
    { onConflict: 'id' },
  );

  if (error) {
    console.error('Error ensuring current profile', error);
    return null;
  }

  return user.id;
};

export function extractDebtInsuranceFromDescription(
  text: string | null | undefined,
): string {
  return extractTaggedValue(text, INSURANCE_TAG);
}

const extractTaggedValue = (
  text: string | null | undefined,
  tag: string,
): string => {
  if (!text) return '';
  const line = text
    .split('\n')
    .find((entry) => entry.trim().toLowerCase().startsWith(tag.toLowerCase()));
  if (!line) return '';
  return line.slice(line.indexOf(':') + 1).trim();
};

const removeTaggedLines = (text: string | null | undefined): string | undefined => {
  if (!text) return undefined;
  const cleaned = text
    .split('\n')
    .filter((line) => {
      const normalized = line.trim().toLowerCase();
      return (
        !normalized.startsWith(PATIENT_ID_TAG.toLowerCase()) &&
        !normalized.startsWith(INSURANCE_TAG.toLowerCase())
      );
    })
    .join('\n')
    .trim();
  return cleaned || undefined;
};

const addTaggedMetadata = (description: string | undefined, debt: Debt): string | null => {
  const lines = [description?.trim() ?? ''].filter(Boolean);
  if (debt.patientId.trim()) {
    lines.push(`${PATIENT_ID_TAG} ${debt.patientId.trim()}`);
  }
  if (debt.payer.trim()) {
    lines.push(`${INSURANCE_TAG} ${debt.payer.trim()}`);
  }
  const merged = lines.join('\n').trim();
  return merged || null;
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
    assignedAgentId: row.assigned_agent_id ?? undefined,
    creditor: row.creditor_name ?? '',
    clientType: 'hospital',
    patientName: row.debtor_name ?? '',
    patientId: extractTaggedValue(row.description, PATIENT_ID_TAG),
    serviceLine: row.service_line ?? '',
    payer: extractTaggedValue(row.description, INSURANCE_TAG),
    owner: row.owner ?? '',
    stage: mapStageFromDb(row.stage),
    amount: row.amount,
    paidAmount: row.paid_amount,
    dueDate: row.due_date ?? new Date().toISOString().slice(0, 10),
    status: mapStatusFromDb(row.status),
    description: removeTaggedLines(row.description),
    documents: [],
    serviceDate: openedAt.slice(0, 10),
    createdAt: openedAt,
    priority: (row.priority as Debt['priority']) ?? 'medium',
  };
};

const mapDebtToDb = (debt: Debt) => ({
  client_id: debt.clientId ?? null,
  assigned_agent_id: debt.assignedAgentId ?? null,
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
  description: addTaggedMetadata(debt.description, debt),
});

export async function fetchDebts(): Promise<Debt[]> {
  // Scope debts based on current user's role: clients only see their own debts
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from('debts')
    .select(
      'id, client_id, assigned_agent_id, creditor_name, debtor_name, service_line, owner, stage, amount, paid_amount, due_date, status, priority, opened_at, description',
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
      'id, client_id, assigned_agent_id, creditor_name, debtor_name, service_line, owner, stage, amount, paid_amount, due_date, status, priority, opened_at, description',
    )
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching debt', error);
    throw error;
  }

  if (!data) return null;
  const debt = mapRowToDebt(data as DebtRow);
  try {
    const documents = await fetchDebtDocumentsWithUrls(id);
    return { ...debt, documents };
  } catch {
    return debt;
  }
}

export async function createDebt(
  payload: Omit<Debt, 'id' | 'createdAt'>,
): Promise<Debt> {
  const now = new Date().toISOString();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const createdBy = user ? await ensureCurrentProfile(user) : null;
  const toInsert = mapDebtToDb({
    ...payload,
    id: '',
    createdAt: now,
  } as Debt);

  const { data, error } = await supabase
    .from('debts')
    .insert({
      ...toInsert,
      created_by: createdBy,
    })
    .select(
      'id, client_id, assigned_agent_id, creditor_name, debtor_name, service_line, owner, stage, amount, paid_amount, due_date, status, priority, opened_at, description',
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
  if (fields.assignedAgentId !== undefined)
    partialDb.assigned_agent_id = fields.assignedAgentId;
  if (fields.stage !== undefined) partialDb.stage = mapStageToDb(fields.stage);
  if (fields.amount !== undefined) partialDb.amount = fields.amount;
  if (fields.paidAmount !== undefined) partialDb.paid_amount = fields.paidAmount;
  if (fields.dueDate !== undefined) partialDb.due_date = fields.dueDate;
  if (fields.status !== undefined) partialDb.status = mapStatusToDb(fields.status);
  if (fields.priority !== undefined) partialDb.priority = fields.priority;
  if (fields.description !== undefined)
    partialDb.description = fields.description ?? null;
  if (fields.patientId !== undefined || fields.payer !== undefined) {
    const { data: existing } = await supabase
      .from('debts')
      .select('description')
      .eq('id', id)
      .maybeSingle();

    const currentDescription = (existing as Pick<DebtRow, 'description'> | null)?.description;
    const currentDebtLike = {
      patientId:
        fields.patientId ??
        extractTaggedValue(currentDescription, PATIENT_ID_TAG),
      payer:
        fields.payer ?? extractTaggedValue(currentDescription, INSURANCE_TAG),
      description:
        fields.description !== undefined
          ? fields.description
          : removeTaggedLines(currentDescription),
    } as Pick<Debt, 'patientId' | 'payer' | 'description'>;

    partialDb.description = addTaggedMetadata(currentDebtLike.description, {
      ...(fields as Debt),
      id,
      clientType: 'hospital',
      creditor: '',
      patientName: '',
      serviceLine: '',
      owner: '',
      stage: 'new',
      amount: 0,
      paidAmount: 0,
      dueDate: new Date().toISOString().slice(0, 10),
      status: 'pending',
      documents: [],
      createdAt: new Date().toISOString(),
      priority: 'medium',
      patientId: currentDebtLike.patientId,
      payer: currentDebtLike.payer,
      description: currentDebtLike.description,
    });
  }

  if (Object.keys(partialDb).length === 0) return;

  const { error } = await supabase.from('debts').update(partialDb).eq('id', id);

  if (error) {
    console.error('Error updating debt', error);
    throw error;
  }
}

export class DebtDeleteClientError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status = 400) {
    super(message);
    this.name = 'DebtDeleteClientError';
    this.code = code;
    this.status = status;
  }
}

export async function deleteDebt(id: string): Promise<void> {
  const response = await fetch(`/api/debts/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });

  if (response.ok) return;

  let payload: { error?: string; code?: string } = {};
  try {
    payload = (await response.json()) as { error?: string; code?: string };
  } catch {
    // ignore parse errors
  }

  const message =
    payload.error ??
    (response.status === 404
      ? 'Debt not found. It may have already been deleted.'
      : 'Failed to delete debt. Please try again.');

  throw new DebtDeleteClientError(
    message,
    payload.code ?? 'DELETE_FAILED',
    response.status,
  );
}

