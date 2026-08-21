import React, { useState } from 'react';
import { usePlotStore } from '../../store/plotStore';
import { useCustomerStore, useBookingStore, usePaymentStore, useNotificationStore } from '../../store/stores';
import { useAuthStore } from '../../store/authStore';
import { StatusBadge, Modal } from '../../components/ui/UIComponents';
import { PlotDetailsDrawer } from '../../components/plots/PlotDetailsDrawer';
import { Plot } from '../../types';
import { Search, UserPlus, Award, TrendingUp, FolderOpen, Bell, User, Phone, Mail, MapPin } from 'lucide-react';
import { formatCurrencyFull, generateId } from '../../utils/helpers';
import { mockProjects, mockDocuments } from '../../data/mockData';
import toast from 'react-hot-toast';

import { PlotMap } from '../../components/plots/PlotMap';

export const ChannelPlots: React.FC = () => {
  const { plots } = usePlotStore();

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Interactive Master Layout & Available Plots</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">
          Interactive township land plot blueprint diagram — click any plot to inspect survey dimensions, price, and proceed to booking
        </p>
      </div>

      <PlotMap plots={plots} />
    </div>
  );
};

export const ChannelProjects: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Township Projects</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Explore active real estate developments and project master plans</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mockProjects.map(proj => (
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
              <div className="grid grid-cols-3 gap-2 text-center mb-4">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100"><div className="font-black text-slate-900">{proj.totalPlots}</div><div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total</div></div>
                <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200"><div className="font-black text-emerald-800">{proj.availablePlots}</div><div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Available</div></div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100"><div className="font-black text-slate-600">{proj.soldPlots}</div><div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sold</div></div>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2">{proj.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ChannelCustomers: React.FC = () => {
  const { customers, addCustomer } = useCustomerStore();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });

  const filtered = customers.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));

  const handleAdd = () => {
    if (!form.name || !form.phone) { toast.error('Name and phone are required'); return; }
    addCustomer({
      id: generateId('cust'),
      name: form.name,
      phone: form.phone,
      email: form.email || `${form.name.toLowerCase().replace(' ', '')}@example.com`,
      address: form.address,
      aadhar: 'XXXX-XXXX-XXXX',
      pan: 'ABCDE1234F',
      plotIds: [],
      bookingIds: [],
      totalPaid: 0,
      totalBalance: 0,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
    });
    toast.success('✓ Client registered successfully');
    setShowAdd(false);
    setForm({ name: '', phone: '', email: '', address: '' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Client Directory</h1>
          <p className="text-slate-500 text-xs font-medium mt-0.5">Manage buyers registered under your agency</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-blue-500/20"
        >
          <UserPlus size={16} />
          Add Client
        </button>
      </div>

      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 max-w-sm shadow-2xs focus-within:border-sky-500">
        <Search size={15} className="text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients..."
          className="outline-none text-xs text-slate-800 bg-transparent flex-1 placeholder:text-slate-400" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
              <th className="text-left px-6 py-3.5">Client Name</th>
              <th className="text-left px-4 py-3.5">Phone Number</th>
              <th className="text-left px-4 py-3.5">Email</th>
              <th className="text-right px-4 py-3.5">Plots Allocated</th>
              <th className="text-right px-4 py-3.5">Total Paid</th>
              <th className="text-left px-4 py-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(c => (
              <tr key={c.id} className="table-row-hover">
                <td className="px-6 py-3.5 font-bold text-slate-900">{c.name}</td>
                <td className="px-4 py-3.5 text-slate-700 font-medium">{c.phone}</td>
                <td className="px-4 py-3.5 text-slate-500">{c.email}</td>
                <td className="px-4 py-3.5 text-right font-medium">{c.plotIds.length}</td>
                <td className="px-4 py-3.5 text-right font-black text-emerald-700">{formatCurrencyFull(c.totalPaid)}</td>
                <td className="px-4 py-3.5"><StatusBadge status={c.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Register New Client" size="md">
        <div className="space-y-3.5">
          <div><label className="text-xs font-bold block mb-1">Full Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full border rounded-xl p-2.5 text-xs outline-none focus:border-sky-500" placeholder="Client Name" /></div>
          <div><label className="text-xs font-bold block mb-1">Phone Number *</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full border rounded-xl p-2.5 text-xs outline-none focus:border-sky-500" placeholder="10-digit mobile" /></div>
          <div><label className="text-xs font-bold block mb-1">Email</label><input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full border rounded-xl p-2.5 text-xs outline-none focus:border-sky-500" placeholder="email@example.com" /></div>
          <div><label className="text-xs font-bold block mb-1">Address</label><textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="w-full border rounded-xl p-2.5 text-xs outline-none focus:border-sky-500 h-16 resize-none" placeholder="Residential address" /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-xs font-bold text-slate-600 border rounded-xl">Cancel</button>
            <button onClick={handleAdd} className="px-5 py-2 text-xs text-white bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 rounded-xl font-black uppercase tracking-wider shadow-sm">Save Client</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export const ChannelBookings: React.FC = () => {
  const { bookings } = useBookingStore();
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900">My Client Bookings</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Track status, token amounts, and balance schedules of all client bookings</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
              <th className="text-left px-6 py-3.5">Booking ID</th>
              <th className="text-left px-4 py-3.5">Plot No</th>
              <th className="text-left px-4 py-3.5">Client Name</th>
              <th className="text-left px-4 py-3.5">Date</th>
              <th className="text-right px-4 py-3.5">Amount Paid</th>
              <th className="text-right px-4 py-3.5">Balance</th>
              <th className="text-left px-4 py-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {bookings.slice(0, 8).map(b => (
              <tr key={b.id} className="table-row-hover">
                <td className="px-6 py-3.5 font-mono font-bold text-blue-700">{b.id}</td>
                <td className="px-4 py-3.5 font-black text-slate-900">{b.plotNumber}</td>
                <td className="px-4 py-3.5 text-slate-700 font-medium">{b.customerName}</td>
                <td className="px-4 py-3.5 text-slate-500 font-mono">{b.bookingDate}</td>
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

export const ChannelPayments: React.FC = () => {
  const { payments } = usePaymentStore();
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Payment Audit Trail</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Transactions initiated for your client accounts</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
              <th className="text-left px-6 py-3.5">Payment ID</th>
              <th className="text-left px-4 py-3.5">Client Name</th>
              <th className="text-left px-4 py-3.5">Plot No</th>
              <th className="text-left px-4 py-3.5">Type</th>
              <th className="text-right px-4 py-3.5">Amount</th>
              <th className="text-left px-4 py-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {payments.slice(0, 8).map(p => (
              <tr key={p.id} className="table-row-hover">
                <td className="px-6 py-3.5 font-mono font-bold text-blue-700">{p.id}</td>
                <td className="px-4 py-3.5 font-bold text-slate-900">{p.customerName}</td>
                <td className="px-4 py-3.5 font-black">{p.plotNumber || '—'}</td>
                <td className="px-4 py-3.5 capitalize text-slate-600">{p.type.replace('_', ' ')}</td>
                <td className="px-4 py-3.5 text-right font-black text-emerald-700">{formatCurrencyFull(p.amount)}</td>
                <td className="px-4 py-3.5"><StatusBadge status={p.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const ChannelCommission: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Commission & Payouts</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Track your brokerage rate, payout history, and pending claims</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <Award size={20} className="text-blue-700 mb-2" />
          <div className="text-2xl font-black text-blue-900">₹4,20,000</div>
          <div className="text-xs text-blue-700 font-bold uppercase tracking-wider mt-1">Total Earned</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
          <TrendingUp size={20} className="text-emerald-700 mb-2" />
          <div className="text-2xl font-black text-emerald-800">₹3,00,000</div>
          <div className="text-xs text-emerald-700 font-bold uppercase tracking-wider mt-1">Paid Out</div>
        </div>
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-5">
          <Award size={20} className="text-sky-700 mb-2" />
          <div className="text-2xl font-black text-sky-800">₹1,20,000</div>
          <div className="text-xs text-sky-700 font-bold uppercase tracking-wider mt-1">Pending Approval</div>
        </div>
      </div>
    </div>
  );
};

export const ChannelDocuments: React.FC = () => {
  const docs = mockDocuments.filter(d => d.type === 'channel_partner' || d.type === 'project');
  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Partner Documents & Brochures</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Download marketing collateral, master layout plans, and partner agreement</p>
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

export const ChannelProfile: React.FC = () => {
  const { user } = useAuthStore();
  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Partner Profile</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Your official agency information and credentials</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-sky-500 text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-sm">
            {user?.name?.charAt(0) || 'P'}
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-base">{user?.name}</h3>
            <p className="text-xs text-slate-400 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-400 font-medium">Email:</span><span className="font-bold text-slate-800">{user?.email}</span></div>
          <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-400 font-medium">Commission Rate:</span><span className="font-black text-emerald-700">2.5%</span></div>
          <div className="flex justify-between py-2"><span className="text-slate-400 font-medium">Account Status:</span><span className="text-emerald-700 font-bold">Active & Verified</span></div>
        </div>
      </div>
    </div>
  );
};
