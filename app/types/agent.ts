// Type definitions for agents

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  status: 'active' | 'inactive' | 'on-leave';
  assignedDebts: number;
  totalCollected: number;
  performance: number; // percentage
  joinDate: string;
}

