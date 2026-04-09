// Type definitions for debt management system

export type DebtStatus = 'pending' | 'paid' | 'overdue' | 'negotiating';

export type CollectionStage = 'new' | 'in-review' | 'escalated' | 'legal';

export type DebtDocument = {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'other';
  size: string;
  uploadedAt: string;
  uploadedBy: string;
  /** Present when loaded from Supabase Storage */
  url?: string;
  storagePath?: string;
  mimeType?: string;
};

export interface Debt {
  id: string;
  clientId?: string; // linked client (Supabase clients.id)
  assignedAgentId?: string; // linked collection owner (Supabase agents.id)
  creditor: string; // Hospital, clinic or doctor group
  clientType: 'hospital' | 'clinic' | 'practice';
  patientName: string;
  patientId: string;
  serviceLine: string;
  payer: string;
  owner: string; // internal owner/collector
  stage: CollectionStage;
  amount: number; // Total debt amount
  paidAmount: number; // Amount already paid
  dueDate: string; // ISO date string
  status: DebtStatus;
  description?: string; // Optional notes
  documents?: DebtDocument[];
  serviceDate?: string;
  createdAt: string; // When debt was added
  priority: 'low' | 'medium' | 'high'; // Priority level
}

// Helper function to calculate remaining amount
export const getRemainingAmount = (debt: Debt): number => {
  return debt.amount - debt.paidAmount;
};

// Helper function to check if debt is overdue
export const isOverdue = (debt: Debt): boolean => {
  if (debt.status === 'paid') return false;
  return new Date(debt.dueDate) < new Date();
};

