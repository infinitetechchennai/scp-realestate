import React, { useState, useEffect, useCallback } from 'react';
import { 
  Shield, Search, Filter, RefreshCw, Download, 
  User, Clock, Terminal, Globe, CheckCircle, AlertTriangle,
  ArrowRight, FileText, Lock, CreditCard, Users, Handshake, MapPin, Bell, Layers
} from 'lucide-react';
import { Tabs } from '../../components/ui/UIComponents';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface AuditLogItem {
  id: string;
  actor_user_id?: string;
  user_name: string;
  user_email?: string;
  user_role: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address: string;
  user_agent?: string;
  created_at: string;
  description?: string;
}

const moduleConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  auth: { label: 'Auth & Access', icon: Lock, color: 'text-purple-700 bg-purple-50 border-purple-200' },
  payment: { label: 'Payments', icon: CreditCard, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  booking: { label: 'Bookings', icon: FileText, color: 'text-blue-700 bg-blue-50 border-blue-200' },
  channel_partner: { label: 'Channel Partners', icon: Handshake, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  customer: { label: 'Customers', icon: Users, color: 'text-teal-700 bg-teal-50 border-teal-200' },
  plot: { label: 'Plots', icon: MapPin, color: 'text-amber-700 bg-amber-50 border-amber-200' },
  notification: { label: 'Broadcasts', icon: Bell, color: 'text-sky-700 bg-sky-50 border-sky-200' },
};

const roleColors: Record<string, string> = {
  super_admin: 'text-blue-900 bg-blue-50 border border-blue-200 font-extrabold',
  'Super Admin': 'text-blue-900 bg-blue-50 border border-blue-200 font-extrabold',
  channel_partner: 'text-indigo-900 bg-indigo-50 border border-indigo-200 font-bold',
  'Channel Partner': 'text-indigo-900 bg-indigo-50 border border-indigo-200 font-bold',
  customer: 'text-emerald-900 bg-emerald-50 border border-emerald-200 font-bold',
  Customer: 'text-emerald-900 bg-emerald-50 border border-emerald-200 font-bold',
  system: 'text-slate-700 bg-slate-100 border border-slate-200 font-mono',
};

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState('all');
  const [search, setSearch] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.auditLogs.list({
        module: activeModule !== 'all' ? activeModule : undefined,
        search: search.trim() || undefined,
        limit: 150,
      });
      setLogs(data);
    } catch (e: any) {
      console.warn('Audit logs fetch warning:', e);
      toast.error('Failed to load audit logs from database');
    } finally {
      setLoading(false);
    }
  }, [activeModule, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Export to CSV
  const handleExportCSV = () => {
    if (logs.length === 0) {
      toast.error('No logs to export');
      return;
    }

    const headers = ['ID', 'Timestamp (UTC)', 'User', 'Email', 'Role', 'Action', 'Module', 'IP Address', 'Details'];
    const rows = logs.map(l => [
      l.id,
      l.created_at,
      `"${l.user_name}"`,
      `"${l.user_email || ''}"`,
      l.user_role,
      `"${l.action}"`,
      l.resource_type,
      l.ip_address,
      `"${(l.description || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SCP_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('✓ Downloaded Audit Log CSV Report');
  };

  const moduleTabs = [
    { id: 'all', label: 'All Activities' },
    { id: 'auth', label: '🔐 Auth & Access' },
    { id: 'payment', label: '💳 Payments' },
    { id: 'booking', label: '📑 Bookings' },
    { id: 'channel_partner', label: '🤝 Channel Partners' },
    { id: 'plot', label: '🗺️ Plots' },
    { id: 'notification', label: '📢 Broadcasts' },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">Audit Trail & Security Logs</h1>
            <span className="bg-blue-50 text-blue-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200">
              PostgreSQL Live
            </span>
          </div>
          <p className="text-slate-500 text-xs font-medium mt-0.5">
            Immutable tamper-proof activity logs tracking all user logins, plot bookings, payments, and KYC verifications
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchLogs}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 shadow-2xs transition-colors"
            title="Refresh logs"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Download size={14} className="text-slate-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200/80">
        <Tabs tabs={moduleTabs} active={activeModule} onChange={setActiveModule} />

        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by user, action, IP..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 transition-colors shadow-2xs"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                <th className="text-left px-5 py-3.5">Timestamp</th>
                <th className="text-left px-4 py-3.5">User</th>
                <th className="text-left px-4 py-3.5">Role</th>
                <th className="text-left px-4 py-3.5">Action Executed</th>
                <th className="text-left px-4 py-3.5">Module</th>
                <th className="text-left px-4 py-3.5">Details</th>
                <th className="text-left px-4 py-3.5">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400">
                    <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span className="text-xs font-medium">Fetching immutable audit logs from PostgreSQL...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400">
                    <Shield size={32} className="mx-auto text-slate-300 mb-2" />
                    <div className="font-bold text-slate-700">No Audit Logs Found</div>
                    <div className="text-[11px] mt-0.5">Try clearing filters or search terms</div>
                  </td>
                </tr>
              ) : (
                logs.map(log => {
                  const mod = moduleConfig[log.resource_type] || {
                    label: log.resource_type,
                    icon: Layers,
                    color: 'text-slate-600 bg-slate-100 border-slate-200',
                  };
                  const ModIcon = mod.icon;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Timestamp */}
                      <td className="px-5 py-3.5 text-slate-500 font-mono whitespace-nowrap text-[11px]">
                        <div>
                          {new Date(log.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(log.created_at).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* User */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase flex-shrink-0">
                            {log.user_name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 leading-tight">{log.user_name}</div>
                            {log.user_email && (
                              <div className="text-[10px] text-slate-400 font-mono">{log.user_email}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${roleColors[log.user_role] || 'text-slate-600 bg-slate-100'}`}>
                          {log.user_role.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-[11px] font-bold text-blue-900 bg-blue-50/70 border border-blue-200/80 px-2 py-0.5 rounded-md">
                          {log.action}
                        </span>
                      </td>

                      {/* Module */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${mod.color}`}>
                          <ModIcon size={11} />
                          <span>{mod.label}</span>
                        </span>
                      </td>

                      {/* Details / Description */}
                      <td className="px-4 py-3.5 text-slate-700 max-w-xs truncate font-medium text-[11px]">
                        {log.description}
                      </td>

                      {/* IP Address */}
                      <td className="px-4 py-3.5 font-mono text-slate-500 text-[11px]">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {log.ip_address}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
