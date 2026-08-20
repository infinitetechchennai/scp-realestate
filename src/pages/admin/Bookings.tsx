import React, { useState } from 'react';
import { useBookingStore } from '../../store/stores';
import { StatusBadge, Tabs } from '../../components/ui/UIComponents';
import { Search } from 'lucide-react';
import { formatCurrencyFull } from '../../utils/helpers';

export const AdminBookings: React.FC = () => {
  const { bookings } = useBookingStore();
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');

  const tabs = [
    { id: 'all', label: 'All Bookings', count: bookings.length },
    { id: 'token_paid', label: 'Token Booked', count: bookings.filter(b => b.status === 'token_paid').length },
    { id: 'confirmed', label: 'Confirmed', count: bookings.filter(b => b.status === 'confirmed').length },
    { id: 'sold', label: 'Sold Out', count: bookings.filter(b => b.status === 'sold').length },
  ];

  const filtered = bookings.filter(b => {
    const matchTab = tab === 'all' || b.status === tab;
    const matchSearch = !search || b.customerName.toLowerCase().includes(search.toLowerCase()) ||
      b.plotNumber.toLowerCase().includes(search.toLowerCase()) || b.id.includes(search);
    return matchTab && matchSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Bookings Pipeline</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Track customer bookings, token payments, payment deadlines, and balances</p>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 max-w-sm shadow-2xs focus-within:border-amber-400">
        <Search size={15} className="text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by customer, plot #, or ID..."
          className="outline-none text-xs text-slate-800 bg-transparent flex-1 placeholder:text-slate-400"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                <th className="text-left px-6 py-3.5">Booking ID</th>
                <th className="text-left px-4 py-3.5">Plot No</th>
                <th className="text-left px-4 py-3.5">Customer</th>
                <th className="text-left px-4 py-3.5">Channel Partner</th>
                <th className="text-left px-4 py-3.5">Booking Date</th>
                <th className="text-right px-4 py-3.5">Amount Paid</th>
                <th className="text-right px-4 py-3.5">Balance Due</th>
                <th className="text-left px-4 py-3.5">Deadline / Expiry</th>
                <th className="text-left px-4 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(b => (
                <tr key={b.id} className="table-row-hover">
                  <td className="px-6 py-3.5 font-mono text-xs font-bold text-amber-700">{b.id}</td>
                  <td className="px-4 py-3.5 font-black text-slate-900">{b.plotNumber}</td>
                  <td className="px-4 py-3.5 text-slate-700 font-medium">{b.customerName}</td>
                  <td className="px-4 py-3.5 text-slate-500">{b.channelPartnerName || 'Direct'}</td>
                  <td className="px-4 py-3.5 text-slate-500 font-mono">{b.bookingDate}</td>
                  <td className="px-4 py-3.5 text-right font-black text-emerald-700">{formatCurrencyFull(b.amountPaid)}</td>
                  <td className="px-4 py-3.5 text-right font-black text-red-600">
                    {b.balanceAmount > 0 ? formatCurrencyFull(b.balanceAmount) : '—'}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 font-medium">
                    {b.status === 'token_paid' ? b.tokenExpiry : b.paymentDeadline || '—'}
                  </td>
                  <td className="px-4 py-3.5"><StatusBadge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-slate-100 text-[11px] text-slate-400 font-medium bg-slate-50/50">
          Showing {filtered.length} of {bookings.length} total bookings
        </div>
      </div>
    </div>
  );
};
