import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Plot } from '../types';
import { mockSurveyPlots } from '../data/mockPlots';
import { mockTownshipPlots } from '../data/mockTownshipPlots';
import { addDays, format, isAfter } from 'date-fns';

interface PlotState {
  plots: Plot[];
  blueprintImage: string | null;
  blueprintPreset: 'township_184' | 'greens_16' | 'custom';
  projectName: string;
  projectLocation: string;
  tokenRequired: number;
  ratePerSqft: number;
  layoutMode: 'blueprint' | 'grid' | 'original';
  setBlueprintPreset: (preset: 'township_184' | 'greens_16' | 'custom') => void;
  setBlueprintImage: (url: string | null) => void;
  setPlots: (plots: Plot[]) => void;
  setLayoutMode: (mode: 'blueprint' | 'grid' | 'original') => void;
  updatePlotStatus: (plotId: string, updates: Partial<Plot>) => void;
  markAsSold: (plotId: string) => void;
  releaseTokenExpired: (plotId: string) => void;
  releaseConfirmedExpired: (plotId: string) => void;
  checkAndReleaseExpiredPlots: () => void;
  resetPlots: () => void;
  useTownshipDataset: () => void;
  useSurveyDataset: () => void;
  startTokenBooking: (plotId: string, bookingData: Partial<Plot>) => void;
  startPartialBooking: (plotId: string, bookingData: Partial<Plot>) => void;
  confirmFullBooking: (plotId: string, bookingData: Partial<Plot>) => void;
}

export const usePlotStore = create<PlotState>()(
  persist(
    (set, get) => ({
      plots: mockTownshipPlots,
      blueprintImage: '/blueprint.png',
      blueprintPreset: 'township_184',
      projectName: 'SCP Farm Layout (184 Plots)',
      projectLocation: 'Main Highway Layout, Hyderabad',
      tokenRequired: 20000,
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
          projectName: 'SCP Farm Layout (184 Plots)',
          projectLocation: 'Main Highway Layout, Hyderabad',
          tokenRequired: 20000,
          ratePerSqft: 2500,
        }),

      useSurveyDataset: () =>
        set({
          plots: mockSurveyPlots,
          blueprintPreset: 'greens_16',
          layoutMode: 'blueprint',
          projectName: 'SCP Farm Layout',
          tokenRequired: 20000,
          ratePerSqft: 2500,
          blueprintImage: '/blueprint.png',
        }),

      updatePlotStatus: (plotId, updates) =>
        set((state) => ({
          plots: state.plots.map((p) => (p.id === plotId ? { ...p, ...updates } : p)),
        })),

      // 1. TOKEN ADVANCE: Yellow status, 7 days validity
      startTokenBooking: (plotId, bookingData) => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const expiry = format(addDays(new Date(), 7), 'yyyy-MM-dd');
        set((state) => ({
          plots: state.plots.map((p) =>
            p.id === plotId
              ? {
                  ...p,
                  status: 'token_booked',
                  tokenDate: today,
                  tokenExpiry: expiry,
                  totalPaid: bookingData.tokenAmount || 20000,
                  balanceDue: Math.max(0, p.totalPrice - (bookingData.tokenAmount || 20000)),
                  ...bookingData,
                }
              : p
          ),
        }));
      },

      // 2. PARTIAL PAYMENT: Orange status, >= 50% paid, 90 days due date
      startPartialBooking: (plotId, bookingData) => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const deadline = format(addDays(new Date(), 90), 'yyyy-MM-dd');
        set((state) => ({
          plots: state.plots.map((p) =>
            p.id === plotId
              ? {
                  ...p,
                  status: 'partial_booked',
                  bookingDate: today,
                  confirmedDate: today,
                  paymentDeadline: deadline,
                  balanceDue: Math.max(0, p.totalPrice - (bookingData.totalPaid || p.totalPrice * 0.5)),
                  ...bookingData,
                }
              : p
          ),
        }));
      },

      // 3. FULL PAYMENT: Red status (sold), 100% paid
      confirmFullBooking: (plotId, bookingData) => {
        const today = format(new Date(), 'yyyy-MM-dd');
        set((state) => ({
          plots: state.plots.map((p) =>
            p.id === plotId
              ? {
                  ...p,
                  status: 'sold',
                  soldDate: today,
                  bookingDate: today,
                  totalPaid: p.totalPrice,
                  balanceDue: 0,
                  tokenExpiry: undefined,
                  paymentDeadline: undefined,
                  ...bookingData,
                }
              : p
          ),
        }));
      },

      markAsSold: (plotId) =>
        set((state) => ({
          plots: state.plots.map((p) =>
            p.id === plotId
              ? { ...p, status: 'sold', soldDate: format(new Date(), 'yyyy-MM-dd'), totalPaid: p.totalPrice, balanceDue: 0 }
              : p
          ),
        })),

      // Release expired 7-day token holds and 90-day partials back to Green (Available)
      checkAndReleaseExpiredPlots: () => {
        const now = new Date();
        set((state) => ({
          plots: state.plots.map((p) => {
            if (p.status === 'token_booked' && p.tokenExpiry) {
              const expiryDate = new Date(p.tokenExpiry);
              if (isAfter(now, expiryDate)) {
                return {
                  ...p,
                  status: 'available',
                  tokenAmount: undefined,
                  tokenDate: undefined,
                  tokenExpiry: undefined,
                  totalPaid: undefined,
                  balanceDue: undefined,
                };
              }
            }
            if (p.status === 'partial_booked' && p.paymentDeadline) {
              const deadlineDate = new Date(p.paymentDeadline);
              if (isAfter(now, deadlineDate)) {
                return {
                  ...p,
                  status: 'available',
                  bookingDate: undefined,
                  paymentDeadline: undefined,
                  totalPaid: undefined,
                  balanceDue: undefined,
                };
              }
            }
            return p;
          }),
        }));
      },

      releaseTokenExpired: (plotId) =>
        set((state) => ({
          plots: state.plots.map((p) =>
            p.id === plotId
              ? {
                  ...p,
                  status: 'available',
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
                  bookingDate: undefined,
                  paymentDeadline: undefined,
                  totalPaid: undefined,
                  balanceDue: undefined,
                }
              : p
          ),
        })),

      resetPlots: () => set({ plots: mockTownshipPlots }),
    }),
    {
      name: 'scp-plot-storage',
    }
  )
);
