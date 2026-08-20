import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Eye, EyeOff, LogIn, Lock, Mail, Shield } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types';
import toast from 'react-hot-toast';

const DEMO_CREDENTIALS = [
  { role: 'super_admin' as UserRole, email: 'admin@example.com', password: 'admin123', label: 'Super Admin', color: 'bg-amber-50 text-amber-900 border-amber-300' },
  { role: 'channel_partner' as UserRole, email: 'channel@example.com', password: 'channel123', label: 'Channel Partner', color: 'bg-orange-50 text-orange-900 border-orange-300' },
  { role: 'customer' as UserRole, email: 'customer@example.com', password: 'cust123', label: 'Customer', color: 'bg-emerald-50 text-emerald-900 border-emerald-300' },
];

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('super_admin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    const success = login(email, password, role);
    setLoading(false);
    if (success) {
      toast.success('Welcome back! Redirecting...');
      setTimeout(() => {
        if (role === 'super_admin') navigate('/admin/dashboard');
        else if (role === 'channel_partner') navigate('/channel/dashboard');
        else navigate('/customer/dashboard');
      }, 250);
    } else {
      toast.error('Invalid credentials. Use the demo credentials below.');
    }
  };

  const quickLogin = (cred: typeof DEMO_CREDENTIALS[0]) => {
    setEmail(cred.email);
    setPassword(cred.password);
    setRole(cred.role);
  };

  return (
    <div className="min-h-screen bg-[#0c0f17] flex">
      {/* Left panel (Hero) */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden bg-gradient-to-br from-[#0c0f17] via-[#151a26] to-[#090b10] border-r border-[#1e2638]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-11 h-11 bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-900/30">
              <Building2 size={24} className="text-slate-950 font-black" />
            </div>
            <div>
              <span className="text-white text-xl font-black tracking-wide">GVE <span className="text-amber-400">Realty</span></span>
              <p className="text-slate-400 text-xs font-medium">Plot Booking Management</p>
            </div>
          </div>

          <h1 className="text-4xl font-black text-white leading-tight mb-4">
            Master Plan & Plot<br />
            <span className="text-amber-400">Booking Management</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-md">
            Manage your entire real estate plot inventory, real-time master layouts, multi-tier booking pipelines, channel partners, and transaction audit trails in one platform.
          </p>
        </div>

        {/* Highlight Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { label: 'Total Plots', value: '40' },
            { label: 'Active Pipeline', value: '12' },
            { label: 'Portfolio Value', value: '₹15.8Cr' },
          ].map(stat => (
            <div key={stat.label} className="bg-[#161b26] border border-[#222a3d] rounded-2xl p-4 shadow-sm">
              <div className="text-2xl font-black text-amber-400">{stat.value}</div>
              <div className="text-slate-400 text-xs font-semibold mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel (Form) */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center">
              <Building2 size={20} className="text-slate-950" />
            </div>
            <span className="text-slate-900 text-xl font-black">GVE <span className="text-amber-600">Realty</span></span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 mb-1">Welcome back</h2>
          <p className="text-slate-500 text-xs mb-7 font-medium">Select your role and sign in to access your dashboard</p>

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
                        ? 'border-amber-500 bg-amber-50 text-amber-950 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:border-amber-200 hover:bg-slate-50'
                    }`}
                  >
                    {r === 'super_admin' ? 'Admin' : r === 'channel_partner' ? 'Partner' : 'Customer'}
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
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-xs font-medium focus:border-amber-400 outline-none transition-colors"
                  placeholder="your@email.com"
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
                  className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl text-xs font-medium focus:border-amber-400 outline-none transition-colors"
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
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={16} />
                  Sign In to Portal
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-8 p-4 bg-slate-50/80 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-1.5 mb-3">
              <Shield size={14} className="text-amber-600" />
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Quick Demo Login</span>
            </div>
            <div className="space-y-2">
              {DEMO_CREDENTIALS.map(cred => (
                <button
                  key={cred.role}
                  onClick={() => quickLogin(cred)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold transition-all hover:scale-[1.01] ${cred.color}`}
                >
                  <span>{cred.label}</span>
                  <span className="opacity-70 font-normal text-[11px]">{cred.email}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-2.5 text-center font-medium">Click any role button above to auto-fill credentials</p>
          </div>
        </div>
      </div>
    </div>
  );
};
