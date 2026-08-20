import React from 'react';
import { mockAuditLogs } from '../../data/mockData';

export const AuditLogs: React.FC = () => {
  const roleColors: Record<string, string> = {
    super_admin: 'text-amber-900 bg-amber-50 border border-amber-200',
    channel_partner: 'text-orange-900 bg-orange-50 border border-orange-200',
    customer: 'text-emerald-900 bg-emerald-50 border border-emerald-200',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Audit Trail & Logs</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Immutable activity logs of all administrative actions, plot bookings, payments, and status changes</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                <th className="text-left px-6 py-3.5">Timestamp</th>
                <th className="text-left px-4 py-3.5">User</th>
                <th className="text-left px-4 py-3.5">Role</th>
                <th className="text-left px-4 py-3.5">Action Executed</th>
                <th className="text-left px-4 py-3.5">Module</th>
                <th className="text-left px-4 py-3.5">Details</th>
                <th className="text-left px-4 py-3.5">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {mockAuditLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => (
                <tr key={log.id} className="table-row-hover">
                  <td className="px-6 py-3.5 text-slate-500 font-mono whitespace-nowrap text-[11px]">
                    {new Date(log.date).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3.5 font-bold text-slate-900">{log.userName}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${roleColors[log.userRole] || 'text-slate-600 bg-slate-100'}`}>
                      {log.userRole.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-bold text-amber-800">{log.action}</td>
                  <td className="px-4 py-3.5 text-slate-500">{log.module}</td>
                  <td className="px-4 py-3.5 text-slate-700 max-w-xs truncate font-medium">{log.description}</td>
                  <td className="px-4 py-3.5 font-mono text-slate-400 text-[11px]">{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
