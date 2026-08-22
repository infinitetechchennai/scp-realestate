import React, { useEffect } from 'react';
import { useChannelPartnerStore, useBookingStore, useNotificationStore } from '../../store/stores';
import { useAuthStore } from '../../store/authStore';
import { DashboardCard } from '../../components/ui/UIComponents';
import { Users, BookOpen, CheckCircle, IndianRupee, Award, TrendingUp, Clock, Star, Sparkles, Megaphone } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

export const ChannelDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { channelPartners } = useChannelPartnerStore();
  const { bookings } = useBookingStore();
  const { notifications, fetchNotifications } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const cp = channelPartners.find(c => c.email === user?.email) || channelPartners[0];

  const myBookings = bookings.filter(b => b.channelPartnerId === cp?.id);
  const tokenBookings = myBookings.filter(b => b.status === 'token_paid').length;
  const confirmedBookings = myBookings.filter(b => b.status === 'confirmed').length;
  const soldBookings = myBookings.filter(b => b.status === 'sold').length;

  const latestOffers = notifications.filter(n => n.type === 'offer' || n.type === 'announcement');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Welcome, {cp?.name || user?.name}!</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">{cp?.companyName} — Partner Pipeline & Commission Dashboard</p>
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <DashboardCard title="My Customers" value={cp?.totalCustomers || 0} icon={Users} iconColor="text-blue-700" />
        <DashboardCard title="Active Leads" value={cp?.totalLeads || 0} icon={TrendingUp} iconColor="text-sky-600" />
        <DashboardCard title="Token Bookings" value={tokenBookings} icon={Clock} iconColor="text-orange-500" />
        <DashboardCard title="Confirmed" value={confirmedBookings} icon={BookOpen} iconColor="text-red-600" />
        <DashboardCard title="Plots Sold" value={soldBookings} icon={CheckCircle} iconColor="text-slate-600" />
        <DashboardCard title="Total Sales" value={formatCurrency(cp?.totalRevenue || 0)} icon={IndianRupee} iconColor="text-emerald-600" />
        <DashboardCard title="Commission" value={formatCurrency(cp?.commission || 0)} icon={Award} iconColor="text-blue-700" />
        <DashboardCard title="Pending Payout" value={formatCurrency(cp?.pendingCommission || 0)} icon={Star} iconColor="text-sky-600" />
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">My Recent Client Bookings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                <th className="text-left px-6 py-3.5">Plot No</th>
                <th className="text-left px-4 py-3.5">Customer</th>
                <th className="text-right px-4 py-3.5">Amount Paid</th>
                <th className="text-left px-4 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {myBookings.slice(0, 5).map(b => (
                <tr key={b.id} className="table-row-hover">
                  <td className="px-6 py-3.5 font-black text-slate-900">{b.plotNumber}</td>
                  <td className="px-4 py-3.5 text-slate-700 font-medium">{b.customerName}</td>
                  <td className="px-4 py-3.5 text-right font-black text-emerald-700">₹{b.amountPaid.toLocaleString('en-IN')}</td>
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
              ))}
              {myBookings.length === 0 && (
                <tr><td colSpan={4} className="text-center py-8 text-slate-400 text-xs font-medium">No bookings recorded yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
