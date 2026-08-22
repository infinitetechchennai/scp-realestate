import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import {
  Building2, Map, BookOpen, Users, Handshake, CreditCard,
  TrendingUp, AlertCircle, CheckCircle, XCircle, IndianRupee, Activity, RefreshCw
} from 'lucide-react';
import { DashboardCard } from '../../components/ui/UIComponents';
import { usePlotStore } from '../../store/plotStore';
import { useBookingStore, useCustomerStore, useChannelPartnerStore, usePaymentStore } from '../../store/stores';
import { formatCurrency } from '../../utils/helpers';
import { revenueChartData, bookingTrendData } from '../../data/mockData';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

const PIE_COLORS = ['#10b981', '#f97316', '#ef4444', '#64748b'];
const STATUS_LABELS = ['Available', 'Token Booked', 'Confirmed', 'Sold'];

export const AdminDashboard: React.FC = () => {
  const { plots, fetchPlots, fetchProjects, projects } = usePlotStore();
  const { bookings } = useBookingStore();
  const { customers } = useCustomerStore();
  const { channelPartners } = useChannelPartnerStore();
  const { payments } = usePaymentStore();
  const navigate = useNavigate();

  const [liveCustomersCount, setLiveCustomersCount] = useState(0);
  const [livePartnersCount, setLivePartnersCount] = useState(0);
  const [livePartners, setLivePartners] = useState<any[]>([]);
  const [livePayments, setLivePayments] = useState<any[]>([]);
  const [liveBookings, setLiveBookings] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

  const loadLiveStats = async () => {
    setLoadingStats(true);
    try {
      await Promise.allSettled([
        fetchPlots(),
        fetchProjects(),
        api.customers.list().then(data => setLiveCustomersCount(data?.length || 0)),
        api.adminPartners.list().then(data => {
          setLivePartners(data || []);
          const approved = (data || []).filter((cp: any) => cp.status === 'approved' || cp.status === 'active').length;
          setLivePartnersCount(approved || data?.length || 0);
        }),
        api.payments.list().then(data => setLivePayments(data || [])),
        api.bookings.list().then(data => setLiveBookings(data || [])),
      ]);
    } catch (e) {
      console.warn('Dashboard stats load error:', e);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadLiveStats();
  }, []);

  const available = plots.filter(p => p.status === 'available').length;
  const tokenBooked = plots.filter(p => p.status === 'token_booked').length;
  const confirmed = plots.filter(p => p.status === 'confirmed').length;
  const sold = plots.filter(p => p.status === 'sold').length;

  const totalCollection = livePayments.filter((p: any) => p.status === 'completed').reduce((s: number, p: any) => s + Number(p.amount || 0), 0)
    || payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);

  const tokenCollection = livePayments.filter((p: any) => p.payment_type === 'token_advance' || p.payment_type === 'registration_fee').reduce((s: number, p: any) => s + Number(p.amount || 0), 0)
    || payments.filter(p => p.type === 'token_advance').reduce((s, p) => s + p.amount, 0);

  const pendingCollection = plots
    .filter(p => p.status === 'confirmed')
    .reduce((s, p) => s + (p.balanceDue || 0), 0);
  const totalBookingValue = plots.filter(p => p.status !== 'available').reduce((s, p) => s + p.totalPrice, 0);

  const totalCustomersDisplay = liveCustomersCount || customers.length;
  const activePartnersDisplay = livePartnersCount || channelPartners.filter(cp => cp.status === 'approved').length;
  const activeProjectsDisplay = (projects && projects.length > 0) ? projects.length : 2;

  const pieData = [
    { name: 'Available', value: available },
    { name: 'Token', value: tokenBooked },
    { name: 'Confirmed', value: confirmed },
    { name: 'Sold', value: sold },
  ];

  const partnerList = livePartners.length > 0 ? livePartners : channelPartners;
  const cpPerformance = partnerList
    .filter((cp: any) => cp.status === 'approved' || cp.status === 'active')
    .map((cp: any) => ({
      name: (cp.company_name || cp.companyName || `${cp.first_name || ''} ${cp.last_name || ''}`).trim().split(' ')[0] || 'Partner',
      leads: cp.total_leads ?? cp.totalLeads ?? 0,
      bookings: cp.total_bookings ?? cp.totalBookings ?? 0,
      sold: cp.total_sold ?? cp.totalSold ?? 0,
      revenue: Number(cp.total_revenue ?? cp.totalRevenue ?? 0) / 100000,
    }));

  const displayBookings = liveBookings.length > 0 ? liveBookings : bookings;

  // Dynamically compute Revenue Trends from real livePayments
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const nowDate = new Date();
  const dynamicRevenueData = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(nowDate.getFullYear(), nowDate.getMonth() - (5 - i), 1);
    return {
      monthKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      month: `${monthNames[d.getMonth()]}`,
      token: 0,
      booking: 0,
      final: 0,
      total: 0,
    };
  });

  (livePayments || []).forEach((p: any) => {
    if (p.status !== 'completed' && p.status !== 'success') return;
    const pDate = new Date(p.payment_date || p.created_at || nowDate);
    const pMonthKey = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}`;
    const mObj = dynamicRevenueData.find(m => m.monthKey === pMonthKey);
    if (mObj) {
      const amt = Number(p.amount || 0);
      mObj.total += amt;
      if (p.payment_type === 'token_advance' || p.payment_type === 'registration_fee') {
        mObj.token += amt;
      } else if (p.payment_type === 'full_payment') {
        mObj.final += amt;
      } else {
        mObj.booking += amt;
      }
    }
  });

  const hasRevenueData = dynamicRevenueData.some(m => m.total > 0);

  // Dynamically compute Weekly Booking Activity from real liveBookings
  const dynamicWeeklyData = [
    { week: '3 Weeks Ago', bookings: 0, confirmations: 0, sold: 0 },
    { week: '2 Weeks Ago', bookings: 0, confirmations: 0, sold: 0 },
    { week: 'Last Week', bookings: 0, confirmations: 0, sold: 0 },
    { week: 'This Week', bookings: 0, confirmations: 0, sold: 0 },
  ];

  (liveBookings || []).forEach((b: any) => {
    const bDate = new Date(b.created_at || nowDate);
    const diffDays = Math.floor((nowDate.getTime() - bDate.getTime()) / (1000 * 60 * 60 * 24));
    const weekIdx = 3 - Math.min(3, Math.max(0, Math.floor(diffDays / 7)));
    if (dynamicWeeklyData[weekIdx]) {
      dynamicWeeklyData[weekIdx].bookings += 1;
      if (b.status === 'confirmed') dynamicWeeklyData[weekIdx].confirmations += 1;
      if (b.status === 'sold') dynamicWeeklyData[weekIdx].sold += 1;
    }
  });

  const hasBookingTrendData = dynamicWeeklyData.some(w => w.bookings > 0 || w.confirmations > 0 || w.sold > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 text-xs font-medium mt-0.5">Seven Circle Property Developers — Real-Time Analytics & Master Inventory</p>
        </div>
        <button
          onClick={loadLiveStats}
          disabled={loadingStats}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition-colors"
        >
          <RefreshCw size={13} className={loadingStats ? 'animate-spin' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <DashboardCard title="Total Plots" value={plots.length} icon={Map} iconColor="text-blue-600" subtitle="Across all master plans" />
        <DashboardCard title="Available" value={available} icon={CheckCircle} iconColor="text-emerald-600" subtitle="Ready for booking" onClick={() => navigate('/admin/plots')} />
        <DashboardCard title="Token Booked" value={tokenBooked} icon={AlertCircle} iconColor="text-orange-500" subtitle="7-day hold" onClick={() => navigate('/admin/bookings')} />
        <DashboardCard title="Confirmed" value={confirmed} icon={Activity} iconColor="text-red-600" subtitle="90-day balance deadline" onClick={() => navigate('/admin/bookings')} />
        <DashboardCard title="Sold Out" value={sold} icon={XCircle} iconColor="text-slate-600" subtitle="Deeds executed" />
        <DashboardCard title="Total Customers" value={totalCustomersDisplay} icon={Users} iconColor="text-blue-700" onClick={() => navigate('/admin/customers')} />
        <DashboardCard title="Active Partners" value={activePartnersDisplay} icon={Handshake} iconColor="text-sky-600" onClick={() => navigate('/admin/channel-partners')} />
        <DashboardCard title="Total Collection" value={formatCurrency(totalCollection)} icon={IndianRupee} iconColor="text-emerald-600" subtitle="Cumulative payments" />
        <DashboardCard title="Booking Value" value={formatCurrency(totalBookingValue)} icon={TrendingUp} iconColor="text-blue-600" subtitle="Active pipeline" />
        <DashboardCard title="Token Collection" value={formatCurrency(tokenCollection)} icon={CreditCard} iconColor="text-orange-500" />
        <DashboardCard title="Pending Balance" value={formatCurrency(pendingCollection)} icon={AlertCircle} iconColor="text-red-500" subtitle="Due from confirmed" />
        <DashboardCard title="Active Projects" value={activeProjectsDisplay} icon={Building2} iconColor="text-sky-700" onClick={() => navigate('/admin/projects')} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plot Status Pie */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">Plot Status Distribution</h3>
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={78} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={10}>
                {pieData.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2.5 mt-2 justify-center border-t border-slate-100 pt-3">
            {STATUS_LABELS.map((label, i) => (
              <div key={label} className="flex items-center gap-1.5 text-[11px] text-slate-600 font-semibold">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Overview */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Revenue Collection Trends (₹ Lakhs)</h3>
            {!hasRevenueData && (
              <span className="text-[10px] bg-slate-100 text-slate-500 font-medium px-2 py-0.5 rounded-full border border-slate-200">
                Live DB: Initial ₹0 baseline
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={dynamicRevenueData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => `${(v / 100000).toFixed(0)}L`} />
              <Tooltip formatter={(v: number) => [`₹${(v / 100000).toFixed(2)}L`, '']} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="token" name="Token Advance" fill="#ea580c" radius={[4, 4, 0, 0]} />
              <Bar dataKey="booking" name="Booking Confirmation" fill="#0284c7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="final" name="Final Settlement" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Trend Line Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Weekly Booking Activity</h3>
            {!hasBookingTrendData && (
              <span className="text-[10px] bg-slate-100 text-slate-500 font-medium px-2 py-0.5 rounded-full border border-slate-200">
                Live DB: 0 bookings in range
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dynamicWeeklyData} margin={{ top: 5, right: 15, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Line type="monotone" dataKey="bookings" name="Bookings" stroke="#0284c7" strokeWidth={2.5} dot={{ r: 4, fill: '#0284c7' }} />
              <Line type="monotone" dataKey="confirmations" name="Confirmed" stroke="#dc2626" strokeWidth={2.5} dot={{ r: 4, fill: '#dc2626' }} />
              <Line type="monotone" dataKey="sold" name="Sold" stroke="#64748b" strokeWidth={2.5} dot={{ r: 4, fill: '#64748b' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Channel Partner Performance */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3">Channel Partner Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-100">
                  <th className="text-left pb-2.5 font-bold">Partner Agency</th>
                  <th className="text-right pb-2.5 font-bold">Leads</th>
                  <th className="text-right pb-2.5 font-bold">Bookings</th>
                  <th className="text-right pb-2.5 font-bold">Sold</th>
                  <th className="text-right pb-2.5 font-bold">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {cpPerformance.map((cp) => (
                  <tr key={cp.name} className="table-row-hover">
                    <td className="py-2.5 font-bold text-slate-800">{cp.name} Properties</td>
                    <td className="text-right py-2.5 text-slate-600 font-medium">{cp.leads}</td>
                    <td className="text-right py-2.5 text-slate-600 font-medium">{cp.bookings}</td>
                    <td className="text-right py-2.5 text-slate-800 font-bold">{cp.sold}</td>
                    <td className="text-right py-2.5 font-black text-emerald-700">₹{cp.revenue.toFixed(1)}L</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Recent Booking Transactions</h3>
          <button onClick={() => navigate('/admin/bookings')} className="text-xs text-blue-600 hover:text-blue-700 font-bold">View All Bookings →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                <th className="text-left px-6 py-3.5">Booking ID</th>
                <th className="text-left px-4 py-3.5">Plot Number</th>
                <th className="text-left px-4 py-3.5">Customer</th>
                <th className="text-left px-4 py-3.5">Channel Partner</th>
                <th className="text-right px-4 py-3.5">Amount Paid</th>
                <th className="text-left px-4 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {displayBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 font-medium">
                    No booking transactions recorded yet.
                  </td>
                </tr>
              ) : (
                displayBookings.slice(0, 6).map(b => (
                  <tr key={b.id} className="table-row-hover">
                    <td className="px-6 py-3.5 font-mono text-xs font-bold text-blue-700">
                      {b.booking_reference || b.id}
                    </td>
                    <td className="px-4 py-3.5 font-black text-slate-900">
                      {b.plot_number || b.plotNumber || '—'}
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 font-medium">
                      {b.customer_name || b.customerName || 'Valued Client'}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {b.channel_partner_name || b.channelPartnerName || 'Direct'}
                    </td>
                    <td className="px-4 py-3.5 text-right font-black text-emerald-700">
                      ₹{Number(b.amount_paid ?? b.amountPaid ?? 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        b.status === 'token_paid' ? 'text-orange-700 bg-orange-50 border-orange-200' :
                        b.status === 'confirmed' ? 'text-red-700 bg-red-50 border-red-200' :
                        b.status === 'sold' ? 'text-slate-700 bg-slate-100 border-slate-200' :
                        'text-blue-700 bg-blue-50 border-blue-200'
                      }`}>
                        {b.status === 'token_paid' ? 'Token Paid' : b.status === 'confirmed' ? 'Confirmed' : b.status === 'sold' ? 'Sold Out' : b.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
