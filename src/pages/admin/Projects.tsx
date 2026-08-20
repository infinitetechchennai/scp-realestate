import React, { useState } from 'react';
import { mockProjects } from '../../data/mockData';
import { Modal } from '../../components/ui/UIComponents';
import { Plus, Eye, Map, Upload } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const AdminProjects: React.FC = () => {
  const projects = mockProjects;
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [createStep, setCreateStep] = useState<'form' | 'upload' | 'preview'>('form');
  const [form, setForm] = useState({ name: '', code: '', location: '', description: '', totalArea: '' });

  const handleImport = () => {
    toast.success('✓ 40 plots imported successfully from Excel');
    setShowCreate(false);
    setCreateStep('form');
    navigate('/admin/plot-layout');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Township Projects</h1>
          <p className="text-slate-500 text-xs font-medium">{projects.length} Active Real Estate Developments</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-blue-500/20"
        >
          <Plus size={16} />
          Create Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map(proj => (
          <div key={proj.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
            <div className="h-44 bg-slate-900 relative overflow-hidden">
              {proj.imageUrl && (
                <img src={proj.imageUrl} alt={proj.name} className="w-full h-full object-cover opacity-75" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute bottom-4 left-5 text-white">
                <h3 className="font-black text-lg leading-tight">{proj.name}</h3>
                <p className="text-slate-300 text-xs mt-0.5">{proj.location}</p>
              </div>
              <span className={`absolute top-4 right-4 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                proj.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-white'
              }`}>
                {proj.status}
              </span>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { label: 'Total', value: proj.totalPlots, color: 'text-slate-900' },
                  { label: 'Available', value: proj.availablePlots, color: 'text-emerald-700' },
                  { label: 'Booked', value: proj.tokenBookedPlots + proj.confirmedPlots, color: 'text-orange-600' },
                  { label: 'Sold Out', value: proj.soldPlots, color: 'text-slate-500' },
                ].map(stat => (
                  <div key={stat.label} className="text-center bg-slate-50 rounded-xl py-2.5 border border-slate-100">
                    <div className={`text-base font-black ${stat.color}`}>{stat.value}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{stat.label}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mb-4 px-1">
                <span className="text-xs text-slate-400 font-medium">Estimated Project Value</span>
                <span className="font-black text-slate-900 text-sm">{formatCurrency(proj.totalValue)}</span>
              </div>
              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => navigate('/admin/plot-layout')}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-sky-500 text-white rounded-xl text-xs font-black hover:from-blue-700 hover:to-sky-600 transition-all uppercase tracking-wider flex-1 shadow-sm"
                >
                  <Map size={14} />
                  View Layout
                </button>
                <button
                  onClick={() => navigate('/admin/plots')}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors flex-1"
                >
                  <Eye size={14} />
                  Plots List
                </button>
                <button
                  onClick={() => setShowCreate(true)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  <Upload size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Project Modal */}
      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setCreateStep('form'); }} title="Create New Project" size="lg">
        {createStep === 'form' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3.5">
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">Project Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-sky-500 outline-none" placeholder="e.g. Seven Circle Palms" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Project Code</label>
                <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-sky-500 outline-none" placeholder="SCP-2026" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Location</label>
                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-sky-500 outline-none" placeholder="Chennai, Tamil Nadu" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Total Land Area</label>
                <input value={form.totalArea} onChange={e => setForm(f => ({ ...f, totalArea: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-sky-500 outline-none" placeholder="12.5 Acres" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-sky-500 outline-none h-18 resize-none" placeholder="Project description..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => { setShowCreate(false); }} className="px-4 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
              <button onClick={() => setCreateStep('upload')} className="px-5 py-2.5 text-xs text-white bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 rounded-xl font-black uppercase tracking-wider shadow-sm">
                Next: Upload Layout & Data →
              </button>
            </div>
          </div>
        )}

        {createStep === 'upload' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              {['Plot Layout Diagram (PDF / Image)', 'Plot Excel Data (.xlsx / .csv)'].map(label => (
                <div key={label}>
                  <label className="text-xs font-bold text-slate-700 block mb-2">{label}</label>
                  <div
                    className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center cursor-pointer hover:border-sky-400 hover:bg-sky-50/30 transition-colors"
                    onClick={() => label.includes('Excel') && setCreateStep('preview')}
                  >
                    <Upload size={24} className="text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700">Drag & Drop or Click to Select</p>
                    <p className="text-[10px] text-slate-400 mt-1">{label.includes('Excel') ? 'Excel file containing plot details' : 'Master plan diagram'}</p>
                    {label.includes('Excel') && (
                      <p className="text-xs text-blue-600 font-bold mt-2.5 underline">Simulate Upload & Parse Data →</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-2">
              <button onClick={() => setCreateStep('form')} className="px-4 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50">← Back</button>
            </div>
          </div>
        )}

        {createStep === 'preview' && (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-800 font-black text-lg">
                40
              </div>
              <div>
                <div className="font-black text-emerald-950 text-xs">40 Plots Successfully Detected</div>
                <div className="text-[11px] text-emerald-800 font-medium">38 rows fully validated · 2 notices auto-adjusted</div>
              </div>
            </div>
            <div className="overflow-auto max-h-56 rounded-xl border border-slate-200">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-100">
                  <tr className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                    <th className="text-left px-3.5 py-2">Plot No</th>
                    <th className="text-right px-3.5 py-2">Area</th>
                    <th className="text-left px-3.5 py-2">Facing</th>
                    <th className="text-right px-3.5 py-2">Price</th>
                    <th className="text-left px-3.5 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {Array.from({ length: 8 }, (_, i) => (
                    <tr key={i}>
                      <td className="px-3.5 py-2 font-black text-slate-900">P-{String(i + 1).padStart(3, '0')}</td>
                      <td className="px-3.5 py-2 text-right text-slate-600 font-medium">{1200 + i * 100} sq.ft</td>
                      <td className="px-3.5 py-2 text-slate-600">North</td>
                      <td className="px-3.5 py-2 text-right font-bold text-emerald-800">₹{(25 + i * 0.5).toFixed(1)}L</td>
                      <td className="px-3.5 py-2 text-emerald-700 font-bold">Available</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setCreateStep('upload')} className="px-4 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50">← Back</button>
              <button onClick={handleImport} className="px-6 py-2.5 text-xs text-white bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 rounded-xl font-black uppercase tracking-wider shadow-sm">
                Import 40 Plots to Master Plan →
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
