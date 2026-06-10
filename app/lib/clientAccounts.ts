import type { ClientAccount, ClientCredentials } from '../types/clientAccount';

export async function fetchClientAccounts(clientId: string): Promise<ClientAccount[]> {
  const res = await fetch(`/api/clients/${clientId}/accounts`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? 'Failed to load portal accounts');
  }

  return (await res.json()) as ClientAccount[];
}

export async function createClientAccount(
  clientId: string,
  payload: { contactName: string; email: string; password: string; phone?: string },
): Promise<{ account: ClientAccount; credentials: ClientCredentials }> {
  const res = await fetch(`/api/clients/${clientId}/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? 'Failed to create portal account');
  }

  return (await res.json()) as {
    account: ClientAccount;
    credentials: ClientCredentials;
  };
}

export async function resetClientAccountPassword(
  clientId: string,
  userId: string,
  password: string,
): Promise<{ credentials: ClientCredentials; account: ClientAccount }> {
  const res = await fetch(
    `/api/clients/${clientId}/accounts/${userId}/reset-password`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    },
  );

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? 'Failed to reset password');
  }

  return (await res.json()) as {
    credentials: ClientCredentials;
    account: ClientAccount;
  };
}
