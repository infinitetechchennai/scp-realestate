import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layout
import { AppLayout } from './components/layout/AppLayout';

// Auth
import { LoginPage } from './pages/Login';

// Auth Guard
import { useAuthStore } from './store/authStore';

// Admin Pages
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminPlotLayout } from './pages/admin/PlotLayout';
import { PlotManagement } from './pages/admin/PlotManagement';
import { AdminBookings } from './pages/admin/Bookings';
import { AdminCustomers } from './pages/admin/Customers';
import { AdminChannelPartners } from './pages/admin/ChannelPartners';
import { AdminPayments } from './pages/admin/Payments';
import { AdminProjects } from './pages/admin/Projects';
import { AdminNotifications } from './pages/admin/Notifications';
import { AuditLogs } from './pages/admin/AuditLogs';
import { AdminSettings } from './pages/admin/Settings';
import { AdminReports } from './pages/admin/Reports';
import { AdminDocuments } from './pages/admin/Documents';

// Channel Partner Pages
import { ChannelDashboard } from './pages/channel/Dashboard';
import {
  ChannelPlots, ChannelProjects, ChannelCustomers,
  ChannelBookings, ChannelPayments, ChannelCommission,
  ChannelProfile, ChannelDocuments
} from './pages/channel/ChannelPages';

// Customer Pages
import {
  CustomerDashboard, CustomerPlots, CustomerProjects,
  CustomerBookings, CustomerPayments, CustomerDocuments,
  CustomerNotifications, CustomerProfile
} from './pages/customer/CustomerPages';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children, allowedRoles
}) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard
    if (user.role === 'super_admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'channel_partner') return <Navigate to="/channel/dashboard" replace />;
    return <Navigate to="/customer/dashboard" replace />;
  }
  return <>{children}</>;
};

const RootRedirect: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'super_admin') return <Navigate to="/admin/dashboard" replace />;
  if (user?.role === 'channel_partner') return <Navigate to="/channel/dashboard" replace />;
  return <Navigate to="/customer/dashboard" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { borderRadius: '12px', fontSize: '13px', fontWeight: '600' },
        }}
      />
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="projects" element={<AdminProjects />} />
          <Route path="plots" element={<PlotManagement />} />
          <Route path="plot-layout" element={<AdminPlotLayout />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="channel-partners" element={<AdminChannelPartners />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Channel Partner Routes */}
        <Route path="/channel" element={
          <ProtectedRoute allowedRoles={['channel_partner']}>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ChannelDashboard />} />
          <Route path="projects" element={<ChannelProjects />} />
          <Route path="plots" element={<ChannelPlots />} />
          <Route path="bookings" element={<ChannelBookings />} />
          <Route path="payments" element={<ChannelPayments />} />
          <Route path="documents" element={<ChannelDocuments />} />
          <Route path="profile" element={<ChannelProfile />} />
        </Route>

        {/* Customer Routes */}
        <Route path="/customer" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<CustomerDashboard />} />
          <Route path="projects" element={<CustomerProjects />} />
          <Route path="plots" element={<CustomerPlots />} />
          <Route path="bookings" element={<CustomerBookings />} />
          <Route path="payments" element={<CustomerPayments />} />
          <Route path="documents" element={<CustomerDocuments />} />
          <Route path="profile" element={<CustomerProfile />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
