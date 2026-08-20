import React, { useState } from 'react';
import { Plot } from '../../types';
import { PlotMap } from '../../components/plots/PlotMap';
import { PlotDetailsDrawer } from '../../components/plots/PlotDetailsDrawer';
import { usePlotStore } from '../../store/plotStore';

export const AdminPlotLayout: React.FC = () => {
  const { plots } = usePlotStore();
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Plot Layout</h1>
        <p className="text-slate-400 text-sm mt-0.5">Visual map of all plots — click any plot to view details or start booking</p>
      </div>

      <PlotMap plots={plots} onPlotClick={setSelectedPlot} />

      <PlotDetailsDrawer plot={selectedPlot} onClose={() => setSelectedPlot(null)} />
    </div>
  );
};
