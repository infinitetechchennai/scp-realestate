// ============================================================
// Core Types for Real Estate Plot Booking Management System
// ============================================================

export type UserRole = 'super_admin' | 'channel_partner' | 'customer';

export type PlotStatus = 'available' | 'token_booked' | 'partial_booked' | 'confirmed' | 'sold';

export type PlotFacing = 'North' | 'South' | 'East' | 'West' | 'North-East' | 'North-West' | 'South-East' | 'South-West';

export type BookingStatus = 'token_paid' | 'partial_paid' | 'confirmed' | 'sold' | 'expired' | 'cancelled';

export type PaymentType = 'registration_fee' | 'token_advance' | 'partial_payment' | 'continue_payment' | 'full_payment' | 'balance_payment';

export type PaymentMethod = 'upi' | 'bank_transfer' | 'cash' | 'card' | 'cheque' | 'other';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type DocumentStatus = 'uploaded' | 'pending_verification' | 'verified' | 'rejected';

export type ChannelPartnerStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type NotificationType =
  | 'new_registration'
  | 'token_payment'
  | 'booking_confirmed'
  | 'token_expiring'
  | 'booking_expired'
  | 'balance_pending'
  | 'plot_sold'
  | 'customer_created'
  | 'payment_received';

// ---- User ----
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

// ---- Project ----
export interface Project {
  id: string;
  name: string;
  code: string;
  location: string;
  description: string;
  totalArea: string;
  totalPlots: number;
  availablePlots: number;
  tokenBookedPlots: number;
  confirmedPlots: number;
  soldPlots: number;
  totalValue: number;
  status: 'active' | 'inactive' | 'completed';
  imageUrl?: string;
  layoutUrl?: string;
  blueprintUrl?: string;
  tokenRequired?: number;
  defaultPricePerSqft?: number;
  createdAt: string;
}

// ---- Plot ----
export interface Plot {
  id: string;
  plotNumber: string;
  projectId: string;
  projectName: string;
  location: string;
  area: number; // sq.ft
  dimensions: string; // e.g. "30x40"
  facing: PlotFacing;
  roadWidth: string; // e.g. "30 ft"
  pricePerSqft: number;
  totalPrice: number;
  status: PlotStatus;
  row: number; // for layout rendering
  col: number; // for layout rendering
  tokenRequired?: number;
  blueprintCoords?: { x: number; y: number; width?: number; height?: number };
  // booking info
  bookingId?: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  channelPartnerId?: string;
  channelPartnerName?: string;
  tokenAmount?: number;
  tokenDate?: string;
  tokenExpiry?: string;
  bookingDate?: string;
  confirmedDate?: string;
  soldDate?: string;
  totalPaid?: number;
  balanceDue?: number;
  paymentDeadline?: string;
  finalAmount?: number;
}

// ---- Customer ----
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  aadhar: string;
  pan: string;
  assignedChannelPartnerId?: string;
  assignedChannelPartnerName?: string;
  plotIds: string[];
  bookingIds: string[];
  totalPaid: number;
  totalBalance: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

// ---- Channel Partner ----
export interface ChannelPartner {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  address: string;
  aadhar: string;
  aadharDocumentName?: string;
  aadharDocumentUrl?: string;
  pan: string;
  panDocumentName?: string;
  panDocumentUrl?: string;
  bankDetails?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  password?: string;
  registrationFee: number;
  registrationPaid: boolean;
  status: ChannelPartnerStatus;
  rejectionReason?: string;
  totalCustomers: number;
  totalLeads: number;
  totalBookings: number;
  totalSold: number;
  totalRevenue: number;
  commission: number;
  pendingCommission: number;
  createdAt: string;
}

// ---- Booking ----
export interface Booking {
  id: string;
  plotId: string;
  plotNumber: string;
  projectId: string;
  projectName: string;
  customerId: string;
  customerName: string;
  channelPartnerId?: string;
  channelPartnerName?: string;
  bookingDate: string;
  paymentType: 'token' | 'continue' | 'full';
  status: BookingStatus;
  tokenAmount?: number;
  totalAmount: number;
  amountPaid: number;
  balanceAmount: number;
  tokenDate?: string;
  tokenExpiry?: string;
  confirmedDate?: string;
  paymentDeadline?: string;
  soldDate?: string;
  payments: Payment[];
}

// ---- Payment ----
export interface Payment {
  id: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  plotId: string;
  plotNumber: string;
  projectName: string;
  channelPartnerId?: string;
  type: PaymentType;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  date: string;
  reference?: string;
  notes?: string;
}

// ---- Notification ----
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedId?: string; // plotId, bookingId, etc.
  targetRoles: UserRole[];
}

// ---- Audit Log ----
export interface AuditLog {
  id: string;
  date: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  module: string;
  description: string;
  ipAddress: string;
}

// ---- Document ----
export interface Document {
  id: string;
  name: string;
  type: 'customer' | 'channel_partner' | 'plot' | 'project' | 'payment_receipt' | 'agreement';
  relatedId: string;
  relatedName: string;
  status: DocumentStatus;
  uploadedAt: string;
  fileSize: string;
  fileType: string;
}

// ---- Settings ----
export interface AppSettings {
  tokenBookingDuration: number; // days
  confirmedBookingDuration: number; // days
  defaultTokenAmount: number;
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  currency: string;
  gstRate: number;
}

// ---- Auth ----
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
}
