export interface ClientAccount {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  createdAt: string;
}

export interface ClientCredentials {
  email: string;
  password: string;
}
