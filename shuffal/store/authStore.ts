import { create } from 'zustand';

export type Role = 
  | 'admin' 
  | 'faculty' 
  | 'vice_president' 
  | 'general_secretary' 
  | 'technical_secretary' 
  | 'cultural_secretary' 
  | 'year_representative' 
  | 'treasurer' 
  | 'member';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  year?: number;
  societyId?: string;
  profile_image_url?: string | null;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockUsers: Record<string, User> = {
      'admin@cse.com': {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        email: 'admin@cse.com',
        name: 'Admin User',
        role: 'admin',
        societyId: '23F2601',
      },
      'faculty@cse.com': {
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        email: 'faculty@cse.com',
        name: 'Dr. Faculty',
        role: 'faculty',
        societyId: '23F2602',
      },
      'vp@cse.com': {
        id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        email: 'vp@cse.com',
        name: 'Vice President',
        role: 'vice_president',
        year: 3,
        societyId: '23S2603',
      },
      'treasurer@cse.com': {
        id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        email: 'treasurer@cse.com',
        name: 'Treasurer',
        role: 'treasurer',
        year: 3,
        societyId: '23S2604',
      },
      'member@cse.com': {
        id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
        email: 'member@cse.com',
        name: 'John Doe',
        role: 'member',
        year: 1,
        societyId: '23F2605',
      },
    };

    const user = mockUsers[email];
    if (user && password === 'password') {
      set({ user, isAuthenticated: true });
    } else {
      throw new Error('Invalid credentials');
    }
  },

  register: async (email: string, password: string, name: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newUser: User = {
      id: Math.random().toString(),
      email,
      name,
      role: 'member',
      year: 1,
      societyId: `23F${Math.random().toString().slice(2, 6)}`,
    };

    set({ user: newUser, isAuthenticated: true });
  },

  logout: () => {
    set({ user: null, isAuthenticated: false });
  },

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
  },
}));
