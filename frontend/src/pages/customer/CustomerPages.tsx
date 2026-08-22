import React, { useState, useEffect } from 'react';
import { usePlotStore } from '../../store/plotStore';
import { useBookingStore, usePaymentStore, useCustomerStore, useNotificationStore } from '../../store/stores';
import { useAuthStore } from '../../store/authStore';
import { StatusBadge } from '../../components/ui/UIComponents';
import { PlotDetailsDrawer } from '../../components/plots/PlotDetailsDrawer';
import { PlotMap } from '../../components/plots/PlotMap';
import { Plot } from '../../types';
import { Search, MapPin, IndianRupee, Clock, CreditCard, FolderOpen, Bell, User } from 'lucide-react';
import { formatCurrencyFull, getDaysRemaining } from '../../utils/helpers';
import { mockProjects, mockDocuments } from '../../data/mockData';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { bookings } = useBookingStore();
  const { customers } = useCustomerStore();
  const { plots } = usePlotStore();

  const customer = customers.find(c => c.email === user?.email) || customers[0];
  const myBookings = bookings.filter(b => b.customerId === customer?.id || b.customerName === user?.name);

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Welcome, {user?.name}!</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Track your allocated plots, payment schedules, receipts, and deed milestones</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <MapPin size={18} className="text-blue-700 mb-2" />
          <div className="text-2xl font-black text-slate-900">{myBookings.length}</div>
          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">Booked Plots</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <IndianRupee size={18} className="text-emerald-700 mb-2" />
          <div className="text-2xl font-black text-emerald-800">{formatCurrencyFull(customer?.totalPaid || 20000)}</div>
          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">Total Paid</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <Clock size={18} className="text-red-600 mb-2" />
          <div className="text-2xl font-black text-red-600">{formatCurrencyFull(customer?.totalBalance || 2380000)}</div>
          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">Balance Due</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <CreditCard size={18} className="text-sky-700 mb-2" />
          <div className="text-2xl font-black text-sky-800">90 Days</div>
          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">Payment Term</div>
        </div>
      </div>

      {/* My Bookings Detailed Cards */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">My Active Plot Bookings</h3>
        {myBookings.map(b => {
          const plot = plots.find(p => p.id === b.plotId);
          const daysLeft = b.tokenExpiry ? getDaysRemaining(b.tokenExpiry) : null;
          return (
            <div key={b.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xl font-black text-slate-900">{b.plotNumber}</span>
                  <StatusBadge status={b.status} size="md" />
                </div>
                <p className="text-xs text-slate-500 font-medium">{b.projectName}</p>
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-600">
                  <div><span className="text-slate-400 font-medium">Area: </span><span className="font-bold">{plot?.area || 1200} sq.ft</span></div>
                  <div><span className="text-slate-400 font-medium">Total: </span><span className="font-bold">{formatCurrencyFull(b.totalAmount)}</span></div>
                  <div><span className="text-slate-400 font-medium">Paid: </span><span className="font-bold text-emerald-700">{formatCurrencyFull(b.amountPaid)}</span></div>
                  <div><span className="text-slate-400 font-medium">Balance: </span><span className="font-bold text-red-600">{formatCurrencyFull(b.balanceAmount)}</span></div>
                </div>
              </div>

              {b.status === 'token_paid' && daysLeft !== null && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3.5 text-center min-w-[160px]">
                  <div className="text-[11px] font-bold text-orange-950">Token Expiry</div>
                  <div className="text-base font-black text-orange-700">{daysLeft > 0 ? `${daysLeft} Days Left` : 'EXPIRED'}</div>
                  <div className="text-[10px] text-orange-800 mt-0.5">{b.tokenExpiry}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const CustomerPlots: React.FC = () => {
  const { plots, fetchPlots } = usePlotStore();
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);

  React.useEffect(() => {
    fetchPlots();
  }, []);

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Browse Available Plots</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Explore the interactive CAD master blueprint, schematic matrix, and survey drawings</p>
      </div>

      <PlotMap plots={plots} onPlotClick={(p) => setSelectedPlot(p)} />

      <PlotDetailsDrawer plot={selectedPlot} onClose={() => setSelectedPlot(null)} />
    </div>
  );
};

export const CustomerProjects: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchLive = async () => {
      try {
        const res = await api.projects.list();
        if (res && res.length > 0) setProjects(res);
        else setProjects(mockProjects);
      } catch {
        setProjects(mockProjects);
      }
    };
    fetchLive();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Our Township Projects</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Explore approved master layouts and community developments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map(proj => (
          <div key={proj.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
            <div className="h-44 bg-slate-900 relative overflow-hidden">
              {proj.imageUrl && <img src={proj.imageUrl} alt={proj.name} className="w-full h-full object-cover opacity-75" />}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute bottom-4 left-5 text-white">
                <h3 className="font-black text-lg leading-tight">{proj.name}</h3>
                <p className="text-slate-300 text-xs mt-0.5">{proj.location}</p>
              </div>
            </div>
            <div className="p-5">
              <p className="text-xs text-slate-600 leading-relaxed">{proj.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CustomerBookings: React.FC = () => {
  const { user } = useAuthStore();
  const { bookings } = useBookingStore();
  const myBookings = bookings.filter(b => b.customerName === user?.name || b.customerId === 'cust-001');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900">My Plot Reservations</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Status of your token advances, confirmation agreements, and registration schedule</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
              <th className="text-left px-6 py-3.5">Booking ID</th>
              <th className="text-left px-4 py-3.5">Plot No</th>
              <th className="text-left px-4 py-3.5">Project</th>
              <th className="text-left px-4 py-3.5">Date</th>
              <th className="text-right px-4 py-3.5">Paid</th>
              <th className="text-right px-4 py-3.5">Balance</th>
              <th className="text-left px-4 py-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {myBookings.map(b => (
              <tr key={b.id} className="table-row-hover">
                <td className="px-6 py-3.5 font-mono font-bold text-blue-700">{b.id}</td>
                <td className="px-4 py-3.5 font-black text-slate-900">{b.plotNumber}</td>
                <td className="px-4 py-3.5 text-slate-600">{b.projectName}</td>
                <td className="px-4 py-3.5 text-slate-400 font-mono">{b.bookingDate}</td>
                <td className="px-4 py-3.5 text-right font-black text-emerald-700">{formatCurrencyFull(b.amountPaid)}</td>
                <td className="px-4 py-3.5 text-right font-black text-red-600">{b.balanceAmount > 0 ? formatCurrencyFull(b.balanceAmount) : '—'}</td>
                <td className="px-4 py-3.5"><StatusBadge status={b.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const CustomerPayments: React.FC = () => {
  const { payments } = usePaymentStore();
  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900">My Payments & Receipts</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Verified payment receipts and transaction records</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
              <th className="text-left px-6 py-3.5">Payment ID</th>
              <th className="text-left px-4 py-3.5">Plot No</th>
              <th className="text-left px-4 py-3.5">Type</th>
              <th className="text-left px-4 py-3.5">Method</th>
              <th className="text-right px-4 py-3.5">Amount</th>
              <th className="text-left px-4 py-3.5">Date</th>
              <th className="text-left px-4 py-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {payments.slice(0, 5).map(p => (
              <tr key={p.id} className="table-row-hover">
                <td className="px-6 py-3.5 font-mono font-bold text-blue-700">{p.id}</td>
                <td className="px-4 py-3.5 font-black">{p.plotNumber || '—'}</td>
                <td className="px-4 py-3.5 capitalize text-slate-600">{p.type.replace('_', ' ')}</td>
                <td className="px-4 py-3.5 capitalize text-slate-500">{p.method.replace('_', ' ')}</td>
                <td className="px-4 py-3.5 text-right font-black text-emerald-700">{formatCurrencyFull(p.amount)}</td>
                <td className="px-4 py-3.5 text-slate-400 font-mono">{p.date}</td>
                <td className="px-4 py-3.5"><StatusBadge status={p.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const CustomerDocuments: React.FC = () => {
  const docs = mockDocuments.filter(d => d.type === 'customer' || d.type === 'agreement' || d.type === 'payment_receipt');
  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900">My Documents & Receipts</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Download sale agreements, payment invoices, and verified identity proofs</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        {docs.map(d => (
          <div key={d.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center">
                <FolderOpen size={18} />
              </div>
              <div>
                <p className="font-bold text-xs text-slate-900">{d.name}</p>
                <p className="text-[10px] text-slate-400">{d.fileSize} · {d.fileType}</p>
              </div>
            </div>
            <button onClick={() => toast.success('✓ Download started')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors">
              Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CustomerNotifications: React.FC = () => {
  const { notifications, markRead, fetchNotifications } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Notifications & Alerts</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Special offers, payment reminders, and project announcements</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No notifications in your inbox yet.
          </div>
        ) : (
          notifications.map(n => (
            <div key={n.id} onClick={() => markRead(n.id)} className="p-4 flex items-start gap-3.5 hover:bg-slate-50 cursor-pointer transition-colors">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${!n.isRead ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'}`}>
                <Bell size={18} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className={`text-xs ${!n.isRead ? 'font-black text-slate-950' : 'font-bold text-slate-800'}`}>{n.title}</p>
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-600" />}
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">{new Date(n.createdAt).toLocaleDateString('en-IN')}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const CustomerProfile: React.FC = () => {
  const { user } = useAuthStore();
  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Buyer Profile</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Your personal contact details and registration preferences</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-sky-500 text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-sm">
            {user?.name?.charAt(0) || 'C'}
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-base">{user?.name}</h3>
            <p className="text-xs text-slate-400 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-400 font-medium">Email:</span><span className="font-bold text-slate-800">{user?.email}</span></div>
          <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-400 font-medium">Phone:</span><span className="font-bold text-slate-800">+91 98765 43210</span></div>
          <div className="flex justify-between py-2"><span className="text-slate-400 font-medium">KYC Status:</span><span className="text-emerald-700 font-bold">Verified</span></div>
        </div>
      </div>
    </div>
  );
};
