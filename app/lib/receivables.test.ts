import { describe, it, expect } from 'vitest';
import { buildInsurerReceivables } from './receivables';
import type { Debt } from '../types/debt';

const makeDebt = (overrides: Partial<Debt>): Debt => ({
  id: 'd1',
  clientId: 'c1',
  creditor: 'Aga Khan Hospital',
  clientType: 'hospital',
  patientName: 'John Doe',
  patientId: 'P-1',
  serviceLine: 'Outpatient',
  payer: 'Jubilee',
  owner: 'Owner',
  stage: 'new',
  amount: 1000,
  paidAmount: 0,
  dueDate: '2026-01-01',
  status: 'pending',
  createdAt: '2026-01-01T00:00:00.000Z',
  priority: 'medium',
  ...overrides,
});

const noClients = new Map<string, string>();

describe('buildInsurerReceivables', () => {
  it('groups by insurer and sums billed/paid/outstanding', () => {
    const debts = [
      makeDebt({ id: 'a', payer: 'Jubilee', amount: 1000, paidAmount: 200 }),
      makeDebt({ id: 'b', payer: 'Jubilee', amount: 500, paidAmount: 0 }),
      makeDebt({ id: 'c', payer: 'AAR', amount: 300, paidAmount: 100 }),
    ];
    const { insurers, totals } = buildInsurerReceivables(debts, 'client', noClients);
    const jubilee = insurers.find((i) => i.insurer === 'Jubilee')!;
    expect(jubilee.billed).toBe(1500);
    expect(jubilee.paid).toBe(200);
    expect(jubilee.outstanding).toBe(1300);
    expect(jubilee.patientCount).toBe(2);
    expect(totals).toEqual({ billed: 1800, paid: 300, outstanding: 1500, insurerCount: 2 });
  });

  it('clamps outstanding at zero for overpaid debts', () => {
    const debts = [makeDebt({ payer: 'Britam', amount: 100, paidAmount: 250 })];
    const { insurers } = buildInsurerReceivables(debts, 'client', noClients);
    expect(insurers[0].outstanding).toBe(0);
    expect(insurers[0].paid).toBe(250);
  });

  it('groups debts with no payer under "No insurer specified"', () => {
    const debts = [makeDebt({ id: 'a', payer: '' }), makeDebt({ id: 'b', payer: '   ' })];
    const { insurers } = buildInsurerReceivables(debts, 'client', noClients);
    expect(insurers).toHaveLength(1);
    expect(insurers[0].insurer).toBe('No insurer specified');
    expect(insurers[0].patientCount).toBe(2);
  });

  it('client view produces a flat patient list and no clients array', () => {
    const debts = [makeDebt({ payer: 'Jubilee' })];
    const { insurers } = buildInsurerReceivables(debts, 'client', noClients);
    expect(insurers[0].patients).toHaveLength(1);
    expect(insurers[0].clients).toBeUndefined();
    expect(insurers[0].patients[0].clientName).toBeUndefined();
  });

  it('admin view nests clients -> patients with resolved client names', () => {
    const clientNames = new Map([
      ['c1', 'Aga Khan Hospital'],
      ['c2', 'Nairobi Hospital'],
    ]);
    const debts = [
      makeDebt({ id: 'a', payer: 'Jubilee', clientId: 'c1', amount: 1000, paidAmount: 0 }),
      makeDebt({ id: 'b', payer: 'Jubilee', clientId: 'c2', amount: 400, paidAmount: 0 }),
    ];
    const { insurers } = buildInsurerReceivables(debts, 'admin', clientNames);
    const jubilee = insurers[0];
    expect(jubilee.clients).toBeDefined();
    expect(jubilee.clients!).toHaveLength(2);
    expect(jubilee.clients![0].clientName).toBe('Aga Khan Hospital'); // 1000 outstanding sorts first
    expect(jubilee.clients![0].outstanding).toBe(1000);
    expect(jubilee.clients![0].patients[0].clientName).toBe('Aga Khan Hospital');
  });

  it('sorts insurers by outstanding desc with fully-paid at the bottom', () => {
    const debts = [
      makeDebt({ id: 'a', payer: 'Small', amount: 100, paidAmount: 0 }),
      makeDebt({ id: 'b', payer: 'Big', amount: 5000, paidAmount: 0 }),
      makeDebt({ id: 'c', payer: 'PaidUp', amount: 800, paidAmount: 800 }),
    ];
    const { insurers } = buildInsurerReceivables(debts, 'client', noClients);
    expect(insurers.map((i) => i.insurer)).toEqual(['Big', 'Small', 'PaidUp']);
    expect(insurers[2].outstanding).toBe(0);
  });

  it('returns an empty result for no debts', () => {
    const { insurers, totals } = buildInsurerReceivables([], 'client', noClients);
    expect(insurers).toEqual([]);
    expect(totals).toEqual({ billed: 0, paid: 0, outstanding: 0, insurerCount: 0 });
  });
});
