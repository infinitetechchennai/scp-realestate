import React from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Download, CheckCircle2, Building2, Calendar, User, Phone, Mail, MapPin, IndianRupee, ShieldCheck } from 'lucide-react';
import { formatCurrencyFull } from '../../utils/helpers';

export interface ReceiptData {
  receiptNumber: string;
  bookingReference?: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  plotNumber: string;
  projectName?: string;
  projectLocation?: string;
  plotArea?: number;
  ratePerSqft?: number;
  totalPlotPrice?: number;
  paymentType: 'token_advance' | 'continue_payment' | 'partial_payment' | 'full_payment' | 'balance_payment' | string;
  paymentMethod: string;
  transactionId?: string;
  amountPaid: number;
  balanceAmount?: number;
  deadlineDate?: string;
  channelPartnerName?: string;
}

interface PaymentReceiptModalProps {
  receipt: ReceiptData | null;
  onClose: () => void;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({ receipt, onClose }) => {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const getPaymentTypeLabel = (type: string) => {
    if (type.includes('token')) return 'Token Advance (7-Day Active Hold)';
    if (type.includes('partial') || type.includes('continue')) return '50% Installment Payment (Confirmed Booking)';
    if (type.includes('full') || type.includes('sold')) return '100% Full Payment (Final Deed Settlement)';
    return 'Milestone Balance Payment';
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto bg-slate-950/75 backdrop-blur-sm print:p-0 print:bg-white print:static">
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-auto overflow-hidden border border-slate-200 animate-scale-in max-h-[90vh] flex flex-col print:max-h-none print:my-0 print:shadow-none print:border-none print:w-full print:max-w-none">
        
        {/* Modal Top Action Bar (Hidden during print) */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white print:hidden border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-black text-sm">
              ₹
            </div>
            <div>
              <h3 className="font-black text-sm tracking-wide">Official Payment Receipt</h3>
              <p className="text-[10px] text-slate-400 font-mono">{receipt.receiptNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Printer size={14} />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 md:p-8 space-y-5 text-slate-800 bg-white overflow-y-auto print:overflow-visible print:p-0" id="printable-receipt">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl font-black text-slate-950 tracking-tight">SCP GLOBAL DEVELOPERS</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-md border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 size={10} /> Verified Receipt
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Premium Township Layouts & Farmland Estates</p>
              <p className="text-[11px] text-slate-400 mt-0.5">RERA Approved: TN/RERA/2026/0491 | Chennai, Tamil Nadu</p>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono font-black text-slate-900">{receipt.receiptNumber}</div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">{new Date(receipt.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
              {receipt.bookingReference && (
                <div className="text-[10px] text-blue-700 font-mono font-bold mt-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Ref: {receipt.bookingReference}
                </div>
              )}
            </div>
          </div>

          {/* Customer & Plot 2-Column Details */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
            {/* Customer Column */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <User size={11} /> Buyer Information
              </div>
              <div className="font-black text-slate-900 text-sm">{receipt.customerName}</div>
              {receipt.customerPhone && (
                <div className="text-slate-600 font-mono"><span className="text-slate-400 font-medium">Phone: </span>{receipt.customerPhone}</div>
              )}
              {receipt.customerEmail && (
                <div className="text-slate-600"><span className="text-slate-400 font-medium">Email: </span>{receipt.customerEmail}</div>
              )}
              {receipt.channelPartnerName && (
                <div className="text-sky-800 font-bold pt-1"><span className="text-slate-400 font-medium">Partner: </span>{receipt.channelPartnerName}</div>
              )}
            </div>

            {/* Plot Column */}
            <div className="space-y-1.5 border-l border-slate-200 pl-6">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <MapPin size={11} /> Allocated Plot
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-blue-800 font-mono">{receipt.plotNumber}</span>
                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
                  {receipt.plotArea || 1500} sq.ft
                </span>
              </div>
              <div className="text-slate-700 font-bold">{receipt.projectName || 'Green Valley Township'}</div>
              <div className="text-slate-500">{receipt.projectLocation || 'Chennai Highway, Tamil Nadu'}</div>
            </div>
          </div>

          {/* Payment Breakdown Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
            <table className="w-full">
              <thead className="bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">Description</th>
                  <th className="text-left px-4 py-3">Payment Mode</th>
                  <th className="text-left px-4 py-3">Txn Reference</th>
                  <th className="text-right px-4 py-3">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-slate-900">{getPaymentTypeLabel(receipt.paymentType)}</div>
                    <div className="text-[11px] text-slate-500">Plot {receipt.plotNumber} allocation milestone receipt</div>
                  </td>
                  <td className="px-4 py-3.5 font-bold uppercase text-slate-700">{receipt.paymentMethod || 'UPI'}</td>
                  <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600">{receipt.transactionId || 'UPI-VERIFIED'}</td>
                  <td className="px-4 py-3.5 text-right font-black text-sm text-emerald-700">
                    {formatCurrencyFull(receipt.amountPaid)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Financial Balance Summary */}
          <div className="flex justify-between items-start gap-4 pt-1">
            <div className="text-xs space-y-1 max-w-xs">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Payment Verified Electronically</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                This is a computer-generated official payment receipt. No physical signature is required. Keep this for registration records.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 min-w-[240px] space-y-2 text-xs">
              {receipt.totalPlotPrice !== undefined && receipt.totalPlotPrice > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Total Plot Value:</span>
                  <span className="font-bold text-slate-800">{formatCurrencyFull(receipt.totalPlotPrice)}</span>
                </div>
              )}
              <div className="flex justify-between text-emerald-700 font-black border-t border-slate-200 pt-1.5">
                <span>Amount Paid:</span>
                <span className="text-sm">{formatCurrencyFull(receipt.amountPaid)}</span>
              </div>
              {receipt.balanceAmount !== undefined && (
                <div className="flex justify-between text-red-600 font-black">
                  <span>Balance Due:</span>
                  <span>{receipt.balanceAmount > 0 ? formatCurrencyFull(receipt.balanceAmount) : '₹0.00 (Fully Paid)'}</span>
                </div>
              )}
              {receipt.deadlineDate && (
                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200 flex justify-between">
                  <span>Schedule Deadline:</span>
                  <span className="font-bold text-slate-700">{new Date(receipt.deadlineDate).toLocaleDateString('en-IN')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Seal & Terms */}
          <div className="border-t border-dashed border-slate-200 pt-4 flex justify-between items-end text-[10px] text-slate-400">
            <div>
              <p className="font-bold text-slate-600">SCP REAL ESTATE & DEVELOPERS PRIVATE LIMITED</p>
              <p>Corporate Office: 42, Anna Salai, Guindy, Chennai 600032</p>
              <p>Email: accounts@scpglobal.in | Helpline: +91 44 2847 9000</p>
            </div>
            <div className="text-center border-2 border-slate-300 rounded-xl p-2.5 bg-slate-50 min-w-[120px]">
              <div className="text-[9px] uppercase font-black tracking-widest text-slate-500">Authorized Seal</div>
              <div className="text-xs font-black text-blue-900 mt-0.5">SCP AUDITED</div>
            </div>
          </div>
        </div>

        {/* Modal Footer (Hidden on print) */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between print:hidden">
          <span className="text-xs text-slate-500">Click Print to generate official A4 PDF</span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-black text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-sm uppercase tracking-wider"
            >
              <Printer size={14} />
              Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
