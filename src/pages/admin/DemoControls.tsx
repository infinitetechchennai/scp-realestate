import React, { useState } from 'react';
import { usePlotStore } from '../../store/plotStore';
import { useBookingStore, usePaymentStore, useNotificationStore, useCustomerStore } from '../../store/stores';
import { Zap, RotateCcw, Clock, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateId } from '../../utils/helpers';

export const DemoControls: React.FC = () => {
  const { plots, releaseTokenExpired, releaseConfirmedExpired, resetPlots } = usePlotStore();
  const { bookings, resetBookings } = useBookingStore();
  const { payments, resetPayments } = usePaymentStore();
  const { notifications, resetNotifications, addNotification } = useNotificationStore();
  const { customers } = useCustomerStore();

  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => setLog(l => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...l.slice(0, 19)]);

  const simulateTokenExpiry = () => {
    const tokenPlots = plots.filter(p => p.status === 'token_booked');
    if (tokenPlots.length === 0) { toast('No token-booked plots to expire'); return; }
    tokenPlots.forEach(p => {
      releaseTokenExpired(p.id);
      addNotification({
        id: generateId('notif'),
        type: 'booking_expired',
        title: 'Token Booking Expired',
        message: `Token booking for Plot ${p.plotNumber} (${p.customerName}) has expired. Plot is now available.`,
        isRead: false,
        createdAt: new Date().toISOString(),
        targetRoles: ['super_admin', 'channel_partner', 'customer'],
      });
      addLog(`✓ Token booking expired: ${p.plotNumber} → AVAILABLE`);
    });
    toast.success(`✓ Simulated 7-day expiry: ${tokenPlots.length} plot(s) released`);
  };

  const simulateConfirmedExpiry = () => {
    const confirmedPlots = plots.filter(p => p.status === 'confirmed');
    if (confirmedPlots.length === 0) { toast('No confirmed plots to expire'); return; }
    confirmedPlots.forEach(p => {
      releaseConfirmedExpired(p.id);
      addNotification({
        id: generateId('notif'),
        type: 'booking_expired',
        title: '90-Day Booking Expired',
        message: `Booking for Plot ${p.plotNumber} (${p.customerName}) exceeded 90 days. Plot is now available.`,
        isRead: false,
        createdAt: new Date().toISOString(),
        targetRoles: ['super_admin', 'channel_partner', 'customer'],
      });
      addLog(`✓ 90-day booking expired: ${p.plotNumber} → AVAILABLE`);
    });
    toast.success(`✓ Simulated 90-day expiry: ${confirmedPlots.length} plot(s) released`);
  };

  const resetAll = () => {
    resetPlots();
    resetBookings();
    resetPayments();
    resetNotifications();
    setLog([]);
    toast.success('✓ Demo data reset to initial state');
    addLog('✓ All demo data reset to initial state');
  };

  const stats = {
    plots: plots.length,
    available: plots.filter(p => p.status === 'available').length,
    token: plots.filter(p => p.status === 'token_booked').length,
    confirmed: plots.filter(p => p.status === 'confirmed').length,
    sold: plots.filter(p => p.status === 'sold').length,
    bookings: bookings.length,
    payments: payments.length,
    customers: customers.length,
    unread: notifications.filter(n => !n.isRead).length,
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Demo Testing Controls</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Simulate automatic business rules, countdown expiries, and state transitions on the frontend</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
        <AlertTriangle size={18} className="text-amber-700 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs font-black text-amber-950 uppercase tracking-wider">Frontend Simulation Mode</p>
          <p className="text-xs text-amber-900 font-medium mt-0.5">Use these buttons to instantly trigger the automatic 7-day token expiry or 90-day booking expiry rules without waiting real calendar days.</p>
        </div>
      </div>

      {/* Current State Stats */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-xs font-black text-slate-400 mb-4 uppercase tracking-wider">Current Inventory & Transaction State</h3>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {[
            { label: 'Total Plots', value: stats.plots, color: 'text-slate-900' },
            { label: 'Available', value: stats.available, color: 'text-emerald-700' },
            { label: 'Token Booked', value: stats.token, color: 'text-orange-600' },
            { label: 'Confirmed', value: stats.confirmed, color: 'text-red-600' },
            { label: 'Sold Out', value: stats.sold, color: 'text-slate-600' },
            { label: 'Bookings', value: stats.bookings, color: 'text-amber-700' },
            { label: 'Payments', value: stats.payments, color: 'text-emerald-700' },
            { label: 'Customers', value: stats.customers, color: 'text-stone-700' },
            { label: 'Unread Alerts', value: stats.unread, color: 'text-red-500' },
          ].map(s => (
            <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
              <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Simulation Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DemoButton
          icon={Clock}
          title="Simulate 7-Day Token Expiry"
          description={`Automatically expire all ${stats.token} token-booked plot(s) and return them to Available`}
          color="orange"
          onClick={simulateTokenExpiry}
        />
        <DemoButton
          icon={AlertTriangle}
          title="Simulate 90-Day Balance Expiry"
          description={`Expire ${stats.confirmed} confirmed plot(s) exceeding the 90-day deadline`}
          color="red"
          onClick={simulateConfirmedExpiry}
        />
        <DemoButton
          icon={RotateCcw}
          title="Reset All Demo Data"
          description="Restore all 40 plots, bookings, customer allocations, and notifications to defaults"
          color="gray"
          onClick={resetAll}
        />
        <DemoButton
          icon={Zap}
          title="Jump to Master Plan Map"
          description="Open the visual plot layout grid to interact with plots live"
          color="amber"
          onClick={() => window.location.href = '/admin/plot-layout'}
        />
      </div>

      {/* Activity Log */}
      {log.length > 0 && (
        <div className="bg-[#0c0f17] border border-[#1e2638] rounded-2xl p-5 shadow-lg">
          <h3 className="text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-wider">Simulation Event Log</h3>
          <div className="space-y-1.5 max-h-40 overflow-y-auto font-mono text-xs text-amber-400">
            {log.map((entry, i) => (
              <p key={i} className="opacity-90">{entry}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const DemoButton: React.FC<{
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  onClick: () => void;
}> = ({ icon: Icon, title, description, color, onClick }) => {
  const colorMap: Record<string, string> = {
    orange: 'border-orange-200 hover:border-orange-400 hover:bg-orange-50/50',
    red: 'border-red-200 hover:border-red-400 hover:bg-red-50/50',
    gray: 'border-slate-200 hover:border-slate-400 hover:bg-slate-50',
    amber: 'border-amber-200 hover:border-amber-400 hover:bg-amber-50/50',
  };
  const iconMap: Record<string, string> = {
    orange: 'text-orange-600 bg-orange-100',
    red: 'text-red-600 bg-red-100',
    gray: 'text-slate-600 bg-slate-100',
    amber: 'text-amber-800 bg-amber-100',
  };

  return (
    <button
      onClick={onClick}
      className={`bg-white border-2 rounded-2xl p-5 text-left transition-all duration-150 w-full shadow-2xs ${colorMap[color]}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${iconMap[color]}`}>
        <Icon size={20} />
      </div>
      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">{title}</h4>
      <p className="text-xs text-slate-500 font-medium mt-1">{description}</p>
    </button>
  );
};
