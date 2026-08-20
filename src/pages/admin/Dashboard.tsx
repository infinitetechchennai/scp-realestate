import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import {
  Building2, Map, BookOpen, Users, Handshake, CreditCard,
  TrendingUp, AlertCircle, CheckCircle, XCircle, DollarSign, Activity,
} from 'lucide-react';
import { DashboardCard } from '../../components/ui/UIComponents';
import { usePlotStore } from '../../store/plotStore';
import { useBookingStore, useCustomerStore, useChannelPartnerStore, usePaymentStore } from '../../store/stores';
import { formatCurrency } from '../../utils/helpers';
import { revenueChartData, bookingTrendData } from '../../data/mockData';
import { useNavigate } from 'react-router-dom';

const PIE_COLORS = ['#10b981', '#f97316', '#ef4444', '#64748b'];
const STATUS_LABELS = ['Available', 'Token Booked', 'Confirmed', 'Sold'];

export const AdminDashboard: React.FC = () => {
  const { plots } = usePlotStore();
  const { bookings } = useBookingStore();
  const { customers } = useCustomerStore();
  const { channelPartners } = useChannelPartnerStore();
  const { payments } = usePaymentStore();
  const navigate = useNavigate();

  const available = plots.filter(p => p.status === 'available').length;
  const tokenBooked = plots.filter(p => p.status === 'token_booked').length;
  const confirmed = plots.filter(p => p.status === 'confirmed').length;
  const sold = plots.filter(p => p.status === 'sold').length;

  const totalCollection = payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);
  const tokenCollection = payments.filter(p => p.type === 'token_advance').reduce((s, p) => s + p.amount, 0);
  const pendingCollection = plots
    .filter(p => p.status === 'confirmed')
    .reduce((s, p) => s + (p.balanceDue || 0), 0);
  const totalBookingValue = plots.filter(p => p.status !== 'available').reduce((s, p) => s + p.totalPrice, 0);

  const activePartners = channelPartners.filter(cp => cp.status === 'approved').length;

  const pieData = [
    { name: 'Available', value: available },
    { name: 'Token', value: tokenBooked },
    { name: 'Confirmed', value: confirmed },
    { name: 'Sold', value: sold },
  ];

  const cpPerformance = channelPartners.filter(cp => cp.status === 'approved').map(cp => ({
    name: cp.companyName.split(' ')[0],
    leads: cp.totalLeads,
    bookings: cp.totalBookings,
    sold: cp.totalSold,
    revenue: cp.totalRevenue / 100000,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Seven Circle Property Developers — Real-Time Analytics & Master Inventory</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <DashboardCard title="Total Plots" value={plots.length} icon={Map} iconColor="text-blue-600" subtitle="Across all master plans" />
        <DashboardCard title="Available" value={available} icon={CheckCircle} iconColor="text-emerald-600" subtitle="Ready for booking" onClick={() => navigate('/admin/plots')} />
        <DashboardCard title="Token Booked" value={tokenBooked} icon={AlertCircle} iconColor="text-orange-500" subtitle="7-day hold" onClick={() => navigate('/admin/bookings')} />
        <DashboardCard title="Confirmed" value={confirmed} icon={Activity} iconColor="text-red-600" subtitle="90-day balance deadline" onClick={() => navigate('/admin/bookings')} />
        <DashboardCard title="Sold Out" value={sold} icon={XCircle} iconColor="text-slate-600" subtitle="Deeds executed" />
        <DashboardCard title="Total Customers" value={customers.length} icon={Users} iconColor="text-blue-700" onClick={() => navigate('/admin/customers')} />
        <DashboardCard title="Active Partners" value={activePartners} icon={Handshake} iconColor="text-sky-600" onClick={() => navigate('/admin/channel-partners')} />
        <DashboardCard title="Total Collection" value={formatCurrency(totalCollection)} icon={DollarSign} iconColor="text-emerald-600" subtitle="Cumulative payments" />
        <DashboardCard title="Booking Value" value={formatCurrency(totalBookingValue)} icon={TrendingUp} iconColor="text-blue-600" subtitle="Active pipeline" />
        <DashboardCard title="Token Collection" value={formatCurrency(tokenCollection)} icon={CreditCard} iconColor="text-orange-500" />
        <DashboardCard title="Pending Balance" value={formatCurrency(pendingCollection)} icon={AlertCircle} iconColor="text-red-500" subtitle="Due from confirmed" />
        <DashboardCard title="Active Projects" value={2} icon={Building2} iconColor="text-sky-700" onClick={() => navigate('/admin/projects')} />
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
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3">Revenue Collection Trends (₹ Lakhs)</h3>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={revenueChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
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
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3">Weekly Booking Activity</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={bookingTrendData} margin={{ top: 5, right: 15, left: -20, bottom: 0 }}>
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
              {bookings.slice(0, 6).map(b => (
                <tr key={b.id} className="table-row-hover">
                  <td className="px-6 py-3.5 font-mono text-xs font-bold text-blue-700">{b.id}</td>
                  <td className="px-4 py-3.5 font-black text-slate-900">{b.plotNumber}</td>
                  <td className="px-4 py-3.5 text-slate-700 font-medium">{b.customerName}</td>
                  <td className="px-4 py-3.5 text-slate-500">{b.channelPartnerName || 'Direct'}</td>
                  <td className="px-4 py-3.5 text-right font-black text-emerald-700">₹{b.amountPaid.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      b.status === 'token_paid' ? 'text-orange-700 bg-orange-50 border-orange-200' :
                      b.status === 'confirmed' ? 'text-red-700 bg-red-50 border-red-200' :
                      'text-slate-700 bg-slate-100 border-slate-200'
                    }`}>
                      {b.status === 'token_paid' ? 'Token Paid' : b.status === 'confirmed' ? 'Confirmed' : 'Sold Out'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
