import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Plot } from '../types';
import { mockPlots } from '../data/mockPlots';
import { addDays, format } from 'date-fns';

interface PlotState {
  plots: Plot[];
  updatePlotStatus: (plotId: string, updates: Partial<Plot>) => void;
  markAsSold: (plotId: string) => void;
  releaseTokenExpired: (plotId: string) => void;
  releaseConfirmedExpired: (plotId: string) => void;
  resetPlots: () => void;
  startBooking: (plotId: string, bookingData: Partial<Plot>) => void;
  confirmBooking: (plotId: string, bookingData: Partial<Plot>) => void;
}

export const usePlotStore = create<PlotState>()(
  persist(
    (set, get) => ({
      plots: mockPlots,
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
      resetPlots: () => set({ plots: mockPlots }),
    }),
    { name: 'plot-store' }
  )
);
