import React, { useState } from 'react';
import { Tabs } from '../../components/ui/UIComponents';
import { usePlotStore } from '../../store/plotStore';
import { useBookingStore, usePaymentStore, useChannelPartnerStore } from '../../store/stores';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download } from 'lucide-react';
import { formatCurrencyFull } from '../../utils/helpers';
import { revenueChartData } from '../../data/mockData';
import toast from 'react-hot-toast';

export const AdminReports: React.FC = () => {
  const [tab, setTab] = useState('plots');
  const { plots } = usePlotStore();
  const { bookings } = useBookingStore();
  const { payments } = usePaymentStore();
  const { channelPartners } = useChannelPartnerStore();

  const tabs = [
    { id: 'plots', label: 'Plot Inventory' },
    { id: 'bookings', label: 'Bookings Report' },
    { id: 'payments', label: 'Payments Report' },
    { id: 'partners', label: 'Partner Sales' },
    { id: 'sales', label: 'Monthly Revenue' },
  ];

  const exportCSV = () => toast.success('✓ CSV export generated (demo)');
  const exportPDF = () => toast.success('✓ PDF report generated (demo)');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Reports & Analytics</h1>
          <p className="text-slate-500 text-xs font-medium mt-0.5">Export inventory statements, collection summaries, and commission logs</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <Download size={14} />
            Export CSV
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm"
          >
            <Download size={14} />
            Export PDF
          </button>
        </div>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'plots' && (
        <div className="space-y-5 animate-fade-in">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {[
              { label: 'Total Plots', value: plots.length, color: 'text-slate-900 bg-slate-100' },
              { label: 'Available', value: plots.filter(p => p.status === 'available').length, color: 'text-emerald-800 bg-emerald-50 border border-emerald-200' },
              { label: 'Token Booked', value: plots.filter(p => p.status === 'token_booked').length, color: 'text-orange-800 bg-orange-50 border border-orange-200' },
              { label: 'Confirmed', value: plots.filter(p => p.status === 'confirmed').length, color: 'text-red-800 bg-red-50 border border-red-200' },
              { label: 'Sold Out', value: plots.filter(p => p.status === 'sold').length, color: 'text-slate-700 bg-slate-100 border border-slate-200' },
            ].map(s => (
              <div key={s.label} className={`rounded-2xl p-4 text-center ${s.color}`}>
                <div className="text-2xl font-black">{s.value}</div>
                <div className="text-[11px] font-bold mt-1 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm overflow-hidden">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3">Plot Inventory Master Sheet</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                    <th className="text-left px-4 py-2.5">Plot No</th>
                    <th className="text-right px-4 py-2.5">Area</th>
                    <th className="text-left px-4 py-2.5">Facing</th>
                    <th className="text-right px-4 py-2.5">Price</th>
                    <th className="text-left px-4 py-2.5">Status</th>
                    <th className="text-left px-4 py-2.5">Customer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {plots.map(p => (
                    <tr key={p.id} className="table-row-hover">
                      <td className="px-4 py-2.5 font-black text-slate-900">{p.plotNumber}</td>
                      <td className="px-4 py-2.5 text-right text-slate-600 font-medium">{p.area} sq.ft</td>
                      <td className="px-4 py-2.5 text-slate-600">{p.facing}</td>
                      <td className="px-4 py-2.5 text-right font-black text-slate-900">{formatCurrencyFull(p.totalPrice)}</td>
                      <td className="px-4 py-2.5 capitalize text-slate-700 font-semibold">{p.status.replace('_', ' ')}</td>
                      <td className="px-4 py-2.5 text-slate-500">{p.customerName || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'bookings' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm overflow-x-auto animate-fade-in">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                <th className="text-left px-4 py-2.5">Booking ID</th>
                <th className="text-left px-4 py-2.5">Customer Name</th>
                <th className="text-left px-4 py-2.5">Plot</th>
                <th className="text-left px-4 py-2.5">Booking Date</th>
                <th className="text-left px-4 py-2.5">Status</th>
                <th className="text-right px-4 py-2.5">Amount Paid</th>
                <th className="text-right px-4 py-2.5">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {bookings.map(b => (
                <tr key={b.id} className="table-row-hover">
                  <td className="px-4 py-2.5 font-mono text-xs font-bold text-amber-700">{b.id}</td>
                  <td className="px-4 py-2.5 font-bold text-slate-900">{b.customerName}</td>
                  <td className="px-4 py-2.5 font-black">{b.plotNumber}</td>
                  <td className="px-4 py-2.5 text-slate-500 font-mono">{b.bookingDate}</td>
                  <td className="px-4 py-2.5 capitalize text-slate-700 font-semibold">{b.status.replace('_', ' ')}</td>
                  <td className="px-4 py-2.5 text-right text-emerald-700 font-black">{formatCurrencyFull(b.amountPaid)}</td>
                  <td className="px-4 py-2.5 text-right text-red-600 font-bold">{b.balanceAmount > 0 ? formatCurrencyFull(b.balanceAmount) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm overflow-x-auto animate-fade-in">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                <th className="text-left px-4 py-2.5">Payment ID</th>
                <th className="text-left px-4 py-2.5">Customer</th>
                <th className="text-left px-4 py-2.5">Plot No</th>
                <th className="text-right px-4 py-2.5">Amount</th>
                <th className="text-left px-4 py-2.5">Type</th>
                <th className="text-left px-4 py-2.5">Method</th>
                <th className="text-left px-4 py-2.5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {payments.map(p => (
                <tr key={p.id} className="table-row-hover">
                  <td className="px-4 py-2.5 font-mono text-xs font-bold text-amber-700">{p.id}</td>
                  <td className="px-4 py-2.5 font-bold text-slate-900">{p.customerName}</td>
                  <td className="px-4 py-2.5 font-bold text-slate-800">{p.plotNumber || '—'}</td>
                  <td className="px-4 py-2.5 text-right font-black text-emerald-700">{formatCurrencyFull(p.amount)}</td>
                  <td className="px-4 py-2.5 text-slate-600 capitalize">{p.type.replace('_', ' ')}</td>
                  <td className="px-4 py-2.5 text-slate-500 capitalize">{p.method.replace('_', ' ')}</td>
                  <td className="px-4 py-2.5 text-slate-400 font-mono">{p.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'partners' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm overflow-x-auto animate-fade-in">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                <th className="text-left px-4 py-2.5">Agency Name</th>
                <th className="text-right px-4 py-2.5">Customers</th>
                <th className="text-right px-4 py-2.5">Bookings</th>
                <th className="text-right px-4 py-2.5">Plots Sold</th>
                <th className="text-right px-4 py-2.5">Total Revenue</th>
                <th className="text-right px-4 py-2.5">Commission Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {channelPartners.filter(cp => cp.status === 'approved').map(cp => (
                <tr key={cp.id} className="table-row-hover">
                  <td className="px-4 py-2.5 font-bold text-slate-900">{cp.companyName}</td>
                  <td className="px-4 py-2.5 text-right font-medium">{cp.totalCustomers}</td>
                  <td className="px-4 py-2.5 text-right font-medium">{cp.totalBookings}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-slate-900">{cp.totalSold}</td>
                  <td className="px-4 py-2.5 text-right font-black text-emerald-700">{formatCurrencyFull(cp.totalRevenue)}</td>
                  <td className="px-4 py-2.5 text-right font-black text-amber-700">{formatCurrencyFull(cp.commission)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'sales' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 animate-fade-in">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Monthly Revenue Aggregate (₹ Lakhs)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip formatter={(v: number) => [`₹${(v / 100000).toFixed(2)} Lakhs`, '']} />
              <Bar dataKey="total" name="Total Revenue" fill="#d97706" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
