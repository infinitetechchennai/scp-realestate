import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/stores';
import { DashboardCard } from '../../components/ui/UIComponents';
import { Users, BookOpen, CheckCircle, IndianRupee, Award, TrendingUp, Clock, Star, Sparkles, Megaphone } from 'lucide-react';
import { formatCurrency, formatCurrencyFull } from '../../utils/helpers';
import { api } from '../../services/api';

const isMyChannelBooking = (b: any, user: any) => {
  if (!user) return false;
  const userName = (user.name || '').trim().toLowerCase();
  const userEmail = (user.email || '').trim().toLowerCase();
  const userId = user.id;

  const bCpId = b.channel_partner_id || b.channelPartnerId;
  const bCpName = (b.channel_partner_name || b.channelPartnerName || '').trim().toLowerCase();
  const bBookedById = b.booked_by_user_id || b.bookedByUserId;
  const bBookedByName = (b.booked_by_name || b.bookedByName || '').trim().toLowerCase();
  const bBookedByEmail = (b.booked_by_email || b.bookedByEmail || '').trim().toLowerCase();

  // 1. Direct ID matching (User ID or Channel Partner ID)
  if (userId && (bCpId === userId || bBookedById === userId)) return true;

  // 2. Name matching (Channel Partner name or Booked By User name)
  if (userName) {
    if (bCpName && (bCpName === userName || bCpName.includes(userName) || userName.includes(bCpName))) return true;
    if (bBookedByName && (bBookedByName === userName || bBookedByName.includes(userName) || userName.includes(bBookedByName))) return true;
  }

  // 3. Email matching
  if (userEmail) {
    if (bCpName && (bCpName === userEmail || bCpName.includes(userEmail))) return true;
    if (bBookedByEmail && (bBookedByEmail === userEmail || bBookedByEmail.includes(userEmail))) return true;
  }

  return false;
};

export const ChannelDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { notifications, fetchNotifications } = useNotificationStore();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    api.bookings.list()
      .then(data => setBookings(data || []))
      .catch(() => [])
      .finally(() => setLoading(false));
  }, []);

  const myBookings = bookings.filter(b => isMyChannelBooking(b, user));
  const tokenBookings = myBookings.filter(b => b.status === 'token_paid' || b.status === 'token_booked').length;
  const confirmedBookings = myBookings.filter(b => b.status === 'confirmed').length;
  const soldBookings = myBookings.filter(b => b.status === 'sold').length;

  const totalSales = myBookings.reduce((sum, b) => sum + Number(b.amount_paid || b.amountPaid || 0), 0);
  const totalBalance = myBookings.reduce((sum, b) => sum + Number(b.balance_amount || b.balanceAmount || 0), 0);
  const uniqueCustomers = new Set(myBookings.map(b => b.customer_id || b.customer_name)).size;

  const latestOffers = notifications.filter(n => n.type === 'offer' || n.type === 'announcement');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Welcome, {user?.name}!</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Partner Agency Pipeline & Sales Dashboard</p>
      </div>

      {/* Latest Broadcast Offer Banner */}
      {latestOffers.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white rounded-2xl shadow-md space-y-2 border border-blue-400/30">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Sparkles size={16} className="text-amber-300" />
            </div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-sky-100">Active Admin Broadcast / Offer</span>
          </div>
          <div>
            <h3 className="text-sm font-black">{latestOffers[0].title}</h3>
            <p className="text-xs text-blue-100 mt-0.5 leading-relaxed">{latestOffers[0].message}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <DashboardCard title="My Clients" value={uniqueCustomers} icon={Users} iconColor="text-blue-700" />
        <DashboardCard title="Total Bookings" value={myBookings.length} icon={TrendingUp} iconColor="text-sky-600" />
        <DashboardCard title="Token Bookings" value={tokenBookings} icon={Clock} iconColor="text-orange-500" />
        <DashboardCard title="Confirmed" value={confirmedBookings} icon={BookOpen} iconColor="text-red-600" />
        <DashboardCard title="Plots Sold" value={soldBookings} icon={CheckCircle} iconColor="text-slate-600" />
        <DashboardCard title="Total Collections" value={formatCurrencyFull(totalSales)} icon={IndianRupee} iconColor="text-emerald-600" />
      </div>

      {/* Recent Booking Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Recent Booking Transactions</h3>
          <a href="/channel/bookings" className="text-xs text-blue-600 hover:text-blue-700 font-bold">View All Bookings →</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                <th className="text-left px-6 py-3.5">Booking ID</th>
                <th className="text-left px-4 py-3.5">Plot Number</th>
                <th className="text-left px-4 py-3.5">Customer (Buyer)</th>
                <th className="text-left px-4 py-3.5">Date</th>
                <th className="text-right px-4 py-3.5">Amount Paid</th>
                <th className="text-right px-4 py-3.5">Balance Due</th>
                <th className="text-left px-4 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 font-medium">
                    Loading your agency bookings...
                  </td>
                </tr>
              ) : myBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 font-medium">
                    No bookings recorded for your agency yet.
                  </td>
                </tr>
              ) : (
                myBookings.slice(0, 5).map(b => {
                  const plotNum = b.plot_number || b.plotNumber || '—';
                  const paid = Number(b.amount_paid || b.amountPaid || 0);
                  const balance = Number(b.balance_amount || b.balanceAmount || 0);
                  return (
                    <tr key={b.id} className="table-row-hover">
                      <td className="px-6 py-3.5 font-mono font-bold text-blue-700">
                        {b.booking_reference || b.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">{plotNum}</td>
                      <td className="px-4 py-3.5 font-medium text-slate-800">{b.customer_name || b.customerName || 'Client'}</td>
                      <td className="px-4 py-3.5 text-slate-500 font-mono">
                        {b.created_at || b.booking_date ? new Date(b.created_at || b.booking_date).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-emerald-700">{formatCurrencyFull(paid)}</td>
                      <td className="px-4 py-3.5 text-right font-black text-red-600">{balance > 0 ? formatCurrencyFull(balance) : '—'}</td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          b.status === 'token_paid' ? 'text-orange-800 bg-orange-50 border-orange-200' :
                          b.status === 'confirmed' ? 'text-red-800 bg-red-50 border-red-200' :
                          'text-slate-700 bg-slate-100 border-slate-200'
                        }`}>
                          {b.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
