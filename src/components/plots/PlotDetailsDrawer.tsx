import React, { useState } from 'react';
import { Plot } from '../../types';
import { X, MapPin, Square, Compass, DollarSign, Calendar, User, Handshake, Clock, CheckCircle, AlertCircle } from 'lucide-react';
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
  const { markAsSold } = usePlotStore();
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();

  if (!plot) return null;

  const daysRemaining = plot.tokenExpiry ? getDaysRemaining(plot.tokenExpiry) : null;
  const deadlineDays = plot.paymentDeadline ? getDaysRemaining(plot.paymentDeadline) : null;

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
      {/* Overlay */}
      <div className="drawer-overlay" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col animate-slide-in-right border-l border-slate-200">
        {/* Header */}
        <div className={`px-6 py-5 border-b flex items-start justify-between ${
          plot.status === 'available' ? 'bg-emerald-50/70 border-emerald-200' :
          plot.status === 'token_booked' ? 'bg-orange-50/70 border-orange-200' :
          plot.status === 'confirmed' ? 'bg-red-50/70 border-red-200' :
          'bg-slate-100 border-slate-200'
        }`}>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-black text-slate-900">{plot.plotNumber}</h2>
              <StatusBadge status={plot.status} size="md" />
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">{plot.projectName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-black/5 hover:text-slate-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Plot Specifications */}
          <div>
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-3">Plot Specifications</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { icon: MapPin, label: 'Location', value: plot.location },
                { icon: Square, label: 'Area', value: `${plot.area} sq.ft` },
                { icon: Square, label: 'Dimensions', value: plot.dimensions },
                { icon: Compass, label: 'Facing', value: plot.facing },
                { icon: MapPin, label: 'Road Width', value: plot.roadWidth },
                { icon: DollarSign, label: 'Price/sq.ft', value: `₹${plot.pricePerSqft.toLocaleString('en-IN')}` },
              ].map((item) => (
                <div key={item.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <item.icon size={12} className="text-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                  </div>
                  <div className="text-xs font-bold text-slate-800 truncate">{item.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 bg-gradient-to-r from-blue-50 to-sky-50 border border-sky-200 rounded-xl p-4 flex items-center justify-between shadow-2xs">
              <span className="text-xs text-blue-900 font-bold uppercase tracking-wider">Total Price</span>
              <span className="text-xl font-black text-blue-800">{formatCurrencyFull(plot.totalPrice)}</span>
            </div>
          </div>

          {/* Booking Info */}
          {plot.status !== 'available' && (
            <div>
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-3">Booking Information</h3>
              <div className="space-y-2.5 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
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
                {plot.status === 'token_booked' && plot.tokenExpiry && (
                  <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                    daysRemaining !== null && daysRemaining <= 2
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : 'bg-orange-50 border-orange-200 text-orange-800'
                  }`}>
                    <Clock size={16} className="text-orange-500 flex-shrink-0" />
                    <div>
                      <div className="text-[11px] font-bold">Expiry Date</div>
                      <div className="text-xs font-black">{plot.tokenExpiry}</div>
                      {daysRemaining !== null && (
                        <div className={`text-[10px] font-bold mt-0.5 ${daysRemaining <= 2 ? 'text-red-600' : 'text-orange-600'}`}>
                          {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'EXPIRED'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
                      <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                        deadlineDays !== null && deadlineDays <= 15
                          ? 'bg-red-50 border-red-200 text-red-800'
                          : 'bg-sky-50 border-sky-200 text-blue-900'
                      }`}>
                        <AlertCircle size={16} className={deadlineDays !== null && deadlineDays <= 15 ? 'text-red-500' : 'text-sky-600'} />
                        <div>
                          <div className="text-[11px] font-bold">90-Day Payment Deadline</div>
                          <div className="text-xs font-black">{plot.paymentDeadline}</div>
                          {deadlineDays !== null && (
                            <div className={`text-[10px] font-bold mt-0.5 ${deadlineDays <= 15 ? 'text-red-600' : 'text-sky-600'}`}>
                              {deadlineDays > 0 ? `${deadlineDays} days remaining` : 'OVERDUE'}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
                {plot.status === 'sold' && (
                  <>
                    {plot.soldDate && <InfoRow icon={Calendar} label="Sold Date" value={plot.soldDate} />}
                    {plot.finalAmount && (
                      <InfoRow icon={DollarSign} label="Final Amount" value={formatCurrencyFull(plot.finalAmount)} highlight="green" />
                    )}
                    <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl p-3">
                      <CheckCircle size={16} className="text-slate-600" />
                      <span className="text-xs font-bold text-slate-700">Transaction Fully Completed</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-2">
          {plot.status === 'available' && (
            <button
              onClick={() => setShowBookingWizard(true)}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-500/20"
            >
              Start Booking
            </button>
          )}
          {plot.status === 'token_booked' && (
            <div className="space-y-2">
              <button
                onClick={() => setShowBookingWizard(true)}
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
              >
                Continue & Confirm Booking
              </button>
            </div>
          )}
          {plot.status === 'confirmed' && (
            <div className="space-y-2">
              {user?.role === 'super_admin' && (
                <button
                  onClick={() => setShowSoldConfirm(true)}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
                >
                  Mark as SOLD
                </button>
              )}
            </div>
          )}
          {plot.status === 'sold' && (
            <div className="w-full py-3 bg-slate-200 text-slate-600 rounded-xl font-bold text-xs text-center uppercase tracking-wider">
              Plot Sold Out
            </div>
          )}
        </div>
      </div>

      {/* Booking Wizard */}
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
  <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
    <div className="flex items-center gap-2 text-slate-500">
      <Icon size={14} className="text-slate-400" />
      <span className="text-xs font-semibold">{label}</span>
    </div>
    <span className={`text-xs font-bold ${
      highlight === 'green' ? 'text-emerald-700 font-black' :
      highlight === 'red' ? 'text-red-600 font-black' :
      'text-slate-800'
    }`}>{value}</span>
  </div>
);
