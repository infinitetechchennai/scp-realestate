import React from 'react';
import { cn, getStatusLabel } from '../../utils/helpers';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const statusConfig: Record<string, { classes: string; icon?: React.ReactNode }> = {
  available: { classes: 'text-emerald-700 bg-emerald-50 border border-emerald-200', icon: <CheckCircle size={11} /> },
  token_booked: { classes: 'text-orange-700 bg-orange-50 border border-orange-200', icon: <Clock size={11} /> },
  token_paid: { classes: 'text-orange-700 bg-orange-50 border border-orange-200', icon: <Clock size={11} /> },
  confirmed: { classes: 'text-red-700 bg-red-50 border border-red-200', icon: <AlertCircle size={11} /> },
  sold: { classes: 'text-slate-700 bg-slate-100 border border-slate-300', icon: <XCircle size={11} /> },
  pending: { classes: 'text-amber-800 bg-amber-50 border border-amber-200', icon: <Clock size={11} /> },
  approved: { classes: 'text-emerald-700 bg-emerald-50 border border-emerald-200', icon: <CheckCircle size={11} /> },
  rejected: { classes: 'text-red-700 bg-red-50 border border-red-200', icon: <XCircle size={11} /> },
  suspended: { classes: 'text-amber-700 bg-amber-50 border border-amber-200', icon: <AlertCircle size={11} /> },
  active: { classes: 'text-emerald-700 bg-emerald-50 border border-emerald-200', icon: <CheckCircle size={11} /> },
  inactive: { classes: 'text-slate-600 bg-slate-100 border border-slate-200' },
  completed: { classes: 'text-emerald-700 bg-emerald-50 border border-emerald-200', icon: <CheckCircle size={11} /> },
  cancelled: { classes: 'text-slate-600 bg-slate-100 border border-slate-200', icon: <XCircle size={11} /> },
  expired: { classes: 'text-red-600 bg-red-50 border border-red-200', icon: <AlertCircle size={11} /> },
  verified: { classes: 'text-emerald-700 bg-emerald-50 border border-emerald-200', icon: <CheckCircle size={11} /> },
  pending_verification: { classes: 'text-amber-700 bg-amber-50 border border-amber-200', icon: <Clock size={11} /> },
  uploaded: { classes: 'text-amber-700 bg-amber-50 border border-amber-200' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const config = statusConfig[status] || { classes: 'text-slate-600 bg-slate-100 border border-slate-200' };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-semibold',
        size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3.5 py-1',
        config.classes
      )}
    >
      {config.icon}
      {getStatusLabel(status)}
    </span>
  );
};

// DashboardCard
interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  iconColor?: string;
  trend?: { value: number; label: string };
  onClick?: () => void;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title, value, subtitle, icon: Icon, iconColor = 'text-amber-600',
  trend, onClick
}) => (
  <div
    onClick={onClick}
    className={cn(
      'bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between shadow-xs',
      onClick && 'cursor-pointer hover:shadow-md hover:border-amber-300 transition-all duration-150'
    )}
  >
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-black text-slate-800 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5 font-medium">{subtitle}</p>}
      </div>
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex-shrink-0">
        <Icon size={20} className={iconColor} />
      </div>
    </div>
    {trend && (
      <div className="flex items-center gap-1.5 text-xs pt-2 mt-2 border-t border-slate-100">
        <span className={trend.value >= 0 ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
        </span>
        <span className="text-slate-400 font-medium">{trend.label}</span>
      </div>
    )}
  </div>
);

// Modal
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={onClose} />
      <div className={cn('relative bg-white rounded-2xl shadow-2xl w-full animate-scale-in overflow-hidden border border-slate-100', widths[size])}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-base font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors">
            <XCircle size={20} />
          </button>
        </div>
        <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

// ConfirmationModal
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <div className="space-y-5">
      <div className="text-sm text-slate-600">{message}</div>
      <div className="flex gap-3 justify-end pt-2">
        <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button
          onClick={() => { onConfirm(); onClose(); }}
          className={cn(
            'px-5 py-2 text-xs font-bold text-white rounded-xl transition-colors shadow-sm',
            danger ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black'
          )}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </Modal>
);

// Tabs
interface TabsProps {
  tabs: { id: string; label: string; count?: number }[];
  active: string;
  onChange: (id: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, active, onChange }) => (
  <div className="flex flex-wrap gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200/60 inline-flex">
    {tabs.map(tab => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150',
          active === tab.id
            ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
            : 'text-slate-500 hover:text-slate-800'
        )}
      >
        <span>{tab.label}</span>
        {tab.count !== undefined && (
          <span className={cn(
            'text-[10px] rounded-full px-2 py-0.5 text-center leading-tight font-black',
            active === tab.id ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'
          )}>
            {tab.count}
          </span>
        )}
      </button>
    ))}
  </div>
);

// EmptyState
interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {Icon && (
      <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 border border-amber-100">
        <Icon size={26} className="text-amber-600" />
      </div>
    )}
    <h3 className="text-base font-bold text-slate-800">{title}</h3>
    {description && <p className="text-xs text-slate-500 mt-1 max-w-sm">{description}</p>}
    {action && (
      <button
        onClick={action.onClick}
        className="mt-4 px-5 py-2.5 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl hover:bg-amber-600 transition-colors shadow-sm"
      >
        {action.label}
      </button>
    )}
  </div>
);
