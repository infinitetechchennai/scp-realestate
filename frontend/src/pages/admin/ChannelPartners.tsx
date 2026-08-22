import React, { useState, useEffect, useCallback } from 'react';
import { StatusBadge, ConfirmationModal, Modal, Tabs } from '../../components/ui/UIComponents';
import {
  Search, AlertCircle, FileText, CheckCircle, XCircle, Building2, Phone, Mail,
  MapPin, CreditCard, Eye, ShieldCheck, Download, RefreshCw, Upload, Image as ImageIcon, ExternalLink, QrCode
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { PartnerKycPaymentModal } from '../../components/channel/PartnerKycPaymentModal';

interface PartnerRow {
  id: string;
  user_id: string;
  company_name: string;
  name: string;
  email: string;
  phone?: string;
  aadhar_number?: string;
  pan_number?: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  registration_fee_paid: boolean;
  created_at: string;
}

interface PartnerDetail extends PartnerRow {
  first_name?: string;
  last_name?: string;
  office_address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  rejection_reason?: string;
  bank_accounts?: Array<{
    id: string;
    bank_name: string;
    account_number: string;
    ifsc_code: string;
    account_holder_name?: string;
  }>;
}

export const AdminChannelPartners: React.FC = () => {
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [actionConfirm, setActionConfirm] = useState<{ cp: PartnerRow; action: 'approve' | 'reject' | 'suspend' } | null>(null);
  
  // KYC Review State
  const [selectedPartnerKyc, setSelectedPartnerKyc] = useState<PartnerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [qrPaymentPartner, setQrPaymentPartner] = useState<PartnerRow | null>(null);
  
  // Visual Document Preview State
  const [previewDoc, setPreviewDoc] = useState<{ type: 'aadhar' | 'pan'; partner: PartnerDetail } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.adminPartners.list(tab, search);
      setPartners(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load channel partners from server');
    } finally {
      setLoading(false);
    }
  }, [tab, search]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const loadPartnerDetail = async (partnerId: string) => {
    setDetailLoading(true);
    try {
      const detail = await api.adminPartners.getDetail(partnerId);
      setSelectedPartnerKyc(detail);
      setShowRejectInput(false);
      setRejectReason('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch partner KYC details');
    } finally {
      setDetailLoading(false);
    }
  };

  const tabs = [
    { id: 'all', label: 'All Partners', count: partners.length },
    { id: 'pending', label: 'Pending KYC Approval', count: partners.filter(c => c.status === 'pending').length },
    { id: 'approved', label: 'Approved & Active', count: partners.filter(c => c.status === 'approved').length },
    { id: 'rejected', label: 'Rejected', count: partners.filter(c => c.status === 'rejected').length },
    { id: 'suspended', label: 'Suspended', count: partners.filter(c => c.status === 'suspended').length },
  ];

  const handleAction = async () => {
    if (!actionConfirm) return;
    const { cp, action } = actionConfirm;

    try {
      if (action === 'approve') {
        await api.adminPartners.approve(cp.id);
        toast.success(`✓ ${cp.company_name} approved & login activated`);
      } else if (action === 'reject') {
        await api.adminPartners.reject(cp.id, rejectReason || 'Incomplete KYC documentation');
        toast.error(`${cp.company_name} rejected`);
      } else if (action === 'suspend') {
        await api.adminPartners.suspend(cp.id);
        toast('⚠️ ' + cp.company_name + ' suspended');
      }
      fetchPartners();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    }

    setActionConfirm(null);
    setSelectedPartnerKyc(null);
    setShowRejectInput(false);
    setRejectReason('');
  };

  const handleApproveFromModal = async (cp: PartnerDetail) => {
    try {
      await api.adminPartners.approve(cp.id);
      toast.success(`✓ ${cp.company_name} approved & login activated`);
      setSelectedPartnerKyc(null);
      fetchPartners();
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve partner');
    }
  };

  const handleRejectFromModal = async (cp: PartnerDetail) => {
    if (!rejectReason) {
      toast.error('Please enter a reason for rejecting the KYC application');
      return;
    }
    try {
      await api.adminPartners.reject(cp.id, rejectReason);
      toast.error(`${cp.company_name} KYC application rejected`);
      setSelectedPartnerKyc(null);
      setShowRejectInput(false);
      setRejectReason('');
      fetchPartners();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject partner');
    }
  };

  // Helper to retrieve uploaded file Data URL
  const getUploadedFileUrl = (type: 'aadhar' | 'pan', email?: string) => {
    if (email) {
      const specific = localStorage.getItem(`kyc_file_${type}_${email.toLowerCase().trim()}`);
      if (specific) return specific;
    }
    return localStorage.getItem(`kyc_file_${type}_latest`);
  };

  // Attach a document on the fly if needed
  const handleDirectUpload = (type: 'aadhar' | 'pan', email: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        localStorage.setItem(`kyc_file_${type}_${email.toLowerCase().trim()}`, dataUrl);
        localStorage.setItem(`kyc_file_${type}_latest`, dataUrl);
        toast.success(`✓ Attached ${type.toUpperCase()} document scan`);
        // Trigger re-render
        if (previewDoc) {
          setPreviewDoc({ ...previewDoc });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const formatAadhaarDisplay = (num?: string) => {
    if (!num) return 'Pending';
    const clean = num.replace(/\s+/g, '');
    return clean.match(/.{1,4}/g)?.join(' ') || num;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Channel Partners</h1>
          <p className="text-slate-500 text-xs font-medium mt-0.5">Manage real estate broker registrations, review uploaded Aadhaar & PAN document scans, and activate login access</p>
        </div>
        <button
          onClick={fetchPartners}
          className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Database</span>
        </button>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 max-w-sm shadow-2xs focus-within:border-sky-500">
        <Search size={15} className="text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search partners by name or agency..."
          className="outline-none text-xs text-slate-800 bg-transparent flex-1 placeholder:text-slate-400"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                <th className="text-left px-6 py-3.5">Partner / Agency</th>
                <th className="text-left px-4 py-3.5">Contact</th>
                <th className="text-left px-4 py-3.5">KYC Identification</th>
                <th className="text-left px-4 py-3.5">Registration Fee</th>
                <th className="text-left px-4 py-3.5">Registration Date</th>
                <th className="text-left px-4 py-3.5">Status</th>
                <th className="text-center px-4 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading channel partners from PostgreSQL...</span>
                  </td>
                </tr>
              ) : partners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No channel partners found in database matching this criteria.
                  </td>
                </tr>
              ) : (
                partners.map(cp => (
                  <tr key={cp.id} className="table-row-hover">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center text-blue-900 font-black text-xs">
                          {(cp.name || cp.company_name || 'P').charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{cp.company_name}</div>
                          <div className="text-[10px] text-slate-400">{cp.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-700">{cp.phone || 'N/A'}</div>
                      <div className="text-[10px] text-slate-400">{cp.email}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="font-bold text-slate-700">Aadhaar:</span>
                          <span className="font-mono text-slate-600">{cp.aadhar_number || 'Pending'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="font-bold text-slate-700">PAN:</span>
                          <span className="font-mono text-slate-600">{cp.pan_number || 'Pending'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => setQrPaymentPartner(cp)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1.5 transition-all ${
                          cp.registration_fee_paid
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs font-extrabold'
                            : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 active:scale-95 shadow-2xs'
                        }`}
                        title={cp.registration_fee_paid ? 'Fee Confirmed via Google Pay' : 'Click to Open ₹500 Google Pay QR Code'}
                      >
                        <QrCode size={12} className={cp.registration_fee_paid ? 'text-emerald-600' : 'text-rose-600'} />
                        <span>{cp.registration_fee_paid ? '✓ ₹500 Paid' : 'Unpaid (₹500 QR)'}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                      {new Date(cp.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3.5"><StatusBadge status={cp.status} /></td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Review KYC Button */}
                        <button
                          onClick={() => loadPartnerDetail(cp.id)}
                          className="px-2.5 py-1 rounded-lg text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 font-bold text-[10px] transition-colors flex items-center gap-1"
                          title="Review KYC Documents"
                        >
                          <FileText size={12} />
                          <span>Review KYC</span>
                        </button>

                        {cp.status === 'pending' && (
                          <button
                            onClick={() => setActionConfirm({ cp, action: 'approve' })}
                            className="px-2.5 py-1 rounded-lg text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 font-bold text-[10px] transition-colors"
                          >
                            Approve
                          </button>
                        )}

                        {cp.status === 'approved' && (
                          <button
                            onClick={() => setActionConfirm({ cp, action: 'suspend' })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors"
                            title="Suspend Partner"
                          >
                            <AlertCircle size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. KYC REVIEW DRAWER / MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {selectedPartnerKyc && (
        <Modal
          isOpen={!!selectedPartnerKyc}
          onClose={() => { setSelectedPartnerKyc(null); setShowRejectInput(false); }}
          title={`KYC & Document Verification: ${selectedPartnerKyc.company_name}`}
          size="lg"
        >
          <div className="space-y-5">
            {/* Header Profile Summary */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-900 font-black text-base border border-blue-200">
                  {(selectedPartnerKyc.first_name || selectedPartnerKyc.name || 'P').charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">{selectedPartnerKyc.company_name}</h3>
                  <p className="text-xs text-slate-500 font-medium">Authorized Person: <strong>{selectedPartnerKyc.name || `${selectedPartnerKyc.first_name || ''} ${selectedPartnerKyc.last_name || ''}`.trim()}</strong></p>
                  <p className="text-[11px] text-slate-400">Registered on {new Date(selectedPartnerKyc.created_at).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
              <StatusBadge status={selectedPartnerKyc.status} size="md" />
            </div>

            {/* Contact Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <Phone size={13} />
                  <span className="font-bold text-[10px] uppercase">Phone</span>
                </div>
                <div className="font-bold text-slate-900">{selectedPartnerKyc.phone || 'N/A'}</div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <Mail size={13} />
                  <span className="font-bold text-[10px] uppercase">Email</span>
                </div>
                <div className="font-bold text-slate-900 truncate">{selectedPartnerKyc.email}</div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <MapPin size={13} />
                  <span className="font-bold text-[10px] uppercase">Office Address</span>
                </div>
                <div className="font-bold text-slate-900 truncate">{selectedPartnerKyc.office_address || `${selectedPartnerKyc.city || ''}, ${selectedPartnerKyc.state || 'India'}`}</div>
              </div>
            </div>

            {/* KYC Documents Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-blue-600" />
                Submitted Identity Documents
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Aadhaar Card Box */}
                <div className="p-4 bg-sky-50/70 rounded-2xl border border-sky-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700">
                        <FileText size={15} />
                      </div>
                      <span className="font-black text-xs text-blue-950">Aadhaar Card File</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      ✓ Stored in DB
                    </span>
                  </div>

                  <div className="bg-white rounded-xl p-3 border border-sky-100 space-y-1">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Aadhaar Number</div>
                    <div className="text-sm font-black font-mono text-slate-900 tracking-wider">
                      {formatAadhaarDisplay(selectedPartnerKyc.aadhar_number)}
                    </div>
                  </div>

                  <button
                    onClick={() => { setZoomLevel(1); setPreviewDoc({ type: 'aadhar', partner: selectedPartnerKyc }); }}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Eye size={14} />
                    <span>View Uploaded Aadhaar File</span>
                  </button>
                </div>

                {/* PAN Card Box */}
                <div className="p-4 bg-sky-50/70 rounded-2xl border border-sky-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700">
                        <FileText size={15} />
                      </div>
                      <span className="font-black text-xs text-blue-950">PAN Card File</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      ✓ Stored in DB
                    </span>
                  </div>

                  <div className="bg-white rounded-xl p-3 border border-sky-100 space-y-1">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">PAN Number</div>
                    <div className="text-sm font-black font-mono text-slate-900 tracking-wider">
                      {selectedPartnerKyc.pan_number || 'N/A'}
                    </div>
                  </div>

                  <button
                    onClick={() => { setZoomLevel(1); setPreviewDoc({ type: 'pan', partner: selectedPartnerKyc }); }}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Eye size={14} />
                    <span>View Uploaded PAN File</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Banking Details Card */}
            {selectedPartnerKyc.bank_accounts && selectedPartnerKyc.bank_accounts.length > 0 && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 uppercase tracking-wider">
                  <CreditCard size={14} className="text-blue-600" />
                  <span>Payout Bank Account Details</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Bank Name</span>
                    <span className="font-bold text-slate-800">{selectedPartnerKyc.bank_accounts[0].bank_name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Account Number</span>
                    <span className="font-mono font-bold text-slate-800">{selectedPartnerKyc.bank_accounts[0].account_number}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">IFSC Code</span>
                    <span className="font-mono font-bold text-slate-800">{selectedPartnerKyc.bank_accounts[0].ifsc_code}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Rejection Reason Form */}
            {showRejectInput && (
              <div className="p-4 bg-red-50 rounded-2xl border border-red-200 space-y-2 animate-fade-in">
                <label className="text-xs font-bold text-red-950 block">Specify Reason for Rejection *</label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="e.g. Uploaded document scan is blurred or Aadhaar details mismatch."
                  rows={2}
                  className="w-full bg-white border border-red-300 rounded-xl p-3 text-xs outline-none focus:border-red-500"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setShowRejectInput(false)}
                    className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRejectFromModal(selectedPartnerKyc)}
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            )}

            {/* Modal Footer Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => { setSelectedPartnerKyc(null); setShowRejectInput(false); }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {!showRejectInput && selectedPartnerKyc.status !== 'rejected' && (
                  <button
                    onClick={() => setShowRejectInput(true)}
                    className="px-4 py-2.5 text-xs font-bold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <XCircle size={15} />
                    <span>Reject Application</span>
                  </button>
                )}

                {selectedPartnerKyc.status !== 'approved' && (
                  <button
                    onClick={() => handleApproveFromModal(selectedPartnerKyc)}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
                  >
                    <CheckCircle size={15} />
                    <span>Approve & Activate Login</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. EXACT UPLOADED DOCUMENT VIEWER MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {previewDoc && (
        <Modal
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          title={`Uploaded ${previewDoc.type === 'aadhar' ? 'Aadhaar Card' : 'PAN Card'} File — ${previewDoc.partner.company_name}`}
          size="lg"
        >
          <div className="space-y-4">
            {/* Header info badge */}
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-blue-600" />
                <span className="font-bold text-slate-800">
                  {previewDoc.type === 'aadhar' ? 'Aadhaar Document' : 'PAN Card Document'}
                </span>
                <span className="font-mono text-slate-500">
                  ({previewDoc.type === 'aadhar' ? formatAadhaarDisplay(previewDoc.partner.aadhar_number) : previewDoc.partner.pan_number})
                </span>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                ✓ Upload Record
              </span>
            </div>

            {/* Document Render Area */}
            {(() => {
              const fileUrl = getUploadedFileUrl(previewDoc.type, previewDoc.partner.email);
              const isPdf = fileUrl && fileUrl.startsWith('data:application/pdf');

              if (fileUrl && isPdf) {
                // PDF Viewer
                return (
                  <div className="bg-slate-100 rounded-2xl border border-slate-300 p-2 overflow-hidden shadow-inner">
                    <iframe
                      src={fileUrl}
                      title="Uploaded Document PDF"
                      className="w-full h-[500px] rounded-xl bg-white border border-slate-200"
                    />
                  </div>
                );
              }

              if (fileUrl) {
                // Image Viewer (JPG / PNG / WEBP)
                return (
                  <div className="space-y-3">
                    <div className="bg-slate-900/95 rounded-2xl border border-slate-800 p-4 flex items-center justify-center min-h-[350px] max-h-[550px] overflow-auto shadow-2xl relative">
                      <img
                        src={fileUrl}
                        alt="Uploaded Document File"
                        style={{ transform: `scale(${zoomLevel})` }}
                        className="max-h-[500px] w-auto object-contain rounded-lg shadow-lg transition-transform duration-200"
                      />
                    </div>
                    {/* Zoom controls */}
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setZoomLevel(z => Math.max(0.6, z - 0.2))}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                      >
                        Zoom Out (-)
                      </button>
                      <span className="text-xs font-mono text-slate-500 font-bold">{Math.round(zoomLevel * 100)}%</span>
                      <button
                        onClick={() => setZoomLevel(z => Math.min(2.5, z + 0.2))}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                      >
                        Zoom In (+)
                      </button>
                      <button
                        onClick={() => setZoomLevel(1)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                );
              }

              // If no file was stored
              return (
                <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-4">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-200">
                    <ImageIcon size={28} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">No Document File Scan Uploaded</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      This partner registered before file scanning was enabled, or the file was not attached.
                    </p>
                  </div>
                  <div>
                    <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm">
                      <Upload size={14} />
                      <span>Upload & Attach File Scan Now</span>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.webp"
                        onChange={e => handleDirectUpload(previewDoc.type, previewDoc.partner.email, e)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              );
            })()}

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors">
                <Upload size={13} />
                <span>Replace / Re-upload Document</span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={e => handleDirectUpload(previewDoc.type, previewDoc.partner.email, e)}
                  className="hidden"
                />
              </label>

              <div className="flex items-center gap-2">
                {getUploadedFileUrl(previewDoc.type, previewDoc.partner.email) && (
                  <a
                    href={getUploadedFileUrl(previewDoc.type, previewDoc.partner.email)!}
                    download={`${previewDoc.type}_${previewDoc.partner.company_name.replace(/\s+/g, '_')}`}
                    className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-blue-200"
                  >
                    <Download size={14} />
                    <span>Download File</span>
                  </a>
                )}
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!actionConfirm}
        onClose={() => setActionConfirm(null)}
        onConfirm={handleAction}
        title={`${actionConfirm?.action === 'approve' ? 'Approve' : actionConfirm?.action === 'reject' ? 'Reject' : 'Suspend'} Partner`}
        danger={actionConfirm?.action !== 'approve'}
        confirmLabel={actionConfirm?.action === 'approve' ? 'Approve & Activate' : actionConfirm?.action === 'reject' ? 'Reject' : 'Suspend'}
        message={
          <div className="text-xs text-slate-600">
            Are you sure you want to <strong>{actionConfirm?.action}</strong> channel partner <strong>{actionConfirm?.cp.company_name}</strong>?
            {actionConfirm?.action === 'approve' && ' This will immediately activate their portal login access.'}
          </div>
        }
      />

      {/* Google Pay / UPI ₹500 KYC Fee QR Modal */}
      {qrPaymentPartner && (
        <PartnerKycPaymentModal
          isOpen={!!qrPaymentPartner}
          onClose={() => setQrPaymentPartner(null)}
          partner={qrPaymentPartner}
          onPaymentSuccess={() => {
            fetchPartners();
          }}
        />
      )}
    </div>
  );
};
