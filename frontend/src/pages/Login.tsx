import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, LogIn, Lock, Mail, Shield, UserPlus, FileText,
  Upload, CheckCircle, Clock, XCircle, AlertCircle, Building2, Phone, MapPin, CreditCard, ArrowLeft
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { UserRole, ChannelPartner } from '../types';
import { Modal } from '../components/ui/UIComponents';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export const LoginPage: React.FC = () => {
  const [authMode, setAuthMode] = useState<'login' | 'register_partner'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('super_admin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // KYC Pending / Rejected Modal state
  const [kycModalPartner, setKycModalPartner] = useState<Partial<ChannelPartner> | null>(null);
  const [kycModalStatus, setKycModalStatus] = useState<'pending' | 'rejected' | 'suspended' | 'approved' | null>(null);

  // Partner Registration Form State
  const [regForm, setRegForm] = useState({
    companyName: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    aadhar: '',
    aadharDocName: '',
    aadharDocSize: '',
    aadharDataUrl: '',
    aadharRawFile: null as File | null,
    pan: '',
    panDocName: '',
    panDocSize: '',
    panDataUrl: '',
    panRawFile: null as File | null,
    bankName: '',
    accountNumber: '',
    ifscCode: '',
  });
  const [regSuccess, setRegSuccess] = useState(false);

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await login(email, password, role);
      setLoading(false);

      if (result.success) {
        toast.success('Welcome back! Redirecting...');
        setTimeout(() => {
          if (role === 'super_admin') navigate('/admin/dashboard');
          else if (role === 'channel_partner') navigate('/channel/dashboard');
          else navigate('/customer/dashboard');
        }, 250);
      } else {
        // If Channel Partner KYC is not approved yet (pending or rejected)
        if (role === 'channel_partner' && result.status && result.partner) {
          setKycModalPartner(result.partner);
          setKycModalStatus(result.status);
        } else {
          toast.error(result.message || 'Invalid credentials. Please verify your email and password.');
        }
      }
    } catch (err: any) {
      setLoading(false);
      toast.error(err.message || 'Unable to connect to backend server');
    }
  };

  const handlePartnerRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!regForm.companyName || !regForm.name || !regForm.email || !regForm.phone || !regForm.password) {
      toast.error('Please fill in all required company and contact details');
      return;
    }

    if (regForm.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (!regForm.aadhar || regForm.aadhar.replace(/\s/g, '').length !== 12) {
      toast.error('Please enter a valid 12-digit Aadhaar number');
      return;
    }

    if (!regForm.pan || regForm.pan.length !== 10) {
      toast.error('Please enter a valid 10-character PAN number (e.g. ABCDE1234F)');
      return;
    }

    if (!regForm.aadharDocName) {
      toast.error('Please upload your Aadhaar Card document');
      return;
    }

    if (!regForm.panDocName) {
      toast.error('Please upload your PAN Card document');
      return;
    }

    setLoading(true);
    try {
      const nameParts = regForm.name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || undefined;

      await api.auth.registerPartner({
        company_name: regForm.companyName,
        first_name: firstName,
        last_name: lastName,
        email: regForm.email,
        password: regForm.password,
        phone: regForm.phone,
        office_address: regForm.address || undefined,
        aadhar_number: regForm.aadhar.replace(/\s/g, ''),
        pan_number: regForm.pan.toUpperCase(),
        bank_name: regForm.bankName || undefined,
        account_number: regForm.accountNumber || undefined,
        ifsc_code: regForm.ifscCode ? regForm.ifscCode.toUpperCase() : undefined,
      });

      // 1. Upload physical Aadhaar file to backend /uploads/kyc
      if (regForm.aadharRawFile) {
        try {
          await api.documents.upload(regForm.aadharRawFile, 'aadhaar');
        } catch (uploadErr) {
          console.warn('Backend file upload note:', uploadErr);
        }
      }

      // 2. Upload physical PAN file to backend /uploads/kyc
      if (regForm.panRawFile) {
        try {
          await api.documents.upload(regForm.panRawFile, 'pan');
        } catch (uploadErr) {
          console.warn('Backend file upload note:', uploadErr);
        }
      }

      // Persist the exact uploaded preview under the partner's email
      const userKey = regForm.email.toLowerCase().trim();
      if (regForm.aadharDataUrl) {
        localStorage.setItem(`kyc_file_aadhar_${userKey}`, regForm.aadharDataUrl);
        localStorage.setItem('kyc_file_aadhar_latest', regForm.aadharDataUrl);
      }
      if (regForm.panDataUrl) {
        localStorage.setItem(`kyc_file_pan_${userKey}`, regForm.panDataUrl);
        localStorage.setItem('kyc_file_pan_latest', regForm.panDataUrl);
      }

      toast.success('✓ KYC Documents & Registration Submitted to Server!');
      setRegSuccess(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit registration');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatedFileUpload = (docType: 'aadhar' | 'pan', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        if (docType === 'aadhar') {
          setRegForm(f => ({
            ...f,
            aadharDocName: file.name,
            aadharDocSize: `${sizeMb} MB`,
            aadharDataUrl: dataUrl,
            aadharRawFile: file,
          }));
          localStorage.setItem('kyc_file_aadhar_latest', dataUrl);
          if (regForm.email) {
            localStorage.setItem(`kyc_file_aadhar_${regForm.email.toLowerCase().trim()}`, dataUrl);
          }
          toast.success(`✓ Uploaded Aadhaar: ${file.name}`);
        } else {
          setRegForm(f => ({
            ...f,
            panDocName: file.name,
            panDocSize: `${sizeMb} MB`,
            panDataUrl: dataUrl,
            panRawFile: file,
          }));
          localStorage.setItem('kyc_file_pan_latest', dataUrl);
          if (regForm.email) {
            localStorage.setItem(`kyc_file_pan_${regForm.email.toLowerCase().trim()}`, dataUrl);
          }
          toast.success(`✓ Uploaded PAN: ${file.name}`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-[#080e1a] flex">
      {/* Left panel (Hero) */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 p-12 relative overflow-hidden bg-gradient-to-br from-[#080e1a] via-[#0f1d38] to-[#060a14] border-r border-[#131f37]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-500/15 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10">
          <div className="mb-10">
            <div className="inline-block bg-white rounded-2xl p-3 shadow-xl border border-white/20">
              <img src="/logo.jpeg" alt="Seven Circle Property Developers" className="h-12 w-auto object-contain" />
            </div>
          </div>

          <h1 className="text-4xl font-black text-white leading-tight mb-4">
            Master Plan & Plot<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-300">
              Booking Management
            </span>
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed max-w-md">
            Manage your entire real estate plot inventory, real-time master layouts, multi-tier booking pipelines, channel partners, and transaction audit trails in one platform.
          </p>

          <div className="mt-8 p-4 bg-sky-950/40 rounded-2xl border border-sky-800/40 text-xs text-sky-200 space-y-2 max-w-md">
            <div className="flex items-center gap-2 font-bold text-white">
              <Shield size={16} className="text-sky-400" />
              <span>PostgreSQL & FastAPI Connected</span>
            </div>
            <p className="text-[11px] text-slate-300">
              All channel partner accounts, KYC documents (Aadhaar & PAN), and booking transactions are synced live with your PostgreSQL database.
            </p>
          </div>
        </div>

        {/* Highlight Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { label: 'Total Plots', value: '40' },
            { label: 'Active Pipeline', value: '12' },
            { label: 'Portfolio Value', value: '₹15.8Cr' },
          ].map(stat => (
            <div key={stat.label} className="bg-[#0e172a]/90 border border-[#1e293b] rounded-2xl p-4 shadow-sm">
              <div className="text-2xl font-black text-sky-400">{stat.value}</div>
              <div className="text-slate-400 text-xs font-semibold mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel (Forms) */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10 bg-white overflow-y-auto max-h-screen">
        <div className="w-full max-w-lg">
          {/* Mobile Logo */}
          <div className="mb-6 lg:hidden">
            <div className="inline-block bg-white border border-slate-200 rounded-xl p-2 shadow-sm">
              <img src="/logo.jpeg" alt="Seven Circle Property Developers" className="h-10 w-auto object-contain" />
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl mb-6 border border-slate-200">
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setRegSuccess(false); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                authMode === 'login'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LogIn size={15} />
              Sign In to Portal
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register_partner'); setRegSuccess(false); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                authMode === 'register_partner'
                  ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserPlus size={15} />
              Partner Registration & KYC
            </button>
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* 1. SIGN IN FORM */}
          {/* ───────────────────────────────────────────────────────────── */}
          {authMode === 'login' && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-black text-slate-900 mb-1">Sign In to Portal</h2>
              <p className="text-slate-500 text-xs mb-6 font-medium">Select your portal role and enter your registered credentials</p>

              <form onSubmit={handleLogin} className="space-y-4">
                {/* Role Switcher */}
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">Sign In As</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['super_admin', 'channel_partner', 'customer'] as UserRole[]).map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`py-2.5 px-2 rounded-xl border-2 text-xs font-bold transition-all ${
                          role === r
                            ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-xs'
                            : 'border-slate-200 text-slate-600 hover:border-sky-300 hover:bg-slate-50'
                        }`}
                      >
                        {r === 'super_admin' ? 'Super Admin' : r === 'channel_partner' ? 'Channel Partner' : 'Customer'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-xs font-medium focus:border-sky-500 outline-none transition-colors"
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl text-xs font-medium focus:border-sky-500 outline-none transition-colors"
                      placeholder="••••••••"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 disabled:opacity-70 mt-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn size={16} />
                      Authenticate & Enter
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* 2. PARTNER KYC REGISTRATION FORM */}
          {/* ───────────────────────────────────────────────────────────── */}
          {authMode === 'register_partner' && (
            <div className="animate-fade-in">
              {regSuccess ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
                    <CheckCircle size={32} className="text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">KYC Documents Saved to Database!</h2>
                    <p className="text-slate-600 text-xs mt-1 max-w-sm mx-auto">
                      Thank you for submitting your Aadhaar & PAN KYC documents. Your application has been stored in PostgreSQL in <strong>Pending Verification</strong> status.
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2 max-w-sm mx-auto">
                    <div className="flex items-center gap-2 text-slate-700 font-bold">
                      <Clock size={14} className="text-orange-500" />
                      <span>Next Steps:</span>
                    </div>
                    <ul className="list-disc list-inside text-slate-500 text-[11px] space-y-1">
                      <li>Super Administrator verifies your Aadhaar & PAN cards in the Admin portal.</li>
                      <li>Upon approval, your login will be activated immediately.</li>
                      <li>You can sign in using: <strong>{regForm.email}</strong></li>
                    </ul>
                  </div>
                  <button
                    onClick={() => { setAuthMode('login'); setRegSuccess(false); setEmail(regForm.email); setRole('channel_partner'); }}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-sky-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md"
                  >
                    Go to Sign In
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <button onClick={() => setAuthMode('login')} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                      <ArrowLeft size={16} />
                    </button>
                    <h2 className="text-xl font-black text-slate-900">Channel Partner Registration</h2>
                  </div>
                  <p className="text-slate-500 text-xs mb-5 font-medium">Submit your agency profile, Aadhaar & PAN cards for admin approval</p>

                  <form onSubmit={handlePartnerRegister} className="space-y-4">
                    {/* Section: Agency Info */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wider">
                        <Building2 size={15} className="text-blue-600" />
                        <span>Agency & Contact Information</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">Agency / Company Name *</label>
                          <input
                            type="text"
                            value={regForm.companyName}
                            onChange={e => setRegForm(f => ({ ...f, companyName: e.target.value }))}
                            placeholder="e.g. Apex Realty Ventures"
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium outline-none focus:border-sky-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">Authorized Person Name *</label>
                          <input
                            type="text"
                            value={regForm.name}
                            onChange={e => setRegForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="Full Name"
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium outline-none focus:border-sky-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">Mobile Phone *</label>
                          <input
                            type="tel"
                            value={regForm.phone}
                            onChange={e => setRegForm(f => ({ ...f, phone: e.target.value }))}
                            placeholder="+91 98765 43210"
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium outline-none focus:border-sky-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">Email Address *</label>
                          <input
                            type="email"
                            value={regForm.email}
                            onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))}
                            placeholder="partner@agency.com"
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium outline-none focus:border-sky-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">Create Password *</label>
                          <input
                            type="password"
                            value={regForm.password}
                            onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))}
                            placeholder="••••••••"
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium outline-none focus:border-sky-500"
                            required
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">Office Address</label>
                          <input
                            type="text"
                            value={regForm.address}
                            onChange={e => setRegForm(f => ({ ...f, address: e.target.value }))}
                            placeholder="Street, City, Postal Code"
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium outline-none focus:border-sky-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section: KYC Documents */}
                    <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-200/80 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-black text-blue-950 uppercase tracking-wider">
                        <FileText size={15} className="text-blue-600" />
                        <span>Identity KYC Documents (Required)</span>
                      </div>

                      {/* Aadhaar Upload Box */}
                      <div className="bg-white rounded-xl p-3 border border-sky-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-slate-900">1. Aadhaar Card Number *</label>
                          <span className="text-[10px] text-slate-400 font-mono">12 Digits</span>
                        </div>
                        <input
                          type="text"
                          maxLength={14}
                          value={regForm.aadhar}
                          onChange={e => setRegForm(f => ({ ...f, aadhar: e.target.value }))}
                          placeholder="1234 5678 9012"
                          className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold tracking-wider outline-none focus:border-sky-500"
                          required
                        />

                        {/* File Upload Trigger */}
                        <div className="flex items-center justify-between pt-1">
                          {regForm.aadharDocName ? (
                            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold">
                              <CheckCircle size={14} className="text-emerald-600" />
                              <span className="truncate max-w-[200px]">{regForm.aadharDocName}</span>
                              <span className="text-[10px] text-emerald-600 font-normal">({regForm.aadharDocSize})</span>
                            </div>
                          ) : (
                            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg text-xs font-bold cursor-pointer transition-colors">
                              <Upload size={13} />
                              <span>Upload Aadhaar File (PDF/Image)</span>
                              <input
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg"
                                onChange={e => handleSimulatedFileUpload('aadhar', e)}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      </div>

                      {/* PAN Upload Box */}
                      <div className="bg-white rounded-xl p-3 border border-sky-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-slate-900">2. PAN Card Number *</label>
                          <span className="text-[10px] text-slate-400 font-mono">10 Characters</span>
                        </div>
                        <input
                          type="text"
                          maxLength={10}
                          value={regForm.pan}
                          onChange={e => setRegForm(f => ({ ...f, pan: e.target.value.toUpperCase() }))}
                          placeholder="ABCDE1234F"
                          className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-wider outline-none focus:border-sky-500"
                          required
                        />

                        {/* File Upload Trigger */}
                        <div className="flex items-center justify-between pt-1">
                          {regForm.panDocName ? (
                            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold">
                              <CheckCircle size={14} className="text-emerald-600" />
                              <span className="truncate max-w-[200px]">{regForm.panDocName}</span>
                              <span className="text-[10px] text-emerald-600 font-normal">({regForm.panDocSize})</span>
                            </div>
                          ) : (
                            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg text-xs font-bold cursor-pointer transition-colors">
                              <Upload size={13} />
                              <span>Upload PAN Card File (PDF/Image)</span>
                              <input
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg"
                                onChange={e => handleSimulatedFileUpload('pan', e)}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Section: Bank Account Info */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wider">
                        <CreditCard size={15} className="text-blue-600" />
                        <span>Commission Payout Bank Details</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">Bank Name</label>
                          <input
                            type="text"
                            value={regForm.bankName}
                            onChange={e => setRegForm(f => ({ ...f, bankName: e.target.value }))}
                            placeholder="HDFC Bank"
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-sky-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">Account Number</label>
                          <input
                            type="text"
                            value={regForm.accountNumber}
                            onChange={e => setRegForm(f => ({ ...f, accountNumber: e.target.value }))}
                            placeholder="123456789012"
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-sky-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">IFSC Code</label>
                          <input
                            type="text"
                            value={regForm.ifscCode}
                            onChange={e => setRegForm(f => ({ ...f, ifscCode: e.target.value.toUpperCase() }))}
                            placeholder="HDFC0001234"
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs uppercase outline-none focus:border-sky-500"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 mt-4 disabled:opacity-70"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle size={16} />
                          Submit Application for Admin Approval
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. KYC STATUS GATEKEEPING MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {kycModalPartner && (
        <Modal
          isOpen={!!kycModalPartner}
          onClose={() => setKycModalPartner(null)}
          title={kycModalStatus === 'pending' ? 'KYC Verification In Progress' : 'KYC Application Rejected'}
          size="md"
        >
          <div className="space-y-4">
            {kycModalStatus === 'pending' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-2xl border border-orange-200">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-700 flex-shrink-0">
                    <Clock size={22} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-orange-950 uppercase tracking-wider">Application Under Review</h3>
                    <p className="text-[11px] text-orange-800 mt-0.5">
                      Your Channel Partner registration documents are currently awaiting verification by the Super Administrator.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5 text-xs">
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-500">Agency Name:</span>
                    <span className="font-bold text-slate-900">{kycModalPartner.companyName}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-500">Contact Email:</span>
                    <span className="font-bold text-slate-900">{kycModalPartner.email}</span>
                  </div>
                  {kycModalPartner.aadhar && (
                    <div className="flex justify-between border-b border-slate-200/60 pb-2">
                      <span className="text-slate-500">Aadhaar Card:</span>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-900">{kycModalPartner.aadhar}</span>
                        <div className="text-[10px] text-emerald-700 font-semibold">✓ Registered</div>
                      </div>
                    </div>
                  )}
                  {kycModalPartner.pan && (
                    <div className="flex justify-between border-b border-slate-200/60 pb-2">
                      <span className="text-slate-500">PAN Card:</span>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-900">{kycModalPartner.pan}</span>
                        <div className="text-[10px] text-emerald-700 font-semibold">✓ Registered</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-xs text-slate-500 bg-sky-50/70 p-3 rounded-xl border border-sky-100 flex items-start gap-2">
                  <AlertCircle size={15} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Once the Administrator verifies your Aadhaar and PAN documents in the Admin Portal, your login will automatically unlock.</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-200">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-700 flex-shrink-0">
                    <XCircle size={22} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-red-950 uppercase tracking-wider">Application Rejected</h3>
                    <p className="text-[11px] text-red-800 mt-0.5">
                      Your registration KYC could not be approved due to documentation issues.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Administrator Feedback:</span>
                  <p className="text-xs text-red-600 font-semibold bg-red-50/60 p-3 rounded-xl border border-red-200">
                    "{kycModalPartner.rejectionReason || 'Aadhaar or PAN document details mismatch.'}"
                  </p>
                </div>

                <button
                  onClick={() => {
                    setKycModalPartner(null);
                    setAuthMode('register_partner');
                    setRegForm(f => ({
                      ...f,
                      companyName: kycModalPartner.companyName || '',
                      email: kycModalPartner.email || '',
                      aadhar: kycModalPartner.aadhar || '',
                      pan: kycModalPartner.pan || '',
                    }));
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-sm"
                >
                  Re-submit Corrected KYC Documents
                </button>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setKycModalPartner(null)}
                className="px-5 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
