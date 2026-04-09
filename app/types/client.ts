// Type definitions for clients

/** How commission is calculated on each recovery (debt_collections row) for this client's debts */
export type RecoveryCommissionType = 'percent' | 'flat';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  totalDebt: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'active' | 'inactive' | 'closed';
  assignedAgent?: string;
  lastContact: string;
  createdAt: string;
  /** Applies to all debts linked to this client */
  recoveryCommissionType: RecoveryCommissionType;
  /** Percent of each recovered amount (e.g. 15 = 15%) when type is percent */
  recoveryCommissionPercent: number | null;
  /** Fixed amount per collection event (KES) when type is flat */
  recoveryCommissionFlat: number | null;
}

