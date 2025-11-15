// Type definitions for debt management system

export type DebtStatus = 'pending' | 'paid' | 'overdue' | 'negotiating';

export interface Debt {
  id: string;
  creditor: string; // Name of the creditor/company
  amount: number; // Total debt amount
  paidAmount: number; // Amount already paid
  dueDate: string; // ISO date string
  status: DebtStatus;
  description?: string; // Optional notes
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

