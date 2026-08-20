import { Plot, PlotFacing, PlotStatus } from '../types';
import { addDays, subDays, format } from 'date-fns';

const today = new Date();
function mkDate(d: Date) {
  return format(d, 'yyyy-MM-dd');
}

// Generate the 184 plots dataset matching the client's master plan blueprint
export function generateTownshipPlots(): Plot[] {
  const plots: Plot[] = [];

  const bookedPlots = new Set([
    1, 4, 6, 8, 12, 16, 19, 23, 27, 30, 35, 41, 44, 50, 55, 60, 64, 68, 72, 77, 82, 86,
    91, 95, 100, 105, 111, 116, 120, 125, 130, 135, 142, 147, 150, 155, 160, 172, 178, 183
  ]);

  const tokenBookedPlots = new Set([
    2, 7, 18, 25, 33, 48, 58, 69, 80, 93, 108, 119, 128, 138, 149, 164, 175
  ]);

  const soldPlots = new Set([
    3, 9, 21, 38, 52, 62, 75, 87, 99, 110, 122, 132, 140, 152, 169, 181
  ]);

  const customerNames = [
    'Ramesh Reddy', 'Sita Devi', 'Anil Sharma', 'Vikram Singh', 'Pooja Kulkarni',
    'Deepak Verma', 'Manish Patel', 'Kiran Rao', 'Ashok Nandamuri', 'Vijay Kumar',
    'Sunita Menon', 'Harish Rawat', 'Lakshmi Prasad', 'Rajesh Kumar', 'John Doe',
  ];

  for (let i = 1; i <= 184; i++) {
    const plotNumber = `P-${String(i).padStart(3, '0')}`;
    let status: PlotStatus = 'available';

    if (soldPlots.has(i)) {
      status = 'sold';
    } else if (bookedPlots.has(i)) {
      status = 'confirmed';
    } else if (tokenBookedPlots.has(i)) {
      status = 'token_booked';
    }

    // Specific dimensions & areas based on blueprint sectors
    let area = 1500;
    let dimensions = '30x50';
    let facing: PlotFacing = 'North';
    let roadWidth = '20 ft';

    if (i <= 15) {
      // Northern River/Irregular plots
      area = 1800 + (i % 5) * 120;
      dimensions = `${30 + (i % 6) * 5}x${50 + (i % 4) * 5}`;
      facing = 'South';
      roadWidth = '16 ft';
    } else if (i >= 16 && i <= 63) {
      // Upper block
      area = i % 3 === 0 ? 1800 : 1500;
      dimensions = i % 3 === 0 ? '30x60' : '30x50';
      facing = i <= 27 || (i >= 28 && i <= 40) ? 'North' : 'South';
      roadWidth = i <= 40 ? '16 ft' : '20 ft';
    } else if (i >= 64 && i <= 110) {
      // Middle block
      area = 1500;
      dimensions = '30x50';
      facing = i <= 87 ? 'North' : 'South';
      roadWidth = '20 ft';
    } else if (i >= 111 && i <= 152) {
      // Lower block
      area = i % 4 === 0 ? 2000 : 1500;
      dimensions = i % 4 === 0 ? '40x50' : '30x50';
      facing = i <= 132 ? 'North' : 'South';
      roadWidth = '20 ft';
    } else if (i >= 153 && i <= 169) {
      // Southern River boundary
      area = 1400 + (i % 4) * 150;
      dimensions = '30x48 (Irregular)';
      facing = 'North';
      roadWidth = '20 ft';
    } else if (i >= 170 && i <= 182) {
      // West Wing
      area = 1600;
      dimensions = '32x50';
      facing = 'East';
      roadWidth = '20 ft';
    } else {
      // 183, 184 Entry plots
      area = 2400;
      dimensions = '40x60';
      facing = 'West';
      roadWidth = '30 ft';
    }

    const pricePerSqft = 2500;
    const totalPrice = area * pricePerSqft;
    const custName = customerNames[(i * 7) % customerNames.length];

    const plot: Plot = {
      id: `plot-t${String(i).padStart(3, '0')}`,
      plotNumber,
      projectId: 'proj-001',
      projectName: 'Green Valley Township (184 Plots)',
      location: 'Main Highway Layout, Hyderabad',
      area,
      dimensions,
      facing,
      roadWidth,
      pricePerSqft,
      totalPrice,
      status,
      row: Math.floor((i - 1) / 12) + 1,
      col: ((i - 1) % 12) + 1,
      tokenRequired: 100000,
    };

    // Pre-populate realistic booking information if plot is booked
    if (status === 'token_booked') {
      plot.bookingId = `book-t${i}`;
      plot.customerId = `cust-${(i % 10) + 1}`;
      plot.customerName = custName;
      plot.channelPartnerName = i % 2 === 0 ? 'Prasad Realtors' : 'Sunrise Properties';
      plot.tokenAmount = 100000;
      plot.tokenDate = mkDate(subDays(today, 2));
      plot.tokenExpiry = mkDate(addDays(today, 5));
      plot.totalPaid = 100000;
      plot.balanceDue = totalPrice - 100000;
    } else if (status === 'confirmed') {
      plot.bookingId = `book-t${i}`;
      plot.customerId = `cust-${(i % 10) + 1}`;
      plot.customerName = custName;
      plot.channelPartnerName = i % 3 === 0 ? 'Prime Estates' : 'Prasad Realtors';
      plot.tokenAmount = 100000;
      plot.tokenDate = mkDate(subDays(today, 15));
      plot.confirmedDate = mkDate(subDays(today, 12));
      plot.paymentDeadline = mkDate(addDays(today, 78));
      plot.totalPaid = Math.round(totalPrice * 0.3);
      plot.balanceDue = totalPrice - (plot.totalPaid || 0);
    } else if (status === 'sold') {
      plot.bookingId = `book-t${i}`;
      plot.customerId = `cust-${(i % 10) + 1}`;
      plot.customerName = custName;
      plot.soldDate = mkDate(subDays(today, 40));
      plot.totalPaid = totalPrice;
      plot.balanceDue = 0;
      plot.finalAmount = totalPrice;
    }

    plots.push(plot);
  }

  return plots;
}

export const mockTownshipPlots: Plot[] = generateTownshipPlots();
