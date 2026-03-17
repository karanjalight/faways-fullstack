'use client';

import { supabase } from '@/lib/supabase-client';

export type DebtCollection = {
  id: string;
  debtId: string;
  collectionDate: string;
  amount: number;
  insuranceName: string | null;
  method: string | null;
  reference: string | null;
  notes: string | null;
  createdAt: string;
};

type DebtCollectionRow = {
  id: string;
  debt_id: string;
  collection_date: string;
  amount: number;
  insurance_name: string | null;
  method: string | null;
  reference: string | null;
  notes: string | null;
  created_at: string;
};

const mapRow = (row: DebtCollectionRow): DebtCollection => ({
  id: row.id,
  debtId: row.debt_id,
  collectionDate: row.collection_date,
  amount: row.amount,
  insuranceName: row.insurance_name,
  method: row.method,
  reference: row.reference,
  notes: row.notes,
  createdAt: row.created_at,
});

export async function fetchCollectionsForDebt(
  debtId: string,
): Promise<DebtCollection[]> {
  const { data, error } = await supabase
    .from('debt_collections')
    .select(
      'id, debt_id, collection_date, amount, insurance_name, method, reference, notes, created_at',
    )
    .eq('debt_id', debtId)
    .order('collection_date', { ascending: false });

  if (error) {
    console.error('Error fetching collections', error);
    throw error;
  }

  return (data as DebtCollectionRow[]).map(mapRow);
}

export async function createCollection(input: {
  debtId: string;
  amount: number;
  collectionDate: string;
  insuranceName: string | null;
  method?: string | null;
  reference?: string | null;
  notes?: string | null;
}): Promise<DebtCollection> {
  const { data, error } = await supabase
    .from('debt_collections')
    .insert({
      debt_id: input.debtId,
      amount: input.amount,
      collection_date: input.collectionDate,
      insurance_name: input.insuranceName,
      method: input.method ?? null,
      reference: input.reference ?? null,
      notes: input.notes ?? null,
    })
    .select(
      'id, debt_id, collection_date, amount, insurance_name, method, reference, notes, created_at',
    )
    .single();

  if (error) {
    console.error('Error creating collection', error);
    throw error;
  }

  return mapRow(data as DebtCollectionRow);
}

