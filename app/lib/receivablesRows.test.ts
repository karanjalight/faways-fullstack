import { describe, it, expect } from 'vitest';
import { flattenReceivablesRows } from './receivablesRows';
import type { InsurerReceivable } from '../types/receivable';

const insurer: InsurerReceivable = {
  insurer: 'Jubilee',
  billed: 1000,
  paid: 200,
  outstanding: 800,
  patientCount: 1,
  patients: [
    {
      debtId: 'd1',
      patientName: 'John Doe',
      patientId: 'P-1',
      clientName: 'Aga Khan Hospital',
      billed: 1000,
      paid: 200,
      outstanding: 800,
      status: 'pending',
      dueDate: '2026-01-01',
    },
  ],
};

describe('flattenReceivablesRows', () => {
  it('emits one row per patient with insurer context', () => {
    const rows = flattenReceivablesRows([insurer], false);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      Insurer: 'Jubilee',
      Patient: 'John Doe',
      'Patient ID': 'P-1',
      Billed: 1000,
      Paid: 200,
      Outstanding: 800,
    });
  });

  it('leaves the Client column blank for non-admin and fills it for admin', () => {
    expect(flattenReceivablesRows([insurer], false)[0].Client).toBe('');
    expect(flattenReceivablesRows([insurer], true)[0].Client).toBe('Aga Khan Hospital');
  });
});
