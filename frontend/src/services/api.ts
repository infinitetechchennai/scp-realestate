import { ChannelPartner, UserRole, AuthUser } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export interface LoginPayload {
  email: string;
  password: string;
  role: string;
}

export interface LoginSuccessResponse {
  access_token: string;
  token_type: string;
  role: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name?: string;
    phone?: string;
    role: string;
  };
}

export interface KycPendingDetail {
  status: 'pending' | 'rejected' | 'suspended';
  message: string;
  company_name: string;
  email: string;
  aadhar_number?: string;
  pan_number?: string;
  rejection_reason?: string;
}

export interface RegisterPartnerPayload {
  company_name: string;
  first_name: string;
  last_name?: string;
  email: string;
  password: string;
  phone: string;
  office_address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  aadhar_number: string;
  pan_number: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('access_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Auth API
  auth: {
    async login(payload: LoginPayload): Promise<{ success: boolean; data?: LoginSuccessResponse; kycDetail?: KycPendingDetail; error?: string }> {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok) {
          localStorage.setItem('access_token', data.access_token);
          return { success: true, data };
        }

        // Check if 403 KYC verification pending / rejected
        if (response.status === 403 && data.detail && typeof data.detail === 'object') {
          return {
            success: false,
            kycDetail: data.detail as KycPendingDetail,
          };
        }

        return {
          success: false,
          error: typeof data.detail === 'string' ? data.detail : 'Invalid email or password',
        };
      } catch (err: any) {
        return {
          success: false,
          error: err.message || 'Unable to connect to backend server. Make sure FastAPI is running.',
        };
      }
    },

    async registerPartner(payload: RegisterPartnerPayload) {
      const response = await fetch(`${API_BASE_URL}/auth/register-partner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        let msg = 'Registration failed';
        if (typeof data.detail === 'string') {
          msg = data.detail;
        } else if (Array.isArray(data.detail) && data.detail.length > 0) {
          msg = data.detail.map((d: any) => `${d.loc ? d.loc[d.loc.length - 1] + ': ' : ''}${d.msg}`).join(', ');
        }
        throw new Error(msg);
      }
      return data;
    },

    async getMe(): Promise<AuthUser | null> {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: getAuthHeaders(),
        });
        if (!response.ok) return null;
        const data = await response.json();
        return {
          id: data.id,
          name: `${data.first_name} ${data.last_name || ''}`.trim() || data.first_name,
          email: data.email,
          role: data.role,
        };
      } catch {
        return null;
      }
    }
  },

  // Admin Channel Partners API
  adminPartners: {
    async list(statusFilter?: string, search?: string) {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (search) params.append('search', search);

      const url = `${API_BASE_URL}/admin/channel-partners?${params.toString()}`;
      const response = await fetch(url, { headers: getAuthHeaders() });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to fetch channel partners');
      }
      return response.json();
    },

    async getDetail(partnerId: string) {
      const response = await fetch(`${API_BASE_URL}/admin/channel-partners/${partnerId}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to fetch partner KYC details');
      }
      return response.json();
    },

    async approve(partnerId: string) {
      const response = await fetch(`${API_BASE_URL}/admin/channel-partners/${partnerId}/approve`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to approve partner');
      }
      return response.json();
    },

    async reject(partnerId: string, rejectionReason?: string) {
      const response = await fetch(`${API_BASE_URL}/admin/channel-partners/${partnerId}/reject`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ rejection_reason: rejectionReason }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to reject partner');
      }
      return response.json();
    },

    async suspend(partnerId: string) {
      const response = await fetch(`${API_BASE_URL}/admin/channel-partners/${partnerId}/suspend`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to suspend partner');
      }
      return response.json();
    }
  },

  // Document Storage API
  documents: {
    upload: async (file: File, documentType: 'aadhaar' | 'pan', entityId?: string) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', documentType);
      formData.append('entity_type', 'channel_partner');
      if (entityId) formData.append('entity_id', entityId);

      const res = await fetch(`${API_BASE_URL}/documents/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'File upload failed');
      }
      return await res.json();
    },

    getDownloadUrl: (fileId: string) => `${API_BASE_URL}/documents/${fileId}/download`,
  },

  // Customers Management API (PostgreSQL backed)
  customers: {
    list: async (search?: string, statusFilter?: string) => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter && statusFilter !== 'all') params.append('status_filter', statusFilter);

      const res = await fetch(`${API_BASE_URL}/customers?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to fetch customers');
      }
      return await res.json();
    },

    create: async (payload: {
      first_name: string;
      last_name?: string;
      email: string;
      phone: string;
      password?: string;
      address_line_1?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      aadhar_number?: string;
      pan_number?: string;
      assigned_channel_partner_id?: string;
    }) => {
      const res = await fetch(`${API_BASE_URL}/customers`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        let msg = 'Failed to create customer';
        if (typeof data.detail === 'string') msg = data.detail;
        else if (Array.isArray(data.detail) && data.detail.length > 0) {
          msg = data.detail.map((d: any) => `${d.loc ? d.loc[d.loc.length - 1] + ': ' : ''}${d.msg}`).join(', ');
        }
        throw new Error(msg);
      }
      return data;
    },

    getDetail: async (customerId: string) => {
      const res = await fetch(`${API_BASE_URL}/customers/${customerId}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to fetch customer detail');
      }
      return await res.json();
    }
  },

  // Projects API (PostgreSQL backed)
  projects: {
    list: async () => {
      const res = await fetch(`${API_BASE_URL}/projects`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to fetch projects');
      }
      return await res.json();
    },

    create: async (payload: {
      code: string;
      name: string;
      description?: string;
      address_line_1?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      total_area_sqft?: number;
      total_plots?: number;
      default_price_per_sqft?: number;
      default_token_amount?: number;
      image_url?: string;
      blueprint_url?: string;
    }) => {
      const res = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to create project');
      }
      return await res.json();
    }
  },

  // Plots API (PostgreSQL backed)
  plots: {
    list: async (projectId?: string, statusFilter?: string) => {
      const params = new URLSearchParams();
      if (projectId) params.append('project_id', projectId);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);

      const res = await fetch(`${API_BASE_URL}/plots?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to fetch plots');
      }
      return await res.json();
    },

    uploadCsv: async (file: File, projectId?: string) => {
      const formData = new FormData();
      formData.append('file', file);
      if (projectId) formData.append('project_id', projectId);

      const res = await fetch(`${API_BASE_URL}/plots/upload-csv`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to upload CSV');
      }
      return await res.json();
    },

    updateStatus: async (plotId: string, payload: {
      status: string;
      token_amount?: number;
      token_expiry?: string;
      amount_paid?: number;
      balance_amount?: number;
      balance_due_date?: string;
      customer_id?: string;
      customer_name?: string;
      channel_partner_id?: string;
      channel_partner_name?: string;
    }) => {
      const res = await fetch(`${API_BASE_URL}/plots/${plotId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to update plot status');
      }
      return await res.json();
    }
  },

  // Bookings API (PostgreSQL app.bookings)
  bookings: {
    list: async (channelPartnerId?: string, customerId?: string) => {
      const params = new URLSearchParams();
      if (channelPartnerId) params.append('channel_partner_id', channelPartnerId);
      if (customerId) params.append('customer_id', customerId);

      const res = await fetch(`${API_BASE_URL}/bookings?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to fetch bookings');
      }
      return await res.json();
    },

    create: async (payload: {
      plot_id: string;
      customer_name?: string;
      customer_phone?: string;
      customer_email?: string;
      customer_id?: string;
      channel_partner_id?: string;
      booking_type: 'token_advance' | 'partial_payment' | 'full_payment';
      amount_paid: number;
      payment_method?: string;
      transaction_id?: string;
      notes?: string;
    }) => {
      const res = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to create booking');
      }
      return await res.json();
    }
  },

  // Payments API (PostgreSQL app.payments)
  payments: {
    list: async (customerId?: string, bookingId?: string) => {
      const params = new URLSearchParams();
      if (customerId) params.append('customer_id', customerId);
      if (bookingId) params.append('booking_id', bookingId);

      const res = await fetch(`${API_BASE_URL}/payments?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to fetch payments');
      }
      return await res.json();
    }
  }
};
