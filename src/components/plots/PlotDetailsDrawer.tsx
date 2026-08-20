import React, { useState, useEffect } from 'react';
import { Plot } from '../../types';
import { X, MapPin, Square, Compass, DollarSign, Calendar, User, Handshake, Clock, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { StatusBadge, ConfirmationModal } from '../ui/UIComponents';
import { formatCurrencyFull, getDaysRemaining } from '../../utils/helpers';
import { usePlotStore } from '../../store/plotStore';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/stores';
import toast from 'react-hot-toast';
import { BookingWizard } from '../booking/BookingWizard';

interface PlotDetailsDrawerProps {
  plot: Plot | null;
  onClose: () => void;
}

export const PlotDetailsDrawer: React.FC<PlotDetailsDrawerProps> = ({ plot, onClose }) => {
  const [showBookingWizard, setShowBookingWizard] = useState(false);
  const [showSoldConfirm, setShowSoldConfirm] = useState(false);
  const { markAsSold, tokenRequired } = usePlotStore();
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();

  // Prevent background body scroll when drawer is open
  useEffect(() => {
    if (plot) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [plot]);

  if (!plot) return null;

  const daysRemaining = plot.tokenExpiry ? getDaysRemaining(plot.tokenExpiry) : null;
  const deadlineDays = plot.paymentDeadline ? getDaysRemaining(plot.paymentDeadline) : null;
  const tokenAmt = plot.tokenAmount || tokenRequired || 100000;

  const handleMarkSold = () => {
    markAsSold(plot.id);
    addNotification({
      id: `notif-sold-${Date.now()}`,
      type: 'plot_sold',
      title: 'Plot Marked as SOLD',
      message: `Plot ${plot.plotNumber} has been marked as SOLD. Customer: ${plot.customerName}.`,
      isRead: false,
      createdAt: new Date().toISOString(),
      targetRoles: ['super_admin'],
    });
    toast.success(`✓ Plot ${plot.plotNumber} marked as SOLD`);
    onClose();
  };

  return (
    <>
      {/* Overlay Backdrop */}
      <div className="drawer-overlay" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-slate-50 z-50 shadow-2xl flex flex-col animate-slide-in-right border-l border-slate-200">
        {/* Header */}
        <div className={`px-5 py-4 border-b flex items-start justify-between bg-white ${
          plot.status === 'available' ? 'border-b-emerald-200' :
          plot.status === 'token_booked' ? 'border-b-orange-200' :
          plot.status === 'confirmed' ? 'border-b-red-200' :
          'border-b-slate-200'
        }`}>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-black text-slate-900">{plot.plotNumber}</h2>
              <StatusBadge status={plot.status} size="md" />
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{plot.projectName || 'Green Valley Township'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 overscroll-contain">
          {/* Plot Specifications Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2.5">Plot Specifications</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: MapPin, label: 'Location', value: plot.location },
                { icon: Square, label: 'Area', value: `${plot.area} sq.ft` },
                { icon: Square, label: 'Dimensions', value: plot.dimensions || '30×50' },
                { icon: Compass, label: 'Facing', value: plot.facing || 'East' },
                { icon: MapPin, label: 'Road Width', value: plot.roadWidth || '20 ft' },
                { icon: DollarSign, label: 'Price/sq.ft', value: `₹${plot.pricePerSqft.toLocaleString('en-IN')}` },
              ].map((item) => (
                <div key={item.label} className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-0.5">
                    <item.icon size={11} className="text-slate-400" />
                    <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
                  </div>
                  <div className="text-xs font-bold text-slate-800 truncate">{item.value}</div>
                </div>
              ))}
            </div>

            {/* Total Price Box */}
            <div className="mt-3 bg-gradient-to-r from-blue-50 to-sky-50 border border-sky-200 rounded-xl p-3.5 flex items-center justify-between shadow-2xs">
              <span className="text-xs text-blue-900 font-bold uppercase tracking-wider">Total Price</span>
              <span className="text-xl font-black text-blue-800">{formatCurrencyFull(plot.totalPrice)}</span>
            </div>
          </div>

          {/* Token Advance Callout Note (Available Plots) */}
          {plot.status === 'available' && (
            <div className="bg-white rounded-2xl p-4 border border-sky-200 shadow-2xs space-y-3">
              <div className="flex items-start gap-2.5">
                <Sparkles size={16} className="text-sky-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-sky-950 leading-relaxed font-medium">
                  <span className="font-bold text-blue-900">Token Advance Required:</span>{' '}
                  <span className="font-black text-blue-900">{formatCurrencyFull(tokenAmt)}</span> to block this plot for 7 days.
                </div>
              </div>

              {/* Start Booking Button */}
              <button
                type="button"
                onClick={() => setShowBookingWizard(true)}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-500/20 active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <CheckCircle size={16} />
                Start Booking
              </button>
            </div>
          )}

          {/* Booking Info Card (For Token Booked / Confirmed / Sold Plots) */}
          {plot.status !== 'available' && (
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Booking Information</h3>
              <div className="space-y-2 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                {plot.customerName && (
                  <InfoRow icon={User} label="Customer" value={plot.customerName} />
                )}
                {plot.channelPartnerName && (
                  <InfoRow icon={Handshake} label="Channel Partner" value={plot.channelPartnerName} />
                )}
                {plot.tokenAmount && (
                  <InfoRow icon={DollarSign} label="Token Amount" value={formatCurrencyFull(plot.tokenAmount)} />
                )}
                {plot.tokenDate && (
                  <InfoRow icon={Calendar} label="Token Date" value={plot.tokenDate} />
                )}

                {/* Token Expiry Banner */}
                {plot.status === 'token_booked' && plot.tokenExpiry && (
                  <div className={`flex items-center gap-2.5 p-2.5 rounded-xl border mt-2 ${
                    daysRemaining !== null && daysRemaining <= 2
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : 'bg-orange-50 border-orange-200 text-orange-800'
                  }`}>
                    <Clock size={16} className="text-orange-500 flex-shrink-0" />
                    <div>
                      <div className="text-[10px] font-bold">7-Day Token Expiry: <span className="font-black text-xs">{plot.tokenExpiry}</span></div>
                      {daysRemaining !== null && (
                        <div className={`text-[10px] font-bold ${daysRemaining <= 2 ? 'text-red-600' : 'text-orange-600'}`}>
                          {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'EXPIRED'}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Confirmed Balance Info */}
                {plot.status === 'confirmed' && (
                  <>
                    {plot.confirmedDate && <InfoRow icon={Calendar} label="Confirmed Date" value={plot.confirmedDate} />}
                    {plot.totalPaid !== undefined && (
                      <InfoRow icon={DollarSign} label="Amount Paid" value={formatCurrencyFull(plot.totalPaid)} highlight="green" />
                    )}
                    {plot.balanceDue !== undefined && plot.balanceDue > 0 && (
                      <InfoRow icon={DollarSign} label="Balance Due" value={formatCurrencyFull(plot.balanceDue)} highlight="red" />
                    )}
                    {plot.paymentDeadline && (
                      <div className={`flex items-center gap-2.5 p-2.5 rounded-xl border mt-2 ${
                        deadlineDays !== null && deadlineDays <= 15
                          ? 'bg-red-50 border-red-200 text-red-800'
                          : 'bg-sky-50 border-sky-200 text-blue-900'
                      }`}>
                        <AlertCircle size={16} className={deadlineDays !== null && deadlineDays <= 15 ? 'text-red-500' : 'text-sky-600'} />
                        <div>
                          <div className="text-[10px] font-bold">90-Day Deadline: <span className="font-black text-xs">{plot.paymentDeadline}</span></div>
                          {deadlineDays !== null && (
                            <div className={`text-[10px] font-bold ${deadlineDays <= 15 ? 'text-red-600' : 'text-sky-600'}`}>
                              {deadlineDays > 0 ? `${deadlineDays} days remaining` : 'OVERDUE'}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Sold Banner */}
                {plot.status === 'sold' && (
                  <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl p-2.5 mt-2">
                    <CheckCircle size={15} className="text-slate-600" />
                    <span className="text-xs font-bold text-slate-700">Transaction Fully Completed & Registered</span>
                  </div>
                )}
              </div>

              {/* Action Buttons for Booked / Confirmed plots */}
              <div className="pt-2">
                {plot.status === 'token_booked' && (
                  <button
                    type="button"
                    onClick={() => setShowBookingWizard(true)}
                    className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
                  >
                    Continue & Confirm Booking
                  </button>
                )}

                {plot.status === 'confirmed' && (
                  user?.role === 'super_admin' ? (
                    <button
                      type="button"
                      onClick={() => setShowSoldConfirm(true)}
                      className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
                    >
                      Mark as SOLD
                    </button>
                  ) : (
                    <div className="w-full py-3 bg-red-50 text-red-800 border border-red-200 rounded-xl font-bold text-xs text-center uppercase tracking-wider">
                      Booking Confirmed (Awaiting Final Payment)
                    </div>
                  )
                )}

                {plot.status === 'sold' && (
                  <div className="w-full py-3 bg-slate-200 text-slate-600 rounded-xl font-bold text-xs text-center uppercase tracking-wider">
                    Plot Sold Out
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Booking Wizard Modal */}
      {showBookingWizard && (
        <BookingWizard
          plot={plot}
          onClose={() => { setShowBookingWizard(false); onClose(); }}
        />
      )}

      {/* Mark as Sold Confirmation */}
      <ConfirmationModal
        isOpen={showSoldConfirm}
        onClose={() => setShowSoldConfirm(false)}
        onConfirm={handleMarkSold}
        title={`Mark Plot ${plot.plotNumber} as SOLD`}
        danger
        confirmLabel="Yes, Mark as SOLD"
        message={
          <div className="space-y-2 text-xs">
            <p>Are you sure you want to mark <strong>{plot.plotNumber}</strong> as SOLD?</p>
            <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 border border-slate-100">
              <div className="flex justify-between"><span className="text-slate-500">Customer:</span><span className="font-bold">{plot.customerName}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Total Amount:</span><span className="font-bold text-emerald-700">{formatCurrencyFull(plot.totalPrice)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Amount Paid:</span><span className="font-bold">{formatCurrencyFull(plot.totalPaid || 0)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Balance:</span><span className={`font-black ${(plot.balanceDue || 0) === 0 ? 'text-emerald-700' : 'text-red-600'}`}>{formatCurrencyFull(plot.balanceDue || 0)}</span></div>
            </div>
            <p className="text-red-600 font-bold">This action cannot be undone.</p>
          </div>
        }
      />
    </>
  );
};

const InfoRow: React.FC<{ icon: React.ElementType; label: string; value: string; highlight?: 'green' | 'red' }> = ({
  icon: Icon, label, value, highlight
}) => (
  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
    <div className="flex items-center gap-2 text-slate-500">
      <Icon size={13} className="text-slate-400" />
      <span className="text-xs font-semibold">{label}</span>
    </div>
    <span className={`text-xs font-bold ${
      highlight === 'green' ? 'text-emerald-700 font-black' :
      highlight === 'red' ? 'text-red-600 font-black' :
      'text-slate-800'
    }`}>{value}</span>
  </div>
);
