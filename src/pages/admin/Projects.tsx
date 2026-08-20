import React, { useState, useRef } from 'react';
import { mockProjects } from '../../data/mockData';
import { Modal } from '../../components/ui/UIComponents';
import { Building2, Plus, Eye, Map, Upload, Image as ImageIcon, FileSpreadsheet, CheckCircle, FileUp, Sparkles } from 'lucide-react';
import { formatCurrency, formatCurrencyFull } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';
import { usePlotStore } from '../../store/plotStore';
import { parsePlotCsv } from '../../utils/csvParser';
import { Plot } from '../../types';
import toast from 'react-hot-toast';

export const AdminProjects: React.FC = () => {
  const projects = mockProjects;
  const navigate = useNavigate();
  const { useSurveyDataset, setBlueprintImage, setPlots, setLayoutMode, plots: currentStorePlots } = usePlotStore();
  const [showCreate, setShowCreate] = useState(false);
  const [createStep, setCreateStep] = useState<'form' | 'upload' | 'preview'>('form');
  const [form, setForm] = useState({
    name: 'Greens Ventures',
    code: 'GV-2026',
    location: 'Hyderabad, Telangana',
    description: 'Cadastral Survey Blueprint Layout with 16 exclusive residential plots.',
    totalArea: '4.8 Acres',
  });

  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [uploadedPlots, setUploadedPlots] = useState<Plot[]>([]);
  const [csvFileName, setCsvFileName] = useState<string>('');

  const imageInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Handle Blueprint Image Upload
  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setUploadedImagePreview(result);
        setBlueprintImage(result);
        toast.success(`✓ Blueprint drawing "${file.name}" uploaded!`);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle CSV File Upload
  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const parsed = parsePlotCsv(content, form.name);
        if (parsed.length > 0) {
          setUploadedPlots(parsed);
          setCsvFileName(file.name);
          toast.success(`✓ Detected ${parsed.length} plots from "${file.name}"!`);
          setCreateStep('preview');
        } else {
          toast.error('Could not parse plots from the selected CSV file.');
        }
      };
      reader.readAsText(file);
    }
  };

  // Load default CSV dataset
  const handleLoadDefaultCsv = () => {
    const defaultCsv = `Plot Number,Size SqFt,Price Per SqFt,Status
P-01,1755,2500,Booked
P-02,1285,2500,Available
P-03,1256,2500,Available
P-04,1369,2500,Available
P-05,1416,2500,Available
P-06,1711,2500,Booked
P-07,1372,2500,Booked
P-08,1370,2500,Booked
P-09,1509,2500,Booked
P-10,1506,2500,Booked
P-11,1587,2500,Booked
P-12,1369,2500,Booked
P-13,1374,2500,Available
P-14,1693,2500,Booked
P-15,1627,2500,Booked
P-16,1692,2500,Booked`;

    const parsed = parsePlotCsv(defaultCsv, form.name);
    setUploadedPlots(parsed);
    setCsvFileName('ai_studio_code_updated.csv');
    toast.success(`✓ Loaded 16 plots from ai_studio_code_updated.csv`);
    setCreateStep('preview');
  };

  // Deploy to Master Plan and sync across portals
  const handleDeployAndSync = () => {
    const plotsToSync = uploadedPlots.length > 0 ? uploadedPlots : currentStorePlots;
    setPlots(plotsToSync);
    setLayoutMode('blueprint');
    if (uploadedImagePreview) {
      setBlueprintImage(uploadedImagePreview);
    }
    toast.success(`✓ ${plotsToSync.length} plots successfully deployed & synced across Customer and Channel Partner portals!`);
    setShowCreate(false);
    setCreateStep('form');
    navigate('/admin/plot-layout');
  };

  const previewList = uploadedPlots.length > 0 ? uploadedPlots : currentStorePlots;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Projects</h1>
          <p className="text-slate-500 text-xs font-medium">{projects.length} Active Real Estate Townships & Layouts</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-sm"
        >
          <Plus size={16} />
          Create / Upload Project Layout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((proj) => (
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
              <span
                className={`absolute top-4 right-4 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  proj.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-white'
                }`}
              >
                {proj.status}
              </span>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { label: 'Total', value: proj.id === 'proj-001' ? 16 : proj.totalPlots, color: 'text-slate-900' },
                  { label: 'Available', value: proj.id === 'proj-001' ? 5 : proj.availablePlots, color: 'text-emerald-700' },
                  { label: 'Booked', value: proj.id === 'proj-001' ? 11 : proj.tokenBookedPlots + proj.confirmedPlots, color: 'text-orange-600' },
                  { label: 'Sold Out', value: proj.id === 'proj-001' ? 0 : proj.soldPlots, color: 'text-slate-500' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center bg-slate-50 rounded-xl py-2.5 border border-slate-100">
                    <div className={`text-base font-black ${stat.color}`}>{stat.value}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{stat.label}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mb-4 px-1">
                <span className="text-xs text-slate-400 font-medium">Estimated Project Value</span>
                <span className="font-black text-slate-900 text-sm">
                  {proj.id === 'proj-001' ? '₹6.20 Cr' : formatCurrency(proj.totalValue)}
                </span>
              </div>
              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    useSurveyDataset();
                    setLayoutMode('blueprint');
                    navigate('/admin/plot-layout');
                  }}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500 text-slate-950 rounded-xl text-xs font-black hover:bg-amber-600 transition-colors uppercase tracking-wider flex-1 shadow-2xs"
                >
                  <Map size={14} />
                  View Blueprint Layout
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
                  title="Upload Blueprint or Excel"
                >
                  <Upload size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleImageFile}
        accept="image/*,.pdf,.svg"
        className="hidden"
      />
      <input
        type="file"
        ref={csvInputRef}
        onChange={handleCsvFile}
        accept=".csv,.xlsx,.txt"
        className="hidden"
      />

      {/* Create / Upload Project Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => {
          setShowCreate(false);
          setCreateStep('form');
        }}
        title="Upload & Configure Project Master Plan"
        size="lg"
      >
        {/* STEP 1: Basic Form */}
        {createStep === 'form' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3.5">
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">Project Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-amber-400 outline-none"
                  placeholder="e.g. Greens Ventures"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Project Code</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-amber-400 outline-none"
                  placeholder="GV-2026"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Location</label>
                <input
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-amber-400 outline-none"
                  placeholder="Hyderabad, Telangana"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Total Land Area</label>
                <input
                  value={form.totalArea}
                  onChange={(e) => setForm((f) => ({ ...f, totalArea: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-amber-400 outline-none"
                  placeholder="4.8 Acres"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-amber-400 outline-none h-18 resize-none"
                  placeholder="Project description..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setCreateStep('upload')}
                className="px-5 py-2.5 text-xs text-slate-950 bg-amber-500 hover:bg-amber-600 rounded-xl font-black uppercase tracking-wider shadow-sm"
              >
                Next: Upload Blueprint & Plot CSV →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Upload Blueprint Image & CSV Dataset */}
        {createStep === 'upload' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option A: Upload Blueprint Drawing */}
              <div
                onClick={() => imageInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-colors"
              >
                <ImageIcon size={28} className="text-amber-600 mx-auto mb-2" />
                <p className="text-xs font-black text-slate-800">1. Upload Blueprint Image</p>
                <p className="text-[10px] text-slate-400 mt-1">Select PNG, JPG, or SVG Architectural Drawing</p>
                {uploadedImagePreview ? (
                  <p className="text-xs text-emerald-700 font-bold mt-3">✓ Blueprint Image Loaded</p>
                ) : (
                  <p className="text-xs text-amber-700 font-bold mt-3 underline">Click to choose image file →</p>
                )}
              </div>

              {/* Option B: Upload Plot CSV / Dataset */}
              <div
                onClick={() => csvInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors"
              >
                <FileSpreadsheet size={28} className="text-emerald-700 mx-auto mb-2" />
                <p className="text-xs font-black text-slate-800">2. Upload Plot CSV File</p>
                <p className="text-[10px] text-slate-400 mt-1">ai_studio_code_updated.csv or custom dataset</p>
                <p className="text-xs text-emerald-700 font-bold mt-3 underline">Click to upload .csv file →</p>
              </div>
            </div>

            {/* Quick 1-Click Load Button for ai_studio_code_updated.csv */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">Load Local ai_studio_code_updated.csv</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Auto-populates 16 plots with ₹2,500/sq.ft and status mapping</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLoadDefaultCsv}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-2xs"
              >
                Load Dataset →
              </button>
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setCreateStep('form')}
                className="px-4 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50"
              >
                ← Back
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Preview with Fixed 6 Columns */}
        {createStep === 'preview' && (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-800 font-black text-lg">
                  {previewList.length}
                </div>
                <div>
                  <div className="font-black text-emerald-950 text-xs">
                    {previewList.length} Survey Plots Successfully Validated
                  </div>
                  <div className="text-[11px] text-emerald-800 font-medium">
                    {csvFileName ? `Imported from ${csvFileName}` : 'Greens Ventures layout dataset'}
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-900 bg-emerald-100/70 px-3 py-1 rounded-full border border-emerald-300">
                ✓ Schema Validated
              </span>
            </div>

            {/* Validated Table with Fixed Columns */}
            <div className="overflow-auto max-h-64 rounded-xl border border-slate-200">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-100">
                  <tr className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                    <th className="text-left px-4 py-2.5">PLOT NO</th>
                    <th className="text-right px-4 py-2.5">AREA</th>
                    <th className="text-left px-4 py-2.5">DIMENSIONS</th>
                    <th className="text-right px-4 py-2.5">RATE/SQ.FT</th>
                    <th className="text-right px-4 py-2.5">TOTAL VALUE</th>
                    <th className="text-left px-4 py-2.5">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium">
                  {previewList.map((p) => {
                    const isAvail = p.status === 'available';
                    return (
                      <tr key={p.id || p.plotNumber} className="hover:bg-slate-50/80">
                        <td className="px-4 py-2.5 font-black text-slate-900">{p.plotNumber}</td>
                        <td className="px-4 py-2.5 text-right text-slate-600 font-bold">{p.area} sq.ft</td>
                        <td className="px-4 py-2.5 text-slate-600 font-mono text-[11px]">{p.dimensions || "30'x40'"}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-700">₹{p.pricePerSqft.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-2.5 text-right font-black text-emerald-800">
                          {formatCurrencyFull(p.totalPrice)}
                        </td>
                        <td className="px-4 py-2.5 font-bold">
                          <span
                            className={
                              isAvail
                                ? 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[10px] uppercase font-black'
                                : 'text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md text-[10px] uppercase font-bold'
                            }
                          >
                            {isAvail ? 'Available' : 'Booked'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setCreateStep('upload')}
                className="px-4 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50"
              >
                ← Back
              </button>
              <button
                onClick={handleDeployAndSync}
                className="flex items-center gap-2 px-6 py-2.5 text-xs text-slate-950 bg-amber-500 hover:bg-amber-600 rounded-xl font-black uppercase tracking-wider shadow-sm"
              >
                <CheckCircle size={15} />
                Deploy & Sync Master Plan →
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
