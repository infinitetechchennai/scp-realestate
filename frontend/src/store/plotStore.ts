import { create } from 'zustand';
import { Plot, Project } from '../types';
import { api } from '../services/api';
import { addDays, format, isAfter } from 'date-fns';

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
  resetPlots: () => void;
  startTokenBooking: (plotId: string, bookingData: Partial<Plot>) => Promise<void>;
  startPartialBooking: (plotId: string, bookingData: Partial<Plot>) => Promise<void>;
  confirmFullBooking: (plotId: string, bookingData: Partial<Plot>) => Promise<void>;
}

export const usePlotStore = create<PlotState>((set, get) => ({
      plots: [],
      projects: [],
      loading: false,
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
          const dbPlots = await api.plots.list(projectId);
          if (dbPlots && dbPlots.length > 0) {
            const mappedPlots: Plot[] = dbPlots.map((p: any) => {
              const numericId = parseInt(p.plotNumber?.replace(/\D/g, '') || '1', 10);
              const rowNum = Math.floor((numericId - 1) / 12) + 1;
              const colNum = ((numericId - 1) % 12) + 1;

              return {
                id: String(p.id),
                projectId: String(p.projectId),
                plotNumber: p.plotNumber,
                projectName: p.projectName || 'SCP Farm Layout (184 Plots)',
                location: 'Main Highway Layout, Hyderabad',
                row: rowNum,
                col: colNum,
                area: p.area || 1800,
                facing: (p.facing as any) || 'North',
                roadWidth: p.roadWidth || '20 ft',
                dimensions: p.dimensions || '30x50',
                pricePerSqft: p.pricePerSqft || 2500,
                totalPrice: p.totalPrice || 4500000,
                status: (p.status as any) || 'available',
                tokenAmount: p.tokenAmount || 0,
                tokenDate: p.tokenDate || undefined,
                tokenExpiry: p.tokenExpiry || undefined,
                totalPaid: p.amountPaid || 0,
                balanceDue: p.balanceAmount || 0,
                paymentDeadline: p.balanceDueDate || undefined,
                customerId: p.customerId || undefined,
                customerName: p.customerName || undefined,
                channelPartnerId: p.partnerId || undefined,
                channelPartnerName: p.partnerName || undefined,
              } as Plot;
            });

            set({ plots: mappedPlots, loading: false });
          } else {
            set({ loading: false });
          }
        } catch (err) {
          console.warn('Could not fetch plots from live PostgreSQL backend:', err);
          set({ loading: false });
        }
      },

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
                  totalPaid: bookingData.tokenAmount || 20000,
                  balanceDue: Math.max(0, p.totalPrice - (bookingData.tokenAmount || 20000)),
                  ...bookingData,
                }
              : p
          ),
        }));

        try {
          await api.plots.updateStatus(plotId, {
            status: 'token_booked',
            token_amount: bookingData.tokenAmount || 20000,
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
