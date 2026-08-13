import { create } from 'zustand';

export type UserRole = 
  | 'admin' 
  | 'faculty' 
  | 'executive' 
  | 'secretary' 
  | 'treasurer' 
  | 'year-rep' 
  | 'member';

export interface User {
  id: string;
  cseId: string;
  name: string;
  email: string;
  role: UserRole;
  year?: number;
  department?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (cseId: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  login: async (cseId: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cseId, password }),
      });

      if (!response.ok) throw new Error('Login failed');

      const data = await response.json();
      set({
        user: data.user,
        isAuthenticated: true,
      });
      localStorage.setItem('authUser', JSON.stringify(data.user));
    } catch (error) {
      throw error;
    }
  },

  register: async (data: any) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Registration failed');

      const result = await response.json();
      set({
        user: result.user,
        isAuthenticated: true,
      });
      localStorage.setItem('authUser', JSON.stringify(result.user));
    } catch (error) {
      throw error;
    }
  },

  logout: () => {
    set({ user: null, isAuthenticated: false });
    localStorage.removeItem('authUser');
  },

  setUser: (user: User) => {
    set({ user, isAuthenticated: true });
    localStorage.setItem('authUser', JSON.stringify(user));
  },
}));
