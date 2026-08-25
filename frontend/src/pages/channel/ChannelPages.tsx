import React, { useState, useEffect } from 'react';
import { usePlotStore } from '../../store/plotStore';
import { useAuthStore } from '../../store/authStore';
import { StatusBadge, Modal } from '../../components/ui/UIComponents';
import { PlotDetailsDrawer } from '../../components/plots/PlotDetailsDrawer';
import { Plot } from '../../types';
import { Search, UserPlus, Award, TrendingUp, FolderOpen, Bell, User, Phone, Mail, MapPin, Printer, FileSpreadsheet, IndianRupee, Clock } from 'lucide-react';
import { formatCurrencyFull, generateId } from '../../utils/helpers';
import { mockProjects, mockDocuments } from '../../data/mockData';
import { PlotMap } from '../../components/plots/PlotMap';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { PaymentReceiptModal, ReceiptData } from '../../components/booking/PaymentReceiptModal';
import { BookingWizard } from '../../components/booking/BookingWizard';
import { CreditCard } from 'lucide-react';

const isMyChannelBooking = (b: any, user: any) => {
  if (!user) return false;
  const userName = (user.name || '').trim().toLowerCase();
  const userEmail = (user.email || '').trim().toLowerCase();
  const userId = user.id;

  const bCpId = b.channel_partner_id || b.channelPartnerId;
  const bCpName = (b.channel_partner_name || b.channelPartnerName || '').trim().toLowerCase();
  const bBookedById = b.booked_by_user_id || b.bookedByUserId;
  const bBookedByName = (b.booked_by_name || b.bookedByName || '').trim().toLowerCase();
  const bBookedByEmail = (b.booked_by_email || b.bookedByEmail || '').trim().toLowerCase();

  // 1. Direct ID matching (User ID or Channel Partner ID)
  if (userId && (bCpId === userId || bBookedById === userId)) return true;

  // 2. Name matching (Channel Partner name or Booked By User name)
  if (userName) {
    if (bCpName && (bCpName === userName || bCpName.includes(userName) || userName.includes(bCpName))) return true;
    if (bBookedByName && (bBookedByName === userName || bBookedByName.includes(userName) || userName.includes(bBookedByName))) return true;
  }

  // 3. Email matching
  if (userEmail) {
    if (bCpName && (bCpName === userEmail || bCpName.includes(userEmail))) return true;
    if (bBookedByEmail && (bBookedByEmail === userEmail || bBookedByEmail.includes(userEmail))) return true;
  }

  return false;
};

const isMyChannelPayment = (p: any, user: any, myBookingIds: Set<string>) => {
  if (!user) return false;
  const userName = (user.name || '').trim().toLowerCase();
  const userEmail = (user.email || '').trim().toLowerCase();
  const userId = user.id;

  if (p.booking_id && myBookingIds.has(p.booking_id)) return true;
  if (userId && (p.channel_partner_id === userId || p.booked_by_user_id === userId)) return true;
  
  const pCpName = (p.channel_partner_name || p.booked_by_name || '').trim().toLowerCase();
  if (userName && pCpName && (pCpName === userName || pCpName.includes(userName) || userName.includes(pCpName))) return true;
  if (userEmail && pCpName && (pCpName === userEmail || pCpName.includes(userEmail))) return true;

  return false;
};

export const ChannelPlots: React.FC = () => {
  const { plots, fetchPlots } = usePlotStore();
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);

  useEffect(() => {
    fetchPlots();
  }, []);

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Available Plots for Sale</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Interactive CAD blueprint, matrix grid, and architectural survey drawings for client presentations</p>
      </div>

      <PlotMap plots={plots} onPlotClick={(p) => setSelectedPlot(p)} />

      <PlotDetailsDrawer plot={selectedPlot} onClose={() => setSelectedPlot(null)} />
    </div>
  );
};

export const ChannelProjects: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    const fetchLive = async () => {
      try {
        const res = await api.projects.list();
        if (res && res.length > 0) setProjects(res);
        else setProjects(mockProjects);
      } catch {
        setProjects(mockProjects);
      }
    };
    fetchLive();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Township Projects</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Explore active real estate developments and project master plans</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map(proj => (
          <div key={proj.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
            <div className="h-44 bg-slate-900 relative overflow-hidden">
              {proj.imageUrl && <img src={proj.imageUrl} alt={proj.name} className="w-full h-full object-cover opacity-75" />}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute bottom-4 left-5 text-white">
                <h3 className="font-black text-lg leading-tight">{proj.name}</h3>
                <p className="text-slate-300 text-xs mt-0.5">{proj.location}</p>
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-3 gap-2 text-center mb-4">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100"><div className="font-black text-slate-900">{proj.totalPlots}</div><div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total</div></div>
                <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200"><div className="font-black text-emerald-800">{proj.availablePlots}</div><div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Available</div></div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100"><div className="font-black text-slate-600">{proj.soldPlots}</div><div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sold</div></div>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2">{proj.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ChannelCustomers: React.FC = () => {
  const { user } = useAuthStore();
  const [customers, setCustomers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });

  useEffect(() => {
    Promise.all([
      api.customers.list().catch(() => []),
      api.bookings.list().catch(() => []),
    ]).then(([custList, bookList]) => {
      setCustomers(custList || []);
      setBookings(bookList || []);
    }).finally(() => setLoading(false));
  }, []);

  const myBookings = bookings.filter(b => isMyChannelBooking(b, user));
  const myBookingCustomerIds = new Set(myBookings.map(b => b.customer_id || b.customerId));

  const myCustomers = customers.filter(c => {
    if (!user) return false;
    const userName = (user.name || '').trim().toLowerCase();
    const userId = user.id;

    if (userId && c.assigned_partner_id === userId) return true;
    if (userName && c.assigned_partner_name && c.assigned_partner_name.toLowerCase().includes(userName)) return true;
    if (myBookingCustomerIds.has(c.id)) return true;
    return false;
  });

  const filtered = myCustomers.filter(c => !search || (c.name || '').toLowerCase().includes(search.toLowerCase()) || (c.phone || '').includes(search));

  const handleAdd = async () => {
    if (!form.name || !form.phone) { toast.error('Name and phone are required'); return; }
    try {
      await api.customers.create({
        first_name: form.name.split(' ')[0],
        last_name: form.name.split(' ').slice(1).join(' ') || '',
        phone: form.phone,
        email: form.email || `${form.name.toLowerCase().replace(/\s+/g, '')}@example.com`,
        address_line_1: form.address,
        assigned_channel_partner_id: user?.id,
      });
      toast.success('✓ Client registered under your partner account');
      setShowAdd(false);
      setForm({ name: '', phone: '', email: '', address: '' });
      // Refresh
      const updated = await api.customers.list().catch(() => []);
      setCustomers(updated || []);
    } catch {
      toast.error('Failed to create customer');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Client Directory</h1>
          <p className="text-slate-500 text-xs font-medium mt-0.5">Manage buyers registered under your agency</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-blue-500/20 cursor-pointer"
        >
          <UserPlus size={16} />
          Add Client
        </button>
      </div>

      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 max-w-sm shadow-2xs focus-within:border-sky-500">
        <Search size={15} className="text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients..."
          className="outline-none text-xs text-slate-800 bg-transparent flex-1 placeholder:text-slate-400" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
              <th className="text-left px-6 py-3.5">Client Name</th>
              <th className="text-left px-4 py-3.5">Phone Number</th>
              <th className="text-left px-4 py-3.5">Email</th>
              <th className="text-right px-4 py-3.5">Plots Allocated</th>
              <th className="text-right px-4 py-3.5">Total Paid</th>
              <th className="text-left px-4 py-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-slate-400 font-medium">Loading your clients...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-slate-400 font-medium">No clients registered under your agency yet.</td></tr>
            ) : (
              filtered.map(c => (
                <tr key={c.id} className="table-row-hover">
                  <td className="px-6 py-3.5 font-bold text-slate-900">{c.name}</td>
                  <td className="px-4 py-3.5 text-slate-700 font-medium">{c.phone}</td>
                  <td className="px-4 py-3.5 text-slate-500">{c.email}</td>
                  <td className="px-4 py-3.5 text-right font-medium">{c.allocated_plots_count || (c.plotIds ? c.plotIds.length : 0)}</td>
                  <td className="px-4 py-3.5 text-right font-black text-emerald-700">{formatCurrencyFull(c.total_paid || c.totalPaid || 0)}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={c.status} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Register New Client" size="md">
        <div className="space-y-3.5">
          <div><label className="text-xs font-bold block mb-1">Full Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full border rounded-xl p-2.5 text-xs outline-none focus:border-sky-500" placeholder="Client Name" /></div>
          <div><label className="text-xs font-bold block mb-1">Phone Number *</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full border rounded-xl p-2.5 text-xs outline-none focus:border-sky-500" placeholder="10-digit mobile" /></div>
          <div><label className="text-xs font-bold block mb-1">Email</label><input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full border rounded-xl p-2.5 text-xs outline-none focus:border-sky-500" placeholder="email@example.com" /></div>
          <div><label className="text-xs font-bold block mb-1">Address</label><textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="w-full border rounded-xl p-2.5 text-xs outline-none focus:border-sky-500 h-16 resize-none" placeholder="Residential address" /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-xs font-bold text-slate-600 border rounded-xl">Cancel</button>
            <button onClick={handleAdd} className="px-5 py-2 text-xs text-white bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 rounded-xl font-black uppercase tracking-wider shadow-sm">Save Client</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export const ChannelBookings: React.FC = () => {
  const { user } = useAuthStore();
  const { plots, fetchPlots } = usePlotStore();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [selectedPlotForPay, setSelectedPlotForPay] = useState<Plot | null>(null);

  const loadData = () => {
    fetchPlots();
    api.bookings.list()
      .then(data => setBookings(data || []))
      .catch(() => [])
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const myBookings = bookings.filter(b => isMyChannelBooking(b, user));

  const handlePayBalance = (b: any) => {
    const plotNum = b.plot_number || b.plotNumber;
    const existingPlot = plots.find(p => p.plotNumber === plotNum || p.id === (b.plot_id || b.plotId));
    const plotObj: Plot = existingPlot ? {
      ...existingPlot,
      customerName: b.customer_name || existingPlot.customerName,
      customerPhone: b.customer_phone || existingPlot.customerPhone,
      customerEmail: b.customer_email || existingPlot.customerEmail,
      totalPrice: Number(b.total_amount || existingPlot.totalPrice),
      totalPaid: Number(b.amount_paid || existingPlot.totalPaid || 0),
      balanceDue: Number(b.balance_amount !== undefined ? b.balance_amount : (existingPlot.balanceDue || 0)),
      status: b.status === 'token_paid' ? 'token_booked' : (b.status === 'confirmed' ? 'partial_booked' : existingPlot.status),
    } : {
      id: b.plot_id || b.id,
      plotNumber: plotNum || 'Plot',
      projectId: b.project_id || 'proj-1',
      projectName: b.project_name || 'Green Valley Township',
      location: 'Chennai Highway',
      dimensions: '30x40',
      area: 1200,
      facing: 'North',
      roadWidth: '30 ft',
      pricePerSqft: 2500,
      totalPrice: Number(b.total_amount || 3000000),
      status: b.status === 'token_paid' ? 'token_booked' : 'partial_booked',
      row: 1,
      col: 1,
      totalPaid: Number(b.amount_paid || 0),
      balanceDue: Number(b.balance_amount || 0),
      customerName: b.customer_name,
      customerEmail: b.customer_email,
      customerPhone: b.customer_phone,
      channelPartnerName: user?.name,
    };
    setSelectedPlotForPay(plotObj);
  };

  const handleOpenReceipt = (b: any) => {
    const receipt: ReceiptData = {
      receiptNumber: `PAY-${(b.booking_reference || b.id).slice(0, 12)}`,
      bookingReference: b.booking_reference || b.id,
      date: b.created_at || new Date().toISOString(),
      customerName: b.customer_name || 'Valued Client',
      customerEmail: b.customer_email,
      customerPhone: b.customer_phone,
      plotNumber: b.plot_number || 'Plot',
      projectName: b.project_name || 'Green Valley Township',
      projectLocation: 'Chennai Highway, Tamil Nadu',
      paymentType: b.status === 'token_paid' ? 'token_advance' : (b.status === 'sold' ? 'full_payment' : 'continue_payment'),
      paymentMethod: 'UPI',
      transactionId: `UPI-${b.id.slice(0, 8).toUpperCase()}`,
      amountPaid: Number(b.amount_paid || 0),
      balanceAmount: Number(b.balance_amount || 0),
      deadlineDate: b.payment_deadline_at,
      channelPartnerName: user?.name,
    };
    setSelectedReceipt(receipt);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900">My Client Bookings</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Track status, token amounts, and balance schedules of all bookings made through your agency</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
              <th className="text-left px-6 py-3.5">Booking Ref</th>
              <th className="text-left px-4 py-3.5">Plot No</th>
              <th className="text-left px-4 py-3.5">Client Name</th>
              <th className="text-left px-4 py-3.5">Date</th>
              <th className="text-right px-4 py-3.5">Amount Paid</th>
              <th className="text-right px-4 py-3.5">Balance</th>
              <th className="text-left px-4 py-3.5">Status</th>
              <th className="text-right px-6 py-3.5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8 text-slate-400 font-medium">Loading your client bookings...</td></tr>
            ) : myBookings.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-slate-400 font-medium">No bookings recorded for your agency yet.</td>
              </tr>
            ) : (
              myBookings.map(b => {
                const hasBalance = Number(b.balance_amount) > 0 && b.status !== 'sold';
                return (
                  <tr key={b.id} className="table-row-hover">
                    <td className="px-6 py-3.5 font-mono font-bold text-blue-700">{b.booking_reference || b.id.slice(0, 8)}</td>
                    <td className="px-4 py-3.5 font-black text-slate-900">{b.plot_number || '—'}</td>
                    <td className="px-4 py-3.5 text-slate-700 font-medium">{b.customer_name}</td>
                    <td className="px-4 py-3.5 text-slate-500 font-mono">
                      {b.created_at ? new Date(b.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-right font-black text-emerald-700">{formatCurrencyFull(Number(b.amount_paid))}</td>
                    <td className="px-4 py-3.5 text-right font-black text-red-600">{Number(b.balance_amount) > 0 ? formatCurrencyFull(Number(b.balance_amount)) : '—'}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={b.status} /></td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {hasBalance && (
                          <button
                            onClick={() => handlePayBalance(b)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white rounded-xl font-bold text-xs shadow-2xs transition-all cursor-pointer"
                          >
                            <CreditCard size={13} />
                            Pay Balance
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenReceipt(b)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                        >
                          <Printer size={13} />
                          Receipt
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Booking Wizard Modal for Paying Balance */}
      {selectedPlotForPay && (
        <BookingWizard
          plot={selectedPlotForPay}
          onClose={() => {
            setSelectedPlotForPay(null);
            loadData();
          }}
        />
      )}

      {/* Receipt Modal */}
      {selectedReceipt && (
        <PaymentReceiptModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
};

export const ChannelPayments: React.FC = () => {
  const { user } = useAuthStore();
  const [payments, setPayments] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);

  useEffect(() => {
    Promise.all([
      api.payments.list().catch(() => []),
      api.bookings.list().catch(() => []),
    ]).then(([payData, bookData]) => {
      setPayments(payData || []);
      setBookings(bookData || []);
    }).finally(() => setLoading(false));
  }, []);

  const myBookings = bookings.filter(b => isMyChannelBooking(b, user));
  const myBookingIds = new Set(myBookings.map(b => b.id));
  const myPayments = payments.filter(p => isMyChannelPayment(p, user, myBookingIds));

  const handleOpenReceipt = (p: any) => {
    const linkedBooking = myBookings.find(b => b.id === p.booking_id) || {};
    const receipt: ReceiptData = {
      receiptNumber: p.payment_reference || `PAY-${p.id.slice(0, 8).toUpperCase()}`,
      bookingReference: linkedBooking.booking_reference || linkedBooking.bookingReference,
      date: p.payment_date || p.created_at || new Date().toISOString(),
      customerName: p.customer_name || linkedBooking.customer_name || 'Valued Buyer',
      customerEmail: linkedBooking.customer_email,
      customerPhone: linkedBooking.customer_phone,
      plotNumber: p.plot_number || linkedBooking.plot_number || 'Plot',
      projectName: linkedBooking.project_name || 'Green Valley Township',
      projectLocation: 'Chennai Highway, Tamil Nadu',
      paymentType: p.payment_type || p.type || 'token_advance',
      paymentMethod: p.payment_method || p.method || 'UPI',
      transactionId: p.gateway_transaction_id || `UPI-${p.id.slice(0, 8).toUpperCase()}`,
      amountPaid: Number(p.amount),
      balanceAmount: linkedBooking.balance_amount ? Number(linkedBooking.balance_amount) : undefined,
      channelPartnerName: user?.name,
    };
    setSelectedReceipt(receipt);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Payment Audit Trail</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Live transaction records for your agency bookings</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
              <th className="text-left px-6 py-3.5">Payment Ref</th>
              <th className="text-left px-4 py-3.5">Client Name</th>
              <th className="text-left px-4 py-3.5">Plot No</th>
              <th className="text-left px-4 py-3.5">Type</th>
              <th className="text-right px-4 py-3.5">Amount</th>
              <th className="text-left px-4 py-3.5">Status</th>
              <th className="text-right px-6 py-3.5">Receipt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8 text-slate-400 font-medium">Loading transactions...</td></tr>
            ) : myPayments.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400 font-medium">No payment transactions recorded for your agency yet.</td>
              </tr>
            ) : (
              myPayments.map(p => (
                <tr key={p.id} className="table-row-hover">
                  <td className="px-6 py-3.5 font-mono font-bold text-blue-700">{p.payment_reference || p.id.slice(0, 8)}</td>
                  <td className="px-4 py-3.5 font-bold text-slate-900">{p.customer_name || 'Client'}</td>
                  <td className="px-4 py-3.5 font-black">{p.plot_number || '—'}</td>
                  <td className="px-4 py-3.5 capitalize text-slate-600">{(p.payment_type || '').replace('_', ' ')}</td>
                  <td className="px-4 py-3.5 text-right font-black text-emerald-700">{formatCurrencyFull(Number(p.amount))}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={p.status} /></td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      onClick={() => handleOpenReceipt(p)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                    >
                      <Printer size={13} />
                      Receipt
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <PaymentReceiptModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
};

export const ChannelCommission: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Commission & Payouts</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Track your brokerage rate, payout history, and pending claims</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <Award size={20} className="text-blue-700 mb-2" />
          <div className="text-2xl font-black text-blue-900">₹4,20,000</div>
          <div className="text-xs text-blue-700 font-bold uppercase tracking-wider mt-1">Total Earned</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
          <TrendingUp size={20} className="text-emerald-700 mb-2" />
          <div className="text-2xl font-black text-emerald-800">₹3,00,000</div>
          <div className="text-xs text-emerald-700 font-bold uppercase tracking-wider mt-1">Paid Out</div>
        </div>
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-5">
          <Award size={20} className="text-sky-700 mb-2" />
          <div className="text-2xl font-black text-sky-800">₹1,20,000</div>
          <div className="text-xs text-sky-700 font-bold uppercase tracking-wider mt-1">Pending Approval</div>
        </div>
      </div>
    </div>
  );
};

export const ChannelReports: React.FC = () => {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<any[]>([]);
  const { plots, fetchPlots } = usePlotStore();
  const [loading, setLoading] = useState(true);

  // Date Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const loadReportData = () => {
    setLoading(true);
    fetchPlots();
    api.bookings.list()
      .then(data => setBookings(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReportData();
  }, []);

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

  const isWithinDateRange = (dateString?: string) => {
    if (!dateString) return true;
    const itemDate = new Date(dateString).toISOString().slice(0, 10);
    if (startDate && itemDate < startDate) return false;
    if (endDate && itemDate > endDate) return false;
    return true;
  };

  const myBookings = bookings.filter(b => isMyChannelBooking(b, user));

  const filteredBookings = myBookings.filter(b => {
    if (!isWithinDateRange(b.created_at || b.booking_date || b.bookingDate)) return false;
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const plot = (b.plot_number || b.plotNumber || '').toLowerCase();
      const cust = (b.customer_name || b.customerName || '').toLowerCase();
      const ref = (b.booking_reference || b.id || '').toLowerCase();
      if (!plot.includes(q) && !cust.includes(q) && !ref.includes(q)) return false;
    }
    return true;
  });

  const totalSalesValue = filteredBookings.reduce((sum, b) => sum + Number(b.total_amount || b.totalAmount || 0), 0);
  const totalCollected = filteredBookings.reduce((sum, b) => sum + Number(b.amount_paid || b.amountPaid || 0), 0);
  const totalBalance = filteredBookings.reduce((sum, b) => sum + Number(b.balance_amount || b.balanceAmount || 0), 0);

  const exportPartnerSalesReport = () => {
    try {
      const headers = [
        'Booking Reference',
        'Plot Number',
        'Buyer Name',
        'Buyer Contact',
        'Project Name',
        'Plot Price (INR)',
        'Amount Collected (INR)',
        'Balance Due (INR)',
        'Booking Status',
        'Booking Date'
      ];

      const rows = filteredBookings.map(b => {
        const plotNum = b.plot_number || b.plotNumber;
        const total = Number(b.total_amount || b.totalAmount || 0);
        const paid = Number(b.amount_paid || b.amountPaid || 0);
        const balance = Number(b.balance_amount || b.balanceAmount || 0);
        return [
          `"${b.booking_reference || b.bookingReference || b.id}"`,
          `"${plotNum || 'Plot'}"`,
          `"${(b.customer_name || b.customerName || 'Client').replace(/"/g, '""')}"`,
          `"${b.customer_email || b.customer_phone || ''}"`,
          `"${b.project_name || b.projectName || 'Township Layout'}"`,
          total,
          paid,
          balance,
          `"${(b.status || 'token_paid').replace('_', ' ').toUpperCase()}"`,
          `"${b.created_at || b.booking_date ? new Date(b.created_at || b.booking_date).toLocaleDateString('en-IN') : ''}"`
        ];
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const dateStr = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `Channel_Partner_Sales_Report_${startDate || 'all'}_to_${endDate || 'all'}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('✓ Partner Sales report downloaded!');
    } catch {
      toast.error('Failed to export report');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Partner Custom Date-Wise Reports</h1>
          <p className="text-slate-500 text-xs font-medium mt-0.5">Filter, analyze, and export your referred client plot sales date-by-date</p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={loadReportData}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 shadow-2xs transition-colors cursor-pointer"
          >
            Refresh
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Printer size={15} />
            <span>Print</span>
          </button>
          <button
            onClick={exportPartnerSalesReport}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer"
          >
            <FileSpreadsheet size={15} />
            <span>Export Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* Date Filter & Control Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3 print:hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wider">
            <span>Date Range & Parameters</span>
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
                className="px-2 py-0.5 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded-lg font-bold border border-slate-200/70 transition-colors cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium focus:border-blue-500 outline-none bg-white"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium focus:border-blue-500 outline-none bg-white"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">Booking Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium focus:border-blue-500 outline-none bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="token_paid">Token Paid</option>
              <option value="partial_paid">Partial Paid</option>
              <option value="confirmed">Confirmed</option>
              <option value="sold">Sold Out</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">Search Keywords</label>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Plot no, client name, ref..."
              className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium focus:border-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <Award size={18} className="text-blue-600 mb-1.5" />
          <div className="text-2xl font-black text-slate-900">{filteredBookings.length}</div>
          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Referred Plots</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <TrendingUp size={18} className="text-purple-600 mb-1.5" />
          <div className="text-2xl font-black text-slate-900">{formatCurrencyFull(totalSalesValue)}</div>
          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Total Sales Value</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <IndianRupee size={18} className="text-emerald-600 mb-1.5" />
          <div className="text-2xl font-black text-emerald-700">{formatCurrencyFull(totalCollected)}</div>
          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Client Collections</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <IndianRupee size={18} className="text-red-500 mb-1.5" />
          <div className="text-2xl font-black text-red-600">{formatCurrencyFull(totalBalance)}</div>
          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Balance Due</div>
        </div>
      </div>

      {/* Sales Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400">Loading your sales report...</div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
            <FolderOpen size={28} />
          </div>
          <h3 className="text-sm font-black text-slate-800">No Client Sales Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No bookings recorded for your agency in the selected date range.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Date-Wise Client Sales Log</h3>
            <span className="text-xs text-slate-400 font-bold">{filteredBookings.length} Bookings in Range</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                  <th className="text-left px-4 py-3">Plot No</th>
                  <th className="text-left px-4 py-3">Buyer Name</th>
                  <th className="text-left px-4 py-3">Booking Ref</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-right px-4 py-3">Plot Value</th>
                  <th className="text-right px-4 py-3">Amount Collected</th>
                  <th className="text-right px-4 py-3">Balance Due</th>
                  <th className="text-left px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredBookings.map(b => {
                  const plotNum = b.plot_number || b.plotNumber;
                  const total = Number(b.total_amount || b.totalAmount || 0);
                  const paid = Number(b.amount_paid || b.amountPaid || 0);
                  const balance = Number(b.balance_amount || b.balanceAmount || 0);
                  return (
                    <tr key={b.id} className="table-row-hover">
                      <td className="px-4 py-3 font-black text-slate-900">{plotNum || 'Plot'}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">{b.customer_name || b.customerName || 'Client'}</td>
                      <td className="px-4 py-3 font-mono font-bold text-blue-700">{b.booking_reference || b.id.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono">
                        {b.created_at || b.booking_date ? new Date(b.created_at || b.booking_date).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-slate-900">{formatCurrencyFull(total)}</td>
                      <td className="px-4 py-3 text-right font-black text-emerald-700">{formatCurrencyFull(paid)}</td>
                      <td className="px-4 py-3 text-right font-black text-red-600">{balance > 0 ? formatCurrencyFull(balance) : '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export const ChannelDocuments: React.FC = () => {
  const docs = mockDocuments.filter(d => d.type === 'channel_partner' || d.type === 'project');
  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Partner Documents & Brochures</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Download marketing collateral, master layout plans, and partner agreement</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        {docs.map(d => (
          <div key={d.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center">
                <FolderOpen size={18} />
              </div>
              <div>
                <p className="font-bold text-xs text-slate-900">{d.name}</p>
                <p className="text-[10px] text-slate-400">{d.fileSize} · {d.fileType}</p>
              </div>
            </div>
            <button onClick={() => toast.success('✓ Download started')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors">
              Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ChannelProfile: React.FC = () => {
  const { user } = useAuthStore();
  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Partner Profile</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Your official agency information and credentials</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-sky-500 text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-sm">
            {user?.name?.charAt(0) || 'P'}
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-base">{user?.name}</h3>
            <p className="text-xs text-slate-400 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-400 font-medium">Email:</span><span className="font-bold text-slate-800">{user?.email}</span></div>
          <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-400 font-medium">Partner Type:</span><span className="font-bold text-slate-800">Authorized Channel Partner</span></div>
          <div className="flex justify-between py-2"><span className="text-slate-400 font-medium">Account Status:</span><span className="text-emerald-700 font-bold">Active & Verified</span></div>
        </div>
      </div>
    </div>
  );
};
