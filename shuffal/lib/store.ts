import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const SESSION_DURATION_MS = 5 * 60 * 1000;

export type UserRole = 
  | 'admin' 
  | 'faculty' 
  | 'executive' 
  | 'secretary' 
  | 'treasurer' 
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

const demoUsers: Record<string, { password: string; user: User }> = {
  '23F2601': {
    password: 'KuchBhi',
    user: {
      id: '11111111-1111-4111-8111-111111111111',
      cseId: '23F2601',
      name: 'Admin User',
      email: 'admin@csesociety.com',
      role: 'admin',
      year: 1,
      department: 'CSE',
    },
  },
  '23F2602': {
    password: 'user123',
    user: {
      id: '22222222-2222-4222-8222-222222222222',
      cseId: '23F2602',
      name: 'Member User',
      email: 'member@csesociety.com',
      role: 'member',
      year: 1,
      department: 'CSE',
    },
  },
  '23F2603': {
    password: 'exec123',
    user: {
      id: '33333333-3333-4333-8333-333333333333',
      cseId: '23F2603',
      name: 'Executive User',
      email: 'executive@csesociety.com',
      role: 'executive',
      year: 2,
      department: 'CSE',
    },
  },
};

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
  merge: (persistedState, currentState) => {
    const persisted = persistedState as Partial<AuthState>;
    const persistedSessionExpired = Boolean(
      persisted.sessionExpiresAt && persisted.sessionExpiresAt <= Date.now()
    );

    if (persistedSessionExpired) {
      return currentState;
    }

    let legacyUser: User | null = null;
    if (typeof window !== 'undefined' && !persisted.user) {
      const storedUser = window.localStorage.getItem('authUser');
      if (storedUser) {
        try {
          legacyUser = JSON.parse(storedUser) as User;
        } catch {
          legacyUser = null;
        }
      }
    }

    const user = persisted.user || legacyUser;
    const isAuthenticated = persisted.user
      ? Boolean(persisted.isAuthenticated)
      : Boolean(
          legacyUser &&
            typeof window !== 'undefined' &&
            !window.localStorage.getItem('pendingVerification')
        );

    return {
      ...currentState,
      ...persisted,
      user,
      isAuthenticated,
      sessionExpiresAt: isAuthenticated ? Date.now() + SESSION_DURATION_MS : null,
    };
  },
  onRehydrateStorage: () => (state) => {
    if (state?.sessionExpiresAt && state.sessionExpiresAt <= Date.now()) {
      state.logout();
    }
    state?.setHasHydrated(true);
  },
}));
