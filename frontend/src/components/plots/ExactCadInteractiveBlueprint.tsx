import React, { useState, useRef } from 'react';
import { Plot } from '../../types';
import { formatCurrencyFull, cn } from '../../utils/helpers';
import { ZoomIn, ZoomOut, RotateCcw, Search, Eye, Compass, Layers, CheckCircle2 } from 'lucide-react';

interface ExactCadInteractiveBlueprintProps {
  plots: Plot[];
  selectedPlotNumber?: string;
  onSelectPlot?: (plot: Plot) => void;
  blueprintImageUrl?: string | null;
}

export const ExactCadInteractiveBlueprint: React.FC<ExactCadInteractiveBlueprintProps> = ({
  plots,
  selectedPlotNumber,
  onSelectPlot,
  blueprintImageUrl = '/blueprint.png',
}) => {
  const [zoom, setZoom] = useState(1);
  const [search, setSearch] = useState('');
  const [hoveredPlot, setHoveredPlot] = useState<{ plot: Plot; x: number; y: number } | null>(null);
  const [showUnderlayImage, setShowUnderlayImage] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const getPlotByNum = (num: number): Plot => {
    const found = plots.find((p) => {
      const pNum = parseInt(p.plotNumber.replace(/\D/g, ''), 10);
      return pNum === num;
    });

    if (found) return found;

    const padded3 = `P-${String(num).padStart(3, '0')}`;
    return {
      id: `plot-t${String(num).padStart(3, '0')}`,
      plotNumber: padded3,
      projectId: 'proj-001',
      projectName: 'SCP Farm Layout (184 Plots)',
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
      tokenRequired: 100000,
    };
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
    const selectedNum = parseInt(selectedPlotNumber.replace(/\D/g, ''), 10);
    return selectedNum === num;
  };

  const getStatusStyle = (status: string, active: boolean) => {
    if (active) {
      return {
        fill: 'rgba(2, 132, 199, 0.48)',
        stroke: '#0284c7',
        strokeWidth: 2.5,
        textColor: '#0369a1',
      };
    }
    switch (status) {
      case 'available':
        return {
          fill: showUnderlayImage ? 'rgba(16, 185, 129, 0.28)' : 'rgba(16, 185, 129, 0.22)',
          stroke: '#059669',
          strokeWidth: 1.2,
          textColor: '#065f46',
        };
      case 'token_booked':
        return {
          fill: showUnderlayImage ? 'rgba(245, 158, 11, 0.38)' : 'rgba(245, 158, 11, 0.30)',
          stroke: '#d97706',
          strokeWidth: 1.2,
          textColor: '#92400e',
        };
      case 'confirmed':
        return {
          fill: showUnderlayImage ? 'rgba(244, 63, 94, 0.32)' : 'rgba(244, 63, 94, 0.24)',
          stroke: '#e11d48',
          strokeWidth: 1.2,
          textColor: '#9f1239',
        };
      case 'sold':
        return {
          fill: showUnderlayImage ? 'rgba(148, 163, 184, 0.42)' : 'rgba(148, 163, 184, 0.32)',
          stroke: '#64748b',
          strokeWidth: 1.2,
          textColor: '#475569',
        };
      default:
        return {
          fill: 'rgba(241, 245, 249, 0.4)',
          stroke: '#94a3b8',
          strokeWidth: 1,
          textColor: '#334155',
        };
    }
  };

  // Render a standard rectangular plot cell
  const renderRectPlot = (num: number, x: number, y: number, w = 31, h = 42, label?: string) => {
    const plot = getPlotByNum(num);
    const active = isSelected(num);
    const style = getStatusStyle(plot.status, active);
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
          fill={style.fill}
          stroke={style.stroke}
          strokeWidth={style.strokeWidth}
          rx={1.5}
        />
        <text
          x={x + w / 2}
          y={y + h / 2 + 3.5}
          fontSize="9.5"
          fontWeight={active ? '900' : '700'}
          fill={active ? '#0369a1' : '#0f172a'}
          textAnchor="middle"
          pointerEvents="none"
        >
          {label || num}
        </text>
      </g>
    );
  };

  // Render a polygon plot cell (for irregular river boundary, sloped top boundary, or Plot 183 & 184)
  const renderPolygonPlot = (num: number, points: string, textX: number, textY: number, label?: string) => {
    const plot = getPlotByNum(num);
    const active = isSelected(num);
    const style = getStatusStyle(plot.status, active);
    const isFiltered = search && !String(num).includes(search.replace('P-', '').replace('p-', ''));

    return (
      <g
        key={num}
        className={cn('cursor-pointer transition-all duration-150', isFiltered ? 'opacity-20' : 'opacity-100')}
        onClick={() => handlePlotClick(num)}
        onMouseEnter={(e) => handleMouseEnter(e, num)}
        onMouseLeave={() => setHoveredPlot(null)}
      >
        <polygon
          points={points}
          fill={style.fill}
          stroke={style.stroke}
          strokeWidth={style.strokeWidth}
        />
        <text
          x={textX}
          y={textY}
          fontSize="9.5"
          fontWeight={active ? '900' : '700'}
          fill={active ? '#0369a1' : '#0f172a'}
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
              placeholder="Search plot (e.g. 63, 110, 184)..."
              className="outline-none text-xs text-slate-700 bg-transparent w-40"
            />
          </div>
          <span className="text-[11px] font-bold text-slate-400">184 Interactive CAD Plots</span>
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

        {/* View & Zoom Controls */}
        <div className="flex items-center gap-2">
          {/* Blueprint Image Underlay Toggle */}
          <button
            type="button"
            onClick={() => setShowUnderlayImage(!showUnderlayImage)}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors',
              showUnderlayImage
                ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            )}
            title="Toggle CAD Drawing Image Underlay"
          >
            <Eye size={12} />
            CAD Underlay
          </button>

          {/* Zoom In/Out/Reset */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
              title="Zoom Out"
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
              title="Zoom In"
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
      </div>

      {/* Blueprint SVG Canvas Viewport */}
      <div className="p-4 overflow-auto max-h-[620px] bg-slate-50/40 select-none">
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            transition: 'transform 0.2s ease',
          }}
          className="inline-block"
        >
          <svg
            viewBox="0 0 1180 540"
            width="1180"
            height="540"
            className="bg-white border border-slate-300 rounded-xl shadow-xs"
          >
            {/* Background Grid Pattern */}
            <defs>
              <pattern id="cadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f8fafc" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="1180" height="540" fill="url(#cadGrid)" />

            {/* Optional High-Res CAD Blueprint Image Underlay */}
            {showUnderlayImage && (
              <image
                href={blueprintImageUrl || '/blueprint.png'}
                x="0"
                y="0"
                width="1180"
                height="540"
                preserveAspectRatio="contain"
                opacity="0.6"
              />
            )}

            {/* ── TOP NORTH BOUNDARY: Plots 1 to 15 (With Exact Survey Slopes) ── */}
            <g id="TopBoundaryPlots">
              {/* Plot 1 (Corner Estate Polygon) */}
              {renderPolygonPlot(1, '778,16 832,22 832,84 778,84', 805, 54)}
              {/* Plot 2 (Corner Estate Polygon) */}
              {renderPolygonPlot(2, '726,30 778,16 778,84 726,84', 752, 54)}
              {/* Plots 3 to 15 (Continuous Diagonal Roof Line with exact survey steps) */}
              {renderPolygonPlot(3, '675,52 718,48 718,84 675,84', 696, 68)}
              {renderPolygonPlot(4, '635,52 675,52 675,84 635,84', 655, 68)}
              {renderPolygonPlot(5, '594,48 635,52 635,84 594,84', 614, 68)}
              {renderPolygonPlot(6, '553,42 594,48 594,84 553,84', 573, 66)}
              {renderPolygonPlot(7, '512,38 553,42 553,84 512,84', 532, 64)}
              {renderPolygonPlot(8, '471,36 512,38 512,84 471,84', 491, 62)}
              {renderPolygonPlot(9, '430,34 471,36 471,84 430,84', 450, 62)}
              {renderPolygonPlot(10, '389,40 430,34 430,84 389,84', 410, 64)}
              {renderPolygonPlot(11, '358,52 389,40 389,84 358,84', 373, 68)}
              {renderPolygonPlot(12, '305,58 358,52 358,84 305,84', 331, 71)}
              {renderPolygonPlot(13, '252,64 305,58 305,84 252,84', 278, 73)}
              {renderPolygonPlot(14, '198,68 252,64 252,84 198,84', 225, 75)}
              {renderPolygonPlot(15, '145,72 198,68 198,84 145,84', 171, 77)}
            </g>

            {/* Road Label: 16' Wide Road */}
            <text x="390" y="93" fontSize="8" fontWeight="800" fill="#94a3b8" letterSpacing="2">
              16' WIDE ROAD - - - - - - - - - - - - - - - - - - - - - - - - - -
            </text>

            {/* ── ROW 1: Plots 16–27 & 28–40 ── */}
            <g id="Row1">
              {Array.from({ length: 12 }, (_, i) => {
                const num = 16 + i;
                return renderRectPlot(num, 145 + i * 31, 98, 30, 42);
              })}
              {Array.from({ length: 12 }, (_, i) => {
                const num = 28 + i;
                return renderRectPlot(num, 532 + i * 30, 98, 29, 42);
              })}
              {renderRectPlot(40, 892, 98, 28, 42)}
            </g>

            {/* ── ROW 2: Plots 63–52 & 51–41 ── */}
            <g id="Row2">
              {Array.from({ length: 12 }, (_, i) => {
                const num = 63 - i;
                return renderRectPlot(num, 145 + i * 31, 142, 30, 42);
              })}
              {Array.from({ length: 11 }, (_, i) => {
                const num = 51 - i;
                return renderRectPlot(num, 532 + i * 30, 142, 29, 42);
              })}
            </g>

            {/* Main Central Access Road: 20' Wide Road */}
            <rect x="140" y="186" width="780" height="12" fill="#e2e8f0" rx="2" />
            <text x="450" y="195" fontSize="8" fontWeight="900" fill="#64748b" letterSpacing="3">
              MAIN 20' WIDE ROAD
            </text>

            {/* ── ROW 3: Plots 64–75 & 76–87 + Park ── */}
            <g id="Row3">
              {Array.from({ length: 12 }, (_, i) => {
                const num = 64 + i;
                return renderRectPlot(num, 145 + i * 31, 200, 30, 42);
              })}
              {Array.from({ length: 12 }, (_, i) => {
                const num = 76 + i;
                return renderRectPlot(num, 532 + i * 30, 200, 29, 42);
              })}
              {/* Park Zone */}
              <rect x="892" y="200" width="30" height="66" fill="#dcfce7" stroke="#16a34a" strokeWidth="1" rx="2" />
              <text x="907" y="238" fontSize="8" fontWeight="900" fill="#15803d" transform="rotate(90 907 238)">
                PARK
              </text>
            </g>

            {/* ── ROW 4: Plots 110–99 & 98–88 ── */}
            <g id="Row4">
              {Array.from({ length: 12 }, (_, i) => {
                const num = 110 - i;
                return renderRectPlot(num, 145 + i * 31, 244, 30, 42);
              })}
              {Array.from({ length: 11 }, (_, i) => {
                const num = 98 - i;
                return renderRectPlot(num, 532 + i * 30, 244, 29, 42);
              })}
            </g>

            {/* 20' Wide Road Divider */}
            <rect x="140" y="288" width="750" height="12" fill="#e2e8f0" rx="2" />
            <text x="450" y="297" fontSize="8" fontWeight="900" fill="#64748b" letterSpacing="3">
              20' WIDE ROAD
            </text>

            {/* ── ROW 5: Plots 111–122 & 123–132 (With 132 Diagonal Slice) ── */}
            <g id="Row5">
              {Array.from({ length: 12 }, (_, i) => {
                const num = 111 + i;
                return renderRectPlot(num, 145 + i * 31, 302, 30, 42);
              })}
              {Array.from({ length: 9 }, (_, i) => {
                const num = 123 + i;
                return renderRectPlot(num, 532 + i * 30, 302, 29, 42);
              })}
              {/* Plot 132: Splayed by diagonal Subamriver */}
              {renderPolygonPlot(132, '802,302 838,302 812,344 802,344', 814, 324)}
            </g>

            {/* ── ROW 6: Plots 152–141 & 140–133 (With 133 Diagonal Slice) ── */}
            <g id="Row6">
              {Array.from({ length: 12 }, (_, i) => {
                const num = 152 - i;
                return renderRectPlot(num, 145 + i * 31, 346, 30, 42);
              })}
              {Array.from({ length: 7 }, (_, i) => {
                const num = 140 - i;
                return renderRectPlot(num, 532 + i * 30, 346, 29, 42);
              })}
              {/* Plot 133: Splayed by diagonal Subamriver */}
              {renderPolygonPlot(133, '742,346 782,346 756,388 742,388', 754, 368)}
            </g>

            {/* ── SOUTHERN RIVERFRONT BOUNDARY: Plots 153 to 169 (Natural Jagged River Contours) ── */}
            <g id="RiverPlots">
              {renderPolygonPlot(153, '145,398 180,398 180,432 145,420', 162, 412)}
              {renderPolygonPlot(154, '180,398 215,398 215,444 180,432', 197, 418)}
              {renderPolygonPlot(155, '215,398 250,398 250,446 215,444', 232, 420)}
              {renderPolygonPlot(156, '250,398 285,398 285,456 250,446', 267, 424)}
              {renderPolygonPlot(157, '285,398 320,398 320,466 285,456', 302, 428)}
              {renderPolygonPlot(158, '320,398 355,398 355,478 320,466', 337, 432)}
              {renderPolygonPlot(159, '355,398 390,398 390,490 355,478', 372, 436)}
              {renderPolygonPlot(160, '390,398 425,398 425,472 390,490', 407, 432)}
              {renderPolygonPlot(161, '425,398 460,398 460,462 425,472', 442, 428)}
              {renderPolygonPlot(162, '460,398 495,398 495,458 460,462', 477, 426)}
              {renderPolygonPlot(163, '495,398 530,398 530,454 495,458', 512, 424)}
              {renderPolygonPlot(164, '530,398 565,398 565,450 530,454', 547, 422)}
              {renderPolygonPlot(165, '565,398 600,398 600,446 565,450', 582, 420)}
              {renderPolygonPlot(166, '600,398 635,398 635,442 600,446', 617, 418)}
              {renderPolygonPlot(167, '635,398 670,398 670,438 635,442', 652, 416)}
              {renderPolygonPlot(168, '670,398 705,398 705,434 670,438', 687, 414)}
              {renderPolygonPlot(169, '705,398 740,398 740,428 705,434', 722, 412)}
            </g>

            {/* Continuous Jagged Natural River Curve (Suramriver) */}
            <path
              d="M 120,430 L 145,420 L 180,432 L 215,444 L 250,446 L 285,456 L 320,466 L 355,478 L 390,490 L 425,472 L 460,462 L 495,458 L 530,454 L 565,450 L 600,446 L 635,442 L 670,438 L 705,434 L 740,428 L 780,410"
              fill="none"
              stroke="#0284c7"
              strokeWidth="2.5"
              strokeDasharray="5 3"
            />
            <text x="420" y="515" fontSize="11" fontWeight="900" fill="#0369a1" letterSpacing="4">
              SURAMRIVER — OWN USE
            </text>

            {/* ── WEST WING: Plots 170 to 182 ── */}
            <g id="WestWing">
              {/* Bottom Left Tail: 170 to 173 */}
              {renderRectPlot(170, 16, 376, 28, 38)}
              {renderRectPlot(171, 46, 376, 28, 38)}
              {renderRectPlot(172, 76, 376, 28, 38)}
              {renderRectPlot(173, 106, 376, 28, 38)}

              {/* Vertical Stack: 174 to 182 */}
              {renderRectPlot(174, 104, 332, 34, 30)}
              {renderRectPlot(175, 104, 300, 34, 30)}
              {renderRectPlot(176, 104, 268, 34, 30)}
              {renderRectPlot(177, 104, 236, 34, 30)}
              {renderRectPlot(178, 104, 204, 34, 30)}
              {renderRectPlot(179, 104, 172, 34, 30)}
              {renderRectPlot(180, 104, 140, 34, 30)}
              {renderRectPlot(181, 88, 106, 50, 30)}
              {renderRectPlot(182, 88, 74, 50, 30)}
            </g>

            {/* ── EAST WING / VILLAGE ENTRANCE: Plots 183 & 184 ── */}
            <g id="EastEntrance">
              {/* Plot 183 (Trapezoid: 168'-9" x 82'-3" x 120'-9" x 54'-4") */}
              {renderPolygonPlot(183, '970,36 1042,42 1032,104 960,98', 998, 72)}

              {/* Plot 184 (Top-Right Corner Wedge: 73'-5" x 68' x 32'-1" x 17'-9") */}
              {renderPolygonPlot(184, '1044,42 1082,45 1073,106 1034,104', 1056, 72)}

              {/* 30' Road Approach, 40' Entrance Road, Temple, and Parking */}
              <text x="990" y="28" fontSize="8" fontWeight="800" fill="#64748b">
                30' WIDE ROAD
              </text>
              <path
                d="M 940,140 L 1050,140 L 1060,200 L 950,200 Z"
                fill="#f8fafc"
                stroke="#cbd5e1"
                strokeWidth="1.2"
              />
              <text x="960" y="132" fontSize="7.5" fontWeight="800" fill="#64748b">
                TEMPLE
              </text>
              <text x="1010" y="170" fontSize="7.5" fontWeight="800" fill="#64748b" transform="rotate(78 1010 170)">
                40' ENTRANCE — VILLAGE ROAD
              </text>
            </g>

            {/* North Compass Arrow Marker */}
            <g transform="translate(1040, 440)">
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
          className="bg-slate-950/95 text-white text-xs rounded-xl px-3.5 py-2.5 shadow-2xl border border-slate-700 animate-fade-in backdrop-blur-xs max-w-xs"
        >
          <div className="flex items-center gap-2">
            <span className="font-black text-amber-400 text-sm">{hoveredPlot.plot.plotNumber}</span>
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
          {hoveredPlot.plot.dimensions && (
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              Dim: {hoveredPlot.plot.dimensions}
            </div>
          )}
          <div className="text-xs font-black text-emerald-400 mt-1">
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
