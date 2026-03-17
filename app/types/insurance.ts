// Type definitions for insurance contacts

export interface InsuranceContact {
  id: string;
  company: string;
  contactPerson: string;
  email: string;
  phone: string;
  policyNumber?: string;
  coverageType: string;
  status: 'active' | 'expired' | 'pending';
  expiryDate?: string;
  notes?: string;
}

