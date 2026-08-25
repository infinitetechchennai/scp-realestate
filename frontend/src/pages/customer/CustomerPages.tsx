import React, { useState, useEffect } from 'react';
import { usePlotStore } from '../../store/plotStore';
import { useBookingStore, usePaymentStore, useCustomerStore, useNotificationStore } from '../../store/stores';
import { useAuthStore } from '../../store/authStore';
import { StatusBadge } from '../../components/ui/UIComponents';
import { PlotDetailsDrawer } from '../../components/plots/PlotDetailsDrawer';
import { PlotMap } from '../../components/plots/PlotMap';
import { Plot } from '../../types';
import { Search, MapPin, IndianRupee, Clock, CreditCard, FolderOpen, Bell, User, Printer, FileText, FileSpreadsheet } from 'lucide-react';
import { formatCurrencyFull, getDaysRemaining } from '../../utils/helpers';
import { mockProjects, mockDocuments } from '../../data/mockData';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { PaymentReceiptModal, ReceiptData } from '../../components/booking/PaymentReceiptModal';

const isMyBooking = (b: any, user: any) => {
  if (!user) return false;
  const userEmail = (user.email || '').trim().toLowerCase();
  const userId = user.id;

  const bBookedById = b.booked_by_user_id || b.bookedByUserId;
  const bCustId = b.customer_id || b.customerId;
  const bUserId = b.user_id || b.userId;
  const bCustEmail = (b.customer_email || b.customerEmail || '').trim().toLowerCase();

  // 1. Strict exact User ID / Employee booked_by ID match
  if (userId && (bBookedById === userId || bUserId === userId || bCustId === userId)) return true;

  // 2. Strict exact Email match (no substrings)
  if (userEmail && bCustEmail && bCustEmail === userEmail) return true;

  return false;
};

const isMyPayment = (p: any, user: any, myBookingIds: Set<string>) => {
  if (!user) return false;
  const userEmail = (user.email || '').trim().toLowerCase();
  const userId = user.id;

  // 1. Belongs to one of my validated bookings
  if (p.booking_id && myBookingIds.has(p.booking_id)) return true;

  // 2. Strict exact Customer ID or User ID match
  if (userId && (p.customer_id === userId || p.user_id === userId)) return true;

  // 3. Strict exact Email match
  const pCustEmail = (p.customer_email || p.email || '').trim().toLowerCase();
  if (userEmail && pCustEmail && pCustEmail === userEmail) return true;

  return false;
};

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { plots, fetchPlots } = usePlotStore();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlots();
    api.bookings.list()
      .then(data => setBookings(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const myBookings = bookings.filter(b => isMyBooking(b, user));
  const totalPaid = myBookings.reduce((sum, b) => sum + Number(b.amount_paid || b.amountPaid || 0), 0);
  const totalBalance = myBookings.reduce((sum, b) => sum + Number(b.balance_amount || b.balanceAmount || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Welcome, {user?.name}!</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Track your allocated plots, payment schedules, receipts, and deed milestones</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <MapPin size={18} className="text-blue-700 mb-2" />
          <div className="text-2xl font-black text-slate-900">{myBookings.length}</div>
          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">Booked Plots</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <IndianRupee size={18} className="text-emerald-700 mb-2" />
          <div className="text-2xl font-black text-emerald-800">{formatCurrencyFull(totalPaid)}</div>
          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">Total Paid</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <Clock size={18} className="text-red-600 mb-2" />
          <div className="text-2xl font-black text-red-600">{formatCurrencyFull(totalBalance)}</div>
          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">Balance Due</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <CreditCard size={18} className="text-sky-700 mb-2" />
          <div className="text-2xl font-black text-sky-800">90 Days</div>
          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">Payment Term</div>
        </div>
      </div>

      {/* My Bookings Detailed Cards */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">My Active Plot Bookings</h3>
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400">Loading your plot reservations...</div>
        ) : myBookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400">No active plot bookings found for your account.</div>
        ) : (
          myBookings.map(b => {
            const plotNum = b.plot_number || b.plotNumber;
            const plot = plots.find(p => (p as any).plot_number === plotNum || p.plotNumber === plotNum || p.id === (b.plot_id || b.plotId));
            const expiryDate = b.token_expires_at || b.tokenExpiry;
            const daysLeft = expiryDate ? getDaysRemaining(expiryDate) : null;
            const paid = Number(b.amount_paid || b.amountPaid || 0);
            const total = Number(b.total_amount || b.totalAmount || 0);
            const balance = Number(b.balance_amount || b.balanceAmount || 0);

            return (
              <div key={b.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xl font-black text-slate-900">{plotNum || 'Plot'}</span>
                    <StatusBadge status={b.status} size="md" />
                  </div>
                  <p className="text-xs text-slate-500 font-medium">{b.project_name || b.projectName || 'SCP Farm Layout'}</p>
                  
                  {/* Customer Information Card */}
                  <div className="mt-3 p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex flex-wrap items-center justify-between gap-2 max-w-xl">
                    <div>
                      <span className="text-[10px] text-blue-900/70 font-bold uppercase block">Customer (Buyer)</span>
                      <span className="text-xs font-black text-slate-900">{b.customer_name || b.customerName || 'Valued Buyer'}</span>
                    </div>
                    {(b.customer_phone || b.customerPhone) && (
                      <div className="text-right">
                        <span className="text-[10px] text-blue-900/70 font-bold uppercase block">Mobile Number</span>
                        <span className="text-xs font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200/60 inline-block">
                          📞 {b.customer_phone || b.customerPhone}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-600">
                    <div><span className="text-slate-400 font-medium">Area: </span><span className="font-bold">{plot?.area || 1200} sq.ft</span></div>
                    <div><span className="text-slate-400 font-medium">Total: </span><span className="font-bold">{formatCurrencyFull(total)}</span></div>
                    <div><span className="text-slate-400 font-medium">Paid: </span><span className="font-bold text-emerald-700">{formatCurrencyFull(paid)}</span></div>
                    <div><span className="text-slate-400 font-medium">Balance: </span><span className="font-bold text-red-600">{formatCurrencyFull(balance)}</span></div>
                  </div>
                </div>

                {b.status === 'token_paid' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-3.5 text-center min-w-[160px]">
                    <div className="text-[11px] font-bold text-orange-950">Token Expiry</div>
                    <div className="text-base font-black text-orange-700">{daysLeft !== null && daysLeft > 0 ? `${daysLeft} Days Left` : (daysLeft !== null ? 'EXPIRED' : '7 Days')}</div>
                    <div className="text-[10px] text-orange-800 mt-0.5">{expiryDate ? new Date(expiryDate).toLocaleDateString() : 'Active Hold'}</div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export const CustomerPlots: React.FC = () => {
  const { plots, fetchPlots } = usePlotStore();
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);

  React.useEffect(() => {
    fetchPlots();
  }, []);

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Browse Available Plots</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Explore the interactive CAD master blueprint, schematic matrix, and survey drawings</p>
      </div>

      <PlotMap plots={plots} onPlotClick={(p) => setSelectedPlot(p)} />

      <PlotDetailsDrawer plot={selectedPlot} onClose={() => setSelectedPlot(null)} />
    </div>
  );
};

export const CustomerProjects: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);

  React.useEffect(() => {
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
        <h1 className="text-2xl font-black text-slate-900">Our Township Projects</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Explore approved master layouts and community developments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map(proj => (
          <div key={proj.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="h-48 bg-slate-900 relative overflow-hidden">
              {proj.imageUrl && <img src={proj.imageUrl} alt={proj.name} className="w-full h-full object-cover opacity-75" />}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute bottom-4 left-5 text-white">
                <h3 className="font-black text-lg leading-tight">{proj.name}</h3>
                <p className="text-slate-300 text-xs mt-0.5">{proj.location}</p>
              </div>
            </div>
            <div className="p-5">
              <p className="text-xs text-slate-600 leading-relaxed">{proj.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CustomerBookings: React.FC = () => {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.bookings.list()
      .then(data => setBookings(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const myBookings = bookings.filter(b => isMyBooking(b, user));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900">My Plot Reservations</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Status of your token advances, confirmation agreements, and client details</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
              <th className="text-left px-5 py-3.5">Booking Ref</th>
              <th className="text-left px-3 py-3.5">Plot No</th>
              <th className="text-left px-4 py-3.5">Customer (Buyer)</th>
              <th className="text-left px-4 py-3.5">Customer Phone</th>
              <th className="text-left px-4 py-3.5">Project</th>
              <th className="text-left px-3 py-3.5">Booking Date</th>
              <th className="text-right px-4 py-3.5">Amount Paid</th>
              <th className="text-right px-4 py-3.5">Balance Due</th>
              <th className="text-left px-4 py-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-slate-400 font-medium">Loading live reservations...</td>
              </tr>
            ) : myBookings.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-slate-400 font-medium">No plot reservations found for your account.</td>
              </tr>
            ) : (
              myBookings.map(b => (
                <tr key={b.id} className="table-row-hover">
                  <td className="px-5 py-3.5 font-mono font-bold text-blue-700">{b.booking_reference || b.id.slice(0, 8)}</td>
                  <td className="px-3 py-3.5 font-black text-slate-900">{b.plot_number || b.plotNumber || '—'}</td>
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-slate-900">{b.customer_name || b.customerName || 'Valued Buyer'}</div>
                    {b.customer_email && <div className="text-[10px] text-slate-400 font-mono">{b.customer_email}</div>}
                  </td>
                  <td className="px-4 py-3.5">
                    {b.customer_phone || b.customerPhone ? (
                      <span className="inline-flex items-center gap-1 font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60 text-[11px]">
                        📞 {b.customer_phone || b.customerPhone}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">{b.project_name || b.projectName || 'SCP Farm Layout'}</td>
                  <td className="px-3 py-3.5 text-slate-500 font-mono">
                    {b.created_at ? new Date(b.created_at).toLocaleDateString() : (b.bookingDate || '—')}
                  </td>
                  <td className="px-4 py-3.5 text-right font-black text-emerald-700">{formatCurrencyFull(Number(b.amount_paid || b.amountPaid || 0))}</td>
                  <td className="px-4 py-3.5 text-right font-black text-red-600">{Number(b.balance_amount || b.balanceAmount || 0) > 0 ? formatCurrencyFull(Number(b.balance_amount || b.balanceAmount || 0)) : '—'}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={b.status} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const CustomerPayments: React.FC = () => {
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

  const myBookings = bookings.filter(b => isMyBooking(b, user));
  const myBookingIds = new Set(myBookings.map(b => b.id));
  const myPayments = payments.filter(p => isMyPayment(p, user, myBookingIds));

  const handleOpenReceipt = (p: any) => {
    const linkedBooking = myBookings.find(b => b.id === p.booking_id) || {};
    const receipt: ReceiptData = {
      receiptNumber: p.payment_reference || `PAY-${p.id.slice(0, 8).toUpperCase()}`,
      bookingReference: linkedBooking.booking_reference || linkedBooking.bookingReference,
      date: p.payment_date || p.created_at || new Date().toISOString(),
      customerName: user?.name || linkedBooking.customer_name || 'Valued Buyer',
      customerEmail: user?.email || linkedBooking.customer_email,
      customerPhone: user?.phone || linkedBooking.customer_phone,
      plotNumber: p.plot_number || linkedBooking.plot_number || 'Plot',
      projectName: linkedBooking.project_name || 'Green Valley Township',
      projectLocation: 'Chennai Highway, Tamil Nadu',
      paymentType: p.payment_type || p.type || 'token_advance',
      paymentMethod: p.payment_method || p.method || 'UPI',
      transactionId: p.gateway_transaction_id || `UPI-${p.id.slice(0, 8).toUpperCase()}`,
      amountPaid: Number(p.amount),
      balanceAmount: linkedBooking.balance_amount ? Number(linkedBooking.balance_amount) : undefined,
    };
    setSelectedReceipt(receipt);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900">My Payments & Receipts</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Verified payment receipts and transaction records</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
              <th className="text-left px-5 py-3.5">Payment Ref</th>
              <th className="text-left px-3 py-3.5">Plot No</th>
              <th className="text-left px-4 py-3.5">Customer (Buyer)</th>
              <th className="text-left px-3 py-3.5">Type</th>
              <th className="text-left px-3 py-3.5">Method</th>
              <th className="text-right px-4 py-3.5">Amount</th>
              <th className="text-left px-3 py-3.5">Date</th>
              <th className="text-left px-3 py-3.5">Status</th>
              <th className="text-right px-5 py-3.5">Receipt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-slate-400 font-medium">Loading payments...</td>
              </tr>
            ) : myPayments.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-slate-400 font-medium">No payment records found for your account.</td>
              </tr>
            ) : (
              myPayments.map(p => {
                const linkedBooking = myBookings.find(b => b.id === p.booking_id) || {};
                const cName = p.customer_name || linkedBooking.customer_name || linkedBooking.customerName || 'Valued Buyer';
                const cPhone = p.customer_phone || linkedBooking.customer_phone || linkedBooking.customerPhone;

                return (
                  <tr key={p.id} className="table-row-hover">
                    <td className="px-5 py-3.5 font-mono font-bold text-blue-700">{p.payment_reference || p.id.slice(0, 8)}</td>
                    <td className="px-3 py-3.5 font-black">{p.plot_number || linkedBooking.plot_number || '—'}</td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-800">{cName}</div>
                      {cPhone && <div className="text-[10px] text-slate-400 font-mono">📞 {cPhone}</div>}
                    </td>
                    <td className="px-3 py-3.5 capitalize text-slate-600">{(p.payment_type || p.type || '').replace('_', ' ')}</td>
                    <td className="px-3 py-3.5 uppercase text-slate-500 font-bold">{p.payment_method || p.method || 'UPI'}</td>
                    <td className="px-4 py-3.5 text-right font-black text-emerald-700">{formatCurrencyFull(Number(p.amount))}</td>
                    <td className="px-3 py-3.5 text-slate-400 font-mono">
                      {p.payment_date || p.created_at ? new Date(p.payment_date || p.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-3 py-3.5"><StatusBadge status={p.status} /></td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleOpenReceipt(p)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                      >
                        <Printer size={13} />
                        Receipt
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Payment Receipt Modal */}
      {selectedReceipt && (
        <PaymentReceiptModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
};

export const CustomerDocuments: React.FC = () => {
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

  const myBookings = bookings.filter(b => isMyBooking(b, user));
  const myBookingIds = new Set(myBookings.map(b => b.id));
  const myPayments = payments.filter(p => isMyPayment(p, user, myBookingIds));

  const handleOpenReceipt = (p: any) => {
    const linkedBooking = myBookings.find(b => b.id === p.booking_id) || {};
    const receipt: ReceiptData = {
      receiptNumber: p.payment_reference || `PAY-${p.id.slice(0, 8).toUpperCase()}`,
      bookingReference: linkedBooking.booking_reference || linkedBooking.bookingReference,
      date: p.payment_date || p.created_at || new Date().toISOString(),
      customerName: user?.name || linkedBooking.customer_name || 'Valued Buyer',
      customerEmail: user?.email || linkedBooking.customer_email,
      customerPhone: user?.phone || linkedBooking.customer_phone,
      plotNumber: p.plot_number || linkedBooking.plot_number || 'Plot',
      projectName: linkedBooking.project_name || 'Green Valley Township',
      projectLocation: 'Chennai Highway, Tamil Nadu',
      paymentType: p.payment_type || p.type || 'token_advance',
      paymentMethod: p.payment_method || p.method || 'UPI',
      transactionId: p.gateway_transaction_id || `UPI-${p.id.slice(0, 8).toUpperCase()}`,
      amountPaid: Number(p.amount),
      balanceAmount: linkedBooking.balance_amount ? Number(linkedBooking.balance_amount) : undefined,
    };
    setSelectedReceipt(receipt);
  };

  const hasAnyRecords = myPayments.length > 0;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900">My Documents & Receipts</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Download and print verified official payment receipts and transaction records</p>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400">
          Loading your document records...
        </div>
      ) : !hasAnyRecords ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
            <FolderOpen size={28} />
          </div>
          <h3 className="text-sm font-black text-slate-800">No Receipts Available Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Once you book a plot or make a token payment, your verified official payment receipts will automatically appear here.
          </p>
          <a
            href="/customer/plots"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-sm transition-all mt-2"
          >
            Browse Available Plots
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section: Payment Receipts */}
          {myPayments.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">Official Payment Receipts</h2>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                {myPayments.map(p => (
                  <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl flex items-center justify-center font-black text-sm">
                        ₹
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-xs text-slate-900">{p.payment_reference || `PAY-${p.id.slice(0, 8).toUpperCase()}`}</p>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-full">
                            {formatCurrencyFull(Number(p.amount))}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Plot {p.plot_number || '—'} · {p.payment_type ? p.payment_type.replace('_', ' ') : 'Token Advance'} · {p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-IN') : 'Recent'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenReceipt(p)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Printer size={13} />
                      <span>View & Print</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment Receipt Modal */}
      {selectedReceipt && (
        <PaymentReceiptModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
};

export const CustomerReports: React.FC = () => {
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

  const myBookings = bookings.filter(b => isMyBooking(b, user));

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

  const totalInvestment = filteredBookings.reduce((sum, b) => sum + Number(b.total_amount || b.totalAmount || 0), 0);
  const totalPaid = filteredBookings.reduce((sum, b) => sum + Number(b.amount_paid || b.amountPaid || 0), 0);
  const totalBalance = filteredBookings.reduce((sum, b) => sum + Number(b.balance_amount || b.balanceAmount || 0), 0);

  const exportMyLandReport = () => {
    try {
      const headers = [
        'Booking Reference',
        'Plot Number',
        'Project Name',
        'Area (Sq.Ft)',
        'Total Plot Price (INR)',
        'Amount Paid (INR)',
        'Balance Due (INR)',
        'Status',
        'Token Hold Expiry',
        'Payment Deadline',
        'Booking Date'
      ];

      const rows = filteredBookings.map(b => {
        const plotNum = b.plot_number || b.plotNumber;
        const plot = plots.find(p => (p as any).plot_number === plotNum || p.plotNumber === plotNum || p.id === (b.plot_id || b.plotId));
        return [
          `"${b.booking_reference || b.bookingReference || b.id}"`,
          `"${plotNum || 'Plot'}"`,
          `"${b.project_name || b.projectName || 'Township Layout'}"`,
          plot?.area || 1200,
          Number(b.total_amount || b.totalAmount || 0),
          Number(b.amount_paid || b.amountPaid || 0),
          Number(b.balance_amount || b.balanceAmount || 0),
          `"${(b.status || 'token_paid').replace('_', ' ').toUpperCase()}"`,
          `"${b.token_expires_at ? new Date(b.token_expires_at).toLocaleDateString('en-IN') : ''}"`,
          `"${b.payment_deadline_at ? new Date(b.payment_deadline_at).toLocaleDateString('en-IN') : ''}"`,
          `"${b.created_at || b.booking_date ? new Date(b.created_at || b.booking_date).toLocaleDateString('en-IN') : ''}"`
        ];
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const dateStr = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `Purchased_Land_Report_${startDate || 'all'}_to_${endDate || 'all'}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('✓ Your Land Purchase report downloaded!');
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
          <h1 className="text-2xl font-black text-slate-900">Custom Date-Wise Property Reports</h1>
          <p className="text-slate-500 text-xs font-medium mt-0.5">Filter, analyze, and export your plot reservations and payment schedules date-by-date</p>
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
            onClick={exportMyLandReport}
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
            <label className="text-[11px] font-bold text-slate-500 block mb-1">Status Filter</label>
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
              placeholder="Plot no, buyer, ref..."
              className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium focus:border-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <MapPin size={18} className="text-blue-600 mb-1.5" />
          <div className="text-2xl font-black text-slate-900">{filteredBookings.length}</div>
          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">My Booked Plots</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <IndianRupee size={18} className="text-purple-600 mb-1.5" />
          <div className="text-2xl font-black text-slate-900">{formatCurrencyFull(totalInvestment)}</div>
          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Total Property Value</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <IndianRupee size={18} className="text-emerald-600 mb-1.5" />
          <div className="text-2xl font-black text-emerald-700">{formatCurrencyFull(totalPaid)}</div>
          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Total Paid</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <Clock size={18} className="text-red-500 mb-1.5" />
          <div className="text-2xl font-black text-red-600">{formatCurrencyFull(totalBalance)}</div>
          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Balance Due</div>
        </div>
      </div>

      {/* Plots Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400">Loading your purchase report...</div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
            <FolderOpen size={28} />
          </div>
          <h3 className="text-sm font-black text-slate-800">No Purchased Plots Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No bookings found in the selected date range.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Date-Wise Property Investment Statement</h3>
            <span className="text-xs text-slate-400 font-bold">{filteredBookings.length} Units in Range</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                  <th className="text-left px-4 py-3">Plot No</th>
                  <th className="text-left px-4 py-3">Buyer Name</th>
                  <th className="text-left px-4 py-3">Booking Ref</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-right px-4 py-3">Plot Price</th>
                  <th className="text-right px-4 py-3">Paid Amount</th>
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
                      <td className="px-4 py-3 font-bold text-slate-800">{b.customer_name || b.customerName || 'Valued Buyer'}</td>
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

export const CustomerNotifications: React.FC = () => {
  const { notifications, markRead, fetchNotifications } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Notifications & Alerts</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Special offers, payment reminders, and project announcements</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No notifications in your inbox yet.
          </div>
        ) : (
          notifications.map(n => (
            <div key={n.id} onClick={() => markRead(n.id)} className="p-4 flex items-start gap-3.5 hover:bg-slate-50 cursor-pointer transition-colors">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${!n.isRead ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'}`}>
                <Bell size={18} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className={`text-xs ${!n.isRead ? 'font-black text-slate-950' : 'font-bold text-slate-800'}`}>{n.title}</p>
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-600" />}
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">{new Date(n.createdAt).toLocaleDateString('en-IN')}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const CustomerProfile: React.FC = () => {
  const { user } = useAuthStore();
  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Buyer Profile</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Your personal contact details and registration preferences</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-sky-500 text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-sm">
            {user?.name?.charAt(0) || 'C'}
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-base">{user?.name}</h3>
            <p className="text-xs text-slate-400 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-400 font-medium">Email:</span><span className="font-bold text-slate-800">{user?.email}</span></div>
          <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-400 font-medium">Phone:</span><span className="font-bold text-slate-800">+91 98765 43210</span></div>
          <div className="flex justify-between py-2"><span className="text-slate-400 font-medium">KYC Status:</span><span className="text-emerald-700 font-bold">Verified</span></div>
        </div>
      </div>
    </div>
  );
};
