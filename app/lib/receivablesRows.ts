import type { InsurerReceivable } from '../types/receivable';

export interface ReceivableRow {
  Insurer: string;
  Client: string;
  Patient: string;
  'Patient ID': string;
  Status: string;
  'Due date': string;
  Billed: number;
  Paid: number;
  Outstanding: number;
}

export function flattenReceivablesRows(
  insurers: InsurerReceivable[],
  isAdmin: boolean,
): ReceivableRow[] {
  const rows: ReceivableRow[] = [];
  for (const insurer of insurers) {
    for (const patient of insurer.patients) {
      rows.push({
        Insurer: insurer.insurer,
        Client: isAdmin ? patient.clientName ?? '' : '',
        Patient: patient.patientName,
        'Patient ID': patient.patientId ?? '',
        Status: patient.status,
        'Due date': patient.dueDate,
        Billed: patient.billed,
        Paid: patient.paid,
        Outstanding: patient.outstanding,
      });
    }
  }
  return rows;
}
