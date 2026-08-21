import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Map, BookOpen, Users, Handshake,
  CreditCard, FileBarChart, Bell, FolderOpen, Settings, ClipboardList,
  LogOut, ChevronLeft, ChevronRight, MapPin, X,
  UserCircle, DollarSign,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/stores';
import { cn } from '../../utils/helpers';

interface NavItem {
  label: string;
  icon: React.ElementType;
  to: string;
}

const adminNav: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/admin/dashboard' },
  { label: 'Projects', icon: Building2, to: '/admin/projects' },
  { label: 'Plot Management', icon: MapPin, to: '/admin/plots' },
  { label: 'Plot Layout', icon: Map, to: '/admin/plot-layout' },
  { label: 'Bookings', icon: BookOpen, to: '/admin/bookings' },
  { label: 'Customers', icon: Users, to: '/admin/customers' },
  { label: 'Channel Partners', icon: Handshake, to: '/admin/channel-partners' },
  { label: 'Payments', icon: CreditCard, to: '/admin/payments' },
  { label: 'Reports', icon: FileBarChart, to: '/admin/reports' },
  { label: 'Notifications', icon: Bell, to: '/admin/notifications' },
  { label: 'Audit Logs', icon: ClipboardList, to: '/admin/audit-logs' },
  { label: 'Settings', icon: Settings, to: '/admin/settings' },
];

const channelNav: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/channel/dashboard' },
  { label: 'Projects', icon: Building2, to: '/channel/projects' },
  { label: 'Available Plots', icon: Map, to: '/channel/plots' },
  { label: 'My Bookings', icon: BookOpen, to: '/channel/bookings' },
  { label: 'Payments', icon: CreditCard, to: '/channel/payments' },
  { label: 'Documents', icon: FolderOpen, to: '/channel/documents' },
  { label: 'Profile', icon: UserCircle, to: '/channel/profile' },
];

const customerNav: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/customer/dashboard' },
  { label: 'Projects', icon: Building2, to: '/customer/projects' },
  { label: 'Browse Plots', icon: Map, to: '/customer/plots' },
  { label: 'My Bookings', icon: BookOpen, to: '/customer/bookings' },
  { label: 'Payments', icon: DollarSign, to: '/customer/payments' },
  { label: 'Documents', icon: FolderOpen, to: '/customer/documents' },
  { label: 'Profile', icon: UserCircle, to: '/customer/profile' },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen,
  onMobileClose,
  collapsed: propCollapsed,
  setCollapsed: propSetCollapsed,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = propCollapsed !== undefined ? propCollapsed : internalCollapsed;
  const setCollapsed = propSetCollapsed || setInternalCollapsed;

  const { user, logout } = useAuthStore();
  const { notifications } = useNotificationStore();
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const navItems = user?.role === 'super_admin'
    ? adminNav
    : user?.role === 'channel_partner'
    ? channelNav
    : customerNav;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderSidebarBody = (isMobile = false) => (
    <div className="flex flex-col h-full bg-[#080e1a] relative">
      {/* Logo Banner */}
      {!isMobile && (
        <div className={cn(
          'flex items-center px-4 py-3.5 border-b border-[#131f37] flex-shrink-0',
          collapsed ? 'justify-center' : 'justify-center'
        )}>
          {collapsed ? (
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center p-1 bg-white shadow-md border border-white/20">
              <img src="/logo.jpeg" alt="SCP Logo" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-full bg-white rounded-xl py-1.5 px-3 flex items-center justify-center shadow-md border border-white/30">
              <img src="/logo.jpeg" alt="Seven Circle Property Developers" className="w-full h-8 object-contain" />
            </div>
          )}
        </div>
      )}

      {/* Nav list */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto sidebar-scroll space-y-1">
        {navItems.map((item) => {
          const isNotifItem = item.to.includes('notifications');
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onMobileClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-colors duration-150 group relative',
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold shadow-md shadow-blue-500/25'
                    : 'text-slate-400 hover:bg-[#101b31] hover:text-slate-100'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={18} className={cn('flex-shrink-0 transition-colors', isActive ? 'text-white stroke-[2.5]' : 'text-slate-400 group-hover:text-sky-400')} />
                  {(!collapsed || isMobile) && <span className="truncate">{item.label}</span>}
                  {(!collapsed || isMobile) && isNotifItem && unreadCount > 0 && (
                    <span className={cn(
                      'ml-auto text-[10px] font-black rounded-full px-2 py-0.5 min-w-[20px] text-center leading-tight',
                      isActive ? 'bg-white text-blue-700' : 'bg-sky-500 text-white'
                    )}>
                      {unreadCount}
                    </span>
                  )}
                  {collapsed && !isMobile && (
                    <div className="absolute left-full ml-3 bg-[#0f172a] text-white text-xs px-2.5 py-1 rounded-lg border border-slate-700 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                      {item.label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-[#131f37] p-3 bg-[#060a14] flex-shrink-0">
        {(!collapsed || isMobile) && (
          <div className="flex items-center gap-3 px-2.5 py-2 mb-2 bg-[#0e172a] rounded-xl border border-[#1e293b]">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-sky-500 text-white flex items-center justify-center text-xs font-black flex-shrink-0 shadow-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-slate-200 text-xs font-bold truncate">{user?.name}</div>
              <div className="text-slate-400 text-[10px] truncate capitalize">{user?.role?.replace('_', ' ')}</div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-all duration-150',
            collapsed && !isMobile ? 'justify-center' : ''
          )}
        >
          <LogOut size={16} />
          {(!collapsed || isMobile) && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse toggle button */}
      {!isMobile && (
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center h-7 w-7 absolute -right-3.5 top-16 bg-[#0e172a] border border-[#1e293b] rounded-full text-slate-400 hover:text-sky-400 transition-colors z-40 shadow-md"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col bg-[#080e1a] h-full flex-shrink-0 relative z-30 transition-all duration-200 border-r border-[#131f37]',
          collapsed ? 'w-16' : 'w-56'
        )}
      >
        {renderSidebarBody(false)}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/70 z-40 backdrop-blur-xs"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'lg:hidden fixed left-0 top-0 h-full w-64 bg-[#080e1a] z-50 transition-transform duration-300 border-r border-[#131f37] flex flex-col',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#131f37] flex-shrink-0">
          <div className="bg-white rounded-xl py-1 px-2 flex items-center justify-center shadow-sm w-40">
            <img src="/logo.jpeg" alt="Seven Circle Property Developers" className="w-full h-7 object-contain" />
          </div>
          <button onClick={onMobileClose} className="text-slate-400 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          {renderSidebarBody(true)}
        </div>
      </aside>
    </>
  );
};
