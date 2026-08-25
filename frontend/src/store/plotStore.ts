import { create } from 'zustand';
import { Plot, Project } from '../types';
import { api } from '../services/api';
import { addDays, format, isAfter } from 'date-fns';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

interface PlotState {
  plots: Plot[];
  projects: any[];
  loading: boolean;
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
  fetchPlots: (projectId?: string) => Promise<void>;
  fetchProjects: () => Promise<void>;
  updatePlotStatus: (plotId: string, updates: Partial<Plot>) => Promise<void>;
  markAsSold: (plotId: string) => Promise<void>;
  releaseTokenExpired: (plotId: string) => void;
  releaseConfirmedExpired: (plotId: string) => void;
  checkAndReleaseExpiredPlots: () => void;
  startTokenBooking: (plotId: string, bookingData: Partial<Plot>) => Promise<void>;
  startPartialBooking: (plotId: string, bookingData: Partial<Plot>) => Promise<void>;
  confirmFullBooking: (plotId: string, bookingData: Partial<Plot>) => Promise<void>;
  resetPlots: () => void;
}

export const usePlotStore = create<PlotState>()((set, get) => ({
  plots: [],
  projects: [],
  loading: false,
  blueprintImage: '/blueprint.png',
  blueprintPreset: 'township_184',
  projectName: '',
  projectLocation: '',
  tokenRequired: 10000,
  ratePerSqft: 2500,
  layoutMode: 'blueprint',

  fetchProjects: async () => {
    try {
      const liveProjects = await api.projects.list();
      if (liveProjects && liveProjects.length > 0) {
        set({
          projects: liveProjects,
          projectName: liveProjects[0].name,
          projectLocation: liveProjects[0].location || 'Hyderabad',
        });
      }
    } catch (err) {
      console.warn('Could not fetch live projects from backend:', err);
    }
  },

  fetchPlots: async (projectId?: string) => {
    set({ loading: true });
    try {
      const res = await fetch(`${API_BASE_URL}/plots/`);
      if (res.ok) {
        const dbPlots = await res.json();
        if (Array.isArray(dbPlots) && dbPlots.length > 0) {
          const mappedPlots: Plot[] = dbPlots.map((p: any) => {
            const numericId = parseInt(p.plotNumber?.replace(/\D/g, '') || '1', 10);
            const rowNum = Math.floor((numericId - 1) / 10) + 1;
            const colNum = ((numericId - 1) % 10) + 1;

            return {
              id: String(p.id),
              projectId: String(p.project_id || p.projectId),
              plotNumber: p.plotNumber,
              projectName: '',
              location: p.location || get().projectLocation || '',
              row: rowNum,
              col: colNum,
              area: Number(p.area || p.area_sqft || 1500),
              facing: (p.facing as any) || 'North',
              roadWidth: p.roadWidth || p.road_width_ft || '20 ft',
              dimensions: p.dimensions || '30x50',
              pricePerSqft: Number(p.pricePerSqft || p.price_per_sqft || 2500),
              totalPrice: Number(p.totalPrice || p.total_price || 3750000),
              tokenRequired: Number(p.tokenRequired || p.token_required || 10000),
              status: (p.status as any) || 'available',
              tokenAmount: Number(p.tokenAmount || p.token_amount || 0),
              tokenDate: p.tokenDate || undefined,
              tokenExpiry: p.tokenExpiry || undefined,
              totalPaid: Number(p.amountPaid || p.amount_paid || 0),
              balanceDue: Number(p.balanceAmount || p.balance_amount || 0),
              paymentDeadline: p.balanceDueDate || undefined,
              bookingId: p.bookingId || undefined,
              bookingReference: p.bookingReference || undefined,
              customerId: p.customerId || undefined,
              customerName: p.customerName || undefined,
              customerEmail: p.customerEmail || undefined,
              customerPhone: p.customerPhone || undefined,
              channelPartnerId: p.channelPartnerId || undefined,
              channelPartnerName: p.channelPartnerName || p.partnerName || undefined,
              channelPartnerPhone: p.channelPartnerPhone || undefined,
            } as Plot;
          });

          set({ plots: mappedPlots, loading: false });
          return;
        }
      }
      set({ loading: false });
    } catch (err) {
      console.warn('Could not fetch plots from live PostgreSQL backend:', err);
      set({ loading: false });
    }
  },

  setBlueprintPreset: (preset) => set({ blueprintPreset: preset }),
  setBlueprintImage: (url) => set({ blueprintImage: url || '/blueprint.png', blueprintPreset: 'custom' }),
  setPlots: (plots) => set({ plots }),
  setLayoutMode: (mode) => set({ layoutMode: mode }),

  updatePlotStatus: async (plotId, updates) => {
    set((state) => ({
      plots: state.plots.map((p) => (p.id === plotId ? { ...p, ...updates } : p)),
    }));

    try {
      await api.plots.updateStatus(plotId, {
        status: updates.status || 'available',
        token_amount: updates.tokenAmount,
        token_expiry: updates.tokenExpiry,
        amount_paid: updates.totalPaid,
        balance_amount: updates.balanceDue,
        balance_due_date: updates.paymentDeadline,
        customer_name: updates.customerName,
        channel_partner_name: updates.channelPartnerName,
      });
    } catch (e) {
      console.warn('Could not sync plot status update to DB:', e);
    }
  },

  // 1. TOKEN ADVANCE: Yellow status, 7 days validity
  startTokenBooking: async (plotId, bookingData) => {
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
              totalPaid: bookingData.tokenAmount || p.tokenRequired || 10000,
              balanceDue: Math.max(0, p.totalPrice - (bookingData.tokenAmount || p.tokenRequired || 10000)),
              ...bookingData,
            }
          : p
      ),
    }));

    try {
      await api.plots.updateStatus(plotId, {
        status: 'token_booked',
        token_amount: bookingData.tokenAmount || 10000,
        token_expiry: expiry,
        customer_name: bookingData.customerName,
        channel_partner_name: bookingData.channelPartnerName,
      });
    } catch (e) {
      console.warn('Could not sync token booking to DB:', e);
    }
  },

  // 2. PARTIAL PAYMENT: Orange status, >= 50% paid, 90 days due date
  startPartialBooking: async (plotId, bookingData) => {
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

    try {
      await api.plots.updateStatus(plotId, {
        status: 'partial_booked',
        amount_paid: bookingData.totalPaid,
        balance_amount: Math.max(0, (bookingData.totalPrice || 0) - (bookingData.totalPaid || 0)),
        balance_due_date: deadline,
        customer_name: bookingData.customerName,
        channel_partner_name: bookingData.channelPartnerName,
      });
    } catch (e) {
      console.warn('Could not sync partial booking to DB:', e);
    }
  },

  // 3. FULL PAYMENT: Red status (sold), 100% paid
  confirmFullBooking: async (plotId, bookingData) => {
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

    try {
      await api.plots.updateStatus(plotId, {
        status: 'sold',
        amount_paid: bookingData.totalPrice,
        balance_amount: 0,
        customer_name: bookingData.customerName,
        channel_partner_name: bookingData.channelPartnerName,
      });
    } catch (e) {
      console.warn('Could not sync full booking to DB:', e);
    }
  },

  markAsSold: async (plotId) => {
    set((state) => ({
      plots: state.plots.map((p) =>
        p.id === plotId
          ? { ...p, status: 'sold', soldDate: format(new Date(), 'yyyy-MM-dd'), totalPaid: p.totalPrice, balanceDue: 0 }
          : p
      ),
    }));

    try {
      await api.plots.updateStatus(plotId, { status: 'sold' });
    } catch (e) {
      console.warn('Could not sync markAsSold to DB:', e);
    }
  },

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

  resetPlots: () => set({ plots: [] }),
}));
