import React from 'react';
import { Plot } from '../../types';
import { cn, getDaysRemaining, formatCurrency } from '../../utils/helpers';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

interface PlotCardProps {
  plot: Plot;
  onClick: (plot: Plot) => void;
  compact?: boolean;
}

export const PlotCard: React.FC<PlotCardProps> = ({ plot, onClick, compact = false }) => {
  const daysRemaining = plot.tokenExpiry ? getDaysRemaining(plot.tokenExpiry) : null;
  const deadlineDays = plot.paymentDeadline ? getDaysRemaining(plot.paymentDeadline) : null;

  const statusClass = {
    available: 'plot-available border-emerald-300 bg-emerald-50/40 text-emerald-950',
    token_booked: 'plot-token border-yellow-400 bg-yellow-50 text-yellow-950',
    partial_booked: 'plot-partial border-orange-400 bg-orange-50 text-orange-950',
    confirmed: 'plot-confirmed border-red-300 bg-red-50 text-red-950',
    sold: 'plot-sold border-red-300 bg-red-50 text-red-950',
  }[plot.status] || 'plot-available';

  return (
    <div
      className={cn('plot-card rounded-xl p-2.5 select-none border-2 transition-all cursor-pointer shadow-2xs hover:shadow-xs', statusClass, compact ? 'min-h-[72px]' : 'min-h-[92px]')}
      onClick={() => onClick(plot)}
      title={`${plot.plotNumber} - ${plot.area} sq.ft`}
    >
      <div className="font-black text-xs leading-tight">{plot.plotNumber}</div>
      <div className="text-[10px] mt-0.5 font-bold opacity-80">
        {plot.area} sq.ft
      </div>

      {plot.status === 'available' && (
        <>
          <div className="flex items-center gap-0.5 mt-1 text-emerald-700">
            <CheckCircle size={10} />
            <span className="text-[10px] font-black uppercase tracking-wider">Available</span>
          </div>
          <div className="text-[10px] mt-0.5 font-bold text-slate-700">{formatCurrency(plot.totalPrice)}</div>
        </>
      )}

      {plot.status === 'token_booked' && (
        <>
          <div className="flex items-center gap-0.5 mt-1 text-yellow-800">
            <Clock size={10} />
            <span className="text-[10px] font-black uppercase tracking-wider">Token</span>
          </div>
          {daysRemaining !== null && (
            <div className="text-[10px] mt-0.5 font-bold text-yellow-900">
              {daysRemaining > 0 ? `${daysRemaining}d left` : 'Expired'}
            </div>
          )}
        </>
      )}

      {plot.status === 'partial_booked' && (
        <>
          <div className="flex items-center gap-0.5 mt-1 text-orange-800">
            <Clock size={10} />
            <span className="text-[10px] font-black uppercase tracking-wider">Partial</span>
          </div>
          {deadlineDays !== null && (
            <div className="text-[10px] mt-0.5 font-bold text-orange-900">
              {deadlineDays > 0 ? `${deadlineDays}d left` : 'Overdue'}
            </div>
          )}
        </>
      )}

      {(plot.status === 'sold' || plot.status === 'confirmed') && (
        <div className="flex items-center gap-0.5 mt-1.5 text-red-700">
          <XCircle size={10} />
          <span className="text-[10px] font-black uppercase tracking-wider">SOLD OUT</span>
        </div>
      )}
    </div>
  );
};
