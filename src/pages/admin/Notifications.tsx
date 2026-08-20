import React from 'react';
import { useNotificationStore } from '../../store/stores';
import { Bell, CheckCircle, AlertCircle, CreditCard, Users, Handshake } from 'lucide-react';

const typeIcon: Record<string, React.ElementType> = {
  new_registration: Handshake,
  token_payment: CreditCard,
  booking_confirmed: CheckCircle,
  token_expiring: AlertCircle,
  booking_expired: AlertCircle,
  balance_pending: AlertCircle,
  plot_sold: CheckCircle,
  customer_created: Users,
  payment_received: CreditCard,
};

export const AdminNotifications: React.FC = () => {
  const { notifications, markRead, markAllRead } = useNotificationStore();

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Notifications</h1>
          <p className="text-slate-500 text-xs font-medium mt-0.5">{notifications.filter(n => !n.isRead).length} unread alerts</p>
        </div>
        <button
          onClick={markAllRead}
          className="text-xs text-amber-600 hover:text-amber-700 font-bold"
        >
          Mark all as read
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {notifications.map(n => {
          const Icon = typeIcon[n.type] || Bell;
          return (
            <div
              key={n.id}
              onClick={() => markRead(n.id)}
              className={`flex gap-4 px-6 py-4 cursor-pointer hover:bg-slate-50 transition-colors ${!n.isRead ? 'bg-amber-50/40' : ''}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                !n.isRead ? 'bg-amber-100 border-amber-200' : 'bg-slate-100 border-slate-200'
              }`}>
                <Icon size={18} className={!n.isRead ? 'text-amber-800' : 'text-slate-400'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-xs font-bold ${!n.isRead ? 'text-slate-950 font-black' : 'text-slate-700'}`}>{n.title}</p>
                  {!n.isRead && <div className="w-2 h-2 bg-amber-500 rounded-full mt-1 flex-shrink-0" />}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">{new Date(n.createdAt).toLocaleString('en-IN')}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
