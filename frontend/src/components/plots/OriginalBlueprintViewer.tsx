import React, { useState, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Download,
  FileText,
  Layers,
  Sparkles,
  Info,
  CheckCircle,
  Eye,
} from 'lucide-react';
import { usePlotStore } from '../../store/plotStore';

export const OriginalBlueprintViewer: React.FC = () => {
  const { blueprintImage, projectName, plots } = usePlotStore();
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const docUrl = blueprintImage || '/blueprint.png';
  const isPdf = docUrl.toLowerCase().includes('.pdf') || docUrl.startsWith('data:application/pdf');

  const handleZoomIn = () => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)));
  const handleZoomOut = () => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)));
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPdf) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isPdf) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = docUrl;
    a.download = isPdf ? 'scp_cad_blueprint_master.pdf' : 'scp_cad_blueprint_master.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      ref={containerRef}
      className={`bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'min-h-[700px]'
      }`}
    >
      {/* ── TOOLBAR HEADER ── */}
      <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-white z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-sky-400 border border-sky-400/30 flex items-center justify-center font-black">
            <FileText size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm text-white tracking-wide">
                Original Architectural Blueprint Document
              </h3>
              <span className="text-[10px] font-black uppercase tracking-wider bg-sky-950 text-sky-300 px-2 py-0.5 rounded border border-sky-800">
                {isPdf ? 'PDF Vector' : 'High-Res CAD'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {projectName} · {plots.length} Units · Master Cadastral Survey Drawing
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {!isPdf && (
            <>
              {/* Zoom & Reset Controls */}
              <div className="flex items-center bg-slate-800/80 rounded-xl border border-slate-700/60 p-0.5">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut size={15} />
                </button>
                <span className="text-[11px] font-mono font-bold px-2 text-slate-200 min-w-[50px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn size={15} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleRotate}
                className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700/60 transition-colors text-xs font-bold flex items-center gap-1.5"
                title="Rotate 90°"
              >
                <RotateCcw size={14} />
                <span className="hidden sm:inline">Rotate</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700/60 transition-colors text-xs font-bold"
                title="Reset View"
              >
                Reset
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-900/30"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Download Blueprint</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen((f) => !f)}
            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700/60 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen View'}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* ── KEY CADASTRAL HIGHLIGHTS BANNER ── */}
      <div className="bg-slate-900/60 border-b border-slate-800/50 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5 text-slate-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-sky-400"></span>
            <b>Suramriver Boundary:</b> Plots 153 to 169 (Natural Contour)
          </span>
          <span className="flex items-center gap-1.5 text-slate-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <b>Corner Wedge:</b> Plot 184 & Plot 183 (Village Road Entrance)
          </span>
          <span className="flex items-center gap-1.5 text-slate-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <b>Internal Roads:</b> 20ft Arterial & 16ft Boundary Roads
          </span>
        </div>
        <span className="text-slate-500 text-[10px]">
          Click & Drag to pan · Scroll to zoom
        </span>
      </div>

      {/* ── DOCUMENT VIEWPORT ── */}
      <div
        className="flex-1 bg-slate-950 relative overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing p-4 min-h-[580px]"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Blueprint Grid Background Motif */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {isPdf ? (
          /* PDF Viewer Object / IFrame */
          <div className="w-full h-full min-h-[600px] flex flex-col items-center justify-center z-10">
            <object
              data={docUrl}
              type="application/pdf"
              className="w-full h-full min-h-[600px] rounded-xl border border-slate-800 bg-white"
            >
              <div className="text-center p-8 text-white space-y-4">
                <FileText size={48} className="mx-auto text-sky-400" />
                <h4 className="text-lg font-bold">PDF Blueprint Document</h4>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  Your browser is displaying the architectural drawing. You can open or download the PDF file directly below.
                </p>
                <a
                  href={docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold"
                >
                  <Eye size={16} /> Open PDF Document in New Tab
                </a>
              </div>
            </object>
          </div>
        ) : (
          /* High-Res Architectural Drawing Image with Pan/Zoom/Rotation */
          <div
            className="transition-transform duration-75 select-none"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
            }}
          >
            <img
              src={docUrl}
              alt="Original CAD Blueprint"
              className="max-w-none max-h-[82vh] rounded-lg shadow-2xl border border-slate-800 pointer-events-none"
              draggable={false}
            />
          </div>
        )}
      </div>
    </div>
  );
};
