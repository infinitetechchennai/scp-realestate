import React, { useState } from 'react';
import { useCustomerStore } from '../../store/stores';
import { StatusBadge, Modal } from '../../components/ui/UIComponents';
import { Search, UserPlus } from 'lucide-react';
import { formatCurrencyFull, generateId } from '../../utils/helpers';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const AdminCustomers: React.FC = () => {
  const { customers, addCustomer } = useCustomerStore();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', aadhar: '', pan: '' });

  const filtered = customers.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const handleCreate = () => {
    if (!form.name || !form.email) { toast.error('Name and email are required'); return; }
    addCustomer({
      id: generateId('cust'),
      ...form,
      assignedChannelPartnerId: undefined,
      assignedChannelPartnerName: undefined,
      plotIds: [],
      bookingIds: [],
      totalPaid: 0,
      totalBalance: 0,
      status: 'active',
      createdAt: format(new Date(), 'yyyy-MM-dd'),
    });
    toast.success('✓ Customer account created successfully');
    setShowCreate(false);
    setForm({ name: '', email: '', phone: '', address: '', aadhar: '', pan: '' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Customers Directory</h1>
          <p className="text-slate-500 text-xs font-medium mt-0.5">{customers.length} registered buyers and active leads</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-blue-500/20"
        >
          <UserPlus size={16} />
          Create Customer
        </button>
      </div>

      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 max-w-sm shadow-2xs focus-within:border-sky-500">
        <Search size={15} className="text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, phone, or email..."
          className="outline-none text-xs text-slate-800 bg-transparent flex-1 placeholder:text-slate-400"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                <th className="text-left px-6 py-3.5">Customer Name</th>
                <th className="text-left px-4 py-3.5">Phone Number</th>
                <th className="text-left px-4 py-3.5">Email Address</th>
                <th className="text-left px-4 py-3.5">Assigned Partner</th>
                <th className="text-right px-4 py-3.5">Total Paid</th>
                <th className="text-right px-4 py-3.5">Total Balance</th>
                <th className="text-left px-4 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(c => (
                <tr key={c.id} className="table-row-hover">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center text-blue-900 font-black text-xs">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{c.name}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{c.plotIds.length} plot(s) allocated</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-700 font-medium">{c.phone}</td>
                  <td className="px-4 py-3.5 text-slate-500">{c.email}</td>
                  <td className="px-4 py-3.5 text-slate-500">{c.assignedChannelPartnerName || 'Direct'}</td>
                  <td className="px-4 py-3.5 text-right font-black text-emerald-700">{formatCurrencyFull(c.totalPaid)}</td>
                  <td className="px-4 py-3.5 text-right font-black text-red-600">
                    {c.totalBalance > 0 ? formatCurrencyFull(c.totalBalance) : '—'}
                  </td>
                  <td className="px-4 py-3.5"><StatusBadge status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-slate-100 text-[11px] text-slate-400 font-medium bg-slate-50/50">
          Showing {filtered.length} of {customers.length} registered customers
        </div>
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Register Customer Account" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3.5">
            {[
              { key: 'name', label: 'Full Name *', placeholder: 'Enter full name' },
              { key: 'phone', label: 'Mobile Number *', placeholder: '10-digit mobile' },
              { key: 'email', label: 'Email Address *', placeholder: 'email@example.com' },
              { key: 'aadhar', label: 'Aadhar Card No', placeholder: 'XXXX XXXX XXXX' },
              { key: 'pan', label: 'PAN Card No', placeholder: 'ABCDE1234F' },
            ].map(field => (
              <div key={field.key} className={field.key === 'name' ? 'col-span-2' : ''}>
                <label className="text-xs font-bold text-slate-700 block mb-1">{field.label}</label>
                <input
                  value={form[field.key as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-sky-500 outline-none"
                />
              </div>
            ))}
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">Residential Address</label>
              <textarea
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-sky-500 outline-none h-18 resize-none"
                placeholder="Full address"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
            <button onClick={handleCreate} className="px-5 py-2.5 text-xs text-white bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 rounded-xl font-black uppercase tracking-wider shadow-sm">Save Customer</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
