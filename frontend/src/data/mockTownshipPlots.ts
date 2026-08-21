import { Plot, PlotFacing, PlotStatus } from '../types';
import { addDays, subDays, format } from 'date-fns';

const today = new Date();
function mkDate(d: Date) {
  return format(d, 'yyyy-MM-dd');
}

// Authentic CAD dimension mapping matching the client's original survey blueprint
export const cadSurveyDimensions: Record<number, { dimensions: string; area: number; facing: PlotFacing; roadWidth: string }> = {
  // Top Northern Boundary Plots (1 to 15)
  1: { dimensions: "119'-7\" x 186'-10\" x 180'-3\" x 119'-5\"", area: 2200, facing: 'South', roadWidth: "16' wide road" },
  2: { dimensions: "59'-6\" x 180'-3\" x 143'-9\" x 49'-3\"", area: 2050, facing: 'South', roadWidth: "16' wide road" },
  3: { dimensions: "125'-2\" x 173'-9\" x 94'-8\"", area: 1950, facing: 'South', roadWidth: "16' wide road" },
  4: { dimensions: "80' x 111'-5\"", area: 1750, facing: 'South', roadWidth: "16' wide road" },
  5: { dimensions: "80' x 111'-6\" x 63'-11\"", area: 1750, facing: 'South', roadWidth: "16' wide road" },
  6: { dimensions: "80' x 119'-7\" x 73'-3\"", area: 1800, facing: 'South', roadWidth: "16' wide road" },
  7: { dimensions: "80' x 131'-2\" x 79'-6\"", area: 1850, facing: 'South', roadWidth: "16' wide road" },
  8: { dimensions: "80' x 156'-5\"", area: 1900, facing: 'South', roadWidth: "16' wide road" },
  9: { dimensions: "80' x 156'-5\" x 45'-4\"", area: 1920, facing: 'South', roadWidth: "16' wide road" },
  10: { dimensions: "80' x 138'-1\" x 41'-9\"", area: 1880, facing: 'South', roadWidth: "16' wide road" },
  11: { dimensions: "80' x 105'-9\" x 85'-1\"", area: 1820, facing: 'South', roadWidth: "16' wide road" },
  12: { dimensions: "160' x 100'-2\" x 76'-9\"", area: 1900, facing: 'South', roadWidth: "16' wide road" },
  13: { dimensions: "160' x 110'-3\" x 22'-7\"", area: 1860, facing: 'South', roadWidth: "16' wide road" },
  14: { dimensions: "160' x 91'-10\" x 28'-11\"", area: 1840, facing: 'South', roadWidth: "16' wide road" },
  15: { dimensions: "180' x 86'-7\" x 51'-8\"", area: 1890, facing: 'South', roadWidth: "16' wide road" },

  // Splayed River Boundary Plots (132 & 133)
  132: { dimensions: "129'-7\" x 157'-7\" (River) x 89'-8\"", area: 1720, facing: 'South', roadWidth: "20' wide road" },
  133: { dimensions: "116'-1\" x 70'-8\" (River) x 31'-6\"", area: 1650, facing: 'South', roadWidth: "20' wide road" },

  // Southern Riverfront (153 to 169) - Following SURAMRIVER contour
  153: { dimensions: "100' x 186'-11\" x 68'-1\"", area: 1780, facing: 'North', roadWidth: "20' wide road" },
  154: { dimensions: "80' x 76'-3\"", area: 1520, facing: 'North', roadWidth: "20' wide road" },
  155: { dimensions: "80' x 91'-11\" x 80'-3\"", area: 1560, facing: 'North', roadWidth: "20' wide road" },
  156: { dimensions: "80' x 113'-11\" x 83'", area: 1600, facing: 'North', roadWidth: "20' wide road" },
  157: { dimensions: "80' x 135'-7\" x 82'-11\"", area: 1680, facing: 'North', roadWidth: "20' wide road" },
  158: { dimensions: "80' x 157'-4\" x 82'-11\"", area: 1740, facing: 'North', roadWidth: "20' wide road" },
  159: { dimensions: "80' x 34'-8\" x 83'-4\"", area: 1620, facing: 'North', roadWidth: "20' wide road" },
  160: { dimensions: "80' x 44'-3\" x 97'", area: 1580, facing: 'North', roadWidth: "20' wide road" },
  161: { dimensions: "80' x 80'-6\"", area: 1540, facing: 'North', roadWidth: "20' wide road" },
  162: { dimensions: "80' x 80'-6\"", area: 1540, facing: 'North', roadWidth: "20' wide road" },
  163: { dimensions: "80' x 74'-3\" x 63'-7\"", area: 1500, facing: 'North', roadWidth: "20' wide road" },
  164: { dimensions: "80' x 61'-9\" x 45'-10\"", area: 1480, facing: 'North', roadWidth: "20' wide road" },
  165: { dimensions: "160' x 87'-2\" x 45'-10\"", area: 1820, facing: 'North', roadWidth: "20' wide road" },
  166: { dimensions: "160' x 160'-1\"", area: 1950, facing: 'North', roadWidth: "20' wide road" },
  167: { dimensions: "80' x 80'-1\" x 54'-7\"", area: 1520, facing: 'North', roadWidth: "20' wide road" },
  168: { dimensions: "80' x 80'-1\" x 57'-6\"", area: 1520, facing: 'North', roadWidth: "20' wide road" },
  169: { dimensions: "162'-6\" x 118'-9\" x 53'-11\"", area: 1880, facing: 'North', roadWidth: "20' wide road" },

  // West Wing Tail (170 to 173)
  170: { dimensions: "91'-4\" x 80'-7\"", area: 1620, facing: 'East', roadWidth: "20' wide road" },
  171: { dimensions: "89'-1\" x 89'-3\"", area: 1600, facing: 'East', roadWidth: "20' wide road" },
  172: { dimensions: "120' x 120'-2\"", area: 1750, facing: 'East', roadWidth: "20' wide road" },
  173: { dimensions: "120' x 108'-11\"", area: 1720, facing: 'East', roadWidth: "20' wide road" },

  // West Wing Vertical Stack (174 to 182)
  174: { dimensions: "106'-9\" x 85'", area: 1560, facing: 'East', roadWidth: "16' wide road" },
  175: { dimensions: "108'-1\" x 80'", area: 1540, facing: 'East', roadWidth: "16' wide road" },
  176: { dimensions: "109'-4\" x 80'", area: 1550, facing: 'East', roadWidth: "16' wide road" },
  177: { dimensions: "110'-8\" x 80'", area: 1570, facing: 'East', roadWidth: "16' wide road" },
  178: { dimensions: "111'-11\" x 80'", area: 1590, facing: 'East', roadWidth: "16' wide road" },
  179: { dimensions: "113'-1\" x 80'", area: 1610, facing: 'East', roadWidth: "16' wide road" },
  180: { dimensions: "114' x 76'-9\"", area: 1620, facing: 'East', roadWidth: "16' wide road" },
  181: { dimensions: "114'-10\" x 166'-6\"", area: 1840, facing: 'East', roadWidth: "16' wide road" },
  182: { dimensions: "166'-6\" x 97'-5\"", area: 2100, facing: 'East', roadWidth: "16' wide road" },

  // East Wing (183 & 184)
  183: { dimensions: "168'-9\" x 82'-3\" x 120'-9\" x 54'-4\"", area: 2350, facing: 'West', roadWidth: "30' wide road" },
  184: { dimensions: "73'-5\" x 68' (Village Road) x 32'-1\" x 17'-9\"", area: 1850, facing: 'West', roadWidth: "Village Road" },
};

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

    // Lookup custom survey specs if present, otherwise default to standard CAD 30x50 block
    const customSpec = cadSurveyDimensions[i];
    const area = customSpec?.area || (i % 3 === 0 ? 1800 : 1500);
    const dimensions = customSpec?.dimensions || '30x50';
    const facing: PlotFacing = customSpec?.facing || (i <= 40 ? 'North' : i <= 87 ? 'South' : i <= 132 ? 'North' : 'South');
    const roadWidth = customSpec?.roadWidth || '20 ft';

    const pricePerSqft = 2500;
    const totalPrice = area * pricePerSqft;
    const custName = customerNames[(i * 7) % customerNames.length];

    const plot: Plot = {
      id: `plot-t${String(i).padStart(3, '0')}`,
      plotNumber,
      projectId: 'proj-001',
      projectName: 'SCP Farm Layout (184 Plots)',
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
