import React, { useState } from 'react';
import { Plot } from '../../types';
import { PlotMap } from '../../components/plots/PlotMap';
import { PlotDetailsDrawer } from '../../components/plots/PlotDetailsDrawer';
import { usePlotStore } from '../../store/plotStore';
import { useAuthStore } from '../../store/authStore';
import { useChannelPartnerStore, useBookingStore, useCustomerStore, usePaymentStore } from '../../store/stores';
import { StatusBadge } from '../../components/ui/UIComponents';
import { formatCurrencyFull, formatCurrency } from '../../utils/helpers';
import { mockProjects } from '../../data/mockData';
import { Building2, Award, TrendingUp } from 'lucide-react';

// ── Available Plots ───────────────────────────────────────
export const ChannelPlots: React.FC = () => {
  const { plots } = usePlotStore();
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Available Plots for Clients</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Browse available inventory and initiate bookings on behalf of your customers</p>
      </div>
      <PlotMap plots={plots} onPlotClick={setSelectedPlot} />
      <PlotDetailsDrawer plot={selectedPlot} onClose={() => setSelectedPlot(null)} />
    </div>
  );
};

// ── Projects ──────────────────────────────────────────────
export const ChannelProjects: React.FC = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="text-2xl font-black text-slate-900">Active Townships</h1>
      <p className="text-slate-500 text-xs font-medium mt-0.5">View ongoing real estate developments open for partner booking</p>
    </div>
    <div className="grid gap-5">
      {mockProjects.filter(p => p.status === 'active').map(proj => (
        <div key={proj.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row gap-5 items-start md:items-center">
          <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center flex-shrink-0 border border-amber-200">
            <Building2 size={32} className="text-amber-700" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-slate-900 text-base">{proj.name}</h3>
            <p className="text-slate-500 text-xs">{proj.location}</p>
            <p className="text-slate-400 text-xs mt-1 line-clamp-2">{proj.description}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-xs">
              <span className="text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">✓ {proj.availablePlots} Available</span>
              <span className="text-orange-800 font-bold bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">⏳ {proj.tokenBookedPlots + proj.confirmedPlots} Booked</span>
              <span className="text-slate-600 font-bold bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">✗ {proj.soldPlots} Sold</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ── My Customers ──────────────────────────────────────────
export const ChannelCustomers: React.FC = () => {
  const { customers } = useCustomerStore();
  const { user } = useAuthStore();
  const { channelPartners } = useChannelPartnerStore();
  const cp = channelPartners.find(c => c.email === user?.email) || channelPartners[0];
  const myCustomers = customers.filter(c => c.assignedChannelPartnerId === cp?.id);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900">My Clients & Leads</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Manage buyers registered under your agency</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                <th className="text-left px-6 py-3.5">Customer</th>
                <th className="text-left px-4 py-3.5">Phone Number</th>
                <th className="text-right px-4 py-3.5">Plots Booked</th>
                <th className="text-right px-4 py-3.5">Total Paid</th>
                <th className="text-right px-4 py-3.5">Balance Due</th>
                <th className="text-left px-4 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {myCustomers.map(c => (
                <tr key={c.id} className="table-row-hover">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center text-amber-900 font-black text-xs">{c.name.charAt(0)}</div>
                      <div>
                        <div className="font-bold text-slate-900">{c.name}</div>
                        <div className="text-[10px] text-slate-400">{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-700 font-medium">{c.phone}</td>
                  <td className="px-4 py-3.5 text-right font-bold text-slate-900">{c.plotIds.length}</td>
                  <td className="px-4 py-3.5 text-right font-black text-emerald-700">{formatCurrencyFull(c.totalPaid)}</td>
                  <td className="px-4 py-3.5 text-right font-black text-red-600">{c.totalBalance > 0 ? formatCurrencyFull(c.totalBalance) : '—'}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={c.status} /></td>
                </tr>
              ))}
              {myCustomers.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-slate-400 text-xs font-medium">No customers registered yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ── My Bookings ───────────────────────────────────────────
export const ChannelBookings: React.FC = () => {
  const { bookings } = useBookingStore();
  const { user } = useAuthStore();
  const { channelPartners } = useChannelPartnerStore();
  const cp = channelPartners.find(c => c.email === user?.email) || channelPartners[0];
  const myBookings = bookings.filter(b => b.channelPartnerId === cp?.id);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900">My Client Bookings</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Track deal pipeline and payment milestones</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                <th className="text-left px-6 py-3.5">Plot No</th>
                <th className="text-left px-4 py-3.5">Customer Name</th>
                <th className="text-left px-4 py-3.5">Date</th>
                <th className="text-right px-4 py-3.5">Amount Paid</th>
                <th className="text-right px-4 py-3.5">Balance</th>
                <th className="text-left px-4 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {myBookings.map(b => (
                <tr key={b.id} className="table-row-hover">
                  <td className="px-6 py-3.5 font-black text-slate-900">{b.plotNumber}</td>
                  <td className="px-4 py-3.5 text-slate-700 font-medium">{b.customerName}</td>
                  <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">{b.bookingDate}</td>
                  <td className="px-4 py-3.5 text-right font-black text-emerald-700">{formatCurrencyFull(b.amountPaid)}</td>
                  <td className="px-4 py-3.5 text-right font-black text-red-600">{b.balanceAmount > 0 ? formatCurrencyFull(b.balanceAmount) : '—'}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={b.status} /></td>
                </tr>
              ))}
              {myBookings.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-slate-400 text-xs font-medium">No bookings recorded yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ── Payments ──────────────────────────────────────────────
export const ChannelPayments: React.FC = () => {
  const { payments } = usePaymentStore();
  const { user } = useAuthStore();
  const { channelPartners } = useChannelPartnerStore();
  const cp = channelPartners.find(c => c.email === user?.email) || channelPartners[0];
  const myPayments = payments.filter(p => p.channelPartnerId === cp?.id);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Partner Payment Receipts</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Collections received from your referred buyers</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
              <th className="text-left px-6 py-3.5">Customer</th>
              <th className="text-left px-4 py-3.5">Plot No</th>
              <th className="text-left px-4 py-3.5">Payment Type</th>
              <th className="text-right px-4 py-3.5">Amount Paid</th>
              <th className="text-left px-4 py-3.5">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {myPayments.map(p => (
              <tr key={p.id} className="table-row-hover">
                <td className="px-6 py-3.5 font-bold text-slate-900">{p.customerName}</td>
                <td className="px-4 py-3.5 font-black text-slate-800">{p.plotNumber || '—'}</td>
                <td className="px-4 py-3.5 text-slate-600 capitalize">{p.type.replace('_', ' ')}</td>
                <td className="px-4 py-3.5 text-right font-black text-emerald-700">{formatCurrencyFull(p.amount)}</td>
                <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">{p.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Commission ────────────────────────────────────────────
export const ChannelCommission: React.FC = () => {
  const { user } = useAuthStore();
  const { channelPartners } = useChannelPartnerStore();
  const cp = channelPartners.find(c => c.email === user?.email) || channelPartners[0];

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Commission & Payouts</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Track your brokerage commissions and eligible payout balances</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center">
              <Award size={20} className="text-emerald-700" />
            </div>
            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Earned Commission</div>
          </div>
          <div className="text-2xl font-black text-emerald-700">{formatCurrency(cp?.commission || 0)}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} className="text-amber-700" />
            </div>
            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Pending Payout</div>
          </div>
          <div className="text-2xl font-black text-amber-700">{formatCurrency(cp?.pendingCommission || 0)}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} className="text-slate-700" />
            </div>
            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Total Sales Volume</div>
          </div>
          <div className="text-2xl font-black text-slate-900">{formatCurrency(cp?.totalRevenue || 0)}</div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4">Commission Structure & Breakdown</h3>
        <div className="space-y-3 divide-y divide-slate-100">
          {[
            { label: 'Token Advance Brokerage (1.0%)', value: Math.round((cp?.totalRevenue || 0) * 0.003) },
            { label: 'Confirmed Booking Commission (2.0%)', value: Math.round((cp?.totalRevenue || 0) * 0.006) },
            { label: 'Final Deed Execution Incentive (1.0%)', value: Math.round((cp?.totalRevenue || 0) * 0.001) },
          ].map(item => (
            <div key={item.label} className="flex justify-between py-2.5 first:pt-0">
              <span className="text-xs font-bold text-slate-700">{item.label}</span>
              <span className="text-xs font-black text-emerald-700">{formatCurrencyFull(item.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Profile ───────────────────────────────────────────────
export const ChannelProfile: React.FC = () => {
  const { user } = useAuthStore();
  const { channelPartners } = useChannelPartnerStore();
  const cp = channelPartners.find(c => c.email === user?.email) || channelPartners[0];

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Partner Profile</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Agency KYC, bank settlement information, and contact details</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-950 text-2xl font-black shadow-sm">
            {cp?.name?.charAt(0) || 'P'}
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">{cp?.name}</h2>
            <p className="text-slate-500 text-xs font-medium">{cp?.companyName}</p>
            <div className="mt-1.5"><StatusBadge status={cp?.status || 'approved'} /></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Official Email', value: cp?.email },
            { label: 'Mobile Number', value: cp?.phone },
            { label: 'Registered Address', value: cp?.address },
            { label: 'Aadhar Number', value: cp?.aadhar },
            { label: 'PAN Card Number', value: cp?.pan },
            { label: 'Bank Settlement Account', value: cp?.bankDetails },
          ].map(item => (
            <div key={item.label} className={item.label.includes('Address') || item.label.includes('Bank') ? 'col-span-2' : ''}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{item.label}</p>
              <p className="text-xs text-slate-800 font-semibold">{item.value || '—'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Documents ─────────────────────────────────────────────
export const ChannelDocuments: React.FC = () => {
  const docs = [
    { name: 'Channel Partner Agreement Deed', status: 'verified' },
    { name: 'Aadhar KYC Verification', status: 'verified' },
    { name: 'PAN Card Verification', status: 'verified' },
    { name: 'RERA Broker Certificate', status: 'pending_verification' },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Partner Documents</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Uploaded agreements and statutory verifications</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="space-y-3 divide-y divide-slate-100">
          {docs.map(doc => (
            <div key={doc.name} className="flex items-center justify-between py-3 first:pt-0">
              <span className="text-xs font-bold text-slate-800">{doc.name}</span>
              <StatusBadge status={doc.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
