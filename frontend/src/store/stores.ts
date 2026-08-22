import { create } from 'zustand';
import { Booking, Customer, ChannelPartner, Payment, Notification, AppSettings } from '../types';
import { defaultSettings } from '../data/mockData';
import { api } from '../services/api';

// ── Bookings Store (In-Memory Only, No LocalStorage) ────────
interface BookingState {
  bookings: Booking[];
  addBooking: (booking: Booking) => void;
  updateBooking: (id: string, updates: Partial<Booking>) => void;
  getBookingById: (id: string) => Booking | undefined;
  resetBookings: () => void;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [],
  addBooking: (booking) => set((s) => ({ bookings: [booking, ...s.bookings] })),
  updateBooking: (id, updates) =>
    set((s) => ({ bookings: s.bookings.map((b) => (b.id === id ? { ...b, ...updates } : b)) })),
  getBookingById: (id) => get().bookings.find((b) => b.id === id),
  resetBookings: () => set({ bookings: [] }),
}));

// ── Customer Store (In-Memory Only, No LocalStorage) ────────
interface CustomerState {
  customers: Customer[];
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  resetCustomers: () => void;
}

export const useCustomerStore = create<CustomerState>((set) => ({
  customers: [],
  addCustomer: (customer) => set((s) => ({ customers: [customer, ...s.customers] })),
  updateCustomer: (id, updates) =>
    set((s) => ({ customers: s.customers.map((c) => (c.id === id ? { ...c, ...updates } : c)) })),
  resetCustomers: () => set({ customers: [] }),
}));

// ── Channel Partner Store (In-Memory Only, No LocalStorage) ──
interface ChannelPartnerState {
  channelPartners: ChannelPartner[];
  addChannelPartner: (cp: ChannelPartner) => void;
  updateChannelPartner: (id: string, updates: Partial<ChannelPartner>) => void;
  approveChannelPartner: (id: string) => void;
  rejectChannelPartner: (id: string, reason?: string) => void;
  suspendChannelPartner: (id: string) => void;
  resetChannelPartners: () => void;
}

export const useChannelPartnerStore = create<ChannelPartnerState>((set) => ({
  channelPartners: [],
  addChannelPartner: (cp) => set((s) => ({ channelPartners: [cp, ...s.channelPartners.filter(p => p.id !== cp.id)] })),
  updateChannelPartner: (id, updates) =>
    set((s) => ({ channelPartners: s.channelPartners.map((c) => (c.id === id ? { ...c, ...updates } : c)) })),
  approveChannelPartner: (id) =>
    set((s) => ({ channelPartners: s.channelPartners.map((c) => (c.id === id ? { ...c, status: 'approved', rejectionReason: undefined } : c)) })),
  rejectChannelPartner: (id, reason) =>
    set((s) => ({ channelPartners: s.channelPartners.map((c) => (c.id === id ? { ...c, status: 'rejected', rejectionReason: reason || 'Incomplete KYC documentation' } : c)) })),
  suspendChannelPartner: (id) =>
    set((s) => ({ channelPartners: s.channelPartners.map((c) => (c.id === id ? { ...c, status: 'suspended' } : c)) })),
  resetChannelPartners: () => set({ channelPartners: [] }),
}));

// ── Payment Store (In-Memory Only, No LocalStorage) ─────────
interface PaymentState {
  payments: Payment[];
  addPayment: (payment: Payment) => void;
  resetPayments: () => void;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  payments: [],
  addPayment: (payment) => set((s) => ({ payments: [payment, ...s.payments] })),
  resetPayments: () => set({ payments: [] }),
}));

// ── Notification Store (In-Memory & Live PostgreSQL Synced) ────
interface NotificationState {
  notifications: Notification[];
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  addNotification: (n: Notification) => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  resetNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  loading: false,
  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const data = await api.notifications.list();
      if (Array.isArray(data)) {
        const mapped: Notification[] = data.map((n: any) => ({
          id: n.id,
          type: n.notification_type || 'offer',
          title: n.title,
          message: n.message,
          createdAt: n.created_at || new Date().toISOString(),
          isRead: n.is_read || false,
          userId: n.entity_id || '',
        }));
        set({ notifications: mapped });
      }
    } catch (e) {
      // Backend offline or token expired
    } finally {
      set({ loading: false });
    }
  },
  addNotification: (n) => set((s) => ({ notifications: [n, ...s.notifications] })),
  markRead: async (id) => {
    set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)) }));
    try {
      await api.notifications.markRead(id);
    } catch (e) {}
  },
  markAllRead: async () => {
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, isRead: true })) }));
    try {
      await api.notifications.markAllRead();
    } catch (e) {}
  },
  resetNotifications: () => set({ notifications: [] }),
}));

// ── Settings Store (In-Memory Only, No LocalStorage) ────────
interface SettingsState {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: defaultSettings,
  updateSettings: (updates) => set((s) => ({ settings: { ...s.settings, ...updates } })),
  resetSettings: () => set({ settings: defaultSettings }),
}));
