// Type definitions for clients

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
}

