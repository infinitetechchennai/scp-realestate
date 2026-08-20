import React, { useState, useRef } from 'react';
import { Plot } from '../../types';
import { formatCurrencyFull, formatCurrency, cn } from '../../utils/helpers';
import { ZoomIn, ZoomOut, RotateCcw, Search, Compass, Layers, CheckCircle2 } from 'lucide-react';

interface TownshipInteractiveBlueprintProps {
  plots: Plot[];
  selectedPlotNumber?: string;
  onSelectPlot?: (plot: Plot) => void;
}

export const TownshipInteractiveBlueprint: React.FC<TownshipInteractiveBlueprintProps> = ({
  plots,
  selectedPlotNumber,
  onSelectPlot,
}) => {
  const [zoom, setZoom] = useState(1);
  const [search, setSearch] = useState('');
  const [hoveredPlot, setHoveredPlot] = useState<{ plot: Plot; x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getPlotByNum = (num: number): Plot => {
    const padded = `P-${String(num).padStart(3, '0')}`;
    const altPadded = `P-${String(num).padStart(2, '0')}`;
    const direct = `P-${num}`;
    return (
      plots.find((p) => p.plotNumber === padded || p.plotNumber === altPadded || p.plotNumber === direct) || {
        id: `plot-${num}`,
        plotNumber: `P-${String(num).padStart(3, '0')}`,
        projectId: 'proj-001',
        projectName: 'Green Valley Township',
        location: 'Main Layout',
        area: 1500,
        dimensions: '30x50',
        facing: 'North',
        roadWidth: '20 ft',
        pricePerSqft: 2500,
        totalPrice: 1500 * 2500,
        status: 'available',
        row: 1,
        col: 1,
      }
    );
  };

  const handlePlotClick = (num: number) => {
    const plot = getPlotByNum(num);
    onSelectPlot?.(plot);
  };

  const handleMouseEnter = (e: React.MouseEvent, num: number) => {
    const plot = getPlotByNum(num);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setHoveredPlot({
        plot,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const isSelected = (num: number) => {
    if (!selectedPlotNumber) return false;
    const padded = `P-${String(num).padStart(3, '0')}`;
    const altPadded = `P-${String(num).padStart(2, '0')}`;
    const direct = `P-${num}`;
    return (
      selectedPlotNumber === padded ||
      selectedPlotNumber === altPadded ||
      selectedPlotNumber === direct ||
      selectedPlotNumber.endsWith(String(num))
    );
  };

  const getStatusColor = (status: string, active: boolean) => {
    if (active) return { fill: 'rgba(2, 132, 199, 0.45)', stroke: '#0284c7', strokeWidth: 2.5 };
    switch (status) {
      case 'available':
        return { fill: 'rgba(16, 185, 129, 0.18)', stroke: '#059669', strokeWidth: 1.2 };
      case 'token_booked':
        return { fill: 'rgba(245, 158, 11, 0.28)', stroke: '#d97706', strokeWidth: 1.2 };
      case 'confirmed':
        return { fill: 'rgba(244, 63, 94, 0.22)', stroke: '#e11d48', strokeWidth: 1.2 };
      case 'sold':
        return { fill: 'rgba(148, 163, 184, 0.3)', stroke: '#64748b', strokeWidth: 1.2 };
      default:
        return { fill: 'rgba(241, 245, 249, 0.5)', stroke: '#94a3b8', strokeWidth: 1 };
    }
  };

  // Render a standard rectangular plot cell
  const renderPlotCell = (num: number, x: number, y: number, w = 34, h = 44, label?: string) => {
    const plot = getPlotByNum(num);
    const active = isSelected(num);
    const colors = getStatusColor(plot.status, active);
    const isFiltered = search && !String(num).includes(search.replace('P-', '').replace('p-', ''));

    return (
      <g
        key={num}
        className={cn('cursor-pointer transition-all duration-150', isFiltered ? 'opacity-20' : 'opacity-100')}
        onClick={() => handlePlotClick(num)}
        onMouseEnter={(e) => handleMouseEnter(e, num)}
        onMouseLeave={() => setHoveredPlot(null)}
      >
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          fill={colors.fill}
          stroke={colors.stroke}
          strokeWidth={colors.strokeWidth}
          rx={2}
        />
        <text
          x={x + w / 2}
          y={y + h / 2 + 3.5}
          fontSize="10"
          fontWeight={active ? '900' : '700'}
          fill={active ? '#0369a1' : '#1e293b'}
          textAnchor="middle"
          pointerEvents="none"
        >
          {label || num}
        </text>
      </g>
    );
  };

  return (
    <div className="relative bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" ref={containerRef}>
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs shadow-2xs focus-within:border-amber-400">
            <Search size={14} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search plot (e.g. 63, 110)..."
              className="outline-none text-xs text-slate-700 bg-transparent w-36"
            />
          </div>
          <span className="text-[11px] font-bold text-slate-400">184 Interactive Plots</span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 font-bold text-emerald-800">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/70 border border-emerald-600" />
            Available ({plots.filter((p) => p.status === 'available').length})
          </span>
          <span className="flex items-center gap-1 font-bold text-amber-800">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/70 border border-amber-600" />
            Token ({plots.filter((p) => p.status === 'token_booked').length})
          </span>
          <span className="flex items-center gap-1 font-bold text-rose-800">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500/70 border border-rose-600" />
            Confirmed ({plots.filter((p) => p.status === 'confirmed').length})
          </span>
          <span className="flex items-center gap-1 font-bold text-slate-600">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-400/70 border border-slate-500" />
            Sold ({plots.filter((p) => p.status === 'sold').length})
          </span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
          >
            <ZoomOut size={13} />
          </button>
          <span className="text-[11px] font-bold text-slate-600 px-1 min-w-[34px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.1))}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
          >
            <ZoomIn size={13} />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
            title="Reset Zoom"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* Blueprint SVG Canvas Viewport */}
      <div className="p-4 overflow-auto max-h-[580px] bg-slate-50/40 select-none">
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            transition: 'transform 0.2s ease',
          }}
          className="inline-block"
        >
          <svg
            viewBox="0 0 1100 530"
            width="1100"
            height="530"
            className="bg-white border border-slate-300 rounded-xl shadow-xs"
          >
            {/* Background Grid Pattern */}
            <defs>
              <pattern id="bgGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="1100" height="530" fill="url(#bgGrid)" />

            {/* ── TOP NORTH BOUNDARY PLOTS (Plots 1 to 15) ── */}
            <g id="NorthBoundaryPlots">
              {/* Plot 1 & 2 (Far Top Right Corner) */}
              {renderPlotCell(1, 740, 20, 42, 60)}
              {renderPlotCell(2, 695, 30, 42, 50)}
              {/* Plots 3 to 15 */}
              {renderPlotCell(3, 630, 52, 36, 32)}
              {renderPlotCell(4, 592, 52, 36, 32)}
              {renderPlotCell(5, 554, 48, 36, 36)}
              {renderPlotCell(6, 516, 42, 36, 42)}
              {renderPlotCell(7, 478, 38, 36, 46)}
              {renderPlotCell(8, 440, 36, 36, 48)}
              {renderPlotCell(9, 402, 34, 36, 50)}
              {renderPlotCell(10, 364, 40, 36, 44)}
              {renderPlotCell(11, 335, 52, 28, 32)}
              {renderPlotCell(12, 285, 60, 48, 24)}
              {renderPlotCell(13, 235, 64, 48, 20)}
              {renderPlotCell(14, 185, 68, 48, 16)}
              {renderPlotCell(15, 135, 72, 48, 14)}
            </g>

            {/* Road Label: 16' Wide Road */}
            <text x="380" y="90" fontSize="8" fontWeight="800" fill="#94a3b8" letterSpacing="2">
              16' WIDE ROAD - - - - - - - - - - - - - - - - - - - -
            </text>

            {/* ── BLOCK 1 & 2: Row 1 (Plots 16–27 & 28–40) ── */}
            <g id="Row1">
              {Array.from({ length: 12 }, (_, i) => {
                const num = 16 + i;
                return renderPlotCell(num, 140 + i * 29, 96, 28, 40);
              })}
              {/* Center Divider: 20' Road */}
              <text x="492" y="240" fontSize="7" fontWeight="800" fill="#94a3b8" transform="rotate(90 492 240)">
                20' ROAD
              </text>
              {Array.from({ length: 13 }, (_, i) => {
                const num = 28 + i;
                return renderPlotCell(num, 504 + i * 28, 96, 27, 40);
              })}
            </g>

            {/* ── BLOCK 3 & 4: Row 2 (Plots 63–52 & 51–41) ── */}
            <g id="Row2">
              {Array.from({ length: 12 }, (_, i) => {
                const num = 63 - i;
                return renderPlotCell(num, 140 + i * 29, 138, 28, 40);
              })}
              {Array.from({ length: 11 }, (_, i) => {
                const num = 51 - i;
                return renderPlotCell(num, 504 + i * 28, 138, 27, 40);
              })}
            </g>

            {/* Main Central Access Road: 20' Wide Road */}
            <rect x="135" y="180" width="740" height="12" fill="#e2e8f0" rx="2" />
            <text x="440" y="189" fontSize="8" fontWeight="900" fill="#64748b" letterSpacing="3">
              MAIN 20' WIDE ROAD
            </text>

            {/* ── BLOCK 5 & 6: Row 3 (Plots 64–75 & 76–87) ── */}
            <g id="Row3">
              {Array.from({ length: 12 }, (_, i) => {
                const num = 64 + i;
                return renderPlotCell(num, 140 + i * 29, 194, 28, 40);
              })}
              {Array.from({ length: 12 }, (_, i) => {
                const num = 76 + i;
                return renderPlotCell(num, 504 + i * 28, 194, 27, 40);
              })}
              {/* Green Park / Amenity Zone */}
              <rect x="842" y="194" width="28" height="60" fill="#dcfce7" stroke="#16a34a" strokeWidth="1" rx="2" />
              <text x="856" y="228" fontSize="8" fontWeight="900" fill="#15803d" transform="rotate(90 856 228)">
                PARK
              </text>
            </g>

            {/* ── BLOCK 7 & 8: Row 4 (Plots 110–99 & 98–88) ── */}
            <g id="Row4">
              {Array.from({ length: 12 }, (_, i) => {
                const num = 110 - i;
                return renderPlotCell(num, 140 + i * 29, 236, 28, 40);
              })}
              {Array.from({ length: 11 }, (_, i) => {
                const num = 98 - i;
                return renderPlotCell(num, 504 + i * 28, 236, 27, 40);
              })}
            </g>

            {/* 20' Wide Road Divider */}
            <rect x="135" y="278" width="710" height="12" fill="#e2e8f0" rx="2" />
            <text x="440" y="287" fontSize="8" fontWeight="900" fill="#64748b" letterSpacing="3">
              20' WIDE ROAD
            </text>

            {/* ── BLOCK 9 & 10: Row 5 (Plots 111–122 & 123–132) ── */}
            <g id="Row5">
              {Array.from({ length: 12 }, (_, i) => {
                const num = 111 + i;
                return renderPlotCell(num, 140 + i * 29, 292, 28, 40);
              })}
              {Array.from({ length: 10 }, (_, i) => {
                const num = 123 + i;
                return renderPlotCell(num, 504 + i * 28, 292, 27, 40);
              })}
            </g>

            {/* ── BLOCK 11 & 12: Row 6 (Plots 152–141 & 140–133) ── */}
            <g id="Row6">
              {Array.from({ length: 12 }, (_, i) => {
                const num = 152 - i;
                return renderPlotCell(num, 140 + i * 29, 334, 28, 40);
              })}
              {Array.from({ length: 8 }, (_, i) => {
                const num = 140 - i;
                return renderPlotCell(num, 504 + i * 28, 334, 27, 40);
              })}
            </g>

            {/* ── SOUTHERN RIVERFRONT BOUNDARY (Plots 153 to 169) ── */}
            <g id="RiverfrontPlots">
              {Array.from({ length: 17 }, (_, i) => {
                const num = 153 + i;
                return renderPlotCell(num, 140 + i * 32, 386, 30, 26);
              })}
            </g>

            {/* Suramriver River Line & Text */}
            <path
              d="M 120,420 Q 350,440 500,430 T 750,420"
              fill="none"
              stroke="#0284c7"
              strokeWidth="2"
              strokeDasharray="4 3"
            />
            <text x="440" y="445" fontSize="10" fontWeight="900" fill="#0369a1" letterSpacing="4">
              SURAMRIVER — OWN USE
            </text>

            {/* ── WEST WING (Plots 170–182) ── */}
            <g id="WestWing">
              {/* Far Left Bottom: Plots 170–173 */}
              {renderPlotCell(170, 16, 360, 26, 36)}
              {renderPlotCell(171, 44, 360, 26, 36)}
              {renderPlotCell(172, 72, 360, 26, 36)}
              {renderPlotCell(173, 100, 360, 26, 36)}

              {/* Left Vertical Strip: Plots 174–182 */}
              {renderPlotCell(174, 96, 320, 32, 28)}
              {renderPlotCell(175, 96, 290, 32, 28)}
              {renderPlotCell(176, 96, 260, 32, 28)}
              {renderPlotCell(177, 96, 230, 32, 28)}
              {renderPlotCell(178, 96, 200, 32, 28)}
              {renderPlotCell(179, 96, 170, 32, 28)}
              {renderPlotCell(180, 96, 140, 32, 28)}
              {renderPlotCell(181, 80, 108, 48, 28)}
              {renderPlotCell(182, 80, 78, 48, 28)}
            </g>

            {/* ── EAST WING / VILLAGE ENTRANCE (Plots 183, 184) ── */}
            <g id="EastEntrance">
              {renderPlotCell(183, 930, 40, 50, 50)}
              {/* 30' & 40' Village Road Entrance */}
              <path d="M 880,140 L 980,140 L 990,200 L 890,200 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
              <text x="940" y="170" fontSize="7" fontWeight="800" fill="#64748b" transform="rotate(75 940 170)">
                VILLAGE ROAD - 40'
              </text>
              <text x="890" y="130" fontSize="7" fontWeight="800" fill="#64748b">
                TEMPLE
              </text>
            </g>

            {/* North Compass Arrow Marker */}
            <g transform="translate(970, 430)">
              <circle cx="20" cy="20" r="18" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
              <path d="M 20 4 L 25 22 L 20 18 L 15 22 Z" fill="#0f172a" />
              <line x1="20" y1="18" x2="20" y2="36" stroke="#0f172a" strokeWidth="1.2" />
              <text x="20" y="-3" fontSize="13" fontWeight="900" fill="#0f172a" textAnchor="middle">
                N
              </text>
            </g>
          </svg>
        </div>
      </div>

      {/* Floating HUD Tooltip on Hover */}
      {hoveredPlot && (
        <div
          style={{
            position: 'absolute',
            left: `${hoveredPlot.x + 15}px`,
            top: `${hoveredPlot.y - 45}px`,
            pointerEvents: 'none',
            zIndex: 50,
          }}
          className="bg-slate-950/95 text-white text-xs rounded-xl px-3.5 py-2 shadow-2xl border border-slate-700 animate-fade-in backdrop-blur-xs"
        >
          <div className="flex items-center gap-2">
            <span className="font-black text-amber-400">{hoveredPlot.plot.plotNumber}</span>
            <span className="text-[10px] text-slate-300 font-medium">({hoveredPlot.plot.area} sq.ft)</span>
            <span
              className={cn(
                'text-[9px] font-black uppercase px-1.5 py-0.5 rounded',
                hoveredPlot.plot.status === 'available'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : hoveredPlot.plot.status === 'token_booked'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              )}
            >
              {hoveredPlot.plot.status.replace('_', ' ')}
            </span>
          </div>
          <div className="text-[11px] font-black text-slate-100 mt-1">
            {formatCurrencyFull(hoveredPlot.plot.totalPrice)}
            <span className="text-[10px] text-slate-400 font-normal ml-1.5">
              (₹{hoveredPlot.plot.pricePerSqft.toLocaleString('en-IN')}/sq.ft)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
