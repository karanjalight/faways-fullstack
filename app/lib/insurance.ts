'use client';

import { supabase } from '@/lib/supabase-client';
import { InsuranceContact } from '../types/insurance';

type InsuranceContactRow = {
  id: string;
  company: string;
  contact_person: string;
  email: string;
  phone: string;
  policy_number: string | null;
  coverage_type: string;
  status: 'active' | 'expired' | 'pending';
  expiry_date: string | null;
  notes: string | null;
  created_at: string;
};

const mapRow = (row: InsuranceContactRow): InsuranceContact => ({
  id: row.id,
  company: row.company,
  contactPerson: row.contact_person,
  email: row.email,
  phone: row.phone,
  policyNumber: row.policy_number ?? undefined,
  coverageType: row.coverage_type,
  status: row.status,
  expiryDate: row.expiry_date ?? undefined,
  notes: row.notes ?? undefined,
});

export async function fetchInsuranceContacts(): Promise<InsuranceContact[]> {
  const { data, error } = await supabase
    .from('insurance_contacts')
    .select(
      'id, company, contact_person, email, phone, policy_number, coverage_type, status, expiry_date, notes, created_at',
    )
    .order('company', { ascending: true });

  if (error) {
    console.error('Error fetching insurance contacts', error);
    throw error;
  }

  return (data as InsuranceContactRow[]).map(mapRow);
}

export async function createInsuranceContact(
  input: Omit<InsuranceContact, 'id'>,
): Promise<InsuranceContact> {
  const { data, error } = await supabase
    .from('insurance_contacts')
    .insert({
      company: input.company,
      contact_person: input.contactPerson,
      email: input.email,
      phone: input.phone,
      policy_number: input.policyNumber ?? null,
      coverage_type: input.coverageType,
      status: input.status,
      expiry_date: input.expiryDate ?? null,
      notes: input.notes ?? null,
    })
    .select(
      'id, company, contact_person, email, phone, policy_number, coverage_type, status, expiry_date, notes, created_at',
    )
    .single();

  if (error) {
    console.error('Error creating insurance contact', error);
    throw error;
  }

  return mapRow(data as InsuranceContactRow);
}

export async function updateInsuranceContact(
  id: string,
  input: Omit<InsuranceContact, 'id'>,
): Promise<InsuranceContact> {
  const { data, error } = await supabase
    .from('insurance_contacts')
    .update({
      company: input.company,
      contact_person: input.contactPerson,
      email: input.email,
      phone: input.phone,
      policy_number: input.policyNumber ?? null,
      coverage_type: input.coverageType,
      status: input.status,
      expiry_date: input.expiryDate ?? null,
      notes: input.notes ?? null,
    })
    .eq('id', id)
    .select(
      'id, company, contact_person, email, phone, policy_number, coverage_type, status, expiry_date, notes, created_at',
    )
    .single();

  if (error) {
    console.error('Error updating insurance contact', error);
    throw error;
  }

  return mapRow(data as InsuranceContactRow);
}

export async function deleteInsuranceContact(id: string): Promise<void> {
  const { error } = await supabase
    .from('insurance_contacts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting insurance contact', error);
    throw error;
  }
}

