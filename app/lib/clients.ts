'use client';

import { Client } from '../types/client';

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

export interface CreateClientPayload {
  clientName: string;
  contactName: string;
  email: string;
  phone?: string;
  region?: string;
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

