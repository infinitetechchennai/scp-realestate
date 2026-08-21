import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser, UserRole, ChannelPartner } from '../types';
import { api, KycPendingDetail } from '../services/api';

export interface LoginResult {
  success: boolean;
  status?: 'pending' | 'rejected' | 'suspended' | 'approved';
  partner?: Partial<ChannelPartner>;
  message?: string;
  rejectionReason?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<LoginResult>;
  logout: () => void;
  setUser: (user: AuthUser, token?: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: async (email, password, role) => {
        const res = await api.auth.login({ email, password, role });

        if (res.success && res.data) {
          const authUser: AuthUser = {
            id: res.data.user.id,
            name: `${res.data.user.first_name} ${res.data.user.last_name || ''}`.trim() || res.data.user.first_name,
            email: res.data.user.email,
            role: res.data.role as UserRole,
          };
          set({ user: authUser, token: res.data.access_token, isAuthenticated: true });
          return { success: true, status: 'approved' };
        }

        if (res.kycDetail) {
          const kyc: KycPendingDetail = res.kycDetail;
          return {
            success: false,
            status: kyc.status,
            partner: {
              companyName: kyc.company_name,
              email: kyc.email,
              aadhar: kyc.aadhar_number,
              pan: kyc.pan_number,
              rejectionReason: kyc.rejection_reason,
            },
            message: kyc.message,
            rejectionReason: kyc.rejection_reason,
          };
        }

        return {
          success: false,
          message: res.error || 'Invalid credentials. Please check your email and password.',
        };
      },
      logout: () => {
        localStorage.removeItem('access_token');
        set({ user: null, token: null, isAuthenticated: false });
      },
      setUser: (user, token) => set({ user, token: token || null, isAuthenticated: true }),
    }),
    { name: 'auth-store' }
  )
);

