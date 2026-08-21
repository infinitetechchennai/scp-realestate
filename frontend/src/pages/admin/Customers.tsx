import React, { useState, useEffect, useCallback } from 'react';
import { StatusBadge, Modal } from '../../components/ui/UIComponents';
import { Search, UserPlus, RefreshCw, Key, Building2, MapPin, Mail, Phone, ShieldCheck } from 'lucide-react';
import { formatCurrencyFull } from '../../utils/helpers';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface CustomerItem {
  id: string;
  user_id: string;
  name: string;
  first_name: string;
  last_name?: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  assigned_partner_id?: string;
  assigned_partner_name?: string;
  total_paid: number;
  total_balance: number;
  allocated_plots_count: number;
  status: string;
  created_at: string;
}

export const AdminCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [partners, setPartners] = useState<Array<{ id: string; company_name: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Customer Create Form State
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'customer123',
    address: '',
    city: '',
    state: '',
    pincode: '',
    aadhar: '',
    pan: '',
    assigned_partner_id: '',
  });

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.customers.list(search);
      setCustomers(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load customers from server');
    } finally {
      setLoading(false);
    }
  }, [search]);

  // Load partners for dropdown
  useEffect(() => {
    api.adminPartners.list('approved')
      .then(res => setPartners(res))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error('Name, email, and mobile phone number are required');
      return;
    }
    if (form.password && form.password.length < 6) {
      toast.error('Login password must be at least 6 characters long');
      return;
    }

    setSubmitting(true);
    try {
      const nameParts = form.name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || undefined;

      await api.customers.create({
        first_name: firstName,
        last_name: lastName,
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password || 'customer123',
        address_line_1: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        postal_code: form.pincode || undefined,
        aadhar_number: form.aadhar ? form.aadhar.replace(/\s/g, '') : undefined,
        pan_number: form.pan ? form.pan.toUpperCase().trim() : undefined,
        assigned_channel_partner_id: form.assigned_partner_id || undefined,
      });

      toast.success(`✓ Customer account created! Login credentials active.`);
      setShowCreate(false);
      setForm({
        name: '',
        email: '',
        phone: '',
        password: 'customer123',
        address: '',
        city: '',
        state: '',
        pincode: '',
        aadhar: '',
        pan: '',
        assigned_partner_id: '',
      });
      fetchCustomers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create customer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Customers Directory</h1>
          <p className="text-slate-500 text-xs font-medium mt-0.5">
            {customers.length} registered buyers and active leads in PostgreSQL
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchCustomers}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-blue-500/20"
          >
            <UserPlus size={16} />
            <span>Create Customer</span>
          </button>
        </div>
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
                <th className="text-left px-4 py-3.5">City / Location</th>
                <th className="text-left px-4 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading customers from PostgreSQL...</span>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No customers found in database. Click <strong>"+ Create Customer"</strong> to add one.
                  </td>
                </tr>
              ) : (
                customers.map(c => (
                  <tr key={c.id} className="table-row-hover">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center text-blue-900 font-black text-xs">
                          {c.name.charAt(0) || 'C'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{c.name}</div>
                          <div className="text-[10px] text-slate-400 font-medium">{c.allocated_plots_count} plot(s) allocated</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 font-medium">{c.phone}</td>
                    <td className="px-4 py-3.5 text-slate-500">{c.email}</td>
                    <td className="px-4 py-3.5 text-slate-600 font-medium">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.assigned_partner_name === 'Direct' ? 'bg-slate-100 text-slate-700' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                        {c.assigned_partner_name || 'Direct'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {c.city ? `${c.city}${c.state ? `, ${c.state}` : ''}` : '—'}
                    </td>
                    <td className="px-4 py-3.5"><StatusBadge status={c.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-slate-100 text-[11px] text-slate-400 font-medium bg-slate-50/50">
          Showing {customers.length} registered customers in database
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* CREATE CUSTOMER MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Register New Customer Account" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
            <ShieldCheck size={16} className="text-blue-600 mt-0.5 shrink-0" />
            <span>
              Creating a customer sets up their PostgreSQL profile and creates active login access for the Customer Portal.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Full Name */}
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">Full Name *</label>
              <input
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Ramesh Kumar"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-sky-500 outline-none"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Email Address (Login ID) *</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="customer@example.com"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-sky-500 outline-none"
              />
            </div>

            {/* Mobile Phone */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Mobile Phone *</label>
              <input
                required
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="9876543210"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-sky-500 outline-none"
              />
            </div>

            {/* Login Password */}
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center justify-between">
                <span>Customer Login Password *</span>
                <span className="text-[10px] text-slate-400 font-normal">Default: customer123</span>
              </label>
              <div className="relative">
                <input
                  required
                  type="text"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Set login password (min 6 chars)"
                  className="w-full border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-mono font-medium focus:border-sky-500 outline-none"
                />
                <Key size={14} className="absolute left-3 top-3 text-slate-400" />
              </div>
            </div>

            {/* Assigned Channel Partner */}
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">Assigned Channel Partner (Optional)</label>
              <select
                value={form.assigned_partner_id}
                onChange={e => setForm(f => ({ ...f, assigned_partner_id: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-sky-500 outline-none bg-white"
              >
                <option value="">Direct Customer (No Partner Assigned)</option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.company_name} ({p.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Aadhaar Number */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Aadhaar Card No (Optional)</label>
              <input
                value={form.aadhar}
                onChange={e => setForm(f => ({ ...f, aadhar: e.target.value }))}
                placeholder="12-digit Aadhaar"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-sky-500 outline-none"
              />
            </div>

            {/* PAN Number */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">PAN Card No (Optional)</label>
              <input
                value={form.pan}
                onChange={e => setForm(f => ({ ...f, pan: e.target.value.toUpperCase() }))}
                placeholder="ABCDE1234F"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-medium focus:border-sky-500 outline-none"
              />
            </div>

            {/* City & State */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">City</label>
              <input
                value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                placeholder="e.g. Chennai"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-sky-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">State</label>
              <input
                value={form.state}
                onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                placeholder="e.g. Tamil Nadu"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-sky-500 outline-none"
              />
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">Residential Address</label>
              <textarea
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-sky-500 outline-none h-16 resize-none"
                placeholder="Door No, Street Name, Landmark"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 text-xs text-white bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 rounded-xl font-black uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5"
            >
              {submitting ? 'Creating Customer...' : 'Save & Activate Login'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
