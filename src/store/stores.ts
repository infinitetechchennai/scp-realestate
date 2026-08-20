import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Booking, Customer, ChannelPartner, Payment, Notification, AppSettings } from '../types';
import { mockBookings, mockCustomers, mockChannelPartners, mockPayments, mockNotifications, defaultSettings } from '../data/mockData';

// ── Bookings Store ────────────────────────────────────────
interface BookingState {
  bookings: Booking[];
  addBooking: (booking: Booking) => void;
  updateBooking: (id: string, updates: Partial<Booking>) => void;
  getBookingById: (id: string) => Booking | undefined;
  resetBookings: () => void;
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      bookings: mockBookings,
      addBooking: (booking) => set((s) => ({ bookings: [booking, ...s.bookings] })),
      updateBooking: (id, updates) =>
        set((s) => ({ bookings: s.bookings.map((b) => (b.id === id ? { ...b, ...updates } : b)) })),
      getBookingById: (id) => get().bookings.find((b) => b.id === id),
      resetBookings: () => set({ bookings: mockBookings }),
    }),
    { name: 'booking-store' }
  )
);

// ── Customer Store ────────────────────────────────────────
interface CustomerState {
  customers: Customer[];
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  resetCustomers: () => void;
}

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set) => ({
      customers: mockCustomers,
      addCustomer: (customer) => set((s) => ({ customers: [customer, ...s.customers] })),
      updateCustomer: (id, updates) =>
        set((s) => ({ customers: s.customers.map((c) => (c.id === id ? { ...c, ...updates } : c)) })),
      resetCustomers: () => set({ customers: mockCustomers }),
    }),
    { name: 'customer-store' }
  )
);

// ── Channel Partner Store ─────────────────────────────────
interface ChannelPartnerState {
  channelPartners: ChannelPartner[];
  addChannelPartner: (cp: ChannelPartner) => void;
  updateChannelPartner: (id: string, updates: Partial<ChannelPartner>) => void;
  approveChannelPartner: (id: string) => void;
  rejectChannelPartner: (id: string) => void;
  suspendChannelPartner: (id: string) => void;
  resetChannelPartners: () => void;
}

export const useChannelPartnerStore = create<ChannelPartnerState>()(
  persist(
    (set) => ({
      channelPartners: mockChannelPartners,
      addChannelPartner: (cp) => set((s) => ({ channelPartners: [cp, ...s.channelPartners] })),
      updateChannelPartner: (id, updates) =>
        set((s) => ({ channelPartners: s.channelPartners.map((c) => (c.id === id ? { ...c, ...updates } : c)) })),
      approveChannelPartner: (id) =>
        set((s) => ({ channelPartners: s.channelPartners.map((c) => (c.id === id ? { ...c, status: 'approved' } : c)) })),
      rejectChannelPartner: (id) =>
        set((s) => ({ channelPartners: s.channelPartners.map((c) => (c.id === id ? { ...c, status: 'rejected' } : c)) })),
      suspendChannelPartner: (id) =>
        set((s) => ({ channelPartners: s.channelPartners.map((c) => (c.id === id ? { ...c, status: 'suspended' } : c)) })),
      resetChannelPartners: () => set({ channelPartners: mockChannelPartners }),
    }),
    { name: 'cp-store' }
  )
);

// ── Payment Store ─────────────────────────────────────────
interface PaymentState {
  payments: Payment[];
  addPayment: (payment: Payment) => void;
  resetPayments: () => void;
}

export const usePaymentStore = create<PaymentState>()(
  persist(
    (set) => ({
      payments: mockPayments,
      addPayment: (payment) => set((s) => ({ payments: [payment, ...s.payments] })),
      resetPayments: () => set({ payments: mockPayments }),
    }),
    { name: 'payment-store' }
  )
);

// ── Notification Store ────────────────────────────────────
interface NotificationState {
  notifications: Notification[];
  addNotification: (n: Notification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  resetNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: mockNotifications,
      addNotification: (n) => set((s) => ({ notifications: [n, ...s.notifications] })),
      markRead: (id) =>
        set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)) })),
      markAllRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, isRead: true })) })),
      resetNotifications: () => set({ notifications: mockNotifications }),
    }),
    { name: 'notification-store' }
  )
);

// ── Settings Store ────────────────────────────────────────
interface SettingsState {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateSettings: (updates) => set((s) => ({ settings: { ...s.settings, ...updates } })),
      resetSettings: () => set({ settings: defaultSettings }),
    }),
    { name: 'settings-store' }
  )
);
