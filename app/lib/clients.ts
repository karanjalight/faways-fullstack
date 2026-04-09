'use client';

import type { Client, RecoveryCommissionType } from '../types/client';

export async function fetchClients(): Promise<Client[]> {
  const res = await fetch('/api/clients', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed to load clients');
  }

  return (await res.json()) as Client[];
}

export async function fetchClientByEmail(email: string): Promise<Client | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const res = await fetch(`/api/clients?email=${encodeURIComponent(normalized)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed to load client by email');
  }

  return (await res.json()) as Client | null;
}

export interface CreateClientPayload {
  clientName: string;
  contactName: string;
  email: string;
  phone?: string;
  region?: string;
  recoveryCommissionType?: RecoveryCommissionType;
  recoveryCommissionPercent?: number | null;
  recoveryCommissionFlat?: number | null;
}

export async function createClientApi(payload: CreateClientPayload) {
  const res = await fetch('/api/clients', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? 'Failed to create client');
  }

  return (await res.json()) as {
    client: Client;
    credentials: { email: string; password: string };
  };
}

export async function updateClientApi(
  id: string,
  payload: {
    name?: string;
    email?: string;
    phone?: string;
    region?: string;
    status?: Client['status'];
    recoveryCommissionType?: RecoveryCommissionType;
    recoveryCommissionPercent?: number | null;
    recoveryCommissionFlat?: number | null;
  },
): Promise<Client> {
  const res = await fetch(`/api/clients/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? 'Failed to update client');
  }

  return (await res.json()) as Client;
}

