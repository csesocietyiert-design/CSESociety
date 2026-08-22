import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const SESSION_DURATION_MS = 5 * 60 * 1000;

export type UserRole = 
  | 'admin' 
  | 'faculty' 
  | 'executive' 
  | 'vice_president'
  | 'general_secretary'
  | 'secretary' 
  | 'technical_secretary'
  | 'cultural_secretary'
  | 'treasurer' 
  | 'year_representative'
  | 'yearRep' 
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
  sessionExpiresAt: number | null;
  hasHydrated: boolean;
  login: (cseId: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(persist((set) => ({
  user: null,
  isAuthenticated: false,
  sessionExpiresAt: null,
  hasHydrated: false,
  setHasHydrated: (hasHydrated: boolean) => set({ hasHydrated }),

  login: async (cseId: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cseId, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Login failed');
      }

      const data = await response.json();
      
      // Check if user is verified
      if (!data.user.is_verified) {
        throw new Error('Your account is pending approval by admin. Please wait for verification.');
      }

      const user: User = data.user;

      set({
        user,
        isAuthenticated: true,
        sessionExpiresAt: Date.now() + SESSION_DURATION_MS,
      });
      localStorage.setItem('authUser', JSON.stringify(user));
    } catch (err) {
      throw err instanceof Error ? err : new Error('Login failed');
    }
  },

  register: async (data: any) => {
    try {
      if (!data.name || !data.email || !data.password) {
        throw new Error('Name, email, and password are required');
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Registration failed');
      }

      const result = await response.json();
      const user: User = result.user;

      // Store user but mark as not authenticated since they need admin approval
      set({
        user,
        isAuthenticated: false, // User cannot login until verified
        sessionExpiresAt: Date.now() + SESSION_DURATION_MS,
      });
      localStorage.setItem('authUser', JSON.stringify(user));
      localStorage.setItem('pendingVerification', 'true');
    } catch (err) {
      throw err instanceof Error ? err : new Error('Registration failed');
    }
  },

  logout: () => {
    set({ user: null, isAuthenticated: false, sessionExpiresAt: null });
    localStorage.removeItem('authUser');
  },

  setUser: (user: User) => {
    set({ user, isAuthenticated: true, sessionExpiresAt: Date.now() + SESSION_DURATION_MS });
    localStorage.setItem('authUser', JSON.stringify(user));
  },
}), {
  name: 'cse-auth-session',
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    sessionExpiresAt: state.sessionExpiresAt,
  }),
  onRehydrateStorage: () => (state) => {
    if (!state || typeof window === 'undefined') return;

    if (state.user?.id === '11111111-1111-4111-8111-111111111111' || state.user?.cseId === '23F2601') {
      state.logout();
      window.localStorage.removeItem('pendingVerification');
      state.setHasHydrated(true);
      return;
    }

    if (state.sessionExpiresAt && state.sessionExpiresAt <= Date.now()) {
      state.logout();
      state.setHasHydrated(true);
      return;
    }

    if (!state.user) {
      const storedUser = window.localStorage.getItem('authUser');
      const pendingVerification = window.localStorage.getItem('pendingVerification');

      if (storedUser && !pendingVerification) {
        try {
          state.setUser(JSON.parse(storedUser) as User);
        } catch {
          window.localStorage.removeItem('authUser');
        }
      }
    }

    state.setHasHydrated(true);
  },
}));
