import React, { useState } from 'react';
import { mockDocuments } from '../../data/mockData';
import { StatusBadge, Tabs } from '../../components/ui/UIComponents';
import { FolderOpen, Download, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminDocuments: React.FC = () => {
  const [tab, setTab] = useState('all');

  const tabs = [
    { id: 'all', label: 'All Documents', count: mockDocuments.length },
    { id: 'customer', label: 'Customer KYC', count: mockDocuments.filter(d => d.type === 'customer').length },
    { id: 'channel_partner', label: 'Partner Docs', count: mockDocuments.filter(d => d.type === 'channel_partner').length },
    { id: 'agreement', label: 'Deeds & Agreements', count: mockDocuments.filter(d => d.type === 'agreement').length },
    { id: 'project', label: 'Project Master Plans', count: mockDocuments.filter(d => d.type === 'project').length },
    { id: 'payment_receipt', label: 'Receipts', count: mockDocuments.filter(d => d.type === 'payment_receipt').length },
  ];

  const filtered = tab === 'all' ? mockDocuments : mockDocuments.filter(d => d.type === tab);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Document Repository</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Manage customer KYC documents, channel partner agreements, deeds, and plans</p>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                <th className="text-left px-6 py-3.5">Document Title</th>
                <th className="text-left px-4 py-3.5">Category</th>
                <th className="text-left px-4 py-3.5">Related Entity</th>
                <th className="text-left px-4 py-3.5">Verification Status</th>
                <th className="text-left px-4 py-3.5">Uploaded Date</th>
                <th className="text-right px-4 py-3.5">File Size</th>
                <th className="text-center px-4 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(doc => (
                <tr key={doc.id} className="table-row-hover">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-200/60">
                        <FolderOpen size={15} className="text-blue-700" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{doc.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{doc.fileType} format</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs font-semibold text-slate-600 capitalize">{doc.type.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-700 font-medium">{doc.relatedName}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={doc.status} /></td>
                  <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">{new Date(doc.uploadedAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3.5 text-right text-slate-500 font-mono">{doc.fileSize}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => toast('Preview not available in demo')}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                        title="Preview"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => toast.success('✓ Download started (demo)')}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                        title="Download"
                      >
                        <Download size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
