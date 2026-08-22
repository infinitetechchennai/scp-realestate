import { Plot, PlotFacing, PlotStatus } from "../types";

export interface ParsedCsvPlot {
  plotNumber: string;
  area: number;
  pricePerSqft: number;
  totalPrice: number;
  status: PlotStatus;
  location?: string;
  dimensions?: string;
  facing?: PlotFacing;
  tokenRequired?: number;
  roadWidth?: string;
}

// RFC 4180 compliant CSV line tokenizer
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += char;
    }
  }
  result.push(cur.trim());
  return result;
}

export function parsePlotCsv(
  csvContent: string,
  projectName = "Master Township",
  defaultLocation = "Hyderabad, Telangana"
): Plot[] {
  const rawLines = csvContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (rawLines.length <= 1) return [];

  const headers = parseCsvLine(rawLines[0]).map((h) => h.toLowerCase().replace(/[\s_]+/g, ""));

  const plotNumIdx = headers.findIndex((h) => h.includes("plot"));
  const sizeIdx = headers.findIndex((h) => h.includes("size") || h.includes("area") || h.includes("sqft"));
  const dimIdx = headers.findIndex((h) => h.includes("dimension") || h.includes("dim"));
  const facingIdx = headers.findIndex((h) => h.includes("facing"));
  const roadIdx = headers.findIndex((h) => h.includes("road"));
  const priceIdx = headers.findIndex((h) => h.includes("price") || h.includes("rate") || h.includes("persqft"));
  const totalIdx = headers.findIndex((h) => h.includes("total"));
  const tokenIdx = headers.findIndex((h) => h.includes("token") || h.includes("minamount") || h.includes("min"));
  const statusIdx = headers.findIndex((h) => h.includes("status"));
  const locIdx = headers.findIndex((h) => h.includes("loc") || h.includes("addr") || h.includes("city"));

  const plots: Plot[] = [];

  for (let i = 1; i < rawLines.length; i++) {
    const row = parseCsvLine(rawLines[i]);
    if (row.length < 2) continue;

    const rawPlotNum = (plotNumIdx !== -1 && row[plotNumIdx] ? row[plotNumIdx] : row[0]) || ("P-" + String(i).padStart(3, "0"));
    const plotNumber = rawPlotNum.toUpperCase().startsWith("P-") ? rawPlotNum.toUpperCase() : ("P-" + rawPlotNum);
    const numericId = parseInt(plotNumber.replace(/\D/g, ""), 10) || i;

    const area = parseFloat(sizeIdx !== -1 && row[sizeIdx] ? row[sizeIdx] : "") || 1500;
    const pricePerSqft = parseFloat(priceIdx !== -1 && row[priceIdx] ? row[priceIdx] : "") || 2500;
    const totalPrice = parseFloat(totalIdx !== -1 && row[totalIdx] ? row[totalIdx] : "") || (area * pricePerSqft);
    const tokenRequired = parseFloat(tokenIdx !== -1 && row[tokenIdx] ? row[tokenIdx] : "") || 10000;
    const rawStatus = (statusIdx !== -1 && row[statusIdx] ? row[statusIdx] : "Available").toLowerCase();
    const plotLocation = (locIdx !== -1 && row[locIdx] ? row[locIdx] : defaultLocation) || defaultLocation;

    let status: PlotStatus = "available";
    if (rawStatus.includes("sold")) {
      status = "sold";
    } else if (rawStatus.includes("token")) {
      status = "token_booked";
    } else if (rawStatus.includes("partial")) {
      status = "partial_booked";
    } else if (rawStatus.includes("book") || rawStatus.includes("confirm")) {
      status = "confirmed";
    } else {
      status = "available";
    }

    const dimensions =
      (dimIdx !== -1 && row[dimIdx] ? row[dimIdx] : undefined) ||
      (Math.round(Math.sqrt(area)) + "x" + Math.round(Math.sqrt(area)));

    const facing: PlotFacing =
      (facingIdx !== -1 && row[facingIdx] ? (row[facingIdx] as PlotFacing) : undefined) ||
      (i <= 15 ? "South" : i <= 63 ? "North" : "South");

    const roadWidth = (roadIdx !== -1 && row[roadIdx] ? row[roadIdx] : undefined) || "20 ft";

    const rowIdx = Math.floor((numericId - 1) / 10) + 1;
    const colIdx = ((numericId - 1) % 10) + 1;

    plots.push({
      id: "plot-t" + numericId,
      plotNumber,
      projectId: "proj-001",
      projectName,
      location: plotLocation,
      area,
      dimensions,
      facing,
      roadWidth,
      pricePerSqft,
      totalPrice,
      status,
      row: rowIdx,
      col: colIdx,
      tokenRequired,
    });
  }

  return plots;
}
