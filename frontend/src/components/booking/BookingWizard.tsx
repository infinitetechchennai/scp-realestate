import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plot } from '../../types';
import { X, User, MapPin, CreditCard, CheckCircle, ChevronRight, ChevronLeft, Banknote } from 'lucide-react';
import { usePlotStore } from '../../store/plotStore';
import { useBookingStore, usePaymentStore, useCustomerStore, useNotificationStore } from '../../store/stores';
import { useAuthStore } from '../../store/authStore';
import { formatCurrencyFull, generateId } from '../../utils/helpers';
import { format, addDays } from 'date-fns';
import toast from 'react-hot-toast';
import { cn } from '../../utils/helpers';

interface BookingWizardProps {
  plot: Plot;
  onClose: () => void;
}

const STEPS = [
  { id: 1, label: 'Customer', icon: User },
  { id: 2, label: 'Plot Details', icon: MapPin },
  { id: 3, label: 'Payment Type', icon: CreditCard },
  { id: 4, label: 'Summary', icon: Banknote },
  { id: 5, label: 'Complete', icon: CheckCircle },
];

type PaymentOption = 'token' | 'continue' | 'full';
type PaymentMethod = 'upi' | 'bank_transfer' | 'cash' | 'card' | 'cheque' | 'other';

export const BookingWizard: React.FC<BookingWizardProps> = ({ plot, onClose }) => {
  const [step, setStep] = useState(1);
  const [customerForm, setCustomerForm] = useState({
    name: '', mobile: '', email: '', address: '', aadhar: '', pan: ''
  });
  const [paymentOption, setPaymentOption] = useState<PaymentOption>('token');
  const [tokenAmount, setTokenAmount] = useState(20000);
  const [customToken, setCustomToken] = useState('');
  const [continueAmount, setContinueAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');

  const { startBooking, confirmBooking } = usePlotStore();
  const { addBooking } = useBookingStore();
  const { addPayment } = usePaymentStore();
  const { addCustomer, customers } = useCustomerStore();
  const { addNotification } = useNotificationStore();
  const { user } = useAuthStore();

  const existingCustomer = customers.find(c => c.email === user?.email);

  const getPaymentAmount = () => {
    if (paymentOption === 'token') return tokenAmount;
    if (paymentOption === 'full') return plot.totalPrice;
    return parseFloat(continueAmount) || 0;
  };

  const handleConfirmPayment = () => {
    const bookingId = generateId('book');
    const paymentId = generateId('pay');
    const today = format(new Date(), 'yyyy-MM-dd');
    const amount = getPaymentAmount();

    const customerId = existingCustomer?.id || generateId('cust');
    if (!existingCustomer) {
      addCustomer({
        id: customerId,
        name: customerForm.name,
        email: customerForm.email,
        phone: customerForm.mobile,
        address: customerForm.address,
        aadhar: customerForm.aadhar,
        pan: customerForm.pan,
        plotIds: [plot.id],
        bookingIds: [bookingId],
        totalPaid: amount,
        totalBalance: plot.totalPrice - amount,
        status: 'active',
        createdAt: today,
      });
    }

    const customerName = existingCustomer?.name || customerForm.name;

    if (paymentOption === 'token') {
      startBooking(plot.id, {
        bookingId,
        customerId,
        customerName,
        tokenAmount: amount,
        tokenDate: today,
        tokenExpiry: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
        totalPaid: amount,
        balanceDue: plot.totalPrice - amount,
      });
      addBooking({
        id: bookingId,
        plotId: plot.id,
        plotNumber: plot.plotNumber,
        projectId: plot.projectId,
        projectName: plot.projectName,
        customerId,
        customerName,
        bookingDate: today,
        paymentType: 'token',
        status: 'token_paid',
        tokenAmount: amount,
        totalAmount: plot.totalPrice,
        amountPaid: amount,
        balanceAmount: plot.totalPrice - amount,
        tokenDate: today,
        tokenExpiry: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
        payments: [],
      });
      addNotification({
        id: `notif-${Date.now()}`,
        type: 'token_payment',
        title: 'Token Payment Received',
        message: `${customerName} paid ${formatCurrencyFull(amount)} token for Plot ${plot.plotNumber}.`,
        isRead: false,
        createdAt: new Date().toISOString(),
        targetRoles: ['super_admin', 'channel_partner'],
      });
      toast.success(`✓ Token booking created! Plot ${plot.plotNumber} is now Token Booked.`);
    } else {
      const isFullPay = paymentOption === 'full' || amount >= plot.totalPrice;
      confirmBooking(plot.id, {
        bookingId,
        customerId,
        customerName,
        tokenAmount: plot.status === 'token_booked' ? (plot.tokenAmount || 0) : 50000,
        bookingDate: today,
        confirmedDate: today,
        paymentDeadline: format(addDays(new Date(), 90), 'yyyy-MM-dd'),
        totalPaid: amount,
        balanceDue: Math.max(0, plot.totalPrice - amount),
      });
      addBooking({
        id: bookingId,
        plotId: plot.id,
        plotNumber: plot.plotNumber,
        projectId: plot.projectId,
        projectName: plot.projectName,
        customerId,
        customerName,
        bookingDate: today,
        paymentType: isFullPay ? 'full' : 'continue',
        status: 'confirmed',
        tokenAmount: 50000,
        totalAmount: plot.totalPrice,
        amountPaid: amount,
        balanceAmount: Math.max(0, plot.totalPrice - amount),
        tokenDate: today,
        tokenExpiry: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
        confirmedDate: today,
        paymentDeadline: format(addDays(new Date(), 90), 'yyyy-MM-dd'),
        payments: [],
      });
      addNotification({
        id: `notif-${Date.now()}`,
        type: 'booking_confirmed',
        title: 'Booking Confirmed',
        message: `Booking confirmed for Plot ${plot.plotNumber}. Customer: ${customerName}.`,
        isRead: false,
        createdAt: new Date().toISOString(),
        targetRoles: ['super_admin', 'channel_partner'],
      });
      toast.success(`✓ Booking confirmed! Plot ${plot.plotNumber} is now Confirmed.`);
    }

    addPayment({
      id: paymentId,
      bookingId,
      customerId,
      customerName,
      plotId: plot.id,
      plotNumber: plot.plotNumber,
      projectName: plot.projectName,
      type: paymentOption === 'token' ? 'token_advance' : paymentOption === 'full' ? 'full_payment' : 'continue_payment',
      method: paymentMethod,
      amount,
      status: 'completed',
      date: today,
      reference: `REF/${Date.now()}`,
    });

    setStep(5);
  };

  const canNext = () => {
    if (step === 1) return customerForm.name && customerForm.mobile && customerForm.email;
    if (step === 3) {
      if (paymentOption === 'continue') return parseFloat(continueAmount) > 0;
      return true;
    }
    return true;
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs" onClick={step === 5 ? onClose : undefined} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-scale-in border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="text-base font-black text-slate-900">
              {step === 5 ? '🎉 Booking Complete' : `Book Plot ${plot.plotNumber}`}
            </h2>
            {step < 5 && <p className="text-xs text-slate-500 font-medium">Step {step} of 4</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors">
            <X size={19} />
          </button>
        </div>

        {/* Progress Steps */}
        {step < 5 && (
          <div className="px-6 py-3.5 border-b border-slate-100 bg-white">
            <div className="flex items-center">
              {STEPS.slice(0, 4).map((s, i) => (
                <React.Fragment key={s.id}>
                  <div className={cn(
                    'flex items-center gap-1.5 text-xs font-bold transition-colors',
                    step === s.id ? 'text-blue-700' : step > s.id ? 'text-emerald-700' : 'text-slate-400'
                  )}>
                    <div className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2',
                      step === s.id ? 'bg-gradient-to-r from-blue-600 to-sky-500 border-blue-600 text-white' :
                      step > s.id ? 'bg-emerald-500 border-emerald-500 text-white' :
                      'bg-white border-slate-300 text-slate-400'
                    )}>
                      {step > s.id ? '✓' : s.id}
                    </div>
                    <span className="hidden sm:block">{s.label}</span>
                  </div>
                  {i < 3 && <div className={cn('flex-1 h-0.5 mx-2', step > s.id ? 'bg-emerald-400' : 'bg-slate-200')} />}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Customer */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customer Details</h3>
              <div className="grid grid-cols-2 gap-3.5">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Full Name *</label>
                  <input value={customerForm.name} onChange={e => setCustomerForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-sky-500 outline-none" placeholder="Enter full name" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Mobile Number *</label>
                  <input value={customerForm.mobile} onChange={e => setCustomerForm(f => ({ ...f, mobile: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-sky-500 outline-none" placeholder="10-digit mobile" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Email *</label>
                  <input value={customerForm.email} onChange={e => setCustomerForm(f => ({ ...f, email: e.target.value }))}
                    type="email" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-sky-500 outline-none" placeholder="email@example.com" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Address</label>
                  <textarea value={customerForm.address} onChange={e => setCustomerForm(f => ({ ...f, address: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-sky-500 outline-none h-18 resize-none" placeholder="Full address" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Aadhar Number</label>
                  <input value={customerForm.aadhar} onChange={e => setCustomerForm(f => ({ ...f, aadhar: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-sky-500 outline-none" placeholder="XXXX XXXX XXXX" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">PAN Number</label>
                  <input value={customerForm.pan} onChange={e => setCustomerForm(f => ({ ...f, pan: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-sky-500 outline-none" placeholder="ABCDE1234F" />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Plot Details */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Selected Plot Details</h3>
              <div className="bg-gradient-to-br from-blue-50/80 to-sky-50/60 border border-sky-200 rounded-2xl p-5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black text-blue-950">{plot.plotNumber}</span>
                  <span className="bg-gradient-to-r from-blue-600 to-sky-500 text-white text-xs px-3 py-1 rounded-full font-black">{plot.projectName}</span>
                </div>
                {[
                  { label: 'Location', value: plot.location },
                  { label: 'Area', value: `${plot.area} sq.ft (${plot.dimensions})` },
                  { label: 'Facing', value: plot.facing },
                  { label: 'Road Width', value: plot.roadWidth },
                  { label: 'Price/sq.ft', value: `₹${plot.pricePerSqft.toLocaleString('en-IN')}` },
                ].map(item => (
                  <div key={item.label} className="flex justify-between py-2 border-b border-sky-100">
                    <span className="text-xs font-semibold text-blue-800">{item.label}</span>
                    <span className="text-xs font-bold text-slate-800">{item.value}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-1">
                  <span className="text-sm font-black text-blue-950 uppercase tracking-wider">Total Price</span>
                  <span className="text-xl font-black text-blue-900">{formatCurrencyFull(plot.totalPrice)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Payment Type */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Payment Type</h3>
              <div className="space-y-3">
                {[
                  { id: 'token', label: 'Token Advance', desc: 'Pay a small token amount to temporarily hold the plot for 7 days' },
                  { id: 'continue', label: 'Continue / Partial Payment', desc: 'Pay a partial amount and confirm the booking (90-day deadline)' },
                  { id: 'full', label: 'Full Payment', desc: 'Pay the full plot amount and complete the booking immediately' },
                ].map(opt => (
                  <label key={opt.id} className={cn(
                    'flex gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all',
                    paymentOption === opt.id ? 'border-sky-500 bg-sky-50/50' : 'border-slate-200 hover:border-sky-200'
                  )}>
                    <input type="radio" name="payment" value={opt.id} checked={paymentOption === opt.id}
                      onChange={() => setPaymentOption(opt.id as PaymentOption)} className="mt-0.5 accent-blue-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{opt.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>

              {paymentOption === 'token' && (
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-bold text-slate-700">Select Token Amount</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[10000, 20000, 50000].map(amt => (
                      <button key={amt}
                        type="button"
                        onClick={() => setTokenAmount(amt)}
                        className={cn('py-2.5 border-2 rounded-xl text-xs font-bold transition-all',
                          tokenAmount === amt ? 'border-blue-600 bg-blue-50 text-blue-900 font-black' : 'border-slate-200 text-slate-700 hover:border-sky-200'
                        )}
                      >
                        ₹{(amt / 1000).toFixed(0)}K
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 font-bold block mb-1">Custom Token Amount</label>
                    <input type="number" value={customToken}
                      onChange={e => { setCustomToken(e.target.value); setTokenAmount(parseFloat(e.target.value) || 0); }}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-sky-500 outline-none" placeholder="Enter custom amount" />
                  </div>
                </div>
              )}

              {paymentOption === 'continue' && (
                <div>
                  <label className="text-xs text-slate-700 font-bold block mb-1">Amount to Pay *</label>
                  <input type="number" value={continueAmount}
                    onChange={e => setContinueAmount(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-sky-500 outline-none"
                    placeholder={`Enter amount (max ₹${plot.totalPrice.toLocaleString('en-IN')})`} />
                </div>
              )}

              {paymentOption === 'full' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex justify-between items-center">
                  <span className="text-xs text-emerald-800 font-bold">Full Plot Amount</span>
                  <span className="text-lg font-black text-emerald-800">{formatCurrencyFull(plot.totalPrice)}</span>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Summary */}
          {step === 4 && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Summary</h3>
              <div className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-100">
                {[
                  { label: 'Plot', value: `${plot.plotNumber} — ${plot.area} sq.ft` },
                  { label: 'Project', value: plot.projectName },
                  { label: 'Customer', value: customerForm.name || existingCustomer?.name || 'N/A' },
                  { label: 'Plot Price', value: formatCurrencyFull(plot.totalPrice) },
                  { label: 'Payment Type', value: paymentOption === 'token' ? 'Token Advance' : paymentOption === 'full' ? 'Full Payment' : 'Partial Payment' },
                  { label: 'Amount Paying Now', value: formatCurrencyFull(getPaymentAmount()), highlight: true },
                  { label: 'Remaining Balance', value: formatCurrencyFull(Math.max(0, plot.totalPrice - getPaymentAmount())) },
                ].map(item => (
                  <div key={item.label} className={cn('flex justify-between py-2', item.highlight ? 'border-t border-b border-slate-200 bg-white px-3 rounded-lg' : 'border-b border-slate-100')}>
                    <span className="text-xs text-slate-500 font-medium">{item.label}</span>
                    <span className={cn('text-xs font-bold', item.highlight ? 'text-blue-700 text-sm font-black' : 'text-slate-800')}>{item.value}</span>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['upi', 'bank_transfer', 'cash', 'card', 'cheque', 'other'] as PaymentMethod[]).map(method => (
                    <button key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={cn(
                        'py-2 px-3 border-2 rounded-xl text-xs font-bold capitalize transition-all',
                        paymentMethod === method ? 'border-blue-600 bg-blue-50 text-blue-900 font-black' : 'border-slate-200 text-slate-600 hover:border-sky-200'
                      )}
                    >
                      {method.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Complete */}
          {step === 5 && (
            <div className="text-center py-6 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                <CheckCircle size={32} className="text-emerald-600" />
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-1">
                {paymentOption === 'token' ? 'Token Booking Created!' : 'Booking Confirmed!'}
              </h3>
              <p className="text-slate-500 text-xs mb-5">
                {paymentOption === 'token'
                  ? `Plot ${plot.plotNumber} is now Token Booked. Booking expires in 7 days.`
                  : `Plot ${plot.plotNumber} is now Confirmed. Balance payment due within 90 days.`}
              </p>
              <div className="bg-slate-50 rounded-xl p-4 text-left space-y-2 max-w-xs mx-auto border border-slate-100">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Plot:</span>
                  <span className="font-black text-slate-800">{plot.plotNumber}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Amount Paid:</span>
                  <span className="font-black text-emerald-700">{formatCurrencyFull(getPaymentAmount())}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Status:</span>
                  <span className={cn('font-black', paymentOption === 'token' ? 'text-orange-600' : 'text-red-600')}>
                    {paymentOption === 'token' ? 'TOKEN BOOKED' : 'CONFIRMED'}
                  </span>
                </div>
              </div>
              <button onClick={onClose} className="mt-6 px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-sm">
                Close
              </button>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        {step < 5 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
            <button
              onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft size={14} />
              {step === 1 ? 'Cancel' : 'Back'}
            </button>
            {step < 4 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canNext()}
                className={cn(
                  'flex items-center gap-1.5 px-5 py-2 text-xs font-black rounded-xl transition-colors shadow-sm uppercase tracking-wider',
                  canNext() ? 'bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                )}
              >
                Next
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleConfirmPayment}
                className="flex items-center gap-1.5 px-6 py-2.5 text-xs text-white rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm uppercase tracking-wider"
              >
                <CheckCircle size={14} />
                Confirm & Pay
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
