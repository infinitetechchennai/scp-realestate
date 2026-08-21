import React, { useState, useRef } from 'react';
import { Plot, PlotStatus } from '../../types';
import { PlotCard } from './PlotCard';
import { BlueprintLayoutView } from './BlueprintLayoutView';
import { OriginalBlueprintViewer } from './OriginalBlueprintViewer';
import { usePlotStore } from '../../store/plotStore';
import { ZoomIn, ZoomOut, RotateCcw, Search, Map, Grid, Layers, FileText } from 'lucide-react';
import { cn } from '../../utils/helpers';

interface PlotMapProps {
  plots: Plot[];
  onPlotClick?: (plot: Plot) => void;
}

const statusOptions: { value: PlotStatus | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'All Plots', color: 'bg-slate-400' },
  { value: 'available', label: 'Available (Green)', color: 'bg-emerald-500' },
  { value: 'token_booked', label: 'Token Advance (Yellow)', color: 'bg-yellow-400' },
  { value: 'partial_booked', label: 'Partial Payment (Orange)', color: 'bg-orange-500' },
  { value: 'sold', label: 'Sold Out (Red)', color: 'bg-red-500' },
];

export const PlotMap: React.FC<PlotMapProps> = ({ plots, onPlotClick }) => {
  const { layoutMode, setLayoutMode, checkAndReleaseExpiredPlots, fetchPlots } = usePlotStore();
  const [zoom, setZoom] = useState(1);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<PlotStatus | 'all'>('all');
  const [filterFacing, setFilterFacing] = useState('all');
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-fetch live plots and check expired plots on mount
  React.useEffect(() => {
    fetchPlots();
    checkAndReleaseExpiredPlots();
  }, []);

  const facings = ['all', ...Array.from(new Set(plots.map((p) => p.facing)))];

  const filteredPlots = plots.filter((p) => {
    const matchSearch = !search || p.plotNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || p.status === filterStatus || (filterStatus === 'sold' && p.status === 'confirmed');
    const matchFacing = filterFacing === 'all' || p.facing === filterFacing;
    return matchSearch && matchStatus && matchFacing;
  });

  // Group by row for Grid view
  const rows = Array.from(new Set(plots.map((p) => p.row))).sort();

  const counts = {
    total: plots.length,
    available: plots.filter((p) => p.status === 'available').length,
    token: plots.filter((p) => p.status === 'token_booked').length,
    partial: plots.filter((p) => p.status === 'partial_booked').length,
    sold: plots.filter((p) => p.status === 'sold' || p.status === 'confirmed').length,
  };

  const isFiltered = (plot: Plot) => filteredPlots.some((fp) => fp.id === plot.id);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* View Mode Switcher Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setLayoutMode('blueprint')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all',
              layoutMode === 'blueprint'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            )}
          >
            <Layers size={14} className={layoutMode === 'blueprint' ? 'text-blue-600' : ''} />
            Blueprint Layout
          </button>
          <button
            type="button"
            onClick={() => setLayoutMode('grid')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all',
              layoutMode === 'grid'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            )}
          >
            <Grid size={14} className={layoutMode === 'grid' ? 'text-blue-600' : ''} />
            Schematic Grid
          </button>
          <button
            type="button"
            onClick={() => setLayoutMode('original')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all',
              layoutMode === 'original'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            )}
          >
            <FileText size={14} className={layoutMode === 'original' ? 'text-blue-600' : ''} />
            Original Blueprint (PDF / Image)
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-500 font-medium">
            Active View:{' '}
            <b className="text-slate-900 font-bold">
              {layoutMode === 'blueprint'
                ? 'Interactive Blueprint'
                : layoutMode === 'original'
                ? 'Original CAD Document'
                : 'Schematic Grid'}
            </b>
          </span>
        </div>
      </div>

      {/* Render Blueprint View, Original Document View, or Grid View */}
      {layoutMode === 'blueprint' ? (
        <BlueprintLayoutView plots={plots} />
      ) : layoutMode === 'original' ? (
        <OriginalBlueprintViewer />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center gap-3 px-5 py-3.5 border-b border-slate-100 bg-slate-50">
            {/* Search */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs w-48 shadow-2xs focus-within:border-sky-500">
              <Search size={14} className="text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search plot..."
                className="outline-none text-xs text-slate-700 bg-transparent w-full"
              />
            </div>

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as PlotStatus | 'all')}
              className="text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-sky-500 shadow-2xs cursor-pointer"
            >
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            {/* Facing filter */}
            <select
              value={filterFacing}
              onChange={(e) => setFilterFacing(e.target.value)}
              className="text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-sky-500 shadow-2xs cursor-pointer"
            >
              {facings.map((f) => (
                <option key={f} value={f}>
                  {f === 'all' ? 'All Facings' : f}
                </option>
              ))}
            </select>

            <div className="flex-1" />

            {/* Zoom controls */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
              <button
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
              >
                <ZoomOut size={14} />
              </button>
              <span className="text-[11px] font-bold text-slate-600 px-1 min-w-[38px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={() => setZoom(1)}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
                title="Reset Zoom"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>

          {/* Stats Counter Bar */}
          <div className="flex flex-wrap items-center gap-5 px-5 py-2.5 bg-slate-50/70 border-b border-slate-100 text-xs">
            <span className="font-bold text-slate-700">
              Total: <span className="text-slate-950 font-black">{counts.total}</span>
            </span>
            <span className="flex items-center gap-1.5 text-emerald-800 font-semibold">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>Available: <b>{counts.available}</b>
            </span>
            <span className="flex items-center gap-1.5 text-yellow-900 font-semibold">
              <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full"></span>Token Advance: <b>{counts.token}</b>
            </span>
            <span className="flex items-center gap-1.5 text-orange-950 font-semibold">
              <span className="w-2.5 h-2.5 bg-orange-500 rounded-full"></span>Partial Payment: <b>{counts.partial}</b>
            </span>
            <span className="flex items-center gap-1.5 text-red-800 font-semibold">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span>Sold Out: <b>{counts.sold}</b>
            </span>
          </div>

          {/* Plot Grid Canvas */}
          <div className="p-6 overflow-auto" ref={containerRef}>
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                transition: 'transform 0.2s ease',
              }}
              className="inline-block"
            >
              {/* Master Plan Banner */}
              <div className="text-center mb-5">
                <div className="inline-flex items-center gap-2 bg-[#0c0f17] text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md border border-slate-800">
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
                  <span className="tracking-wider">GREEN VALLEY ENCLAVE — MASTER PLAN</span>
                </div>
              </div>

              {/* North Direction Marker */}
              <div className="flex justify-center mb-3">
                <div className="text-[11px] text-slate-400 font-bold tracking-wider">▲ NORTH</div>
              </div>

              {rows.map((row, rowIdx) => {
                const rowPlots = plots
                  .filter((p) => p.row === row)
                  .sort((a, b) => a.col - b.col);

                return (
                  <div key={row}>
                    {rowIdx > 0 && (
                      <div className="flex items-center gap-2 my-2.5">
                        <div className="flex-1 border-b-2 border-dashed border-slate-300" />
                        <span className="text-[10px] font-bold text-slate-500 px-3 py-0.5 bg-slate-100 rounded-full border border-slate-200">
                          MAIN ACCESS ROAD — {30 + rowIdx * 10}ft WIDTH
                        </span>
                        <div className="flex-1 border-b-2 border-dashed border-slate-300" />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <div className="flex items-center justify-center w-6">
                        <span
                          className="text-[10px] text-slate-400 font-bold"
                          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                        >
                          ROW {row}
                        </span>
                      </div>
                      {rowPlots.map((plot) => (
                        <div
                          key={plot.id}
                          className={cn(
                            'w-[94px] transition-all duration-200',
                            !isFiltered(plot) && (search || filterStatus !== 'all' || filterFacing !== 'all')
                              ? 'opacity-20 scale-95 pointer-events-none'
                              : 'opacity-100'
                          )}
                        >
                          <PlotCard plot={plot} onClick={onPlotClick} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-8 pt-5 border-t border-slate-200 justify-center">
                {statusOptions
                  .filter((s) => s.value !== 'all')
                  .map((s) => (
                    <div key={s.value} className="flex items-center gap-2">
                      <div className={cn('w-3.5 h-3.5 rounded-md', s.color)} />
                      <span className="text-xs text-slate-600 font-semibold">{s.label}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
