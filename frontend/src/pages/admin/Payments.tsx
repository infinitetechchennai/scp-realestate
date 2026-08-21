import React, { useState } from 'react';
import { usePaymentStore } from '../../store/stores';
import { StatusBadge } from '../../components/ui/UIComponents';
import { DashboardCard } from '../../components/ui/UIComponents';
import { Search, CreditCard, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { formatCurrencyFull, formatCurrency } from '../../utils/helpers';

export const AdminPayments: React.FC = () => {
  const { payments } = usePaymentStore();
  const [search, setSearch] = useState('');

  const total = payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);
  const today = payments.filter(p => p.date === new Date().toISOString().split('T')[0]).reduce((s, p) => s + p.amount, 0);
  const tokenColl = payments.filter(p => p.type === 'token_advance').reduce((s, p) => s + p.amount, 0);
  const fullPayColl = payments.filter(p => p.type === 'full_payment').reduce((s, p) => s + p.amount, 0);

  const filtered = payments.filter(p =>
    !search || p.customerName.toLowerCase().includes(search.toLowerCase()) ||
    p.plotNumber.toLowerCase().includes(search.toLowerCase()) || p.id.includes(search)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Collections & Payments</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Audit trail of all token advances, installments, full payments, and registration fees</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <DashboardCard title="Total Collection" value={formatCurrency(total)} icon={DollarSign} iconColor="text-emerald-600" />
        <DashboardCard title="Today's Collection" value={formatCurrency(today)} icon={TrendingUp} iconColor="text-blue-600" />
        <DashboardCard title="Token Advances" value={formatCurrency(tokenColl)} icon={Clock} iconColor="text-orange-500" />
        <DashboardCard title="Full Settlements" value={formatCurrency(fullPayColl)} icon={CreditCard} iconColor="text-sky-600" />
      </div>

      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 max-w-sm shadow-2xs focus-within:border-sky-500">
        <Search size={15} className="text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by customer, plot #, or payment ID..."
          className="outline-none text-xs text-slate-800 bg-transparent flex-1 placeholder:text-slate-400"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                <th className="text-left px-6 py-3.5">Payment ID</th>
                <th className="text-left px-4 py-3.5">Customer Name</th>
                <th className="text-left px-4 py-3.5">Plot No</th>
                <th className="text-left px-4 py-3.5">Payment Type</th>
                <th className="text-left px-4 py-3.5">Method</th>
                <th className="text-right px-4 py-3.5">Amount</th>
                <th className="text-left px-4 py-3.5">Date</th>
                <th className="text-left px-4 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(p => (
                <tr key={p.id} className="table-row-hover">
                  <td className="px-6 py-3.5 font-mono text-xs font-bold text-blue-700">{p.id}</td>
                  <td className="px-4 py-3.5 font-bold text-slate-900">{p.customerName}</td>
                  <td className="px-4 py-3.5 font-black text-slate-800">{p.plotNumber || '—'}</td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs font-semibold text-slate-700 capitalize">{p.type.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 capitalize">{p.method.replace('_', ' ')}</td>
                  <td className="px-4 py-3.5 text-right font-black text-emerald-700">{formatCurrencyFull(p.amount)}</td>
                  <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">{p.date}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-slate-100 text-[11px] text-slate-400 font-medium bg-slate-50/50">
          Showing {filtered.length} of {payments.length} payment records
        </div>
      </div>
    </div>
  );
};
