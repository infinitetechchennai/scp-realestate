import React, { useState } from 'react';
import { Plot } from '../../types';
import { usePlotStore } from '../../store/plotStore';
import { TownshipInteractiveBlueprint } from './TownshipInteractiveBlueprint';
import { SurveyBlueprintDiagram } from './SurveyBlueprintDiagram';
import { BookingWizard } from '../booking/BookingWizard';
import { formatCurrencyFull, cn } from '../../utils/helpers';
import { Layers, CheckCircle2, RotateCcw, Search, User, Calendar, DollarSign, Handshake, Clock, Sparkles } from 'lucide-react';

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
  const {
    plots: storePlots,
    blueprintImage,
    blueprintPreset,
    tokenRequired,
    ratePerSqft,
    useTownshipDataset,
    useSurveyDataset,
  } = usePlotStore();

  const plots = propPlots || storePlots;

  // Default selected plot
  const defaultSelected = plots.find((p) => p.status === 'available') || plots[0];
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(defaultSelected);
  const [bookingPlot, setBookingPlot] = useState<Plot | null>(null);
  const [gridSearch, setGridSearch] = useState('');
  const [gridFilterStatus, setGridFilterStatus] = useState<string>('all');

  const handleSelect = (plot: Plot) => {
    setSelectedPlot(plot);
    onPlotSelect?.(plot);
  };

  const handleDiagramSelect = (plot: Plot) => {
    handleSelect(plot);
  };

  // Selected plot metrics
  const currentPlot = selectedPlot || defaultSelected;
  const plotArea = currentPlot?.area || 1500;
  const currentRate = currentPlot?.pricePerSqft || ratePerSqft || 2500;
  const totalValue = currentPlot?.totalPrice || plotArea * currentRate;
  const tokenAmount = currentPlot?.tokenRequired || tokenRequired || 100000;
  const isAvailable = currentPlot?.status === 'available';

  // Filtered plots for bottom grid
  const filteredPlots = plots.filter((p) => {
    const matchSearch =
      !gridSearch ||
      p.plotNumber.toLowerCase().includes(gridSearch.toLowerCase()) ||
      p.plotNumber.replace('P-', '').includes(gridSearch.replace('P-', ''));
    const matchStatus = gridFilterStatus === 'all' || p.status === gridFilterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── TOP SECTION: Architectural Blueprint Header & Viewport ── */}
      <div className="space-y-3">
        {/* Preset Switcher Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider pl-2">Layout Blueprint:</span>
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={useTownshipDataset}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all',
                  blueprintPreset === 'township_184'
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                <Layers size={13} className={blueprintPreset === 'township_184' ? 'text-amber-600' : ''} />
                Client Master Layout (184 Plots)
              </button>
              <button
                type="button"
                onClick={useSurveyDataset}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all',
                  blueprintPreset === 'greens_16'
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                <Sparkles size={13} className={blueprintPreset === 'greens_16' ? 'text-amber-600' : ''} />
                Greens Ventures (16 Plots)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 pr-2">
            <span>
              Total Units: <b className="text-slate-900 font-black">{plots.length}</b>
            </span>
          </div>
        </div>

        {/* The Clickable Interactive Blueprint Diagram */}
        {blueprintPreset === 'greens_16' ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <SurveyBlueprintDiagram
              selectedPlotNumber={currentPlot?.plotNumber}
              onSelectPlot={(pNum) => {
                const found = plots.find((p) => p.plotNumber === pNum || p.plotNumber.endsWith(pNum.replace('P-', '')));
                if (found) handleSelect(found);
              }}
              customImage={blueprintImage}
            />
          </div>
        ) : (
          <TownshipInteractiveBlueprint
            plots={plots}
            selectedPlotNumber={currentPlot?.plotNumber}
            onSelectPlot={handleDiagramSelect}
          />
        )}
      </div>

      {/* ── BOTTOM SECTION: Split Pane (Plots Grid + Selection Details) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Plots Matrix */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Plots</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Click any plot below or directly in the blueprint above</p>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs shadow-2xs focus-within:border-amber-400">
                <Search size={13} className="text-slate-400" />
                <input
                  value={gridSearch}
                  onChange={(e) => setGridSearch(e.target.value)}
                  placeholder="Search plot..."
                  className="outline-none text-xs text-slate-700 bg-transparent w-24 sm:w-32"
                />
              </div>
              <select
                value={gridFilterStatus}
                onChange={(e) => setGridFilterStatus(e.target.value)}
                className="text-xs font-semibold border border-slate-200 rounded-xl px-2.5 py-1.5 bg-slate-50 text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">All</option>
                <option value="available">Available</option>
                <option value="token_booked">Token</option>
                <option value="confirmed">Confirmed</option>
                <option value="sold">Sold</option>
              </select>
            </div>
          </div>

          {/* Scrollable Matrix of Plots */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[440px] overflow-y-auto pr-1">
            {filteredPlots.map((plot) => {
              const isSelected = currentPlot?.id === plot.id || currentPlot?.plotNumber === plot.plotNumber;
              const isPlotAvailable = plot.status === 'available';

              return (
                <button
                  key={plot.id || plot.plotNumber}
                  type="button"
                  onClick={() => handleSelect(plot)}
                  className={cn(
                    'flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-150 text-center min-h-[90px]',
                    isSelected
                      ? 'border-[#0284c7] bg-[#f0f9ff] ring-2 ring-[#0284c7]/20 shadow-xs scale-[1.02]'
                      : isPlotAvailable
                      ? 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                      : 'border-slate-100 bg-slate-50/60 opacity-65 hover:opacity-90'
                  )}
                >
                  <span
                    className={cn(
                      'text-xs font-black tracking-wide',
                      isSelected ? 'text-[#0369a1]' : isPlotAvailable ? 'text-slate-900' : 'text-slate-600'
                    )}
                  >
                    {plot.plotNumber}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] font-bold mt-0.5',
                      isSelected ? 'text-[#0284c7]' : isPlotAvailable ? 'text-emerald-700' : 'text-slate-400'
                    )}
                  >
                    {plot.area} sq.ft
                  </span>
                  <span
                    className={cn(
                      'text-[9px] font-extrabold uppercase tracking-wider mt-1 px-1.5 py-0.5 rounded',
                      isPlotAvailable
                        ? isSelected
                          ? 'bg-[#0284c7]/10 text-[#0284c7]'
                          : 'bg-emerald-50 text-emerald-700'
                        : plot.status === 'token_booked'
                        ? 'bg-amber-50 text-amber-700'
                        : plot.status === 'confirmed'
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-slate-200/70 text-slate-500'
                    )}
                  >
                    {plot.status.replace('_', ' ')}
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
              {/* Plot Title & Status */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-2xl font-black text-slate-900">{currentPlot?.plotNumber}</span>
                  <p className="text-[11px] text-slate-400 font-medium">{currentPlot?.dimensions || '30x50'} · {currentPlot?.facing || 'North'}</p>
                </div>
                <span
                  className={cn(
                    'text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider',
                    isAvailable
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : currentPlot?.status === 'token_booked'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : currentPlot?.status === 'confirmed'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {currentPlot?.status?.replace('_', ' ')}
                </span>
              </div>

              {/* Metrics Table */}
              <div className="space-y-2.5 py-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500">Area Size</span>
                  <span className="font-bold text-slate-900">{plotArea} sq.ft</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500">Road Width</span>
                  <span className="font-bold text-slate-900">{currentPlot?.roadWidth || '20 ft'}</span>
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

              {/* Booking Information (If Booked) */}
              {!isAvailable && (
                <div className="space-y-2 bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs mb-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Booking Record</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1"><User size={12} /> Buyer</span>
                    <span className="font-bold text-slate-900">{currentPlot?.customerName || 'Verified Investor'}</span>
                  </div>
                  {currentPlot?.channelPartnerName && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1"><Handshake size={12} /> Partner</span>
                      <span className="font-bold text-slate-800">{currentPlot?.channelPartnerName}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1"><DollarSign size={12} /> Paid</span>
                    <span className="font-black text-emerald-700">{formatCurrencyFull(currentPlot?.totalPaid || currentPlot?.tokenAmount || 100000)}</span>
                  </div>
                  {currentPlot?.balanceDue !== undefined && currentPlot?.balanceDue > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1"><Clock size={12} /> Balance Due</span>
                      <span className="font-black text-rose-600">{formatCurrencyFull(currentPlot?.balanceDue)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Token Advance Callout Note (If Available) */}
              {isAvailable && (
                <div className="bg-[#e0f2fe]/70 border border-[#bae6fd] rounded-xl p-3.5 mt-2">
                  <p className="text-xs text-[#0369a1] font-semibold leading-relaxed">
                    <b className="font-black text-[#0c4a6e]">Note:</b> A token advance of{' '}
                    <span className="font-black text-[#0c4a6e]">{formatCurrencyFull(tokenAmount)}</span> is required to
                    block this plot.
                  </p>
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="pt-4">
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
            const updated = storePlots.find((p) => p.id === bookingPlot.id);
            if (updated) setSelectedPlot(updated);
          }}
        />
      )}
    </div>
  );
};
