import type { DebtStatus } from './debt';

export interface PatientReceivable {
  debtId: string;
  patientName: string;
  patientId?: string;
  /** Populated only in admin view, for context in the flat patient list. */
  clientName?: string;
  billed: number;
  paid: number;
  outstanding: number;
  status: DebtStatus;
  dueDate: string;
}

export interface ClientReceivable {
  /** clientId when present, otherwise the creditor name used as the grouping key. */
  clientId: string;
  clientName: string;
  billed: number;
  paid: number;
  outstanding: number;
  patients: PatientReceivable[];
}

export interface InsurerReceivable {
  insurer: string;
  billed: number;
  paid: number;
  outstanding: number;
  patientCount: number;
  /** Present only in admin view. */
  clients?: ClientReceivable[];
  /** Always present; flat list used by the client view and exports. */
  patients: PatientReceivable[];
}

export interface ReceivablesTotals {
  billed: number;
  paid: number;
  outstanding: number;
  insurerCount: number;
}

export interface ReceivablesResult {
  insurers: InsurerReceivable[];
  totals: ReceivablesTotals;
}
