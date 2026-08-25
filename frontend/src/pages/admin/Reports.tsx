import React from 'react';
import { usePlotStore } from '../../store/plotStore';
import { FileSpreadsheet } from 'lucide-react';
import { formatCurrencyFull } from '../../utils/helpers';
import toast from 'react-hot-toast';

export const AdminReports: React.FC = () => {
  const { plots } = usePlotStore();

  const exportExcel = () => {
    try {
      const headers = [
        'Plot Number',
        'Area (Sq.Ft)',
        'Dimensions',
        'Facing',
        'Road Width (Ft)',
        'Price Per Sq.Ft (INR)',
        'Total Price (INR)',
        'Status',
        'Token Paid (INR)',
        'Token Expiry Date',
        'Total Paid (INR)',
        'Balance Due (INR)',
        'Balance Due Date',
        'Customer Name',
        'Customer Email',
        'Customer Phone',
        'Channel Partner'
      ];

      const rows = plots.map(p => [
        `"${p.plotNumber || ''}"`,
        p.area || 0,
        `"${p.dimensions || ''}"`,
        `"${p.facing || 'North'}"`,
        `"${p.roadWidth || '20'}"`,
        p.pricePerSqft || 2500,
        p.totalPrice || 0,
        `"${(p.status || 'available').replace('_', ' ').toUpperCase()}"`,
        p.tokenAmount || 0,
        `"${p.tokenExpiry ? new Date(p.tokenExpiry).toLocaleDateString('en-IN') : ''}"`,
        p.totalPaid || (p as any).amountPaid || 0,
        p.balanceDue || (p as any).balanceAmount || 0,
        `"${(p as any).balanceDueDate || p.paymentDeadline ? new Date((p as any).balanceDueDate || p.paymentDeadline!).toLocaleDateString('en-IN') : ''}"`,
        `"${(p.customerName || '').replace(/"/g, '""')}"`,
        `"${p.customerEmail || ''}"`,
        `"${p.customerPhone || ''}"`,
        `"${((p as any).channelPartnerName || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const dateStr = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `SCP_Plot_Inventory_Report_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('✓ Plot Inventory Excel/CSV report downloaded!');
    } catch (err) {
      toast.error('Failed to export Excel report');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Reports & Analytics</h1>
          <p className="text-slate-500 text-xs font-medium mt-0.5">Plot inventory statements, layout matrix, and allocation summaries</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button
            onClick={exportExcel}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer"
          >
            <FileSpreadsheet size={15} />
            <span>Download Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation: Plot Inventory Only */}
      <div className="bg-slate-100 p-1.5 rounded-2xl inline-flex gap-1 print:hidden">
        <button
          className="px-4 py-2 rounded-xl text-xs font-bold transition-all bg-white text-blue-700 shadow-sm"
        >
          Plot Inventory
        </button>
      </div>

      {/* Plot Inventory Summary & Master Sheet */}
      <div className="space-y-5 animate-fade-in">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {[
            { label: 'Total Plots', value: plots.length, color: 'text-slate-900 bg-slate-100' },
            { label: 'Available', value: plots.filter(p => p.status === 'available').length, color: 'text-emerald-800 bg-emerald-50 border border-emerald-200' },
            { label: 'Token Booked', value: plots.filter(p => p.status === 'token_booked').length, color: 'text-orange-800 bg-orange-50 border border-orange-200' },
            { label: 'Confirmed', value: plots.filter(p => p.status === 'confirmed').length, color: 'text-red-800 bg-red-50 border border-red-200' },
            { label: 'Sold Out', value: plots.filter(p => p.status === 'sold').length, color: 'text-slate-700 bg-slate-100 border border-slate-200' },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl p-4 text-center ${s.color}`}>
              <div className="text-2xl font-black">{s.value}</div>
              <div className="text-[11px] font-bold mt-1 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Plot Inventory Master Sheet</h3>
            <span className="text-xs text-slate-400 font-bold">{plots.length} Total Units</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                  <th className="text-left px-4 py-2.5">Plot No</th>
                  <th className="text-right px-4 py-2.5">Area</th>
                  <th className="text-left px-4 py-2.5">Facing</th>
                  <th className="text-right px-4 py-2.5">Price</th>
                  <th className="text-left px-4 py-2.5">Status</th>
                  <th className="text-left px-4 py-2.5">Customer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {plots.map(p => (
                  <tr key={p.id} className="table-row-hover">
                    <td className="px-4 py-2.5 font-black text-slate-900">{p.plotNumber}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600 font-medium">{p.area} sq.ft</td>
                    <td className="px-4 py-2.5 text-slate-600">{p.facing}</td>
                    <td className="px-4 py-2.5 text-right font-black text-slate-900">{formatCurrencyFull(p.totalPrice)}</td>
                    <td className="px-4 py-2.5 capitalize text-slate-700 font-semibold">{p.status.replace('_', ' ')}</td>
                    <td className="px-4 py-2.5 text-slate-500">{p.customerName || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
