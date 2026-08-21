import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser, UserRole } from '../types';
import { mockAuthUsers } from '../data/mockData';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: UserRole) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (email, password, role) => {
        const found = mockAuthUsers.find(
          (u) => u.email === email && u.password === password && u.role === role
        );
        if (found) {
          const { password: _pw, ...user } = found;
          set({ user, isAuthenticated: true });
          return true;
        }
        return false;
      },
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: 'auth-store' }
  )
);
