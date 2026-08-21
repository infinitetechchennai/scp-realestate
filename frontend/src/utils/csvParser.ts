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

export function parsePlotCsv(csvContent: string, projectName = 'SCP Farm Layout (184 Plots)'): Plot[] {
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

    const rawPlotNum = (plotNumIdx !== -1 ? row[plotNumIdx] : row[0]) || `P-${String(i).padStart(3, '0')}`;
    const plotNumber = rawPlotNum.toUpperCase().startsWith('P-') ? rawPlotNum.toUpperCase() : `P-${rawPlotNum}`;
    const numericId = parseInt(plotNumber.replace(/\D/g, ''), 10) || i;

    const area = parseFloat(sizeIdx !== -1 ? row[sizeIdx] : row[1]) || 1500;
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
      (dimIdx !== -1 && row[dimIdx] ? row[dimIdx] : undefined) ||
      `${Math.round(Math.sqrt(area))}x${Math.round(Math.sqrt(area))}`;

    const facing: PlotFacing =
      (facingIdx !== -1 && row[facingIdx] ? (row[facingIdx] as PlotFacing) : undefined) ||
      (i <= 15 ? 'South' : i <= 63 ? 'North' : 'South');

    const roadWidth = '20 ft';

    const rowIdx = Math.floor((numericId - 1) / 10) + 1;
    const colIdx = ((numericId - 1) % 10) + 1;

    plots.push({
      id: `plot-t${numericId}`,
      plotNumber,
      projectId: 'proj-001',
      projectName,
      location: 'Main Highway Layout, Hyderabad',
      area,
      dimensions,
      facing,
      roadWidth,
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
