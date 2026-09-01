import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Search, Menu, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/stores';

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

const routeLabels: Record<string, string[]> = {
  '/admin/dashboard': ['Admin', 'Dashboard'],
  '/admin/projects': ['Admin', 'Projects'],
  '/admin/plots': ['Admin', 'Plot Management'],
  '/admin/plot-layout': ['Admin', 'Plot Layout'],
  '/admin/bookings': ['Admin', 'Bookings'],
  '/admin/customers': ['Admin', 'Customers'],
  '/admin/channel-partners': ['Admin', 'Channel Partners'],
  '/admin/payments': ['Admin', 'Payments'],
  '/admin/reports': ['Admin', 'Reports'],
  '/admin/notifications': ['Admin', 'Notifications'],
  '/admin/audit-logs': ['Admin', 'Audit Logs'],
  '/admin/settings': ['Admin', 'Settings'],
  '/channel/dashboard': ['Channel Partner', 'Dashboard'],
  '/channel/projects': ['Channel Partner', 'Projects'],
  '/channel/plots': ['Channel Partner', 'Available Plots'],
  '/channel/bookings': ['Channel Partner', 'My Bookings'],
  '/channel/payments': ['Channel Partner', 'Payments'],
  '/channel/reports': ['Channel Partner', 'Reports'],
  '/channel/profile': ['Channel Partner', 'Profile'],
  '/customer/dashboard': ['Customer', 'Dashboard'],
  '/customer/projects': ['Customer', 'Projects'],
  '/customer/plots': ['Customer', 'Browse Plots'],
  '/customer/bookings': ['Customer', 'My Bookings'],
  '/customer/payments': ['Customer', 'Payments'],
  '/customer/reports': ['Customer', 'Reports'],
  '/customer/documents': ['Customer', 'Documents'],
  '/customer/profile': ['Customer', 'Profile'],
};

export const Header: React.FC<HeaderProps> = ({ onMobileMenuToggle }) => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { notifications, markAllRead, fetchNotifications } = useNotificationStore();
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const unread = notifications.filter(n => !n.isRead);
  const crumbs = routeLabels[location.pathname] || ['Home'];

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 flex items-center px-6 gap-4 sticky top-0 z-20 shadow-xs">
      {/* Mobile menu toggle */}
      <button
        onClick={onMobileMenuToggle}
        className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500">
        {crumbs.map((crumb, i) => (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight size={13} className="text-slate-300" />}
            <span className={i === crumbs.length - 1 ? 'text-blue-900 font-black' : 'text-slate-400 font-medium'}>
              {crumb}
            </span>
          </React.Fragment>
        ))}
      </nav>

      <div className="flex-1" />

      {/* Quick Search */}
      <div className="hidden md:flex items-center gap-2 bg-slate-100/90 border border-slate-200/60 rounded-xl px-3.5 py-2 text-xs text-slate-400 w-56 focus-within:border-sky-500 focus-within:bg-white transition-all">
        <Search size={14} className="text-slate-400" />
        <input
          type="text"
          placeholder="Quick search..."
          className="bg-transparent text-slate-700 text-xs outline-none w-full placeholder:text-slate-400"
        />
      </div>

      {/* Notifications dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowNotif(!showNotif)}
          className="relative p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <Bell size={19} />
          {unread.length > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-gradient-to-r from-blue-600 to-sky-500 text-white text-[10px] rounded-full flex items-center justify-center font-black shadow-xs">
              {unread.length > 9 ? '9+' : unread.length}
            </span>
          )}
        </button>

        {showNotif && (
          <div className="absolute right-0 top-13 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 animate-scale-in overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-slate-50">
              <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">Notifications</span>
              <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-700 font-bold">
                Mark all read
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
              {notifications.slice(0, 8).map(n => (
                <div
                  key={n.id}
                  className={`px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${!n.isRead ? 'bg-sky-50/50' : ''}`}
                >
                  <div className="flex items-start gap-2.5">
                    {!n.isRead && <div className="w-2 h-2 bg-sky-500 rounded-full mt-1.5 flex-shrink-0" />}
                    <div className={!n.isRead ? '' : 'ml-4'}>
                      <p className="text-xs font-bold text-slate-800">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowNotif(false)}
              className="w-full py-2.5 text-xs text-blue-600 hover:bg-sky-50 transition-colors font-bold text-center border-t border-slate-100"
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 text-white flex items-center justify-center text-xs font-black shadow-sm">
          {user?.name?.charAt(0) || 'U'}
        </div>
        <div className="hidden md:block">
          <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
            {user?.name}
          </div>
          <div className="text-[10px] text-slate-400 capitalize">
            {user?.role?.replace('_', ' ')}
          </div>
        </div>
      </div>
    </header>
  );
};
