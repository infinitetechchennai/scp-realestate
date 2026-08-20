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
    available: 'plot-available',
    token_booked: 'plot-token',
    confirmed: 'plot-confirmed',
    sold: 'plot-sold',
  }[plot.status] || 'plot-available';

  return (
    <div
      className={cn('plot-card rounded-lg p-2 select-none', statusClass, compact ? 'min-h-[72px]' : 'min-h-[90px]')}
      onClick={() => onClick(plot)}
      title={`${plot.plotNumber} - ${plot.area} sq.ft`}
    >
      <div className="font-bold text-[11px] leading-tight">{plot.plotNumber}</div>
      <div className="text-[10px] mt-0.5 font-medium opacity-80">
        {plot.area} sq.ft
      </div>

      {plot.status === 'available' && (
        <>
          <div className="flex items-center gap-0.5 mt-1">
            <CheckCircle size={9} />
            <span className="text-[10px] font-semibold">Available</span>
          </div>
          <div className="text-[10px] mt-0.5 font-bold opacity-90">{formatCurrency(plot.totalPrice)}</div>
        </>
      )}

      {plot.status === 'token_booked' && (
        <>
          <div className="flex items-center gap-0.5 mt-1">
            <Clock size={9} />
            <span className="text-[10px] font-semibold">Token Paid</span>
          </div>
          {daysRemaining !== null && (
            <div className="text-[10px] mt-0.5 font-bold">
              {daysRemaining > 0 ? `${daysRemaining}d left` : 'Expired'}
            </div>
          )}
        </>
      )}

      {plot.status === 'confirmed' && (
        <>
          <div className="flex items-center gap-0.5 mt-1">
            <Clock size={9} />
            <span className="text-[10px] font-semibold">Confirmed</span>
          </div>
          {deadlineDays !== null && (
            <div className="text-[10px] mt-0.5 font-bold">
              {deadlineDays > 0 ? `${deadlineDays}d left` : 'Overdue'}
            </div>
          )}
        </>
      )}

      {plot.status === 'sold' && (
        <div className="flex items-center gap-0.5 mt-1">
          <XCircle size={9} />
          <span className="text-[10px] font-bold">SOLD</span>
        </div>
      )}
    </div>
  );
};
