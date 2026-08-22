import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  X, CheckCircle2, Copy, Check, Smartphone,
  ShieldCheck, Loader2, ExternalLink, RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface PartnerKycPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner: {
    id: string;
    company_name?: string;
    name?: string;
    email?: string;
    phone?: string;
    partner_code?: string;
    registration_fee_paid?: boolean;
  };
  onPaymentSuccess: () => void;
}

export const PartnerKycPaymentModal: React.FC<PartnerKycPaymentModalProps> = ({
  isOpen,
  onClose,
  partner,
  onPaymentSuccess,
}) => {
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [isPaid, setIsPaid] = useState(partner.registration_fee_paid || false);

  const merchantVpa = '12204885695@okbizaxis';
  const merchantName = 'infinitetechai';
  const amount = '500.00';
  // Standard NPCI UPI URI Scheme
  const upiUri = `upi://pay?pa=${merchantVpa}&pn=${encodeURIComponent(merchantName)}&am=500&cu=INR`;

  // Auto-poll payment status from backend webhook updates every 3 seconds
  useEffect(() => {
    if (!isOpen || isPaid) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.payments.getPartnerFeeStatus(partner.id);
        if (res && res.registration_paid) {
          setIsPaid(true);
          toast.success('Payment verified automatically via Google Pay Webhook!');
          onPaymentSuccess();
          clearInterval(interval);
        }
      } catch (err) {
        // Silently continue polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, isPaid, partner.id, onPaymentSuccess]);

  if (!isOpen) return null;

  const handleCopyVpa = () => {
    navigator.clipboard.writeText(merchantVpa);
    setCopied(true);
    toast.success('UPI ID copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualConfirm = async () => {
    setVerifying(true);
    try {
      const res = await api.payments.confirmPartnerFee(partner.id);
      if (res.success) {
        setIsPaid(true);
        toast.success('Registration fee of ₹500 confirmed!');
        setTimeout(() => {
          onPaymentSuccess();
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to verify payment');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-lg">
              ₹
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">Channel Partner KYC Fee</h3>
              <p className="text-xs text-blue-100 font-medium">Google Pay & Instant UPI Verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          {isPaid ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-lg font-black text-slate-800">Registration Fee Paid</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                ₹500.00 KYC verification fee has been confirmed for <span className="font-bold text-slate-700">{partner.company_name || partner.name}</span>.
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                Close & Continue
              </button>
            </div>
          ) : (
            <>
              {/* Partner Summary Card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">{partner.company_name || partner.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">Code: {partner.partner_code || 'CP-NEW'}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400 font-medium">Onboarding Fee</div>
                  <div className="text-base font-black text-emerald-600">₹500.00</div>
                </div>
              </div>

              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center py-2 space-y-3">
                <div className="relative p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
                  <QRCodeSVG
                    value={upiUri}
                    size={190}
                    level="H"
                    includeMargin
                    imageSettings={{
                      src: "/favicon.ico",
                      x: undefined,
                      y: undefined,
                      height: 28,
                      width: 28,
                      excavate: true,
                    }}
                  />
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                  <span>Scan via Google Pay, PhonePe, Paytm or BHIM</span>
                </div>
              </div>

              {/* Business UPI Info Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Merchant:</span>
                  <span className="font-bold text-slate-800">{merchantName}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">UPI VPA:</span>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {merchantVpa}
                    </code>
                    <button
                      onClick={handleCopyVpa}
                      className="text-slate-600 hover:text-blue-600 transition-colors p-1"
                      title="Copy UPI ID"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Deep Link Button for Mobile Users */}
              <a
                href={upiUri}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors border border-slate-200 sm:hidden"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                <span>Tap to Pay Directly in UPI App (₹500)</span>
              </a>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleManualConfirm}
                  disabled={verifying}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Payment...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>I Have Completed Payment (₹500)</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                  <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
                  <span>Auto-syncing with bank webhook...</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
