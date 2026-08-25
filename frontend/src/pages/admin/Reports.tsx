import React, { useState, useEffect, useMemo } from 'react';
import { usePlotStore } from '../../store/plotStore';
import { api } from '../../services/api';
import {
  FileSpreadsheet,
  Printer,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  TrendingUp,
  CreditCard,
  Building2,
  Users,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  BookOpen
} from 'lucide-react';
import { formatCurrencyFull } from '../../utils/helpers';
import { StatusBadge } from '../../components/ui/UIComponents';
import toast from 'react-hot-toast';

type ReportType = 'bookings' | 'payments' | 'plots' | 'employees';

export const AdminReports: React.FC = () => {
  const { plots, fetchPlots } = usePlotStore();
  const [bookings, setBookings] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [reportType, setReportType] = useState<ReportType>('bookings');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      await fetchPlots();
      const [bookData, payData] = await Promise.all([
        api.bookings.list().catch(() => []),
        api.payments.list().catch(() => []),
      ]);
      setBookings(bookData || []);
      setPayments(payData || []);
    } catch (err: any) {
      toast.error('Failed to fetch reporting data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Quick Date Range Presets
  const setDatePreset = (preset: 'today' | 'last7' | 'this_month' | 'last_month' | 'this_year' | 'all') => {
    const today = new Date();
    const toDateStr = (d: Date) => d.toISOString().slice(0, 10);

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
      return;
    }

    if (preset === 'today') {
      const dStr = toDateStr(today);
      setStartDate(dStr);
      setEndDate(dStr);
      return;
    }

    if (preset === 'last7') {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      setStartDate(toDateStr(past));
      setEndDate(toDateStr(today));
      return;
    }

    if (preset === 'this_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(toDateStr(firstDay));
      setEndDate(toDateStr(today));
      return;
    }

    if (preset === 'last_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
      setStartDate(toDateStr(firstDay));
      setEndDate(toDateStr(lastDay));
      return;
    }

    if (preset === 'this_year') {
      const firstDay = new Date(today.getFullYear(), 0, 1);
      setStartDate(toDateStr(firstDay));
      setEndDate(toDateStr(today));
      return;
    }
  };

  // Helper Date Checker
  const isWithinDateRange = (dateString?: string) => {
    if (!dateString) return true;
    const itemDate = new Date(dateString).toISOString().slice(0, 10);
    if (startDate && itemDate < startDate) return false;
    if (endDate && itemDate > endDate) return false;
    return true;
  };

  // 1. Filtered Bookings Report Data
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (!isWithinDateRange(b.created_at || b.booking_date || b.bookingDate)) return false;
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const ref = (b.booking_reference || b.bookingReference || '').toLowerCase();
        const plot = (b.plot_number || b.plotNumber || '').toLowerCase();
        const customer = (b.customer_name || b.customerName || '').toLowerCase();
        const phone = (b.customer_phone || b.customerPhone || '').toLowerCase();
        const employee = (b.booked_by_name || b.bookedByName || '').toLowerCase();
        if (!ref.includes(q) && !plot.includes(q) && !customer.includes(q) && !phone.includes(q) && !employee.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [bookings, startDate, endDate, statusFilter, search]);

  // 2. Filtered Payments Report Data
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      if (!isWithinDateRange(p.payment_date || p.created_at)) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (paymentMethodFilter !== 'all' && (p.payment_method || p.method || '').toLowerCase() !== paymentMethodFilter.toLowerCase()) return false;
      if (search) {
        const q = search.toLowerCase();
        const ref = (p.payment_reference || p.transaction_id || '').toLowerCase();
        const plot = (p.plot_number || '').toLowerCase();
        const customer = (p.customer_name || '').toLowerCase();
        if (!ref.includes(q) && !plot.includes(q) && !customer.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [payments, startDate, endDate, statusFilter, paymentMethodFilter, search]);

  // 3. Filtered Plots Report Data
  const filteredPlots = useMemo(() => {
    return plots.filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const num = (p.plotNumber || '').toLowerCase();
        const cust = (p.customerName || '').toLowerCase();
        const partner = ((p as any).channelPartnerName || '').toLowerCase();
        if (!num.includes(q) && !cust.includes(q) && !partner.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [plots, statusFilter, search]);

  // 4. Employee Sales Performance Summary
  const employeePerformance = useMemo(() => {
    const map = new Map<string, { name: string; email: string; role: string; count: number; totalCollected: number; totalValue: number }>();

    filteredBookings.forEach(b => {
      const empName = b.booked_by_name || 'Direct / Super Admin';
      const empEmail = b.booked_by_email || 'admin@example.com';
      const empRole = b.booked_by_role || 'Staff';
      const key = empName + '_' + empEmail;

      const existing = map.get(key) || {
        name: empName,
        email: empEmail,
        role: empRole,
        count: 0,
        totalCollected: 0,
        totalValue: 0
      };

      existing.count += 1;
      existing.totalCollected += Number(b.amount_paid || b.amountPaid || 0);
      existing.totalValue += Number(b.total_amount || b.totalAmount || 0);
      map.set(key, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.totalCollected - a.totalCollected);
  }, [filteredBookings]);

  // Metrics Summary
  const summaryMetrics = useMemo(() => {
    if (reportType === 'bookings') {
      const totalCount = filteredBookings.length;
      const totalPaid = filteredBookings.reduce((sum, b) => sum + Number(b.amount_paid || b.amountPaid || 0), 0);
      const totalBalance = filteredBookings.reduce((sum, b) => sum + Number(b.balance_amount || b.balanceAmount || 0), 0);
      const totalPlotValue = filteredBookings.reduce((sum, b) => sum + Number(b.total_amount || b.totalAmount || (Number(b.amount_paid || 0) + Number(b.balance_amount || 0))), 0);
      return { totalCount, totalPaid, totalBalance, totalPlotValue };
    }
    if (reportType === 'payments') {
      const totalCount = filteredPayments.length;
      const totalPaid = filteredPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      return { totalCount, totalPaid, totalBalance: 0, totalPlotValue: totalPaid };
    }
    if (reportType === 'employees') {
      const totalCount = employeePerformance.length;
      const totalPaid = employeePerformance.reduce((sum, e) => sum + e.totalCollected, 0);
      const totalPlotValue = employeePerformance.reduce((sum, e) => sum + e.totalValue, 0);
      return { totalCount, totalPaid, totalBalance: totalPlotValue - totalPaid, totalPlotValue };
    }
    // Plots
    return {
      totalCount: filteredPlots.length,
      totalPaid: filteredPlots.reduce((sum, p) => sum + (p.tokenAmount || (p as any).amountPaid || 0), 0),
      totalBalance: filteredPlots.reduce((sum, p) => sum + (p.balanceDue || 0), 0),
      totalPlotValue: filteredPlots.reduce((sum, p) => sum + (p.totalPrice || 0), 0)
    };
  }, [reportType, filteredBookings, filteredPayments, filteredPlots, employeePerformance]);

  // Export Date-wise CSV / Excel
  const exportCustomReport = () => {
    try {
      let headers: string[] = [];
      let rows: any[][] = [];
      let filename = `SCP_Report_${reportType}_${startDate || 'all'}_to_${endDate || 'all'}.csv`;

      if (reportType === 'bookings') {
        headers = [
          'Booking Reference',
          'Booking Date',
          'Plot Number',
          'Project',
          'Customer Name',
          'Customer Mobile',
          'Customer Email',
          'Booked By (Employee / User)',
          'Booking Type',
          'Amount Paid (INR)',
          'Balance Due (INR)',
          'Status'
        ];
        rows = filteredBookings.map(b => [
          `"${b.booking_reference || b.id}"`,
          `"${b.created_at ? new Date(b.created_at).toLocaleDateString('en-IN') : ''}"`,
          `"${b.plot_number || b.plotNumber || ''}"`,
          `"${b.project_name || b.projectName || 'SCP Farm Layout'}"`,
          `"${(b.customer_name || b.customerName || 'Buyer').replace(/"/g, '""')}"`,
          `"${b.customer_phone || b.customerPhone || ''}"`,
          `"${b.customer_email || b.customerEmail || ''}"`,
          `"${(b.booked_by_name || 'Staff').replace(/"/g, '""')}"`,
          `"${b.booking_type || 'token_advance'}"`,
          Number(b.amount_paid || b.amountPaid || 0),
          Number(b.balance_amount || b.balanceAmount || 0),
          `"${b.status || ''}"`
        ]);
      } else if (reportType === 'payments') {
        headers = [
          'Payment Reference',
          'Payment Date',
          'Plot Number',
          'Customer Name',
          'Payment Type',
          'Payment Method',
          'Transaction Reference',
          'Amount Received (INR)',
          'Status'
        ];
        rows = filteredPayments.map(p => [
          `"${p.payment_reference || p.id}"`,
          `"${p.payment_date || p.created_at ? new Date(p.payment_date || p.created_at).toLocaleDateString('en-IN') : ''}"`,
          `"${p.plot_number || ''}"`,
          `"${(p.customer_name || 'Buyer').replace(/"/g, '""')}"`,
          `"${p.payment_type || p.type || ''}"`,
          `"${p.payment_method || p.method || 'UPI'}"`,
          `"${p.gateway_transaction_id || p.transaction_id || ''}"`,
          Number(p.amount || 0),
          `"${p.status || ''}"`
        ]);
      } else if (reportType === 'employees') {
        headers = [
          'Employee / Staff Name',
          'Email Address',
          'Role',
          'Total Plots Booked',
          'Total Collections Received (INR)',
          'Total Booking Portfolio Value (INR)'
        ];
        rows = employeePerformance.map(e => [
          `"${e.name.replace(/"/g, '""')}"`,
          `"${e.email}"`,
          `"${e.role}"`,
          e.count,
          e.totalCollected,
          e.totalValue
        ]);
      } else {
        headers = [
          'Plot Number',
          'Area (Sq.Ft)',
          'Facing',
          'Road Width',
          'Price Per Sq.Ft',
          'Total Price (INR)',
          'Status',
          'Token Amount (INR)',
          'Customer Name',
          'Customer Mobile'
        ];
        rows = filteredPlots.map(p => [
          `"${p.plotNumber}"`,
          p.area || 0,
          `"${p.facing || 'North'}"`,
          `"${p.roadWidth || '20 ft'}"`,
          p.pricePerSqft || 2500,
          p.totalPrice || 0,
          `"${p.status}"`,
          p.tokenAmount || 0,
          `"${(p.customerName || '').replace(/"/g, '""')}"`,
          `"${p.customerPhone || ''}"`
        ]);
      }

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`✓ Downloaded ${filename}!`);
    } catch (err) {
      toast.error('Failed to export custom report');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Custom Date-Wise Reports</h1>
          <p className="text-slate-500 text-xs font-medium mt-0.5">
            Filter, analyze, and export plot transactions, collections, and executive sales date-by-date
          </p>
        </div>
        <div className="flex items-center gap-2.5 print:hidden">
          <button
            onClick={loadData}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Printer size={15} />
            <span>Print Report</span>
          </button>
          <button
            onClick={exportCustomReport}
            className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer"
          >
            <FileSpreadsheet size={16} />
            <span>Export CSV / Excel</span>
          </button>
        </div>
      </div>

      {/* Module Selector Tabs */}
      <div className="bg-slate-100 p-1.5 rounded-2xl flex flex-wrap gap-1 print:hidden">
        {[
          { id: 'bookings', label: 'Plot Bookings Report', icon: BookOpen },
          { id: 'payments', label: 'Payment Collections Report', icon: CreditCard },
          { id: 'employees', label: 'Employee Sales Performance', icon: Users },
          { id: 'plots', label: 'Plot Master Inventory', icon: Building2 },
        ].map(t => {
          const Icon = t.icon;
          const active = reportType === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setReportType(t.id as ReportType)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                active ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Icon size={15} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Date Filter & Control Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 print:hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wider">
            <Filter size={15} className="text-blue-600" />
            <span>Date-Wise & Filter Parameters</span>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1 text-[11px]">
            <span className="text-slate-400 font-bold mr-1">Quick:</span>
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'last7', label: 'Last 7 Days' },
              { id: 'this_month', label: 'This Month' },
              { id: 'last_month', label: 'Last Month' },
              { id: 'this_year', label: 'This Year' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setDatePreset(p.id as any)}
                className="px-2.5 py-1 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded-lg font-bold border border-slate-200/70 transition-colors cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* Start Date */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1 flex items-center gap-1">
              <Calendar size={12} className="text-slate-400" /> From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:border-blue-500 outline-none bg-white"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1 flex items-center gap-1">
              <Calendar size={12} className="text-slate-400" /> To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:border-blue-500 outline-none bg-white"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">Status Filter</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:border-blue-500 outline-none bg-white"
            >
              <option value="all">All Statuses</option>
              {reportType === 'plots' ? (
                <>
                  <option value="available">Available (Green)</option>
                  <option value="token_booked">Token Booked (Yellow)</option>
                  <option value="confirmed">Confirmed (Blue)</option>
                  <option value="sold">Sold Out (Red)</option>
                </>
              ) : (
                <>
                  <option value="token_paid">Token Paid</option>
                  <option value="partial_paid">Partial Paid</option>
                  <option value="confirmed">Confirmed Agreement</option>
                  <option value="completed">Completed / Sold</option>
                  <option value="cancelled">Cancelled</option>
                </>
              )}
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">Search Keywords</label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Plot no, client, staff, ref..."
                className="w-full border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-medium focus:border-blue-500 outline-none"
              />
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards for Selected Date Range */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase block tracking-wider">Total Records</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{summaryMetrics.totalCount}</div>
          <span className="text-[10px] text-slate-500 font-medium">In selected date range</span>
        </div>

        <div className="bg-emerald-50/80 rounded-2xl border border-emerald-200/80 p-4 shadow-sm">
          <span className="text-[11px] font-bold text-emerald-800 uppercase block tracking-wider">Total Collected</span>
          <div className="text-2xl font-black text-emerald-900 mt-1">{formatCurrencyFull(summaryMetrics.totalPaid)}</div>
          <span className="text-[10px] text-emerald-700 font-medium">Verified cash / UPI receipts</span>
        </div>

        <div className="bg-red-50/80 rounded-2xl border border-red-200/80 p-4 shadow-sm">
          <span className="text-[11px] font-bold text-red-800 uppercase block tracking-wider">Outstanding Balance</span>
          <div className="text-2xl font-black text-red-900 mt-1">{formatCurrencyFull(summaryMetrics.totalBalance)}</div>
          <span className="text-[10px] text-red-700 font-medium">Pending agreement collections</span>
        </div>

        <div className="bg-blue-50/80 rounded-2xl border border-blue-200/80 p-4 shadow-sm">
          <span className="text-[11px] font-bold text-blue-800 uppercase block tracking-wider">Portfolio Volume</span>
          <div className="text-2xl font-black text-blue-900 mt-1">{formatCurrencyFull(summaryMetrics.totalPlotValue)}</div>
          <span className="text-[10px] text-blue-700 font-medium">Total transaction value</span>
        </div>
      </div>

      {/* Report Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              {reportType === 'bookings' && 'Date-Wise Plot Bookings & Allocation Master'}
              {reportType === 'payments' && 'Date-Wise Payment Transactions & Gateway Records'}
              {reportType === 'employees' && 'Sales Executive & Staff Performance Breakdown'}
              {reportType === 'plots' && 'Master Plot Inventory & Availability Registry'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Showing {summaryMetrics.totalCount} entries {startDate ? `from ${startDate}` : ''} {endDate ? `to ${endDate}` : ''}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {reportType === 'bookings' && (
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                  <th className="text-left px-5 py-3.5">Booking Ref</th>
                  <th className="text-left px-3 py-3.5">Date</th>
                  <th className="text-left px-3 py-3.5">Plot No</th>
                  <th className="text-left px-4 py-3.5">Customer (Buyer)</th>
                  <th className="text-left px-4 py-3.5">Booked By (Staff)</th>
                  <th className="text-right px-4 py-3.5">Amount Paid</th>
                  <th className="text-right px-4 py-3.5">Balance Due</th>
                  <th className="text-left px-4 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400 font-medium">
                      No plot bookings found in the selected date range.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map(b => (
                    <tr key={b.id} className="table-row-hover">
                      <td className="px-5 py-3.5 font-mono font-bold text-blue-700">{b.booking_reference || b.id.slice(0, 8)}</td>
                      <td className="px-3 py-3.5 text-slate-500 font-mono">
                        {b.created_at ? new Date(b.created_at).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="px-3 py-3.5 font-black text-slate-900">{b.plot_number || b.plotNumber || '—'}</td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{b.customer_name || b.customerName || 'Valued Buyer'}</div>
                        {(b.customer_phone || b.customerPhone) && (
                          <div className="text-[10px] text-slate-400 font-mono">📞 {b.customer_phone || b.customerPhone}</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {(() => {
                          const isPartner =
                            b.channel_partner_name ||
                            b.channel_partner_id ||
                            b.booked_by_role === 'channel_partner' ||
                            b.booked_by_role === 'Channel Partner' ||
                            (b.booked_by_name && b.booked_by_name.toLowerCase().startsWith('cp'));

                          if (isPartner) {
                            return (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-purple-900 border border-purple-200/80 font-bold text-[10px]">
                                <span>🤝 {b.channel_partner_name || b.booked_by_name}</span>
                                <span className="text-[9px] bg-purple-200 text-purple-900 px-1 rounded uppercase">Partner</span>
                              </div>
                            );
                          }
                          return (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200/60 font-bold text-[10px]">
                              <span>👤 {b.booked_by_name || 'Staff'}</span>
                              <span className="text-[9px] bg-blue-200 text-blue-800 px-1 rounded uppercase">{b.booked_by_role || 'Staff'}</span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-emerald-700">
                        {formatCurrencyFull(Number(b.amount_paid || b.amountPaid || 0))}
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-red-600">
                        {Number(b.balance_amount || b.balanceAmount || 0) > 0 ? formatCurrencyFull(Number(b.balance_amount || b.balanceAmount || 0)) : '—'}
                      </td>
                      <td className="px-4 py-3.5"><StatusBadge status={b.status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {reportType === 'payments' && (
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                  <th className="text-left px-5 py-3.5">Payment Ref</th>
                  <th className="text-left px-3 py-3.5">Payment Date</th>
                  <th className="text-left px-3 py-3.5">Plot No</th>
                  <th className="text-left px-4 py-3.5">Customer Name</th>
                  <th className="text-left px-3 py-3.5">Type</th>
                  <th className="text-left px-3 py-3.5">Method</th>
                  <th className="text-right px-4 py-3.5">Amount</th>
                  <th className="text-left px-4 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400 font-medium">
                      No payment transactions found in the selected date range.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map(p => (
                    <tr key={p.id} className="table-row-hover">
                      <td className="px-5 py-3.5 font-mono font-bold text-blue-700">{p.payment_reference || p.id.slice(0, 8)}</td>
                      <td className="px-3 py-3.5 text-slate-500 font-mono">
                        {p.payment_date || p.created_at ? new Date(p.payment_date || p.created_at).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="px-3 py-3.5 font-black text-slate-900">{p.plot_number || '—'}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">{p.customer_name || 'Client'}</td>
                      <td className="px-3 py-3.5 capitalize text-slate-600">{(p.payment_type || p.type || '').replace('_', ' ')}</td>
                      <td className="px-3 py-3.5 uppercase font-bold text-slate-500">{p.payment_method || p.method || 'UPI'}</td>
                      <td className="px-4 py-3.5 text-right font-black text-emerald-700">{formatCurrencyFull(Number(p.amount))}</td>
                      <td className="px-4 py-3.5"><StatusBadge status={p.status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {reportType === 'employees' && (
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                  <th className="text-left px-5 py-3.5">Staff / Sales Executive</th>
                  <th className="text-left px-4 py-3.5">Email</th>
                  <th className="text-left px-3 py-3.5">Role</th>
                  <th className="text-center px-4 py-3.5">Plots Booked</th>
                  <th className="text-right px-4 py-3.5">Total Collections (INR)</th>
                  <th className="text-right px-4 py-3.5">Total Portfolio (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {employeePerformance.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                      No sales activity found for the selected dates.
                    </td>
                  </tr>
                ) : (
                  employeePerformance.map((emp, idx) => (
                    <tr key={idx} className="table-row-hover">
                      <td className="px-5 py-3.5 font-black text-slate-900 flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center text-blue-800 font-bold text-xs">
                          {emp.name.charAt(0)}
                        </div>
                        <span>{emp.name}</span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 font-mono">{emp.email}</td>
                      <td className="px-3 py-3.5">
                        <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px]">
                          {emp.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center font-black text-blue-700">{emp.count}</td>
                      <td className="px-4 py-3.5 text-right font-black text-emerald-700">{formatCurrencyFull(emp.totalCollected)}</td>
                      <td className="px-4 py-3.5 text-right font-black text-slate-900">{formatCurrencyFull(emp.totalValue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {reportType === 'plots' && (
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                  <th className="text-left px-5 py-3.5">Plot No</th>
                  <th className="text-right px-4 py-3.5">Area (Sq.Ft)</th>
                  <th className="text-left px-3 py-3.5">Facing</th>
                  <th className="text-left px-3 py-3.5">Road Width</th>
                  <th className="text-right px-4 py-3.5">Price</th>
                  <th className="text-left px-4 py-3.5">Status</th>
                  <th className="text-left px-4 py-3.5">Allocated Customer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredPlots.map(p => (
                  <tr key={p.id} className="table-row-hover">
                    <td className="px-5 py-3.5 font-black text-slate-900">{p.plotNumber}</td>
                    <td className="px-4 py-3.5 text-right text-slate-700 font-medium">{p.area} sq.ft</td>
                    <td className="px-3 py-3.5 text-slate-600">{p.facing || 'North'}</td>
                    <td className="px-3 py-3.5 text-slate-600">{p.roadWidth || '20 ft'}</td>
                    <td className="px-4 py-3.5 text-right font-black text-slate-900">{formatCurrencyFull(p.totalPrice)}</td>
                    <td className="px-4 py-3.5 capitalize font-bold"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3.5 text-slate-700 font-medium">{p.customerName || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
