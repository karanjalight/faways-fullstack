export type CommissionInvoiceStatus = 'issued' | 'paid';

export interface CommissionInvoiceSummary {
  id: string;
  reference: string;
  clientId: string | null;
  clientName: string | null;
  periodStart: string;
  periodEnd: string;
  totalRecovered: number;
  totalCommission: number;
  status: CommissionInvoiceStatus;
  paidAt: string | null;
  paidNote: string | null;
  createdAt: string;
}

export interface CommissionInvoiceLineDetail {
  lineId: string;
  collectionId: string;
  collectionDate: string;
  amountRecovered: number;
  commissionAmount: number;
  creditorName: string;
  debtorName: string;
  insuranceName: string;
}

export function formatInvoiceLineInsurance(line: Pick<CommissionInvoiceLineDetail, 'insuranceName'>): string {
  return line.insuranceName.trim() || '—';
}

export function formatInvoiceLinePatient(line: Pick<CommissionInvoiceLineDetail, 'debtorName'>): string {
  return line.debtorName.trim() || '—';
}

export interface CommissionInvoiceDocument {
  id: string;
  name: string;
  sizeLabel: string;
  url?: string;
  uploadedAt: string;
  storagePath: string;
}

export interface CommissionInvoiceDetail extends CommissionInvoiceSummary {
  lines: CommissionInvoiceLineDetail[];
  documents: CommissionInvoiceDocument[];
}
