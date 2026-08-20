import React, { useState } from 'react';
import { Plot } from '../../types';
import { PlotMap } from '../../components/plots/PlotMap';
import { PlotDetailsDrawer } from '../../components/plots/PlotDetailsDrawer';
import { usePlotStore } from '../../store/plotStore';
import { useAuthStore } from '../../store/authStore';
import { useBookingStore, usePaymentStore, useNotificationStore } from '../../store/stores';
import { mockCustomers, mockProjects } from '../../data/mockData';
import { DashboardCard } from '../../components/ui/UIComponents';
import { StatusBadge } from '../../components/ui/UIComponents';
import { Map, BookOpen, CreditCard, Bell, DollarSign, CheckCircle } from 'lucide-react';
import { formatCurrencyFull, formatCurrency } from '../../utils/helpers';

// ── Customer Dashboard ────────────────────────────────────
export const CustomerDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { plots } = usePlotStore();
  const { bookings } = useBookingStore();
  const { payments } = usePaymentStore();

  const me = mockCustomers.find(c => c.email === user?.email) || mockCustomers[8];
  const myBookings = bookings.filter(b => b.customerId === me?.id);
  const myPayments = payments.filter(p => p.customerId === me?.id);
  const totalPaid = myPayments.reduce((s, p) => s + p.amount, 0);
  const availablePlots = plots.filter(p => p.status === 'available').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Welcome, {me?.name || user?.name}!</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Buyer Portal — Track your booked plots, balance schedules, and documents</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <DashboardCard title="Available Plots" value={availablePlots} icon={Map} iconColor="text-emerald-600" subtitle="Ready for selection" />
        <DashboardCard title="My Bookings" value={myBookings.length} icon={BookOpen} iconColor="text-amber-600" />
        <DashboardCard title="Total Paid" value={formatCurrency(totalPaid)} icon={CreditCard} iconColor="text-emerald-700" />
        <DashboardCard title="Balance Due" value={formatCurrency(me?.totalBalance || 0)} icon={DollarSign} iconColor="text-red-500" />
        <DashboardCard title="Token Bookings" value={myBookings.filter(b => b.status === 'token_paid').length} icon={CheckCircle} iconColor="text-orange-500" />
        <DashboardCard title="Confirmed Plots" value={myBookings.filter(b => b.status === 'confirmed').length} icon={CheckCircle} iconColor="text-red-600" />
      </div>

      {/* Active Deals Table */}
      {myBookings.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">My Active Plot Bookings</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                  <th className="text-left px-6 py-3.5">Plot No</th>
                  <th className="text-left px-4 py-3.5">Township</th>
                  <th className="text-right px-4 py-3.5">Total Amount</th>
                  <th className="text-right px-4 py-3.5">Paid So Far</th>
                  <th className="text-right px-4 py-3.5">Balance Due</th>
                  <th className="text-left px-4 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {myBookings.map(b => (
                  <tr key={b.id} className="table-row-hover">
                    <td className="px-6 py-3.5 font-black text-slate-900">{b.plotNumber}</td>
                    <td className="px-4 py-3.5 text-slate-600 font-medium">{b.projectName}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-900">{formatCurrencyFull(b.totalAmount)}</td>
                    <td className="px-4 py-3.5 text-right font-black text-emerald-700">{formatCurrencyFull(b.amountPaid)}</td>
                    <td className="px-4 py-3.5 text-right font-black text-red-600">
                      {b.balanceAmount > 0 ? formatCurrencyFull(b.balanceAmount) : '—'}
                    </td>
                    <td className="px-4 py-3.5"><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Customer Browse Plots ─────────────────────────────────
export const CustomerPlots: React.FC = () => {
  const { plots } = usePlotStore();
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Explore Master Plan</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Click any available (green) plot on the map to review specifications and initiate token booking</p>
      </div>
      <PlotMap plots={plots} onPlotClick={setSelectedPlot} />
      <PlotDetailsDrawer plot={selectedPlot} onClose={() => setSelectedPlot(null)} />
    </div>
  );
};

// ── Customer Projects ─────────────────────────────────────
export const CustomerProjects: React.FC = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="text-2xl font-black text-slate-900">Featured Townships</h1>
      <p className="text-slate-500 text-xs font-medium mt-0.5">Premium HMDA & RERA approved residential layouts</p>
    </div>
    <div className="grid gap-6">
      {mockProjects.filter(p => p.status === 'active').map(proj => (
        <div key={proj.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
          <div className="h-48 md:h-auto md:w-80 relative overflow-hidden bg-slate-900 flex-shrink-0">
            {proj.imageUrl && <img src={proj.imageUrl} alt={proj.name} className="w-full h-full object-cover opacity-70" />}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
            <div className="absolute bottom-4 left-5 text-white">
              <h3 className="font-black text-xl">{proj.name}</h3>
              <p className="text-slate-300 text-xs">{proj.location}</p>
            </div>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-between">
            <p className="text-slate-600 text-xs font-medium mb-4 leading-relaxed">{proj.description}</p>
            <div className="grid grid-cols-4 gap-2.5">
              {[
                { label: 'Total Plots', value: proj.totalPlots, color: 'text-slate-900' },
                { label: 'Available', value: proj.availablePlots, color: 'text-emerald-700' },
                { label: 'Booked', value: proj.tokenBookedPlots + proj.confirmedPlots, color: 'text-orange-600' },
                { label: 'Sold Out', value: proj.soldPlots, color: 'text-slate-500' },
              ].map(s => (
                <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                  <div className={`text-base font-black ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ── Customer Bookings ─────────────────────────────────────
export const CustomerBookings: React.FC = () => {
  const { user } = useAuthStore();
  const { bookings } = useBookingStore();
  const me = mockCustomers.find(c => c.email === user?.email) || mockCustomers[8];
  const myBookings = bookings.filter(b => b.customerId === me?.id);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900">My Plot Bookings</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Overview of active plots, token receipts, and balance deadlines</p>
      </div>

      {myBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <BookOpen size={40} className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-slate-700 font-bold text-sm">No Active Bookings</h3>
          <p className="text-slate-400 text-xs mt-1">Browse available plots on the master plan map to start a booking</p>
        </div>
      ) : (
        <div className="space-y-4">
          {myBookings.map(b => (
            <div key={b.id} className={`bg-white rounded-2xl border-2 shadow-xs p-6 ${
              b.status === 'token_paid' ? 'border-orange-200 bg-orange-50/20' :
              b.status === 'confirmed' ? 'border-red-200 bg-red-50/20' : 'border-slate-200'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900">{b.plotNumber} — {b.projectName}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">Booking Date: {b.bookingDate}</p>
                </div>
                <StatusBadge status={b.status} size="md" />
              </div>
              <div className="grid grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-slate-100">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Value</p>
                  <p className="font-black text-slate-900 text-sm mt-0.5">{formatCurrencyFull(b.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Amount Paid</p>
                  <p className="font-black text-emerald-700 text-sm mt-0.5">{formatCurrencyFull(b.amountPaid)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Balance Due</p>
                  <p className={`font-black text-sm mt-0.5 ${b.balanceAmount > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                    {b.balanceAmount > 0 ? formatCurrencyFull(b.balanceAmount) : '✓ Cleared'}
                  </p>
                </div>
              </div>
              {b.status === 'token_paid' && (
                <div className="mt-3 text-xs bg-orange-50 border border-orange-200 rounded-xl p-3 text-orange-950 font-bold">
                  ⏳ 7-Day Token Hold Expiry: {b.tokenExpiry}
                </div>
              )}
              {b.status === 'confirmed' && b.paymentDeadline && (
                <div className="mt-3 text-xs bg-red-50 border border-red-200 rounded-xl p-3 text-red-950 font-bold">
                  ⚠️ 90-Day Settlement Deadline: {b.paymentDeadline}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Customer Payments ─────────────────────────────────────
export const CustomerPayments: React.FC = () => {
  const { user } = useAuthStore();
  const { payments } = usePaymentStore();
  const me = mockCustomers.find(c => c.email === user?.email) || mockCustomers[8];
  const myPayments = payments.filter(p => p.customerId === me?.id);
  const total = myPayments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Payment Receipts</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Receipts and verification confirmations for all transactions</p>
      </div>
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center justify-between shadow-2xs">
        <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">Total Payments Settled</span>
        <span className="text-2xl font-black text-emerald-800">{formatCurrencyFull(total)}</span>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
              <th className="text-left px-6 py-3.5">Payment Date</th>
              <th className="text-left px-4 py-3.5">Plot No</th>
              <th className="text-left px-4 py-3.5">Payment Type</th>
              <th className="text-left px-4 py-3.5">Method</th>
              <th className="text-right px-4 py-3.5">Amount Paid</th>
              <th className="text-left px-4 py-3.5">Bank Reference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {myPayments.map(p => (
              <tr key={p.id} className="table-row-hover">
                <td className="px-6 py-3.5 text-slate-500 font-mono text-[11px]">{p.date}</td>
                <td className="px-4 py-3.5 font-black text-slate-900">{p.plotNumber || '—'}</td>
                <td className="px-4 py-3.5 text-slate-600 capitalize">{p.type.replace('_', ' ')}</td>
                <td className="px-4 py-3.5 text-slate-500 capitalize">{p.method.replace('_', ' ')}</td>
                <td className="px-4 py-3.5 text-right font-black text-emerald-700">{formatCurrencyFull(p.amount)}</td>
                <td className="px-4 py-3.5 font-mono text-slate-400 text-[11px]">{p.reference || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Customer Documents ────────────────────────────────────
export const CustomerDocuments: React.FC = () => {
  const docs = [
    { name: 'Aadhar Card KYC Verification', status: 'verified' },
    { name: 'PAN Card Verification', status: 'verified' },
    { name: 'Sale Agreement Deed - Plot P-018', status: 'pending_verification' },
    { name: 'Token Advance Official Receipt', status: 'verified' },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900">My Legal Documents</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Access official deeds, receipts, and KYC verifications</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="space-y-3 divide-y divide-slate-100">
          {docs.map(doc => (
            <div key={doc.name} className="flex items-center justify-between py-3 first:pt-0">
              <span className="text-xs font-bold text-slate-800">{doc.name}</span>
              <StatusBadge status={doc.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Customer Notifications ────────────────────────────────
export const CustomerNotifications: React.FC = () => {
  const { notifications, markRead, markAllRead } = useNotificationStore();
  const userNotifs = notifications.filter(n => n.targetRoles.includes('customer'));

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Notifications</h1>
          <p className="text-slate-500 text-xs font-medium mt-0.5">Booking alerts, payment deadlines, and status updates</p>
        </div>
        <button onClick={markAllRead} className="text-xs text-amber-600 hover:text-amber-700 font-bold">Mark all read</button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {userNotifs.map(n => (
          <div key={n.id} onClick={() => markRead(n.id)}
            className={`flex gap-4 px-6 py-4 cursor-pointer hover:bg-slate-50 transition-colors ${!n.isRead ? 'bg-amber-50/40' : ''}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${!n.isRead ? 'bg-amber-100 border-amber-200' : 'bg-slate-100 border-slate-200'}`}>
              <Bell size={16} className={!n.isRead ? 'text-amber-700' : 'text-slate-400'} />
            </div>
            <div className="flex-1">
              <p className={`text-xs font-bold ${!n.isRead ? 'text-slate-950 font-black' : 'text-slate-700'}`}>{n.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">{new Date(n.createdAt).toLocaleDateString('en-IN')}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Customer Profile ──────────────────────────────────────
export const CustomerProfile: React.FC = () => {
  const { user } = useAuthStore();
  const me = mockCustomers.find(c => c.email === user?.email) || mockCustomers[8];

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Buyer Profile</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Your personal information and channel partner assignment</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-950 text-2xl font-black shadow-sm">
            {me?.name?.charAt(0) || 'C'}
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">{me?.name}</h2>
            <p className="text-slate-500 text-xs font-medium">Verified Property Buyer</p>
            <div className="mt-1.5"><StatusBadge status={me?.status || 'active'} /></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Email Address', value: me?.email },
            { label: 'Mobile Number', value: me?.phone },
            { label: 'Permanent Address', value: me?.address },
            { label: 'Aadhar Card Number', value: me?.aadhar },
            { label: 'PAN Card Number', value: me?.pan },
            { label: 'Assigned Channel Partner', value: me?.assignedChannelPartnerName || 'Direct Booking' },
          ].map(item => (
            <div key={item.label} className={item.label.includes('Address') ? 'col-span-2' : ''}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{item.label}</p>
              <p className="text-xs text-slate-800 font-semibold">{item.value || '—'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
