import { Plot, PlotFacing, PlotStatus } from '../types';

export interface ParsedCsvPlot {
  plotNumber: string;
  area: number;
  pricePerSqft: number;
  totalPrice: number;
  status: PlotStatus;
  dimensions?: string;
  facing?: PlotFacing;
}

const defaultDimensionsMap: Record<string, string> = {
  'P-01': "54'-5\" x 32'-4\"",
  'P-02': "27'-5\" x 52'-10\"",
  'P-03': "29'-7\" x 42'-3\"",
  'P-04': "30'-1\" x 28'-5\"",
  'P-05': "28'-3\" x 28'-2\"",
  'P-06': "29'-1\" x 32'-7\"",
  'P-07': "37'-8\" x 21'-8\"",
  'P-08': "34'-2\" x 28'-8\"",
  'P-09': "37'-3\" x 33'-8\"",
  'P-10': "39'-1\" x 38'-5\"",
  'P-11': "36'-6\" x 43'-1\"",
  'P-12': "40'-1\" x 38'-8\"",
  'P-13': "27'-9\" x 40'-3\"",
  'P-14': "49'-11\" x 33'-10\"",
  'P-15': "51'-2\" x 49'-3\"",
  'P-16': "48'-3\" x 34'-10\"",
};

export function parsePlotCsv(csvContent: string, projectName = 'Greens Ventures'): Plot[] {
  const lines = csvContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length <= 1) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/[\s_]+/g, ''));

  const plotNumIdx = headers.findIndex((h) => h.includes('plot'));
  const sizeIdx = headers.findIndex((h) => h.includes('size') || h.includes('area') || h.includes('sqft'));
  const priceIdx = headers.findIndex((h) => h.includes('price') || h.includes('rate') || h.includes('persqft'));
  const statusIdx = headers.findIndex((h) => h.includes('status'));
  const dimIdx = headers.findIndex((h) => h.includes('dimension') || h.includes('dim'));
  const facingIdx = headers.findIndex((h) => h.includes('facing'));

  const plots: Plot[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map((cell) => cell.trim().replace(/^["']|["']$/g, ''));
    if (row.length < 2) continue;

    const rawPlotNum = (plotNumIdx !== -1 ? row[plotNumIdx] : row[0]) || `P-${String(i).padStart(2, '0')}`;
    const plotNumber = rawPlotNum.toUpperCase().startsWith('P-') ? rawPlotNum.toUpperCase() : `P-${rawPlotNum}`;

    const area = parseFloat(sizeIdx !== -1 ? row[sizeIdx] : row[1]) || 1200;
    const pricePerSqft = parseFloat(priceIdx !== -1 ? row[priceIdx] : row[2]) || 2500;
    const rawStatus = (statusIdx !== -1 ? row[statusIdx] : row[3] || 'Available').toLowerCase();

    let status: PlotStatus = 'available';
    if (rawStatus.includes('sold')) {
      status = 'sold';
    } else if (rawStatus.includes('token')) {
      status = 'token_booked';
    } else if (rawStatus.includes('book') || rawStatus.includes('confirm')) {
      status = 'confirmed';
    } else {
      status = 'available';
    }

    const dimensions =
      (dimIdx !== -1 ? row[dimIdx] : undefined) ||
      defaultDimensionsMap[plotNumber] ||
      `${Math.round(Math.sqrt(area))}x${Math.round(Math.sqrt(area))}`;

    const facing: PlotFacing =
      (facingIdx !== -1 ? (row[facingIdx] as PlotFacing) : undefined) ||
      (i <= 5 ? 'North' : i <= 10 ? 'East' : i <= 13 ? 'South' : 'West');

    const rowIdx = Math.floor((i - 1) / 5) + 1;
    const colIdx = ((i - 1) % 5) + 1;

    plots.push({
      id: `plot-${plotNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      plotNumber,
      projectId: 'proj-001',
      projectName,
      location: 'Main Layout, Hyderabad',
      area,
      dimensions,
      facing,
      roadWidth: '13 ft',
      pricePerSqft,
      totalPrice: area * pricePerSqft,
      status,
      row: rowIdx,
      col: colIdx,
      tokenRequired: 100000,
    });
  }

  return plots;
}
