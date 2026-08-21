import { Plot, PlotFacing, PlotStatus } from '../types';
import { addDays, subDays, format } from 'date-fns';

const today = new Date();

const facing: PlotFacing[] = ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'];
const dims = ['30x40', '30x50', '40x50', '40x60', '20x30', '25x40', '30x60', '50x60'];

function mkDate(d: Date) { return format(d, 'yyyy-MM-dd'); }

export const mockPlots: Plot[] = [
  // ── ROW 1: plots 1-10 ──
  {
    id: 'plot-001', plotNumber: 'P-001', projectId: 'proj-001', projectName: 'Green Valley Enclave',
    location: 'Sector 12, Hyderabad', area: 1200, dimensions: '30x40', facing: 'North',
    roadWidth: '30 ft', pricePerSqft: 2500, totalPrice: 3000000, status: 'available',
    row: 1, col: 1,
  },
  {
    id: 'plot-002', plotNumber: 'P-002', projectId: 'proj-001', projectName: 'Green Valley Enclave',
    location: 'Sector 12, Hyderabad', area: 1500, dimensions: '30x50', facing: 'North',
    roadWidth: '30 ft', pricePerSqft: 2500, totalPrice: 3750000, status: 'token_booked',
    row: 1, col: 2,
    bookingId: 'book-001', customerId: 'cust-001', customerName: 'Rajesh Kumar',
    channelPartnerId: 'cp-001', channelPartnerName: 'Prasad Realtors',
    tokenAmount: 20000, tokenDate: mkDate(subDays(today, 2)), tokenExpiry: mkDate(addDays(today, 5)),
    totalPaid: 20000, balanceDue: 3730000,
  },
  {
    id: 'plot-003', plotNumber: 'P-003', projectId: 'proj-001', projectName: 'Green Valley Enclave',
    location: 'Sector 12, Hyderabad', area: 1200, dimensions: '30x40', facing: 'North-East',
    roadWidth: '30 ft', pricePerSqft: 2600, totalPrice: 3120000, status: 'available',
    row: 1, col: 3,
  },
  {
    id: 'plot-004', plotNumber: 'P-004', projectId: 'proj-001', projectName: 'Green Valley Enclave',
    location: 'Sector 12, Hyderabad', area: 2000, dimensions: '40x50', facing: 'East',
    roadWidth: '40 ft', pricePerSqft: 2800, totalPrice: 5600000, status: 'sold',
    row: 1, col: 4,
    bookingId: 'book-002', customerId: 'cust-002', customerName: 'Sita Devi',
    channelPartnerId: 'cp-001', channelPartnerName: 'Prasad Realtors',
    tokenAmount: 50000, soldDate: mkDate(subDays(today, 45)),
    totalPaid: 5600000, balanceDue: 0, finalAmount: 5600000,
  },
  {
    id: 'plot-005', plotNumber: 'P-005', projectId: 'proj-001', projectName: 'Green Valley Enclave',
    location: 'Sector 12, Hyderabad', area: 1200, dimensions: '30x40', facing: 'North',
    roadWidth: '30 ft', pricePerSqft: 2500, totalPrice: 3000000, status: 'available',
    row: 1, col: 5,
  },
  {
    id: 'plot-006', plotNumber: 'P-006', projectId: 'proj-001', projectName: 'Green Valley Enclave',
    location: 'Sector 12, Hyderabad', area: 1500, dimensions: '30x50', facing: 'South',
    roadWidth: '30 ft', pricePerSqft: 2400, totalPrice: 3600000, status: 'confirmed',
    row: 1, col: 6,
    bookingId: 'book-003', customerId: 'cust-003', customerName: 'Anil Sharma',
    channelPartnerId: 'cp-002', channelPartnerName: 'Sunrise Properties',
    tokenAmount: 30000, tokenDate: mkDate(subDays(today, 10)), bookingDate: mkDate(subDays(today, 8)),
    confirmedDate: mkDate(subDays(today, 8)), paymentDeadline: mkDate(addDays(today, 82)),
    totalPaid: 1000000, balanceDue: 2600000,
  },
  {
    id: 'plot-007', plotNumber: 'P-007', projectId: 'proj-001', projectName: 'Green Valley Enclave',
    location: 'Sector 12, Hyderabad', area: 1200, dimensions: '30x40', facing: 'East',
    roadWidth: '30 ft', pricePerSqft: 2700, totalPrice: 3240000, status: 'available',
    row: 1, col: 7,
  },
  {
    id: 'plot-008', plotNumber: 'P-008', projectId: 'proj-001', projectName: 'Green Valley Enclave',
    location: 'Sector 12, Hyderabad', area: 2000, dimensions: '40x50', facing: 'North-West',
    roadWidth: '40 ft', pricePerSqft: 2900, totalPrice: 5800000, status: 'sold',
    row: 1, col: 8,
    bookingId: 'book-004', customerId: 'cust-004', customerName: 'Priya Nair',
    channelPartnerId: 'cp-001', channelPartnerName: 'Prasad Realtors',
    tokenAmount: 50000, soldDate: mkDate(subDays(today, 60)),
    totalPaid: 5800000, balanceDue: 0, finalAmount: 5800000,
  },
  {
    id: 'plot-009', plotNumber: 'P-009', projectId: 'proj-001', projectName: 'Green Valley Enclave',
    location: 'Sector 12, Hyderabad', area: 1200, dimensions: '30x40', facing: 'North',
    roadWidth: '30 ft', pricePerSqft: 2500, totalPrice: 3000000, status: 'available',
    row: 1, col: 9,
  },
  {
    id: 'plot-010', plotNumber: 'P-010', projectId: 'proj-001', projectName: 'Green Valley Enclave',
    location: 'Sector 12, Hyderabad', area: 1500, dimensions: '30x50', facing: 'South-East',
    roadWidth: '30 ft', pricePerSqft: 2600, totalPrice: 3900000, status: 'available',
    row: 1, col: 10,
  },

  // ── ROW 2: plots 11-20 ──
  {
    id: 'plot-011', plotNumber: 'P-011', projectId: 'proj-001', projectName: 'Green Valley Enclave',
    location: 'Sector 12, Hyderabad', area: 1200, dimensions: '30x40', facing: 'South',
    roadWidth: '30 ft', pricePerSqft: 2400, totalPrice: 2880000, status: 'available',
    row: 2, col: 1,
  },
  {
    id: 'plot-012', plotNumber: 'P-012', projectId: 'proj-001', projectName: 'Green Valley Enclave',
    location: 'Sector 12, Hyderabad', area: 1500, dimensions: '30x50', facing: 'South',
    roadWidth: '30 ft', pricePerSqft: 2400, totalPrice: 3600000, status: 'token_booked',
    row: 2, col: 2,
    bookingId: 'book-005', customerId: 'cust-005', customerName: 'Vikram Singh',
    channelPartnerId: 'cp-002', channelPartnerName: 'Sunrise Properties',
    tokenAmount: 25000, tokenDate: mkDate(subDays(today, 5)), tokenExpiry: mkDate(addDays(today, 2)),
    totalPaid: 25000, balanceDue: 3575000,
  },
  {
    id: 'plot-013', plotNumber: 'P-013', projectId: 'proj-001', projectName: 'Green Valley Enclave',
    location: 'Sector 12, Hyderabad', area: 1200, dimensions: '30x40', facing: 'East',
    roadWidth: '30 ft', pricePerSqft: 2700, totalPrice: 3240000, status: 'confirmed',
    row: 2, col: 3,
    bookingId: 'book-006', customerId: 'cust-006', customerName: 'Kavitha Reddy',
    channelPartnerId: 'cp-001', channelPartnerName: 'Prasad Realtors',
    tokenAmount: 30000, bookingDate: mkDate(subDays(today, 20)), confirmedDate: mkDate(subDays(today, 18)),
    paymentDeadline: mkDate(addDays(today, 70)), totalPaid: 1500000, balanceDue: 1740000,
  },
  {
    id: 'plot-014', plotNumber: 'P-014', projectId: 'proj-001', projectName: 'Green Valley Enclave',
    location: 'Sector 12, Hyderabad', area: 2000, dimensions: '40x50', facing: 'West',
    roadWidth: '40 ft', pricePerSqft: 2800, totalPrice: 5600000, status: 'available',
    row: 2, col: 4,
  },
  {
    id: 'plot-015', plotNumber: 'P-015', projectId: 'proj-001', projectName: 'Green Valley Enclave',
    location: 'Sector 12, Hyderabad', area: 1200, dimensions: '30x40', facing: 'North',
    roadWidth: '30 ft', pricePerSqft: 2500, totalPrice: 3000000, status: 'sold',
    row: 2, col: 5,
    bookingId: 'book-007', customerId: 'cust-007', customerName: 'Suresh Babu',
    channelPartnerId: 'cp-003', channelPartnerName: 'Prime Estates',
    tokenAmount: 30000, soldDate: mkDate(subDays(today, 30)),
    totalPaid: 3000000, balanceDue: 0, finalAmount: 3000000,
  },
  {
    id: 'plot-016', plotNumber: 'P-016', projectId: 'proj-001', projectName: 'Green Valley Enclave',
    location: 'Sector 12, Hyderabad', area: 1500, dimensions: '30x50', facing: 'North-East',
    roadWidth: '30 ft', pricePerSqft: 2600, totalPrice: 3900000, status: 'available',
    row: 2, col: 6,
  },
  {
    id: 'plot-017', plotNumber: 'P-017', projectId: 'proj-001', projectName: 'Green Valley Enclave',
    location: 'Sector 12, Hyderabad', area: 1200, dimensions: '30x40', facing: 'South-West',
    roadWidth: '30 ft', pricePerSqft: 2450, totalPrice: 2940000, status: 'confirmed',
    row: 2, col: 7,
    bookingId: 'book-008', customerId: 'cust-008', customerName: 'Lakshmi Prasad',
    channelPartnerId: 'cp-002', channelPartnerName: 'Sunrise Properties',
    tokenAmount: 25000, bookingDate: mkDate(subDays(today, 35)), confirmedDate: mkDate(subDays(today, 33)),
    paymentDeadline: mkDate(addDays(today, 57)), totalPaid: 1000000, balanceDue: 1940000,
  },
  {
    id: 'plot-018', plotNumber: 'P-018', projectId: 'proj-001', projectName: 'Green Valley Enclave',
    location: 'Sector 12, Hyderabad', area: 2400, dimensions: '40x60', facing: 'East',
    roadWidth: '40 ft', pricePerSqft: 3000, totalPrice: 7200000, status: 'confirmed',
    row: 2, col: 8,
    bookingId: 'book-009', customerId: 'cust-009', customerName: 'John Doe',
    channelPartnerId: 'cp-001', channelPartnerName: 'Prasad Realtors',
    tokenAmount: 50000, bookingDate: mkDate(subDays(today, 5)), confirmedDate: mkDate(subDays(today, 3)),
    paymentDeadline: mkDate(addDays(today, 87)), totalPaid: 3600000, balanceDue: 3600000,
  },
  {
    id: 'plot-019', plotNumber: 'P-019', projectId: 'proj-001', projectName: 'Green Valley Enclave',
    location: 'Sector 12, Hyderabad', area: 1200, dimensions: '30x40', facing: 'North',
    roadWidth: '30 ft', pricePerSqft: 2500, totalPrice: 3000000, status: 'available',
    row: 2, col: 9,
  },
  {
    id: 'plot-020', plotNumber: 'P-020', projectId: 'proj-001', projectName: 'Green Valley Enclave',
    location: 'Sector 12, Hyderabad', area: 1500, dimensions: '30x50', facing: 'West',
    roadWidth: '30 ft', pricePerSqft: 2450, totalPrice: 3675000, status: 'sold',
    row: 2, col: 10,
    bookingId: 'book-010', customerId: 'cust-010', customerName: 'Ramesh Gupta',
    channelPartnerId: 'cp-003', channelPartnerName: 'Prime Estates',
    tokenAmount: 35000, soldDate: mkDate(subDays(today, 15)),
    totalPaid: 3675000, balanceDue: 0, finalAmount: 3675000,
  },

  // ── ROW 3: plots 21-30 ──
  {
    id: 'plot-021', plotNumber: 'P-021', projectId: 'proj-001', projectName: 'Green Valley Enclave',
    location: 'Sector 12, Hyderabad', area: 1200, dimensions: '30x40', facing: 'North',
    roadWidth: '30 ft', pricePerSqft: 2500, totalPrice: 3000000, status: 'available',
    row: 3, col: 1,
  },
  {
    id: 'plot-022', plotNumber: 'P-022', projectId: 'proj-001', projectName: 'Green Valley Enclave',
    location: 'Sector 12, Hyderabad', area: 1500, dimensions: '30x50', facing: 'South',
    roadWidth: '30 ft', pricePerSqft: 2400, totalPrice: 3600000, status: 'available',
    row: 3, col: 2,
  },
  {
    id: 'plot-023', plotNumber: 'P-023', projectId: 'proj-001', projectName: 'Green Valley Enclave',
    location: 'Sector 12, Hyderabad', area: 1200, dimensions: '30x40', facing: 'East',
    roadWidth: '30 ft', pricePerSqft: 2700, totalPrice: 3240000, status: 'token_booked',
    row: 3, col: 3,
    bookingId: 'book-011', customerId: 'cust-001', customerName: 'Rajesh Kumar',
    channelPartnerId: 'cp-001', channelPartnerName: 'Prasad Realtors',
    tokenAmount: 20000, tokenDate: mkDate(subDays(today, 1)), tokenExpiry: mkDate(addDays(today, 6)),
    totalPaid: 20000, balanceDue: 3220000,
  },
  {
    id: 'plot-024', plotNumber: 'P-024', projectId: 'proj-001', projectName: 'Green Valley Enclave',
    location: 'Sector 12, Hyderabad', area: 2000, dimensions: '40x50', facing: 'North-East',
    roadWidth: '40 ft', pricePerSqft: 2900, totalPrice: 5800000, status: 'sold',
    row: 3, col: 4,
    bookingId: 'book-012', customerId: 'cust-002', customerName: 'Sita Devi',
    channelPartnerId: 'cp-002', channelPartnerName: 'Sunrise Properties',
    tokenAmount: 50000, soldDate: mkDate(subDays(today, 90)),
    totalPaid: 5800000, balanceDue: 0, finalAmount: 5800000,
  },
  {
    id: 'plot-025', plotNumber: 'P-025', projectId: 'proj-001', projectName: 'Green Valley Enclave',
    location: 'Sector 12, Hyderabad', area: 1200, dimensions: '30x40', facing: 'South',
    roadWidth: '30 ft', pricePerSqft: 2400, totalPrice: 2880000, status: 'available',
    row: 3, col: 5,
  },
  {
    id: 'plot-026', plotNumber: 'P-026', projectId: 'proj-001', projectName: 'Green Valley Enclave',
    location: 'Sector 12, Hyderabad', area: 1500, dimensions: '30x50', facing: 'West',
    roadWidth: '30 ft', pricePerSqft: 2450, totalPrice: 3675000, status: 'confirmed',
    row: 3, col: 6,
    bookingId: 'book-013', customerId: 'cust-003', customerName: 'Anil Sharma',
    channelPartnerId: 'cp-003', channelPartnerName: 'Prime Estates',
    tokenAmount: 35000, bookingDate: mkDate(subDays(today, 12)), confirmedDate: mkDate(subDays(today, 10)),
    paymentDeadline: mkDate(addDays(today, 80)), totalPaid: 1500000, balanceDue: 2175000,
  },
  {
    id: 'plot-027', plotNumber: 'P-027', projectId: 'proj-001', projectName: 'Green Valley Enclave',
    location: 'Sector 12, Hyderabad', area: 1200, dimensions: '30x40', facing: 'North',
    roadWidth: '30 ft', pricePerSqft: 2500, totalPrice: 3000000, status: 'available',
    row: 3, col: 7,
  },
  {
    id: 'plot-028', plotNumber: 'P-028', projectId: 'proj-001', projectName: 'Green Valley Enclave',
    location: 'Sector 12, Hyderabad', area: 1800, dimensions: '30x60', facing: 'East',
    roadWidth: '40 ft', pricePerSqft: 2750, totalPrice: 4950000, status: 'sold',
    row: 3, col: 8,
    bookingId: 'book-014', customerId: 'cust-004', customerName: 'Priya Nair',
    channelPartnerId: 'cp-001', channelPartnerName: 'Prasad Realtors',
    tokenAmount: 50000, soldDate: mkDate(subDays(today, 20)),
    totalPaid: 4950000, balanceDue: 0, finalAmount: 4950000,
  },
  {
    id: 'plot-029', plotNumber: 'P-029', projectId: 'proj-001', projectName: 'Green Valley Enclave',
    location: 'Sector 12, Hyderabad', area: 1200, dimensions: '30x40', facing: 'South',
    roadWidth: '30 ft', pricePerSqft: 2450, totalPrice: 2940000, status: 'available',
    row: 3, col: 9,
  },
  {
    id: 'plot-030', plotNumber: 'P-030', projectId: 'proj-001', projectName: 'Green Valley Enclave',
    location: 'Sector 12, Hyderabad', area: 1500, dimensions: '30x50', facing: 'North-West',
    roadWidth: '30 ft', pricePerSqft: 2550, totalPrice: 3825000, status: 'token_booked',
    row: 3, col: 10,
    bookingId: 'book-015', customerId: 'cust-005', customerName: 'Vikram Singh',
    channelPartnerId: 'cp-002', channelPartnerName: 'Sunrise Properties',
    tokenAmount: 20000, tokenDate: mkDate(subDays(today, 3)), tokenExpiry: mkDate(addDays(today, 4)),
    totalPaid: 20000, balanceDue: 3805000,
  },

  // ── ROW 4: plots 31-40 ──
  {
    id: 'plot-031', plotNumber: 'P-031', projectId: 'proj-001', projectName: 'Green Valley Enclave',
    location: 'Sector 12, Hyderabad', area: 1200, dimensions: '30x40', facing: 'North',
    roadWidth: '30 ft', pricePerSqft: 2500, totalPrice: 3000000, status: 'available',
    row: 4, col: 1,
  },
  {
    id: 'plot-032', plotNumber: 'P-032', projectId: 'proj-001', projectName: 'Green Valley Enclave',
    location: 'Sector 12, Hyderabad', area: 2000, dimensions: '40x50', facing: 'East',
    roadWidth: '40 ft', pricePerSqft: 2800, totalPrice: 5600000, status: 'available',
    row: 4, col: 2,
  },
  {
    id: 'plot-033', plotNumber: 'P-033', projectId: 'proj-001', projectName: 'Green Valley Enclave',
    location: 'Sector 12, Hyderabad', area: 1200, dimensions: '30x40', facing: 'South',
    roadWidth: '30 ft', pricePerSqft: 2400, totalPrice: 2880000, status: 'confirmed',
    row: 4, col: 3,
    bookingId: 'book-016', customerId: 'cust-006', customerName: 'Kavitha Reddy',
    channelPartnerId: 'cp-003', channelPartnerName: 'Prime Estates',
    tokenAmount: 30000, bookingDate: mkDate(subDays(today, 50)), confirmedDate: mkDate(subDays(today, 48)),
    paymentDeadline: mkDate(addDays(today, 40)), totalPaid: 1440000, balanceDue: 1440000,
  },
  {
    id: 'plot-034', plotNumber: 'P-034', projectId: 'proj-001', projectName: 'Green Valley Enclave',
    location: 'Sector 12, Hyderabad', area: 1500, dimensions: '30x50', facing: 'North-East',
    roadWidth: '30 ft', pricePerSqft: 2600, totalPrice: 3900000, status: 'available',
    row: 4, col: 4,
  },
  {
    id: 'plot-035', plotNumber: 'P-035', projectId: 'proj-001', projectName: 'Green Valley Enclave',
    location: 'Sector 12, Hyderabad', area: 1200, dimensions: '30x40', facing: 'West',
    roadWidth: '30 ft', pricePerSqft: 2450, totalPrice: 2940000, status: 'available',
    row: 4, col: 5,
  },
  {
    id: 'plot-036', plotNumber: 'P-036', projectId: 'proj-001', projectName: 'Green Valley Enclave',
    location: 'Sector 12, Hyderabad', area: 1800, dimensions: '30x60', facing: 'South-East',
    roadWidth: '40 ft', pricePerSqft: 2700, totalPrice: 4860000, status: 'sold',
    row: 4, col: 6,
    bookingId: 'book-017', customerId: 'cust-007', customerName: 'Suresh Babu',
    channelPartnerId: 'cp-001', channelPartnerName: 'Prasad Realtors',
    tokenAmount: 50000, soldDate: mkDate(subDays(today, 75)),
    totalPaid: 4860000, balanceDue: 0, finalAmount: 4860000,
  },
  {
    id: 'plot-037', plotNumber: 'P-037', projectId: 'proj-001', projectName: 'Green Valley Enclave',
    location: 'Sector 12, Hyderabad', area: 1200, dimensions: '30x40', facing: 'North',
    roadWidth: '30 ft', pricePerSqft: 2500, totalPrice: 3000000, status: 'available',
    row: 4, col: 7,
  },
  {
    id: 'plot-038', plotNumber: 'P-038', projectId: 'proj-001', projectName: 'Green Valley Enclave',
    location: 'Sector 12, Hyderabad', area: 1500, dimensions: '30x50', facing: 'East',
    roadWidth: '30 ft', pricePerSqft: 2700, totalPrice: 4050000, status: 'token_booked',
    row: 4, col: 8,
    bookingId: 'book-018', customerId: 'cust-008', customerName: 'Lakshmi Prasad',
    channelPartnerId: 'cp-002', channelPartnerName: 'Sunrise Properties',
    tokenAmount: 30000, tokenDate: mkDate(subDays(today, 4)), tokenExpiry: mkDate(addDays(today, 3)),
    totalPaid: 30000, balanceDue: 4020000,
  },
  {
    id: 'plot-039', plotNumber: 'P-039', projectId: 'proj-001', projectName: 'Green Valley Enclave',
    location: 'Sector 12, Hyderabad', area: 1200, dimensions: '30x40', facing: 'South-West',
    roadWidth: '30 ft', pricePerSqft: 2400, totalPrice: 2880000, status: 'available',
    row: 4, col: 9,
  },
  {
    id: 'plot-040', plotNumber: 'P-040', projectId: 'proj-001', projectName: 'Green Valley Enclave',
    location: 'Sector 12, Hyderabad', area: 2400, dimensions: '40x60', facing: 'North',
    roadWidth: '40 ft', pricePerSqft: 3000, totalPrice: 7200000, status: 'sold',
    row: 4, col: 10,
    bookingId: 'book-019', customerId: 'cust-009', customerName: 'John Doe',
    channelPartnerId: 'cp-003', channelPartnerName: 'Prime Estates',
    tokenAmount: 70000, soldDate: mkDate(subDays(today, 10)),
    totalPaid: 7200000, balanceDue: 0, finalAmount: 7200000,
  },
];

export const mockSurveyPlots: Plot[] = [
  {
    id: 'plot-s01', plotNumber: 'P-01', projectId: 'proj-001', projectName: 'Greens Ventures',
    location: 'Main Layout, Hyderabad', area: 1755, dimensions: "54'-5\" x 32'-4\"", facing: 'North',
    roadWidth: '13 ft', pricePerSqft: 2500, totalPrice: 1755 * 2500, status: 'confirmed',
    row: 1, col: 1, tokenRequired: 100000, customerName: 'Ramesh Reddy'
  },
  {
    id: 'plot-s02', plotNumber: 'P-02', projectId: 'proj-001', projectName: 'Greens Ventures',
    location: 'Main Layout, Hyderabad', area: 1285, dimensions: "27'-5\" x 52'-10\"", facing: 'North',
    roadWidth: '13 ft', pricePerSqft: 2500, totalPrice: 3212500, status: 'available',
    row: 1, col: 2, tokenRequired: 100000
  },
  {
    id: 'plot-s03', plotNumber: 'P-03', projectId: 'proj-001', projectName: 'Greens Ventures',
    location: 'Main Layout, Hyderabad', area: 1256, dimensions: "29'-7\" x 42'-3\"", facing: 'North',
    roadWidth: '13 ft', pricePerSqft: 2500, totalPrice: 1256 * 2500, status: 'confirmed',
    row: 1, col: 3, tokenRequired: 100000, customerName: 'Sanjay Gupta'
  },
  {
    id: 'plot-s04', plotNumber: 'P-04', projectId: 'proj-001', projectName: 'Greens Ventures',
    location: 'Main Layout, Hyderabad', area: 1369, dimensions: "30'-1\" x 28'-5\"", facing: 'North',
    roadWidth: '13 ft', pricePerSqft: 2500, totalPrice: 1369 * 2500, status: 'available',
    row: 1, col: 4, tokenRequired: 100000
  },
  {
    id: 'plot-s05', plotNumber: 'P-05', projectId: 'proj-001', projectName: 'Greens Ventures',
    location: 'Main Layout, Hyderabad', area: 1416, dimensions: "28'-3\" x 28'-2\"", facing: 'North',
    roadWidth: '13 ft', pricePerSqft: 2500, totalPrice: 1416 * 2500, status: 'available',
    row: 1, col: 5, tokenRequired: 100000
  },
  {
    id: 'plot-s06', plotNumber: 'P-06', projectId: 'proj-001', projectName: 'Greens Ventures',
    location: 'Main Layout, Hyderabad', area: 1711, dimensions: "29'-1\" x 32'-7\"", facing: 'North',
    roadWidth: '13 ft', pricePerSqft: 2500, totalPrice: 1711 * 2500, status: 'confirmed',
    row: 2, col: 1, tokenRequired: 100000, customerName: 'Kiran Rao'
  },
  {
    id: 'plot-s07', plotNumber: 'P-07', projectId: 'proj-001', projectName: 'Greens Ventures',
    location: 'Main Layout, Hyderabad', area: 1372, dimensions: "37'-8\" x 21'-8\"", facing: 'East',
    roadWidth: '13 ft', pricePerSqft: 2500, totalPrice: 1372 * 2500, status: 'confirmed',
    row: 2, col: 2, tokenRequired: 100000, customerName: 'Deepak V.'
  },
  {
    id: 'plot-s08', plotNumber: 'P-08', projectId: 'proj-001', projectName: 'Greens Ventures',
    location: 'Main Layout, Hyderabad', area: 1370, dimensions: "34'-2\" x 28'-8\"", facing: 'East',
    roadWidth: '13 ft', pricePerSqft: 2500, totalPrice: 1370 * 2500, status: 'confirmed',
    row: 2, col: 3, tokenRequired: 100000, customerName: 'Pooja K.'
  },
  {
    id: 'plot-s09', plotNumber: 'P-09', projectId: 'proj-001', projectName: 'Greens Ventures',
    location: 'Main Layout, Hyderabad', area: 1509, dimensions: "37'-3\" x 33'-8\"", facing: 'East',
    roadWidth: '13 ft', pricePerSqft: 2500, totalPrice: 1509 * 2500, status: 'confirmed',
    row: 2, col: 4, tokenRequired: 100000, customerName: 'Vikram S.'
  },
  {
    id: 'plot-s10', plotNumber: 'P-10', projectId: 'proj-001', projectName: 'Greens Ventures',
    location: 'Main Layout, Hyderabad', area: 1506, dimensions: "39'-1\" x 38'-5\"", facing: 'East',
    roadWidth: '13 ft', pricePerSqft: 2500, totalPrice: 1506 * 2500, status: 'confirmed',
    row: 2, col: 5, tokenRequired: 100000, customerName: 'Manish P.'
  },
  {
    id: 'plot-s11', plotNumber: 'P-11', projectId: 'proj-001', projectName: 'Greens Ventures',
    location: 'Main Layout, Hyderabad', area: 1587, dimensions: "36'-6\" x 43'-1\"", facing: 'South',
    roadWidth: '13 ft', pricePerSqft: 2500, totalPrice: 1587 * 2500, status: 'confirmed',
    row: 3, col: 1, tokenRequired: 100000, customerName: 'Ashok N.'
  },
  {
    id: 'plot-s12', plotNumber: 'P-12', projectId: 'proj-001', projectName: 'Greens Ventures',
    location: 'Main Layout, Hyderabad', area: 1369, dimensions: "40'-1\" x 38'-8\"", facing: 'South',
    roadWidth: '13 ft', pricePerSqft: 2500, totalPrice: 1369 * 2500, status: 'confirmed',
    row: 3, col: 2, tokenRequired: 100000, customerName: 'Vijay K.'
  },
  {
    id: 'plot-s13', plotNumber: 'P-13', projectId: 'proj-001', projectName: 'Greens Ventures',
    location: 'Main Layout, Hyderabad', area: 1374, dimensions: "27'-9\" x 40'-3\"", facing: 'South',
    roadWidth: '13 ft', pricePerSqft: 2500, totalPrice: 1374 * 2500, status: 'available',
    row: 3, col: 3, tokenRequired: 100000
  },
  {
    id: 'plot-s14', plotNumber: 'P-14', projectId: 'proj-001', projectName: 'Greens Ventures',
    location: 'Main Layout, Hyderabad', area: 1693, dimensions: "49'-11\" x 33'-10\"", facing: 'West',
    roadWidth: '13 ft', pricePerSqft: 2500, totalPrice: 1693 * 2500, status: 'confirmed',
    row: 3, col: 4, tokenRequired: 100000, customerName: 'Sunita M.'
  },
  {
    id: 'plot-s15', plotNumber: 'P-15', projectId: 'proj-001', projectName: 'Greens Ventures',
    location: 'Main Layout, Hyderabad', area: 1627, dimensions: "51'-2\" x 49'-3\"", facing: 'West',
    roadWidth: '13 ft', pricePerSqft: 2500, totalPrice: 1627 * 2500, status: 'confirmed',
    row: 3, col: 5, tokenRequired: 100000, customerName: 'Harish R.'
  },
  {
    id: 'plot-s16', plotNumber: 'P-16', projectId: 'proj-001', projectName: 'Greens Ventures',
    location: 'Main Layout, Hyderabad', area: 1692, dimensions: "48'-3\" x 34'-10\"", facing: 'West',
    roadWidth: '13 ft', pricePerSqft: 2500, totalPrice: 1692 * 2500, status: 'confirmed',
    row: 4, col: 1, tokenRequired: 100000, customerName: 'Ravi Teja'
  },
];

export function getPlotStatusCounts(plots: Plot[]) {
  return {
    total: plots.length,
    available: plots.filter(p => p.status === 'available').length,
    token_booked: plots.filter(p => p.status === 'token_booked').length,
    confirmed: plots.filter(p => p.status === 'confirmed').length,
    sold: plots.filter(p => p.status === 'sold').length,
  };
}
