import React, { useState, useEffect } from 'react';
import { StatusBadge, Tabs } from '../../components/ui/UIComponents';
import { Search, RefreshCw } from 'lucide-react';
import { formatCurrencyFull } from '../../utils/helpers';
import { api } from '../../services/api';

export const AdminBookings: React.FC = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await api.bookings.list();
      setBookings(data || []);
    } catch (e) {
      console.warn('Failed to load bookings from API:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const tabs = [
    { id: 'all', label: 'All Bookings', count: bookings.length },
    { id: 'token_paid', label: 'Token Booked', count: bookings.filter(b => b.status === 'token_paid').length },
    { id: 'confirmed', label: 'Confirmed', count: bookings.filter(b => b.status === 'confirmed').length },
    { id: 'sold', label: 'Sold Out', count: bookings.filter(b => b.status === 'sold').length },
  ];

  const filtered = bookings.filter(b => {
    const matchTab = tab === 'all' || b.status === tab;
    const matchSearch =
      !search ||
      (b.customer_name && b.customer_name.toLowerCase().includes(search.toLowerCase())) ||
      (b.booked_by_name && b.booked_by_name.toLowerCase().includes(search.toLowerCase())) ||
      (b.channel_partner_name && b.channel_partner_name.toLowerCase().includes(search.toLowerCase())) ||
      (b.plot_number && b.plot_number.toLowerCase().includes(search.toLowerCase())) ||
      (b.booking_reference && b.booking_reference.toLowerCase().includes(search.toLowerCase())) ||
      b.id.includes(search);
    return matchTab && matchSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Bookings Pipeline</h1>
          <p className="text-slate-500 text-xs font-medium mt-0.5">Live records tracking plot bookings, assigned employees/sales users, and customers</p>
        </div>
        <button
          onClick={fetchBookings}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition-colors"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 max-w-md shadow-2xs focus-within:border-sky-500">
        <Search size={15} className="text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by customer, employee, plot #, or reference..."
          className="outline-none text-xs text-slate-800 bg-transparent flex-1 placeholder:text-slate-400"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                <th className="text-left px-5 py-3.5">Booking Ref</th>
                <th className="text-left px-3 py-3.5">Plot</th>
                <th className="text-left px-4 py-3.5">Customer (Buyer)</th>
                <th className="text-left px-4 py-3.5">Booked By (Employee / User)</th>
                <th className="text-left px-3 py-3.5">Date</th>
                <th className="text-right px-4 py-3.5">Amount Paid</th>
                <th className="text-right px-4 py-3.5">Balance Due</th>
                <th className="text-left px-4 py-3.5">Deadline</th>
                <th className="text-left px-4 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400 font-medium">
                    No bookings found matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map(b => (
                  <tr key={b.id} className="table-row-hover">
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-blue-700">{b.booking_reference || b.id.slice(0, 8)}</td>
                    <td className="px-3 py-3.5 font-black text-slate-900">{b.plot_number || '—'}</td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-800">{b.customer_name}</div>
                      {b.customer_phone && <div className="text-[10px] text-slate-400 font-mono">{b.customer_phone}</div>}
                    </td>
                    <td className="px-4 py-3.5">
                      {b.booked_by_name ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200/60 font-semibold text-[11px]">
                          <span>👤 {b.booked_by_name}</span>
                          <span className="text-[9px] bg-blue-200/60 text-blue-800 px-1.5 py-0.2 rounded font-bold uppercase">Staff</span>
                        </div>
                      ) : b.channel_partner_name ? (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-900 border border-purple-200/60 font-semibold text-[11px]">
                          <span>🤝 {b.channel_partner_name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Direct / Super Admin</span>
                      )}
                    </td>
                    <td className="px-3 py-3.5 text-slate-500 font-mono">
                      {b.created_at ? new Date(b.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-right font-black text-emerald-700">{formatCurrencyFull(Number(b.amount_paid))}</td>
                    <td className="px-4 py-3.5 text-right font-black text-red-600">
                      {Number(b.balance_amount) > 0 ? formatCurrencyFull(Number(b.balance_amount)) : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 font-medium">
                      {b.status === 'token_paid' && b.token_expires_at
                        ? new Date(b.token_expires_at).toLocaleDateString()
                        : b.payment_deadline_at
                        ? new Date(b.payment_deadline_at).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-4 py-3.5"><StatusBadge status={b.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-slate-100 text-[11px] text-slate-400 font-medium bg-slate-50/50">
          Showing {filtered.length} of {bookings.length} total live bookings in PostgreSQL
        </div>
      </div>
    </div>
  );
};
