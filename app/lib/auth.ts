// Simple mock authentication utility for client-side demo
// In a real app, this would interact with a backend API

const AUTH_KEY = 'debt_management_auth';

export interface User {
  email: string;
  name: string;
}

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(AUTH_KEY) === 'true';
};

// Get current user (mock)
export const getCurrentUser = (): User | null => {
  if (!isAuthenticated()) return null;
  return {
    email: localStorage.getItem('user_email') || 'user@example.com',
    name: localStorage.getItem('user_name') || 'Demo User',
  };
};

// Login function (mock - accepts any credentials for demo)
export const login = (email: string, password: string): Promise<boolean> => {
  return new Promise((resolve) => {
    // Simulate API call delay
    setTimeout(() => {
      // For demo purposes, accept any non-empty credentials
      if (email && password) {
        localStorage.setItem(AUTH_KEY, 'true');
        localStorage.setItem('user_email', email);
        localStorage.setItem('user_name', email.split('@')[0] || 'User');
        resolve(true);
      } else {
        resolve(false);
      }
    }, 500);
  });
};

// Logout function
export const logout = (): void => {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem('user_email');
  localStorage.removeItem('user_name');
};

