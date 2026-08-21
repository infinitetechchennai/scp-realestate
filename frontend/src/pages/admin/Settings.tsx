import React, { useState } from 'react';
import { useSettingsStore } from '../../store/stores';
import { Tabs } from '../../components/ui/UIComponents';
import { Save, Building, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminSettings: React.FC = () => {
  const { settings, updateSettings } = useSettingsStore();
  const [tab, setTab] = useState('general');
  const [local, setLocal] = useState(settings);

  const handleSave = () => {
    updateSettings(local);
    toast.success('✓ Settings saved successfully');
  };

  const tabs = [
    { id: 'general', label: 'Company Info' },
    { id: 'booking', label: 'Booking Rules' },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900">System Settings</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Configure company details and automatic booking expiry rules</p>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        {tab === 'general' && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Building size={18} className="text-blue-600" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Company Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'companyName', label: 'Company Name', placeholder: 'Seven Circle Property Developers' },
                { key: 'companyEmail', label: 'Official Email', placeholder: 'info@sevencircle.com' },
                { key: 'companyPhone', label: 'Official Phone', placeholder: '+91 98765 43210' },
              ].map(f => (
                <div key={f.key} className={f.key === 'companyName' ? 'md:col-span-2' : ''}>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">{f.label}</label>
                  <input
                    type="text"
                    value={local[f.key as keyof typeof local] as string}
                    onChange={e => setLocal(l => ({ ...l, [f.key]: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:border-sky-500 outline-none transition-colors"
                    placeholder={f.placeholder}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'booking' && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Clock size={18} className="text-blue-600" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Booking Duration Rules</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-orange-50/70 border border-orange-200/80 rounded-2xl p-5 space-y-2">
                <label className="text-xs font-black text-orange-950 block">Token Booking Expiry (Days)</label>
                <input
                  type="number"
                  value={local.tokenBookingDuration}
                  onChange={e => setLocal(l => ({ ...l, tokenBookingDuration: parseInt(e.target.value) || 7 }))}
                  className="w-32 bg-white border border-orange-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 outline-none focus:border-orange-500"
                />
                <p className="text-[11px] text-orange-800 font-medium">After 7 days without confirmation, plots automatically release back to Available status.</p>
              </div>

              <div className="bg-red-50/70 border border-red-200/80 rounded-2xl p-5 space-y-2">
                <label className="text-xs font-black text-red-950 block">Confirmed Balance Deadline (Days)</label>
                <input
                  type="number"
                  value={local.confirmedBookingDuration}
                  onChange={e => setLocal(l => ({ ...l, confirmedBookingDuration: parseInt(e.target.value) || 90 }))}
                  className="w-32 bg-white border border-red-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 outline-none focus:border-red-500"
                />
                <p className="text-[11px] text-red-800 font-medium">Customers must complete full balance payment within 90 days of confirmation.</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2 md:col-span-2">
                <label className="text-xs font-black text-slate-900 block">Default Token Advance Amount (₹)</label>
                <input
                  type="number"
                  value={local.defaultTokenAmount}
                  onChange={e => setLocal(l => ({ ...l, defaultTokenAmount: parseInt(e.target.value) || 20000 }))}
                  className="w-48 bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 outline-none focus:border-sky-500"
                />
                <p className="text-[11px] text-slate-500 font-medium">Standard minimum token advance required to hold a plot.</p>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-blue-500/20"
          >
            <Save size={15} />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
