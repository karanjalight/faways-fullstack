'use client';

import type { Client, RecoveryCommissionType } from '../types/client';
import { supabase } from '@/lib/supabase-client';
import { extractDebtInsuranceFromDescription } from './debts';

export type CollectionInvoiceRow = {
  collectionId: string;
  collectionDate: string;
  amount: number;
  insuranceName: string | null;
  debtId: string;
  clientId: string | null;
  creditorName: string;
  debtorName: string;
};

export function commissionEarnedOnCollection(
  recoveredAmount: number,
  commissionType: RecoveryCommissionType,
  commissionPercent: number | null | undefined,
  commissionFlat: number | null | undefined,
): number {
  if (commissionType === 'flat') {
    return Math.max(0, Number(commissionFlat ?? 0));
  }
  const p = Number(commissionPercent ?? 0);
  if (p <= 0) return 0;
  return Math.round(recoveredAmount * (p / 100) * 100) / 100;
}

export function commissionForRow(
  row: CollectionInvoiceRow,
  clientsById: Map<string, Client>,
): number {
  if (!row.clientId) return 0;
  const client = clientsById.get(row.clientId);
  if (!client) return 0;
  return commissionEarnedOnCollection(
    row.amount,
    client.recoveryCommissionType,
    client.recoveryCommissionPercent,
    client.recoveryCommissionFlat,
  );
}

export async function fetchCollectionsForInvoice(): Promise<CollectionInvoiceRow[]> {
  const { data, error } = await supabase
    .from('debt_collections')
    .select(
      `
      id,
      debt_id,
      collection_date,
      amount,
      insurance_name,
      debts (
        id,
        client_id,
        creditor_name,
        debtor_name,
        description
      )
    `,
    )
    .order('collection_date', { ascending: false });

  if (error) {
    console.error('Error fetching collections for invoice', error);
    throw error;
  }

  type Raw = {
    id: string;
    debt_id: string;
    collection_date: string;
    amount: number;
    insurance_name: string | null;
    debts:
      | {
          id: string;
          client_id: string | null;
          creditor_name: string | null;
          debtor_name: string | null;
          description: string | null;
        }
      | {
          id: string;
          client_id: string | null;
          creditor_name: string | null;
          debtor_name: string | null;
          description: string | null;
        }[]
      | null;
  };

  const rows = (data ?? []) as Raw[];

  return rows
    .map((r) => {
      const debt = Array.isArray(r.debts) ? r.debts[0] : r.debts;
      if (!debt) return null;
      return {
        collectionId: r.id,
        collectionDate: r.collection_date,
        amount: Number(r.amount),
        insuranceName:
          r.insurance_name?.trim() ||
          extractDebtInsuranceFromDescription(debt.description) ||
          null,
        debtId: r.debt_id,
        clientId: debt.client_id,
        creditorName: debt.creditor_name ?? '',
        debtorName: debt.debtor_name ?? '',
      } satisfies CollectionInvoiceRow;
    })
    .filter((x): x is CollectionInvoiceRow => x !== null);
}
