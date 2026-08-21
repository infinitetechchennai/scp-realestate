import { Customer, ChannelPartner, Project, Booking, Payment, Notification, AuditLog, Document, AppSettings, AuthUser } from '../types';
import { subDays, addDays, format } from 'date-fns';

const today = new Date();
function d(offset: number) { return format(offset >= 0 ? addDays(today, offset) : subDays(today, -offset), 'yyyy-MM-dd'); }

// ── AUTH MOCK USERS ──────────────────────────────────────
export const mockAuthUsers: (AuthUser & { password: string })[] = [
  { id: 'user-admin', name: 'Suresh Admin', email: 'admin@example.com', password: 'admin123', role: 'super_admin' },
  { id: 'user-cp1', name: 'Prasad Realtors', email: 'channel@example.com', password: 'channel123', role: 'channel_partner' },
  { id: 'user-cust1', name: 'Rajesh Kumar', email: 'customer@example.com', password: 'cust123', role: 'customer' },
];

// ── PROJECTS ─────────────────────────────────────────────
export const mockProjects: Project[] = [
  {
    id: 'proj-001',
    name: 'Green Valley Enclave',
    code: 'GVE-2024',
    location: 'Sector 12, Hyderabad',
    description: 'Premium residential plots in the heart of the city with all modern amenities, wide roads, underground drainage, and 24/7 security.',
    totalArea: '12 Acres',
    totalPlots: 40,
    availablePlots: 20,
    tokenBookedPlots: 5,
    confirmedPlots: 7,
    soldPlots: 8,
    totalValue: 158265000,
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    createdAt: d(-120),
  },
  {
    id: 'proj-002',
    name: 'Sunrise Hills Township',
    code: 'SHT-2025',
    location: 'Gachibowli, Hyderabad',
    description: 'Luxury villa plots in Gachibowli with HMDA approval, close to IT corridor and international schools.',
    totalArea: '8 Acres',
    totalPlots: 0,
    availablePlots: 0,
    tokenBookedPlots: 0,
    confirmedPlots: 0,
    soldPlots: 0,
    totalValue: 0,
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800',
    createdAt: d(-30),
  },
];

// ── CUSTOMERS ─────────────────────────────────────────────
export const mockCustomers: Customer[] = [
  { id: 'cust-001', name: 'Rajesh Kumar', email: 'rajesh@example.com', phone: '9876543210', address: '12, MG Road, Hyderabad', aadhar: '1234 5678 9012', pan: 'ABCDE1234F', assignedChannelPartnerId: 'cp-001', assignedChannelPartnerName: 'Prasad Realtors', plotIds: ['plot-002'], bookingIds: ['book-001'], totalPaid: 20000, totalBalance: 3730000, status: 'active', createdAt: d(-15) },
  { id: 'cust-002', name: 'Sita Devi', email: 'sita@example.com', phone: '9876543211', address: '45, Jubilee Hills, Hyderabad', aadhar: '2345 6789 0123', pan: 'BCDEF2345G', assignedChannelPartnerId: 'cp-001', assignedChannelPartnerName: 'Prasad Realtors', plotIds: ['plot-004', 'plot-024'], bookingIds: ['book-002', 'book-012'], totalPaid: 11400000, totalBalance: 0, status: 'active', createdAt: d(-120) },
  { id: 'cust-003', name: 'Anil Sharma', email: 'anil@example.com', phone: '9876543212', address: '78, Banjara Hills, Hyderabad', aadhar: '3456 7890 1234', pan: 'CDEFG3456H', assignedChannelPartnerId: 'cp-002', assignedChannelPartnerName: 'Sunrise Properties', plotIds: ['plot-006', 'plot-026'], bookingIds: ['book-003', 'book-013'], totalPaid: 2500000, totalBalance: 4775000, status: 'active', createdAt: d(-40) },
  { id: 'cust-004', name: 'Priya Nair', email: 'priya@example.com', phone: '9876543213', address: '23, Madhapur, Hyderabad', aadhar: '4567 8901 2345', pan: 'DEFGH4567I', assignedChannelPartnerId: 'cp-001', assignedChannelPartnerName: 'Prasad Realtors', plotIds: ['plot-008', 'plot-028'], bookingIds: ['book-004', 'book-014'], totalPaid: 10750000, totalBalance: 0, status: 'active', createdAt: d(-90) },
  { id: 'cust-005', name: 'Vikram Singh', email: 'vikram@example.com', phone: '9876543214', address: '56, Kondapur, Hyderabad', aadhar: '5678 9012 3456', pan: 'EFGHI5678J', assignedChannelPartnerId: 'cp-002', assignedChannelPartnerName: 'Sunrise Properties', plotIds: ['plot-012', 'plot-030'], bookingIds: ['book-005', 'book-015'], totalPaid: 45000, totalBalance: 7380000, status: 'active', createdAt: d(-8) },
  { id: 'cust-006', name: 'Kavitha Reddy', email: 'kavitha@example.com', phone: '9876543215', address: '89, Gachibowli, Hyderabad', aadhar: '6789 0123 4567', pan: 'FGHIJ6789K', assignedChannelPartnerId: 'cp-001', assignedChannelPartnerName: 'Prasad Realtors', plotIds: ['plot-013', 'plot-033'], bookingIds: ['book-006', 'book-016'], totalPaid: 2940000, totalBalance: 3180000, status: 'active', createdAt: d(-55) },
  { id: 'cust-007', name: 'Suresh Babu', email: 'suresh@example.com', phone: '9876543216', address: '34, Kukatpally, Hyderabad', aadhar: '7890 1234 5678', pan: 'GHIJK7890L', assignedChannelPartnerId: 'cp-003', assignedChannelPartnerName: 'Prime Estates', plotIds: ['plot-015', 'plot-036'], bookingIds: ['book-007', 'book-017'], totalPaid: 7860000, totalBalance: 0, status: 'active', createdAt: d(-100) },
  { id: 'cust-008', name: 'Lakshmi Prasad', email: 'lakshmi@example.com', phone: '9876543217', address: '67, Ameerpet, Hyderabad', aadhar: '8901 2345 6789', pan: 'HIJKL8901M', assignedChannelPartnerId: 'cp-002', assignedChannelPartnerName: 'Sunrise Properties', plotIds: ['plot-017', 'plot-038'], bookingIds: ['book-008', 'book-018'], totalPaid: 1030000, totalBalance: 5960000, status: 'active', createdAt: d(-40) },
  { id: 'cust-009', name: 'John Doe', email: 'customer@example.com', phone: '9876543218', address: '90, Secunderabad, Hyderabad', aadhar: '9012 3456 7890', pan: 'IJKLM9012N', assignedChannelPartnerId: 'cp-001', assignedChannelPartnerName: 'Prasad Realtors', plotIds: ['plot-018', 'plot-040'], bookingIds: ['book-009', 'book-019'], totalPaid: 10800000, totalBalance: 3600000, status: 'active', createdAt: d(-12) },
  { id: 'cust-010', name: 'Ramesh Gupta', email: 'ramesh@example.com', phone: '9876543219', address: '11, Hitech City, Hyderabad', aadhar: '0123 4567 8901', pan: 'JKLMN0123O', assignedChannelPartnerId: 'cp-003', assignedChannelPartnerName: 'Prime Estates', plotIds: ['plot-020'], bookingIds: ['book-010'], totalPaid: 3675000, totalBalance: 0, status: 'active', createdAt: d(-20) },
];

// ── CHANNEL PARTNERS ──────────────────────────────────────
export const mockChannelPartners: ChannelPartner[] = [
  { id: 'cp-001', name: 'Prasad Venkat', email: 'channel@example.com', phone: '9988776655', companyName: 'Prasad Realtors', address: '22, Banjara Hills, Hyderabad', aadhar: '1111 2222 3333', aadharDocumentName: 'Aadhaar_Prasad_Venkat.pdf', pan: 'PQRST1111U', panDocumentName: 'PAN_Card_Prasad_Venkat.pdf', bankDetails: 'HDFC Bank, A/C: 12345678, IFSC: HDFC0001234', bankName: 'HDFC Bank', accountNumber: '123456789012', ifscCode: 'HDFC0001234', registrationFee: 500, registrationPaid: true, status: 'approved', totalCustomers: 5, totalLeads: 18, totalBookings: 9, totalSold: 4, totalRevenue: 27610000, commission: 276100, pendingCommission: 50000, createdAt: d(-150) },
  { id: 'cp-002', name: 'Sunrise Properties', email: 'sunrise@example.com', phone: '9988776644', companyName: 'Sunrise Properties', address: '44, Jubilee Hills, Hyderabad', aadhar: '4444 5555 6666', aadharDocumentName: 'Aadhaar_Sunrise.pdf', pan: 'UVWXY4444Z', panDocumentName: 'PAN_Sunrise.pdf', bankDetails: 'SBI, A/C: 87654321, IFSC: SBIN0004321', bankName: 'State Bank of India', accountNumber: '987654321098', ifscCode: 'SBIN0004321', registrationFee: 500, registrationPaid: true, status: 'approved', totalCustomers: 4, totalLeads: 12, totalBookings: 6, totalSold: 2, totalRevenue: 9450000, commission: 94500, pendingCommission: 25000, createdAt: d(-100) },
  { id: 'cp-003', name: 'Prime Estates', email: 'prime@example.com', phone: '9988776633', companyName: 'Prime Estates', address: '66, Kondapur, Hyderabad', aadhar: '7777 8888 9999', aadharDocumentName: 'Aadhaar_Prime_Estates.pdf', pan: 'ABCDE7777F', panDocumentName: 'PAN_Prime_Estates.pdf', bankDetails: 'Axis Bank, A/C: 11223344, IFSC: UTIB0001122', bankName: 'Axis Bank', accountNumber: '556677889900', ifscCode: 'UTIB0001122', registrationFee: 500, registrationPaid: true, status: 'approved', totalCustomers: 3, totalLeads: 9, totalBookings: 4, totalSold: 3, totalRevenue: 15535000, commission: 155350, pendingCommission: 0, createdAt: d(-80) },
  { id: 'cp-004', name: 'Radha Properties', email: 'radha@example.com', phone: '9988776622', companyName: 'Radha Properties', address: '88, Madhapur, Hyderabad', aadhar: '2222 3333 4444', aadharDocumentName: 'Radha_Aadhaar_Card.pdf', pan: 'GHIJK2222L', panDocumentName: 'Radha_PAN_Card.pdf', bankDetails: 'ICICI, A/C: 99887766, IFSC: ICIC0009988', bankName: 'ICICI Bank', accountNumber: '112244668800', ifscCode: 'ICIC0009988', registrationFee: 500, registrationPaid: true, status: 'pending', totalCustomers: 0, totalLeads: 0, totalBookings: 0, totalSold: 0, totalRevenue: 0, commission: 0, pendingCommission: 0, createdAt: d(-2) },
  { id: 'cp-005', name: 'Lakshmi Ventures', email: 'lakshmi.ventures@example.com', phone: '9988776611', companyName: 'Lakshmi Ventures', address: '110, Ameerpet, Hyderabad', aadhar: '5555 6666 7777', aadharDocumentName: 'Lakshmi_Aadhaar_Doc.pdf', pan: 'MNOPQ5555R', panDocumentName: 'Lakshmi_PAN_Doc.pdf', bankDetails: 'Bank of India, A/C: 55443322, IFSC: BKID0005544', bankName: 'Bank of India', accountNumber: '778899001122', ifscCode: 'BKID0005544', registrationFee: 500, registrationPaid: false, status: 'pending', totalCustomers: 0, totalLeads: 0, totalBookings: 0, totalSold: 0, totalRevenue: 0, commission: 0, pendingCommission: 0, createdAt: d(-1) },
];

// ── BOOKINGS ──────────────────────────────────────────────
export const mockBookings: Booking[] = [
  { id: 'book-001', plotId: 'plot-002', plotNumber: 'P-002', projectId: 'proj-001', projectName: 'Green Valley Enclave', customerId: 'cust-001', customerName: 'Rajesh Kumar', channelPartnerId: 'cp-001', channelPartnerName: 'Prasad Realtors', bookingDate: d(-2), paymentType: 'token', status: 'token_paid', tokenAmount: 20000, totalAmount: 3750000, amountPaid: 20000, balanceAmount: 3730000, tokenDate: d(-2), tokenExpiry: d(5), payments: [] },
  { id: 'book-003', plotId: 'plot-006', plotNumber: 'P-006', projectId: 'proj-001', projectName: 'Green Valley Enclave', customerId: 'cust-003', customerName: 'Anil Sharma', channelPartnerId: 'cp-002', channelPartnerName: 'Sunrise Properties', bookingDate: d(-10), paymentType: 'continue', status: 'confirmed', tokenAmount: 30000, totalAmount: 3600000, amountPaid: 1000000, balanceAmount: 2600000, tokenDate: d(-10), tokenExpiry: d(-3), confirmedDate: d(-8), paymentDeadline: d(82), payments: [] },
  { id: 'book-005', plotId: 'plot-012', plotNumber: 'P-012', projectId: 'proj-001', projectName: 'Green Valley Enclave', customerId: 'cust-005', customerName: 'Vikram Singh', channelPartnerId: 'cp-002', channelPartnerName: 'Sunrise Properties', bookingDate: d(-5), paymentType: 'token', status: 'token_paid', tokenAmount: 25000, totalAmount: 3600000, amountPaid: 25000, balanceAmount: 3575000, tokenDate: d(-5), tokenExpiry: d(2), payments: [] },
  { id: 'book-006', plotId: 'plot-013', plotNumber: 'P-013', projectId: 'proj-001', projectName: 'Green Valley Enclave', customerId: 'cust-006', customerName: 'Kavitha Reddy', channelPartnerId: 'cp-001', channelPartnerName: 'Prasad Realtors', bookingDate: d(-20), paymentType: 'continue', status: 'confirmed', tokenAmount: 30000, totalAmount: 3240000, amountPaid: 1500000, balanceAmount: 1740000, tokenDate: d(-20), tokenExpiry: d(-13), confirmedDate: d(-18), paymentDeadline: d(70), payments: [] },
  { id: 'book-008', plotId: 'plot-017', plotNumber: 'P-017', projectId: 'proj-001', projectName: 'Green Valley Enclave', customerId: 'cust-008', customerName: 'Lakshmi Prasad', channelPartnerId: 'cp-002', channelPartnerName: 'Sunrise Properties', bookingDate: d(-35), paymentType: 'continue', status: 'confirmed', tokenAmount: 25000, totalAmount: 2940000, amountPaid: 1000000, balanceAmount: 1940000, tokenDate: d(-35), tokenExpiry: d(-28), confirmedDate: d(-33), paymentDeadline: d(57), payments: [] },
  { id: 'book-009', plotId: 'plot-018', plotNumber: 'P-018', projectId: 'proj-001', projectName: 'Green Valley Enclave', customerId: 'cust-009', customerName: 'John Doe', channelPartnerId: 'cp-001', channelPartnerName: 'Prasad Realtors', bookingDate: d(-5), paymentType: 'continue', status: 'confirmed', tokenAmount: 50000, totalAmount: 7200000, amountPaid: 3600000, balanceAmount: 3600000, tokenDate: d(-5), tokenExpiry: d(2), confirmedDate: d(-3), paymentDeadline: d(87), payments: [] },
  { id: 'book-002', plotId: 'plot-004', plotNumber: 'P-004', projectId: 'proj-001', projectName: 'Green Valley Enclave', customerId: 'cust-002', customerName: 'Sita Devi', channelPartnerId: 'cp-001', channelPartnerName: 'Prasad Realtors', bookingDate: d(-90), paymentType: 'full', status: 'sold', tokenAmount: 50000, totalAmount: 5600000, amountPaid: 5600000, balanceAmount: 0, tokenDate: d(-90), tokenExpiry: d(-83), confirmedDate: d(-88), soldDate: d(-45), payments: [] },
  { id: 'book-004', plotId: 'plot-008', plotNumber: 'P-008', projectId: 'proj-001', projectName: 'Green Valley Enclave', customerId: 'cust-004', customerName: 'Priya Nair', channelPartnerId: 'cp-001', channelPartnerName: 'Prasad Realtors', bookingDate: d(-120), paymentType: 'full', status: 'sold', tokenAmount: 50000, totalAmount: 5800000, amountPaid: 5800000, balanceAmount: 0, tokenDate: d(-120), tokenExpiry: d(-113), confirmedDate: d(-118), soldDate: d(-60), payments: [] },
  { id: 'book-007', plotId: 'plot-015', plotNumber: 'P-015', projectId: 'proj-001', projectName: 'Green Valley Enclave', customerId: 'cust-007', customerName: 'Suresh Babu', channelPartnerId: 'cp-003', channelPartnerName: 'Prime Estates', bookingDate: d(-80), paymentType: 'full', status: 'sold', tokenAmount: 30000, totalAmount: 3000000, amountPaid: 3000000, balanceAmount: 0, tokenDate: d(-80), tokenExpiry: d(-73), confirmedDate: d(-78), soldDate: d(-30), payments: [] },
  { id: 'book-010', plotId: 'plot-020', plotNumber: 'P-020', projectId: 'proj-001', projectName: 'Green Valley Enclave', customerId: 'cust-010', customerName: 'Ramesh Gupta', channelPartnerId: 'cp-003', channelPartnerName: 'Prime Estates', bookingDate: d(-50), paymentType: 'full', status: 'sold', tokenAmount: 35000, totalAmount: 3675000, amountPaid: 3675000, balanceAmount: 0, tokenDate: d(-50), tokenExpiry: d(-43), confirmedDate: d(-48), soldDate: d(-15), payments: [] },
];

// ── PAYMENTS ──────────────────────────────────────────────
export const mockPayments: Payment[] = [
  { id: 'pay-001', bookingId: 'book-001', customerId: 'cust-001', customerName: 'Rajesh Kumar', plotId: 'plot-002', plotNumber: 'P-002', projectName: 'Green Valley Enclave', channelPartnerId: 'cp-001', type: 'token_advance', method: 'upi', amount: 20000, status: 'completed', date: d(-2), reference: 'UPI/202408/001', notes: 'Token advance for P-002' },
  { id: 'pay-002', bookingId: 'book-003', customerId: 'cust-003', customerName: 'Anil Sharma', plotId: 'plot-006', plotNumber: 'P-006', projectName: 'Green Valley Enclave', channelPartnerId: 'cp-002', type: 'token_advance', method: 'bank_transfer', amount: 30000, status: 'completed', date: d(-10), reference: 'NEFT/202408/002' },
  { id: 'pay-003', bookingId: 'book-003', customerId: 'cust-003', customerName: 'Anil Sharma', plotId: 'plot-006', plotNumber: 'P-006', projectName: 'Green Valley Enclave', channelPartnerId: 'cp-002', type: 'continue_payment', method: 'bank_transfer', amount: 970000, status: 'completed', date: d(-8), reference: 'NEFT/202408/003' },
  { id: 'pay-004', bookingId: 'book-005', customerId: 'cust-005', customerName: 'Vikram Singh', plotId: 'plot-012', plotNumber: 'P-012', projectName: 'Green Valley Enclave', channelPartnerId: 'cp-002', type: 'token_advance', method: 'upi', amount: 25000, status: 'completed', date: d(-5), reference: 'UPI/202408/004' },
  { id: 'pay-005', bookingId: 'book-006', customerId: 'cust-006', customerName: 'Kavitha Reddy', plotId: 'plot-013', plotNumber: 'P-013', projectName: 'Green Valley Enclave', channelPartnerId: 'cp-001', type: 'token_advance', method: 'cheque', amount: 30000, status: 'completed', date: d(-20), reference: 'CHQ/202408/005' },
  { id: 'pay-006', bookingId: 'book-006', customerId: 'cust-006', customerName: 'Kavitha Reddy', plotId: 'plot-013', plotNumber: 'P-013', projectName: 'Green Valley Enclave', channelPartnerId: 'cp-001', type: 'continue_payment', method: 'bank_transfer', amount: 1470000, status: 'completed', date: d(-18), reference: 'NEFT/202408/006' },
  { id: 'pay-007', bookingId: 'book-009', customerId: 'cust-009', customerName: 'John Doe', plotId: 'plot-018', plotNumber: 'P-018', projectName: 'Green Valley Enclave', channelPartnerId: 'cp-001', type: 'token_advance', method: 'upi', amount: 50000, status: 'completed', date: d(-5), reference: 'UPI/202408/007' },
  { id: 'pay-008', bookingId: 'book-009', customerId: 'cust-009', customerName: 'John Doe', plotId: 'plot-018', plotNumber: 'P-018', projectName: 'Green Valley Enclave', channelPartnerId: 'cp-001', type: 'continue_payment', method: 'bank_transfer', amount: 3550000, status: 'completed', date: d(-3), reference: 'NEFT/202408/008' },
  { id: 'pay-009', bookingId: 'book-002', customerId: 'cust-002', customerName: 'Sita Devi', plotId: 'plot-004', plotNumber: 'P-004', projectName: 'Green Valley Enclave', channelPartnerId: 'cp-001', type: 'full_payment', method: 'bank_transfer', amount: 5600000, status: 'completed', date: d(-45), reference: 'NEFT/202408/009' },
  { id: 'pay-010', bookingId: 'book-004', customerId: 'cust-004', customerName: 'Priya Nair', plotId: 'plot-008', plotNumber: 'P-008', projectName: 'Green Valley Enclave', channelPartnerId: 'cp-001', type: 'full_payment', method: 'bank_transfer', amount: 5800000, status: 'completed', date: d(-60), reference: 'NEFT/202408/010' },
  { id: 'pay-011', bookingId: 'book-001', customerId: 'cp-004', customerName: 'Radha Properties', plotId: '', plotNumber: '', projectName: 'Green Valley Enclave', type: 'registration_fee', method: 'upi', amount: 500, status: 'completed', date: d(-2), reference: 'UPI/202408/011', notes: 'Channel partner registration fee' },
];

// ── NOTIFICATIONS ─────────────────────────────────────────
export const mockNotifications: Notification[] = [
  { id: 'notif-001', type: 'new_registration', title: 'New Channel Partner Registration', message: 'Radha Properties has submitted their registration. Pending approval.', isRead: false, createdAt: d(-2) + 'T10:30:00', relatedId: 'cp-004', targetRoles: ['super_admin'] },
  { id: 'notif-002', type: 'token_payment', title: 'Token Payment Received', message: 'Rajesh Kumar has paid ₹20,000 token advance for Plot P-002.', isRead: false, createdAt: d(-2) + 'T11:15:00', relatedId: 'book-001', targetRoles: ['super_admin', 'channel_partner'] },
  { id: 'notif-003', type: 'token_expiring', title: 'Token Booking Expiring Soon', message: 'Token booking for Plot P-012 (Vikram Singh) expires in 2 days.', isRead: false, createdAt: d(0) + 'T09:00:00', relatedId: 'book-005', targetRoles: ['super_admin', 'channel_partner', 'customer'] },
  { id: 'notif-004', type: 'booking_confirmed', title: 'Booking Confirmed', message: 'Booking for Plot P-006 has been confirmed by Anil Sharma.', isRead: true, createdAt: d(-8) + 'T14:20:00', relatedId: 'book-003', targetRoles: ['super_admin', 'channel_partner'] },
  { id: 'notif-005', type: 'balance_pending', title: 'Balance Payment Pending', message: 'Plot P-017: ₹19,40,000 balance due. 57 days remaining for Lakshmi Prasad.', isRead: true, createdAt: d(-1) + 'T08:00:00', relatedId: 'book-008', targetRoles: ['super_admin', 'customer'] },
  { id: 'notif-006', type: 'plot_sold', title: 'Plot Marked as SOLD', message: 'Plot P-020 has been marked as SOLD. Customer: Ramesh Gupta.', isRead: true, createdAt: d(-15) + 'T16:45:00', relatedId: 'book-010', targetRoles: ['super_admin'] },
  { id: 'notif-007', type: 'customer_created', title: 'New Customer Account', message: 'New customer John Doe (john@example.com) account has been created.', isRead: true, createdAt: d(-12) + 'T10:00:00', relatedId: 'cust-009', targetRoles: ['super_admin'] },
  { id: 'notif-008', type: 'payment_received', title: 'Payment Received', message: 'John Doe paid ₹35,50,000 towards Plot P-018 balance.', isRead: false, createdAt: d(-3) + 'T15:30:00', relatedId: 'pay-008', targetRoles: ['super_admin', 'channel_partner'] },
  { id: 'notif-009', type: 'new_registration', title: 'New Channel Partner Registration', message: 'Lakshmi Ventures has submitted their registration. Pending payment.', isRead: false, createdAt: d(-1) + 'T12:00:00', relatedId: 'cp-005', targetRoles: ['super_admin'] },
  { id: 'notif-010', type: 'token_expiring', title: 'Token Booking Expiring', message: 'Token booking for Plot P-038 (Lakshmi Prasad) expires in 3 days.', isRead: false, createdAt: d(0) + 'T09:30:00', relatedId: 'book-018', targetRoles: ['super_admin', 'channel_partner', 'customer'] },
];

// ── AUDIT LOGS ────────────────────────────────────────────
export const mockAuditLogs: AuditLog[] = [
  { id: 'log-001', date: d(-2) + 'T10:30:00', userId: 'user-admin', userName: 'Suresh Admin', userRole: 'super_admin', action: 'Approved Channel Partner', module: 'Channel Partners', description: 'Approved channel partner Prasad Realtors (cp-001)', ipAddress: '192.168.1.1' },
  { id: 'log-002', date: d(-2) + 'T11:15:00', userId: 'user-cust1', userName: 'Rajesh Kumar', userRole: 'customer', action: 'Token Payment', module: 'Bookings', description: 'Paid ₹20,000 token advance for Plot P-002', ipAddress: '192.168.1.25' },
  { id: 'log-003', date: d(-8) + 'T14:20:00', userId: 'user-admin', userName: 'Suresh Admin', userRole: 'super_admin', action: 'Confirmed Booking', module: 'Bookings', description: 'Booking confirmed for Plot P-006 - Anil Sharma', ipAddress: '192.168.1.1' },
  { id: 'log-004', date: d(-15) + 'T16:45:00', userId: 'user-admin', userName: 'Suresh Admin', userRole: 'super_admin', action: 'Marked Plot Sold', module: 'Plot Management', description: 'Plot P-020 marked as SOLD. Customer: Ramesh Gupta. Amount: ₹36,75,000', ipAddress: '192.168.1.1' },
  { id: 'log-005', date: d(-20) + 'T10:00:00', userId: 'user-cp1', userName: 'Prasad Venkat', userRole: 'channel_partner', action: 'Created Customer', module: 'Customers', description: 'Created customer account for Kavitha Reddy', ipAddress: '192.168.1.30' },
  { id: 'log-006', date: d(-30) + 'T09:00:00', userId: 'user-admin', userName: 'Suresh Admin', userRole: 'super_admin', action: 'Created Project', module: 'Projects', description: 'Created project Green Valley Enclave (GVE-2024)', ipAddress: '192.168.1.1' },
  { id: 'log-007', date: d(-30) + 'T09:30:00', userId: 'user-admin', userName: 'Suresh Admin', userRole: 'super_admin', action: 'Imported Plots', module: 'Plot Management', description: 'Imported 40 plots from Excel for Green Valley Enclave', ipAddress: '192.168.1.1' },
  { id: 'log-008', date: d(-45) + 'T14:00:00', userId: 'user-admin', userName: 'Suresh Admin', userRole: 'super_admin', action: 'Marked Plot Sold', module: 'Plot Management', description: 'Plot P-004 marked as SOLD. Customer: Sita Devi. Amount: ₹56,00,000', ipAddress: '192.168.1.1' },
  { id: 'log-009', date: d(-60) + 'T11:30:00', userId: 'user-admin', userName: 'Suresh Admin', userRole: 'super_admin', action: 'Marked Plot Sold', module: 'Plot Management', description: 'Plot P-008 marked as SOLD. Customer: Priya Nair. Amount: ₹58,00,000', ipAddress: '192.168.1.1' },
  { id: 'log-010', date: d(-1) + 'T08:00:00', userId: 'user-admin', userName: 'Suresh Admin', userRole: 'super_admin', action: 'Updated Settings', module: 'Settings', description: 'Updated token booking duration to 7 days', ipAddress: '192.168.1.1' },
  { id: 'log-011', date: d(-3) + 'T15:30:00', userId: 'user-cust1', userName: 'John Doe', userRole: 'customer', action: 'Balance Payment', module: 'Payments', description: 'Paid ₹35,50,000 towards Plot P-018 balance', ipAddress: '192.168.1.50' },
  { id: 'log-012', date: d(-5) + 'T12:00:00', userId: 'user-cust1', userName: 'John Doe', userRole: 'customer', action: 'Token Payment', module: 'Bookings', description: 'Paid ₹50,000 token advance for Plot P-018', ipAddress: '192.168.1.50' },
];

// ── DOCUMENTS ──────────────────────────────────────────────
export const mockDocuments: Document[] = [
  { id: 'doc-001', name: 'Aadhar Card - Rajesh Kumar', type: 'customer', relatedId: 'cust-001', relatedName: 'Rajesh Kumar', status: 'verified', uploadedAt: d(-15) + 'T10:00:00', fileSize: '2.3 MB', fileType: 'PDF' },
  { id: 'doc-002', name: 'PAN Card - Rajesh Kumar', type: 'customer', relatedId: 'cust-001', relatedName: 'Rajesh Kumar', status: 'verified', uploadedAt: d(-15) + 'T10:05:00', fileSize: '1.1 MB', fileType: 'PDF' },
  { id: 'doc-003', name: 'Sale Agreement - P-002', type: 'agreement', relatedId: 'plot-002', relatedName: 'P-002', status: 'pending_verification', uploadedAt: d(-2) + 'T11:30:00', fileSize: '4.2 MB', fileType: 'PDF' },
  { id: 'doc-004', name: 'Aadhar - Prasad Venkat (CP)', type: 'channel_partner', relatedId: 'cp-001', relatedName: 'Prasad Realtors', status: 'verified', uploadedAt: d(-150) + 'T09:00:00', fileSize: '1.8 MB', fileType: 'PDF' },
  { id: 'doc-005', name: 'PAN Card - Prasad Venkat (CP)', type: 'channel_partner', relatedId: 'cp-001', relatedName: 'Prasad Realtors', status: 'verified', uploadedAt: d(-150) + 'T09:05:00', fileSize: '0.9 MB', fileType: 'PDF' },
  { id: 'doc-006', name: 'Plot Layout - GVE', type: 'project', relatedId: 'proj-001', relatedName: 'Green Valley Enclave', status: 'verified', uploadedAt: d(-120) + 'T08:00:00', fileSize: '8.5 MB', fileType: 'PDF' },
  { id: 'doc-007', name: 'Payment Receipt - book-001', type: 'payment_receipt', relatedId: 'pay-001', relatedName: 'Token Advance P-002', status: 'verified', uploadedAt: d(-2) + 'T11:20:00', fileSize: '0.5 MB', fileType: 'PDF' },
  { id: 'doc-008', name: 'Sale Deed - P-004', type: 'agreement', relatedId: 'plot-004', relatedName: 'P-004', status: 'verified', uploadedAt: d(-45) + 'T15:00:00', fileSize: '6.1 MB', fileType: 'PDF' },
  { id: 'doc-009', name: 'Aadhar - Radha Properties (CP)', type: 'channel_partner', relatedId: 'cp-004', relatedName: 'Radha Properties', status: 'pending_verification', uploadedAt: d(-2) + 'T10:00:00', fileSize: '2.0 MB', fileType: 'PDF' },
  { id: 'doc-010', name: 'Plot Details Excel - GVE', type: 'project', relatedId: 'proj-001', relatedName: 'Green Valley Enclave', status: 'verified', uploadedAt: d(-120) + 'T08:30:00', fileSize: '0.2 MB', fileType: 'XLSX' },
];

// ── APP SETTINGS ───────────────────────────────────────────
export const defaultSettings: AppSettings = {
  tokenBookingDuration: 7,
  confirmedBookingDuration: 90,
  defaultTokenAmount: 20000,
  companyName: 'GVE Realty Pvt. Ltd.',
  companyEmail: 'info@gverealty.com',
  companyPhone: '+91 98765 43210',
  currency: 'INR',
  gstRate: 18,
};

// ── REVENUE / CHART DATA ───────────────────────────────────
export const revenueChartData = [
  { month: 'Mar', token: 45000, booking: 2440000, final: 5600000, total: 8085000 },
  { month: 'Apr', token: 80000, booking: 5970000, final: 5800000, total: 11850000 },
  { month: 'May', token: 55000, booking: 1500000, final: 3000000, total: 4555000 },
  { month: 'Jun', token: 30000, booking: 970000, final: 0, total: 1000000 },
  { month: 'Jul', token: 75000, booking: 4860000, final: 3675000, total: 8610000 },
  { month: 'Aug', token: 145000, booking: 5050000, final: 7200000, total: 12395000 },
];

export const bookingTrendData = [
  { week: 'Week 1', bookings: 2, confirmations: 1, sold: 0 },
  { week: 'Week 2', bookings: 3, confirmations: 2, sold: 1 },
  { week: 'Week 3', bookings: 1, confirmations: 1, sold: 1 },
  { week: 'Week 4', bookings: 4, confirmations: 2, sold: 2 },
  { week: 'Week 5', bookings: 2, confirmations: 3, sold: 1 },
  { week: 'Week 6', bookings: 5, confirmations: 2, sold: 3 },
];
