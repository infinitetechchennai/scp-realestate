import { Customer, ChannelPartner, Project, Booking, Payment, Notification, AuditLog, Document, AppSettings, AuthUser } from '../types';

// ── AUTH USERS ───────────────────────────────────────────
export const mockAuthUsers: (AuthUser & { password: string })[] = [
  { id: 'user-admin', name: 'Suresh Admin', email: 'admin@example.com', password: 'admin123', role: 'super_admin' },
  { id: 'user-cp1', name: 'Prasad Realtors', email: 'channel@example.com', password: 'channel123', role: 'channel_partner' },
  { id: 'user-cust1', name: 'Rajesh Kumar', email: 'customer@example.com', password: 'cust123', role: 'customer' },
];

// ── PROJECTS ─────────────────────────────────────────────
export const mockProjects: Project[] = [];

// ── CUSTOMERS ─────────────────────────────────────────────
export const mockCustomers: Customer[] = [];

// ── CHANNEL PARTNERS ──────────────────────────────────────
export const mockChannelPartners: ChannelPartner[] = [];

// ── BOOKINGS ──────────────────────────────────────────────
export const mockBookings: Booking[] = [];

// ── PAYMENTS ──────────────────────────────────────────────
export const mockPayments: Payment[] = [];

// ── NOTIFICATIONS ─────────────────────────────────────────
export const mockNotifications: Notification[] = [];

// ── AUDIT LOGS ────────────────────────────────────────────
export const mockAuditLogs: AuditLog[] = [];

// ── DOCUMENTS ──────────────────────────────────────────────
export const mockDocuments: Document[] = [];

// ── APP SETTINGS ───────────────────────────────────────────
export const defaultSettings: AppSettings = {
  tokenBookingDuration: 7,
  confirmedBookingDuration: 90,
  defaultTokenAmount: 20000,
  companyName: 'SCP Realty Pvt. Ltd.',
  companyEmail: 'info@scprealty.com',
  companyPhone: '+91 98765 43210',
  currency: 'INR',
  gstRate: 18,
};

// ── REVENUE / CHART DATA ───────────────────────────────────
export const revenueChartData: any[] = [];
export const bookingTrendData: any[] = [];
