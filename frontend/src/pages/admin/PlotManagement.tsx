import React, { useState } from 'react';
import { usePlotStore } from '../../store/plotStore';
import { StatusBadge, ConfirmationModal, Tabs } from '../../components/ui/UIComponents';
import { Plot } from '../../types';
import { PlotDetailsDrawer } from '../../components/plots/PlotDetailsDrawer';
import { Search, Eye } from 'lucide-react';
import { formatCurrencyFull } from '../../utils/helpers';
import toast from 'react-hot-toast';

export const PlotManagement: React.FC = () => {
  const { plots, markAsSold, releaseTokenExpired } = usePlotStore();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [soldConfirm, setSoldConfirm] = useState<Plot | null>(null);

  const tabs = [
    { id: 'all', label: 'All Plots', count: plots.length },
    { id: 'available', label: 'Available', count: plots.filter(p => p.status === 'available').length },
    { id: 'token_booked', label: 'Token Booked', count: plots.filter(p => p.status === 'token_booked').length },
    { id: 'confirmed', label: 'Confirmed', count: plots.filter(p => p.status === 'confirmed').length },
    { id: 'sold', label: 'Sold Out', count: plots.filter(p => p.status === 'sold').length },
  ];

  const filtered = plots.filter(p => {
    const matchTab = tab === 'all' || p.status === tab;
    const matchSearch = !search || p.plotNumber.toLowerCase().includes(search.toLowerCase()) ||
      (p.customerName || '').toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Plot Management</h1>
          <p className="text-slate-500 text-xs font-medium mt-0.5">Manage individual plot details, prices, and status changes</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {/* Search Input */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 flex-1 max-w-sm shadow-2xs focus-within:border-sky-500">
          <Search size={15} className="text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by plot # or customer name..."
            className="outline-none text-xs text-slate-800 bg-transparent flex-1 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                <th className="text-left px-6 py-3.5">Plot No</th>
                <th className="text-right px-4 py-3.5">Area</th>
                <th className="text-left px-4 py-3.5">Facing</th>
                <th className="text-right px-4 py-3.5">Total Price</th>
                <th className="text-left px-4 py-3.5">Status</th>
                <th className="text-left px-4 py-3.5">Customer</th>
                <th className="text-left px-4 py-3.5">Channel Partner</th>
                <th className="text-center px-4 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(plot => (
                <tr key={plot.id} className="table-row-hover">
                  <td className="px-6 py-3.5 font-black text-slate-900">{plot.plotNumber}</td>
                  <td className="px-4 py-3.5 text-right text-slate-600 font-medium">{plot.area} sq.ft</td>
                  <td className="px-4 py-3.5 text-slate-600">{plot.facing}</td>
                  <td className="px-4 py-3.5 text-right font-black text-slate-900">{formatCurrencyFull(plot.totalPrice)}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={plot.status} /></td>
                  <td className="px-4 py-3.5 text-slate-700 font-medium">{plot.customerName || '—'}</td>
                  <td className="px-4 py-3.5 text-slate-500">{plot.channelPartnerName || '—'}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedPlot(plot)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                        title="View Full Details"
                      >
                        <Eye size={15} />
                      </button>
                      {plot.status === 'confirmed' && (
                        <button
                          onClick={() => setSoldConfirm(plot)}
                          className="px-2 py-1 text-[10px] font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Mark Sold"
                        >
                          Mark Sold
                        </button>
                      )}
                      {plot.status === 'token_booked' && (
                        <button
                          onClick={() => { releaseTokenExpired(plot.id); toast.success(`Plot ${plot.plotNumber} released — now Available`); }}
                          className="px-2 py-1 text-[10px] font-bold text-orange-800 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
                          title="Release Hold"
                        >
                          Release Hold
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-slate-100 text-[11px] text-slate-400 font-medium bg-slate-50/50">
          Showing {filtered.length} of {plots.length} plots in inventory
        </div>
      </div>

      <PlotDetailsDrawer plot={selectedPlot} onClose={() => setSelectedPlot(null)} />

      <ConfirmationModal
        isOpen={!!soldConfirm}
        onClose={() => setSoldConfirm(null)}
        onConfirm={() => { if (soldConfirm) { markAsSold(soldConfirm.id); toast.success(`✓ Plot ${soldConfirm.plotNumber} marked as SOLD`); setSoldConfirm(null); } }}
        title={`Mark ${soldConfirm?.plotNumber} as SOLD`}
        danger
        confirmLabel="Mark as SOLD"
        message={
          <div className="text-xs text-slate-600 space-y-1">
            <p>Are you sure you want to mark <strong>{soldConfirm?.plotNumber}</strong> as SOLD?</p>
            <p>Customer: <strong>{soldConfirm?.customerName}</strong>. This completes the plot deed execution.</p>
          </div>
        }
      />
    </div>
  );
};
