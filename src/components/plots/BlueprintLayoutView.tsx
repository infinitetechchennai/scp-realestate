import React, { useState } from 'react';
import { Plot } from '../../types';
import { usePlotStore } from '../../store/plotStore';
import { SurveyBlueprintDiagram } from './SurveyBlueprintDiagram';
import { BookingWizard } from '../booking/BookingWizard';
import { formatCurrencyFull, cn } from '../../utils/helpers';
import { Layers, CheckCircle2, RotateCcw, AlertCircle } from 'lucide-react';

interface BlueprintLayoutViewProps {
  plots?: Plot[];
  onPlotSelect?: (plot: Plot) => void;
  showControls?: boolean;
}

export const BlueprintLayoutView: React.FC<BlueprintLayoutViewProps> = ({
  plots: propPlots,
  onPlotSelect,
  showControls = true,
}) => {
  const { plots: storePlots, blueprintImage, tokenRequired, ratePerSqft } = usePlotStore();
  const plots = propPlots || storePlots;

  // Default to first available plot, or first plot
  const defaultSelected = plots.find((p) => p.status === 'available') || plots[1] || plots[0];
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(defaultSelected);
  const [bookingPlot, setBookingPlot] = useState<Plot | null>(null);

  const handleSelect = (plot: Plot) => {
    setSelectedPlot(plot);
    onPlotSelect?.(plot);
  };

  const handleDiagramSelect = (plotNumber: string) => {
    const found = plots.find(
      (p) => p.plotNumber.toLowerCase() === plotNumber.toLowerCase() || p.plotNumber.endsWith(plotNumber.replace('P-', ''))
    );
    if (found) {
      handleSelect(found);
    }
  };

  // Selected plot computations
  const currentPlot = selectedPlot || defaultSelected;
  const plotArea = currentPlot?.area || 1285;
  const currentRate = currentPlot?.pricePerSqft || ratePerSqft || 2500;
  const totalValue = currentPlot?.totalPrice || plotArea * currentRate;
  const tokenAmount = currentPlot?.tokenRequired || tokenRequired || 100000;
  const isAvailable = currentPlot?.status === 'available';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── TOP SECTION: Architectural Blueprint Diagram ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-3 md:p-6">
        <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-wide">Master Plan Architectural Blueprint</h2>
              <p className="text-[11px] text-slate-500 font-medium">Cadastral Survey & Road Layout Diagram</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 font-bold text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Available ({plots.filter((p) => p.status === 'available').length})
            </span>
            <span className="flex items-center gap-1.5 font-bold text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              Booked ({plots.filter((p) => p.status !== 'available').length})
            </span>
          </div>
        </div>

        {/* Blueprint CAD SVG / Image */}
        <SurveyBlueprintDiagram
          selectedPlotNumber={currentPlot?.plotNumber}
          onSelectPlot={handleDiagramSelect}
          customImage={blueprintImage}
        />
      </div>

      {/* ── BOTTOM SECTION: Split Pane (Plots Grid + Selection Details) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Plots Matrix */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Plots</h3>
            <span className="text-[11px] font-bold text-slate-400">Showing {plots.length} Layout Units</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
            {plots.map((plot) => {
              const isSelected = currentPlot?.id === plot.id;
              const isPlotAvailable = plot.status === 'available';

              return (
                <button
                  key={plot.id}
                  type="button"
                  onClick={() => handleSelect(plot)}
                  className={cn(
                    'flex flex-col items-center justify-center p-3.5 rounded-xl border-2 transition-all duration-150 text-center min-h-[96px]',
                    isSelected
                      ? 'border-[#0284c7] bg-[#f0f9ff] ring-2 ring-[#0284c7]/20 shadow-xs scale-[1.02]'
                      : isPlotAvailable
                      ? 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                      : 'border-slate-100 bg-slate-50/60 opacity-60 hover:opacity-80'
                  )}
                >
                  <span
                    className={cn(
                      'text-xs font-black tracking-wide',
                      isSelected ? 'text-[#0369a1]' : isPlotAvailable ? 'text-slate-900' : 'text-slate-500'
                    )}
                  >
                    {plot.plotNumber}
                  </span>
                  <span
                    className={cn(
                      'text-[11px] font-bold mt-1',
                      isSelected ? 'text-[#0284c7]' : isPlotAvailable ? 'text-emerald-700' : 'text-slate-400'
                    )}
                  >
                    {plot.area} sq.ft
                  </span>
                  <span
                    className={cn(
                      'text-[9px] font-extrabold uppercase tracking-wider mt-1.5 px-2 py-0.5 rounded-md',
                      isPlotAvailable
                        ? isSelected
                          ? 'bg-[#0284c7]/10 text-[#0284c7]'
                          : 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-200/70 text-slate-500'
                    )}
                  >
                    {isPlotAvailable ? 'AVAILABLE' : 'BOOKED'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 4 Cols: Selection Details Sidebar */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Selection Details</h3>
          </div>

          <div className="p-6 space-y-5 flex-1 flex flex-col justify-between">
            <div>
              {/* Plot Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <span className="text-2xl font-black text-slate-900">{currentPlot?.plotNumber}</span>
                <span
                  className={cn(
                    'text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider',
                    isAvailable ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {isAvailable ? 'Available' : currentPlot?.status?.replace('_', ' ') || 'Booked'}
                </span>
              </div>

              {/* Metrics Table */}
              <div className="space-y-3.5 py-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500">Area Size</span>
                  <span className="font-bold text-slate-900">{plotArea} sq.ft</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500">Rate / sq.ft</span>
                  <span className="font-bold text-slate-900">₹{currentRate.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-700">Total Value</span>
                  <span className="text-base font-black text-[#0284c7]">
                    {formatCurrencyFull(totalValue)}
                  </span>
                </div>
              </div>

              {/* Token Advance Callout Note */}
              <div className="bg-[#e0f2fe]/70 border border-[#bae6fd] rounded-xl p-4 mt-2">
                <p className="text-xs text-[#0369a1] font-semibold leading-relaxed">
                  <b className="font-black text-[#0c4a6e]">Note:</b> A token advance of{' '}
                  <span className="font-black text-[#0c4a6e]">{formatCurrencyFull(tokenAmount)}</span> is required to
                  block this plot.
                </p>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-5">
              {isAvailable ? (
                <button
                  type="button"
                  onClick={() => setBookingPlot(currentPlot)}
                  className="w-full py-3.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-500/20 active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  Proceed to Booking
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-3.5 bg-slate-100 text-slate-400 rounded-xl font-bold text-xs uppercase tracking-wider cursor-not-allowed border border-slate-200"
                >
                  Plot Already {currentPlot?.status?.replace('_', ' ')?.toUpperCase() || 'BOOKED'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Booking Wizard Modal ── */}
      {bookingPlot && (
        <BookingWizard
          plot={bookingPlot}
          onClose={() => {
            setBookingPlot(null);
            // Refresh selected plot reference
            const updated = storePlots.find((p) => p.id === bookingPlot.id);
            if (updated) setSelectedPlot(updated);
          }}
        />
      )}
    </div>
  );
};
