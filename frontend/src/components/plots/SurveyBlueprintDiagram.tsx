import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Download, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

interface SurveyBlueprintDiagramProps {
  selectedPlotNumber?: string;
  onSelectPlot?: (plotNumber: string) => void;
  customImage?: string | null;
}

export const SurveyBlueprintDiagram: React.FC<SurveyBlueprintDiagramProps> = ({
  selectedPlotNumber,
  onSelectPlot,
  customImage,
}) => {
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>(customImage || '/blueprint.png');

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 2.5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.75));
  const handleResetZoom = () => setZoom(1);

  const displayUrl = imgSrc.startsWith('data:application/pdf') ? '/blueprint.png' : (imgSrc || '/blueprint.png');

  return (
    <div className="w-full space-y-3">
      {/* Interactive Blueprint Canvas Card */}
      <div className="relative w-full bg-slate-900/5 rounded-2xl border border-slate-200 overflow-hidden min-h-[380px] flex items-center justify-center p-2">
        {/* Floating Controls Bar */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 shadow-sm">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
            title="Reset Zoom"
          >
            <RotateCcw size={16} />
          </button>
          <div className="w-px h-4 bg-slate-200 mx-0.5" />
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-700 transition-colors"
            title="Full Screen Preview"
          >
            <Maximize2 size={16} />
          </button>
          <a
            href="/blueprint.pdf"
            download="SCP_Farm_Layout_Detail_Dimension.pdf"
            className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-700 transition-colors flex items-center gap-1 text-[11px] font-bold px-2"
            title="Download PDF"
          >
            <Download size={15} />
            PDF
          </a>
        </div>

        {/* Blueprint High-Res Drawing */}
        <div className="w-full overflow-auto max-h-[520px] flex items-center justify-center p-4">
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.2s ease',
            }}
            className="inline-block"
          >
            <img
              src={displayUrl}
              alt="SCP Farm Layout Detail Dimension"
              onError={() => setImgSrc('/blueprint.png')}
              className="max-h-[480px] w-auto object-contain rounded-xl shadow-md border border-slate-200 bg-white"
            />
          </div>
        </div>

        {/* Subtitle Banner */}
        <div className="absolute bottom-3 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-black text-slate-800">SCP Farm Layout Detail Dimension (Verified Blueprint)</span>
        </div>
      </div>

      {/* Fullscreen Modal View */}
      {isFullscreen && createPortal(
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col p-4">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl mb-3 text-white">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-sky-400" />
              <span className="font-black text-sm">SCP Farm Layout Detail Dimension 20.08.2026</span>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/blueprint.pdf"
                download="SCP_Farm_Layout_Detail_Dimension.pdf"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                <Download size={14} />
                Download Original PDF
              </a>
              <button
                onClick={() => setIsFullscreen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Close (ESC)
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto flex items-center justify-center p-4">
            <img
              src={displayUrl}
              alt="SCP Farm Layout Detail Dimension Fullscreen"
              className="max-w-full max-h-[88vh] object-contain rounded-xl bg-white p-2 shadow-2xl"
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
