import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Plot } from '../types';
import { mockPlots, mockSurveyPlots } from '../data/mockPlots';
import { mockTownshipPlots } from '../data/mockTownshipPlots';
import { addDays, format } from 'date-fns';

interface PlotState {
  plots: Plot[];
  blueprintImage: string | null;
  blueprintPreset: 'township_184' | 'greens_16' | 'custom';
  projectName: string;
  projectLocation: string;
  tokenRequired: number;
  ratePerSqft: number;
  layoutMode: 'blueprint' | 'grid';
  setBlueprintPreset: (preset: 'township_184' | 'greens_16' | 'custom') => void;
  setBlueprintImage: (url: string | null) => void;
  setPlots: (plots: Plot[]) => void;
  setLayoutMode: (mode: 'blueprint' | 'grid') => void;
  updatePlotStatus: (plotId: string, updates: Partial<Plot>) => void;
  markAsSold: (plotId: string) => void;
  releaseTokenExpired: (plotId: string) => void;
  releaseConfirmedExpired: (plotId: string) => void;
  resetPlots: () => void;
  useTownshipDataset: () => void;
  useSurveyDataset: () => void;
  useDefaultGridDataset: () => void;
  startBooking: (plotId: string, bookingData: Partial<Plot>) => void;
  confirmBooking: (plotId: string, bookingData: Partial<Plot>) => void;
}

export const usePlotStore = create<PlotState>()(
  persist(
    (set, get) => ({
      plots: mockSurveyPlots,
      blueprintImage: '/blueprint.png',
      blueprintPreset: 'greens_16',
      projectName: 'SCP Farm Layout',
      projectLocation: 'Main Township, Hyderabad',
      tokenRequired: 100000,
      ratePerSqft: 2500,
      layoutMode: 'blueprint',
      setBlueprintPreset: (preset) => set({ blueprintPreset: preset }),
      setBlueprintImage: (url) => set({ blueprintImage: url || '/blueprint.png', blueprintPreset: 'custom' }),
      setPlots: (plots) => set({ plots }),
      setLayoutMode: (mode) => set({ layoutMode: mode }),
      useTownshipDataset: () =>
        set({
          plots: mockTownshipPlots,
          blueprintPreset: 'township_184',
          layoutMode: 'blueprint',
          projectName: 'Green Valley Township (184 Plots)',
          projectLocation: 'Main Highway Layout, Hyderabad',
          tokenRequired: 100000,
          ratePerSqft: 2500,
        }),
      useSurveyDataset: () =>
        set({
          plots: mockSurveyPlots,
          blueprintPreset: 'greens_16',
          layoutMode: 'blueprint',
          projectName: 'SCP Farm Layout',
          tokenRequired: 100000,
          ratePerSqft: 2500,
          blueprintImage: '/blueprint.png',
        }),
      useDefaultGridDataset: () =>
        set({
          plots: mockPlots,
          blueprintPreset: 'custom',
          layoutMode: 'grid',
          projectName: 'Green Valley Enclave',
          tokenRequired: 20000,
          ratePerSqft: 2500,
        }),
      updatePlotStatus: (plotId, updates) =>
        set((state) => ({
          plots: state.plots.map((p) => (p.id === plotId ? { ...p, ...updates } : p)),
        })),
      startBooking: (plotId, bookingData) =>
        set((state) => ({
          plots: state.plots.map((p) =>
            p.id === plotId
              ? {
                ...p,
                status: 'token_booked',
                tokenExpiry: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
                tokenDate: format(new Date(), 'yyyy-MM-dd'),
                ...bookingData,
              }
              : p
          ),
        })),
      confirmBooking: (plotId, bookingData) =>
        set((state) => ({
          plots: state.plots.map((p) =>
            p.id === plotId
              ? {
                ...p,
                status: 'confirmed',
                confirmedDate: format(new Date(), 'yyyy-MM-dd'),
                paymentDeadline: format(addDays(new Date(), 90), 'yyyy-MM-dd'),
                bookingDate: format(new Date(), 'yyyy-MM-dd'),
                ...bookingData,
              }
              : p
          ),
        })),
      markAsSold: (plotId) =>
        set((state) => ({
          plots: state.plots.map((p) =>
            p.id === plotId
              ? { ...p, status: 'sold', soldDate: format(new Date(), 'yyyy-MM-dd') }
              : p
          ),
        })),
      releaseTokenExpired: (plotId) =>
        set((state) => ({
          plots: state.plots.map((p) =>
            p.id === plotId
              ? {
                ...p,
                status: 'available',
                bookingId: undefined,
                customerId: undefined,
                customerName: undefined,
                channelPartnerId: undefined,
                channelPartnerName: undefined,
                tokenAmount: undefined,
                tokenDate: undefined,
                tokenExpiry: undefined,
                totalPaid: undefined,
                balanceDue: undefined,
              }
              : p
          ),
        })),
      releaseConfirmedExpired: (plotId) =>
        set((state) => ({
          plots: state.plots.map((p) =>
            p.id === plotId
              ? {
                ...p,
                status: 'available',
                bookingId: undefined,
                customerId: undefined,
                customerName: undefined,
                channelPartnerId: undefined,
                channelPartnerName: undefined,
                tokenAmount: undefined,
                tokenDate: undefined,
                tokenExpiry: undefined,
                bookingDate: undefined,
                confirmedDate: undefined,
                paymentDeadline: undefined,
                totalPaid: undefined,
                balanceDue: undefined,
              }
              : p
          ),
        })),
      resetPlots: () => set({ plots: mockSurveyPlots, blueprintImage: '/blueprint.png' }),
    }),
    { name: 'plot-store-v3' }
  )
);
