import React, { useState } from 'react';
import { useChannelPartnerStore } from '../../store/stores';
import { StatusBadge, ConfirmationModal, Tabs } from '../../components/ui/UIComponents';
import { Search, AlertCircle } from 'lucide-react';
import { formatCurrencyFull } from '../../utils/helpers';
import toast from 'react-hot-toast';

export const AdminChannelPartners: React.FC = () => {
  const { channelPartners, approveChannelPartner, rejectChannelPartner, suspendChannelPartner } = useChannelPartnerStore();
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [actionConfirm, setActionConfirm] = useState<{ cp: typeof channelPartners[0]; action: 'approve' | 'reject' | 'suspend' } | null>(null);

  const tabs = [
    { id: 'all', label: 'All Partners', count: channelPartners.length },
    { id: 'pending', label: 'Pending Approval', count: channelPartners.filter(c => c.status === 'pending').length },
    { id: 'approved', label: 'Approved', count: channelPartners.filter(c => c.status === 'approved').length },
    { id: 'rejected', label: 'Rejected', count: channelPartners.filter(c => c.status === 'rejected').length },
    { id: 'suspended', label: 'Suspended', count: channelPartners.filter(c => c.status === 'suspended').length },
  ];

  const filtered = channelPartners.filter(cp => {
    const matchTab = tab === 'all' || cp.status === tab;
    const matchSearch = !search || cp.name.toLowerCase().includes(search.toLowerCase()) || cp.companyName.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const handleAction = () => {
    if (!actionConfirm) return;
    const { cp, action } = actionConfirm;
    if (action === 'approve') { approveChannelPartner(cp.id); toast.success(`✓ ${cp.companyName} approved`); }
    if (action === 'reject') { rejectChannelPartner(cp.id); toast.error(`${cp.companyName} rejected`); }
    if (action === 'suspend') { suspendChannelPartner(cp.id); toast('⚠️ ' + cp.companyName + ' suspended'); }
    setActionConfirm(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Channel Partners</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Manage real estate broker registrations, approval pipelines, and commission payouts</p>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 max-w-sm shadow-2xs focus-within:border-sky-500">
        <Search size={15} className="text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search partners by name or agency..."
          className="outline-none text-xs text-slate-800 bg-transparent flex-1 placeholder:text-slate-400"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                <th className="text-left px-6 py-3.5">Partner / Agency</th>
                <th className="text-left px-4 py-3.5">Phone Number</th>
                <th className="text-right px-4 py-3.5">Customers</th>
                <th className="text-right px-4 py-3.5">Plots Sold</th>
                <th className="text-right px-4 py-3.5">Total Sales</th>
                <th className="text-center px-4 py-3.5">Reg. Fee</th>
                <th className="text-left px-4 py-3.5">Status</th>
                <th className="text-center px-4 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(cp => (
                <tr key={cp.id} className="table-row-hover">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center text-blue-900 font-black text-xs">
                        {cp.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{cp.companyName}</div>
                        <div className="text-[10px] text-slate-400">{cp.name} · {cp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-700 font-medium">{cp.phone}</td>
                  <td className="px-4 py-3.5 text-right font-medium text-slate-700">{cp.totalCustomers}</td>
                  <td className="px-4 py-3.5 text-right font-bold text-slate-900">{cp.totalSold}</td>
                  <td className="px-4 py-3.5 text-right font-black text-emerald-700">{formatCurrencyFull(cp.totalRevenue)}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cp.registrationPaid ? 'text-emerald-800 bg-emerald-50 border border-emerald-200' : 'text-red-800 bg-red-50 border border-red-200'}`}>
                      {cp.registrationPaid ? '✓ Paid (₹500)' : '✗ Unpaid'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5"><StatusBadge status={cp.status} /></td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-center gap-1.5">
                      {cp.status === 'pending' && (
                        <>
                          <button
                            onClick={() => setActionConfirm({ cp, action: 'approve' })}
                            className="px-2.5 py-1 rounded-lg text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 font-bold text-[10px] transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setActionConfirm({ cp, action: 'reject' })}
                            className="px-2.5 py-1 rounded-lg text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 font-bold text-[10px] transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {cp.status === 'approved' && (
                        <button
                          onClick={() => setActionConfirm({ cp, action: 'suspend' })}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-700 hover:bg-sky-50 transition-colors"
                          title="Suspend Partner"
                        >
                          <AlertCircle size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!actionConfirm}
        onClose={() => setActionConfirm(null)}
        onConfirm={handleAction}
        title={`${actionConfirm?.action === 'approve' ? 'Approve' : actionConfirm?.action === 'reject' ? 'Reject' : 'Suspend'} Partner`}
        danger={actionConfirm?.action !== 'approve'}
        confirmLabel={actionConfirm?.action === 'approve' ? 'Approve' : actionConfirm?.action === 'reject' ? 'Reject' : 'Suspend'}
        message={
          <div className="text-xs text-slate-600">
            Are you sure you want to <strong>{actionConfirm?.action}</strong> channel partner <strong>{actionConfirm?.cp.companyName}</strong>?
          </div>
        }
      />
    </div>
  );
};
