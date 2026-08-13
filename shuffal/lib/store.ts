import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from './supabase';
import { hashPassword, verifyPassword, generateCSEId } from './auth-utils';

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
  login: (cseId: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

const demoUsers: Record<string, { password: string; user: User }> = {
  '23F2601': {
    password: 'admin123',
    user: {
      id: '1',
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
      id: '2',
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
      id: '3',
      cseId: '23F2603',
      name: 'Executive User',
      email: 'executive@csesociety.com',
      role: 'executive',
      year: 2,
      department: 'CSE',
    },
  },
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  login: async (cseId: string, password: string) => {
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('cse_id', cseId)
          .single();

        if (error || !data) {
          throw new Error('Invalid CSE ID or password');
        }

        const passwordMatch = await verifyPassword(password, data.password_hash);
        if (!passwordMatch) {
          throw new Error('Invalid CSE ID or password');
        }

        const user: User = {
          id: data.id,
          cseId: data.cse_id,
          name: data.name,
          email: data.email,
          role: data.role as UserRole,
          year: data.year,
          department: data.department,
        };

        set({
          user,
          isAuthenticated: true,
        });
        localStorage.setItem('authUser', JSON.stringify(user));
      } else {
        const demoUser = demoUsers[cseId];
        if (!demoUser || demoUser.password !== password) {
          throw new Error('Invalid CSE ID or password');
        }

        set({
          user: demoUser.user,
          isAuthenticated: true,
        });
        localStorage.setItem('authUser', JSON.stringify(demoUser.user));
      }
    } catch (err) {
      throw err instanceof Error ? err : new Error('Login failed');
    }
  },

  register: async (data: any) => {
    try {
      if (!data.name || !data.email || !data.password) {
        throw new Error('Name, email, and password are required');
      }

      if (isSupabaseConfigured && supabase) {
        const admissionYear = parseInt(String(data.year).split('')[0]) || 2023;
        const cseId = await generateCSEId(admissionYear);
        const passwordHash = await hashPassword(data.password);

        const { data: newUserData, error } = await supabase
          .from('users')
          .insert([
            {
              cse_id: cseId,
              name: data.name,
              email: data.email,
              year: data.year || 1,
              password_hash: passwordHash,
              role: 'member',
              department: 'CSE',
            },
          ])
          .select()
          .single();

        if (error) {
          throw new Error(error.message || 'Registration failed');
        }

        const user: User = {
          id: newUserData.id,
          cseId: newUserData.cse_id,
          name: newUserData.name,
          email: newUserData.email,
          role: newUserData.role as UserRole,
          year: newUserData.year,
          department: newUserData.department,
        };

        set({
          user,
          isAuthenticated: true,
        });
        localStorage.setItem('authUser', JSON.stringify(user));
      } else {
        const newUser: User = {
          id: Date.now().toString(),
          cseId: `23F${Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, '0')}`,
          name: data.name,
          email: data.email,
          role: 'member',
          year: data.year || 1,
          department: 'CSE',
        };

        set({
          user: newUser,
          isAuthenticated: true,
        });
        localStorage.setItem('authUser', JSON.stringify(newUser));
      }
    } catch (err) {
      throw err instanceof Error ? err : new Error('Registration failed');
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
