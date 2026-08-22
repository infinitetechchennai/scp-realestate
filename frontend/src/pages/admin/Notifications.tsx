import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, CheckCircle, AlertCircle, CreditCard, Users, Handshake, 
  Plus, Send, Tag, Megaphone, Clock, Shield, Sparkles, Filter, 
  RefreshCw, CheckCheck, Search, ChevronDown, UserCheck, X
} from 'lucide-react';
import { Modal, Tabs } from '../../components/ui/UIComponents';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface NotificationItem {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  entity_type?: string;
  entity_id?: string;
  created_at: string;
  target_label?: string;
  recipient_count?: number;
  is_read: boolean;
  read_at?: string;
  recipients_preview?: Array<{
    user_id: string;
    user_name?: string;
    user_email?: string;
    role?: string;
  }>;
}

interface UserOption {
  user_id: string;
  name: string;
  email: string;
  role: string;
  label: string;
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; badge: string; label: string }> = {
  offer: { icon: Sparkles, color: 'text-amber-600 bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-900 border-amber-300', label: 'Special Offer' },
  announcement: { icon: Megaphone, color: 'text-blue-600 bg-blue-50 border-blue-200', badge: 'bg-blue-100 text-blue-900 border-blue-300', label: 'Announcement' },
  reminder: { icon: Clock, color: 'text-orange-600 bg-orange-50 border-orange-200', badge: 'bg-orange-100 text-orange-900 border-orange-300', label: 'Reminder' },
  system: { icon: Shield, color: 'text-purple-600 bg-purple-50 border-purple-200', badge: 'bg-purple-100 text-purple-900 border-purple-300', label: 'System Notice' },
  booking_confirmed: { icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 border-emerald-200', badge: 'bg-emerald-100 text-emerald-900 border-emerald-300', label: 'Booking' },
  payment_received: { icon: CreditCard, color: 'text-emerald-600 bg-emerald-50 border-emerald-200', badge: 'bg-emerald-100 text-emerald-900 border-emerald-300', label: 'Payment' },
  new_registration: { icon: Handshake, color: 'text-indigo-600 bg-indigo-50 border-indigo-200', badge: 'bg-indigo-100 text-indigo-900 border-indigo-300', label: 'Partner' },
};

export const AdminNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Audience dropdown users list
  const [audienceUsers, setAudienceUsers] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Create Form State
  const [form, setForm] = useState({
    title: '',
    message: '',
    notification_type: 'offer',
    target_audience: 'all_channel_partners', // 'broadcast_all' | 'all_channel_partners' | 'all_customers' | 'specific_user'
    target_user_id: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.notifications.list(activeTab);
      setNotifications(data);
    } catch (e: any) {
      console.warn('Notification fetch warning:', e);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const loadAudienceUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await api.notifications.getUsersDropdown();
      setAudienceUsers(data);
    } catch (e) {
      console.warn('Could not load user audience list:', e);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleOpenCreate = () => {
    setShowCreateModal(true);
    loadAudienceUsers();
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Please enter a notification title and message');
      return;
    }

    if (form.target_audience === 'specific_user' && !form.target_user_id) {
      toast.error('Please select a specific recipient user');
      return;
    }

    setSubmitting(true);
    try {
      await api.notifications.create({
        title: form.title.trim(),
        message: form.message.trim(),
        notification_type: form.notification_type,
        target_audience: form.target_audience,
        target_user_id: form.target_audience === 'specific_user' ? form.target_user_id : undefined,
      });

      toast.success('🎉 Notification broadcasted & saved to database!');
      setShowCreateModal(false);
      setForm({
        title: '',
        message: '',
        notification_type: 'offer',
        target_audience: 'all_channel_partners',
        target_user_id: '',
      });
      fetchNotifications();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send notification');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      toast.success('All notifications marked as read');
      fetchNotifications();
    } catch (e) {
      toast.error('Failed to mark notifications as read');
    }
  };

  const tabs = [
    { id: 'all', label: 'All Alerts' },
    { id: 'offer', label: '🎁 Offers & Promos' },
    { id: 'announcement', label: '📢 Announcements' },
    { id: 'reminder', label: '⏰ Reminders' },
    { id: 'system', label: '⚙️ System Notices' },
  ];

  const filteredUsers = audienceUsers.filter(u => 
    !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()) || u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Broadcast & Notifications</h1>
          <p className="text-slate-500 text-xs font-medium mt-0.5">
            Create and send special offers, festive discounts, project launches, and reminders to Channel Partners and Customers
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchNotifications}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 shadow-2xs transition-colors"
            title="Refresh list"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleMarkAllRead}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <CheckCheck size={14} className="text-blue-600" />
            <span>Mark All Read</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Plus size={16} />
            <span>Create & Send Notification</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {/* Notifications Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-slate-400">
            <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span className="text-xs font-medium">Loading notifications from PostgreSQL...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto text-blue-600 border border-blue-100">
              <Megaphone size={26} />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Notifications Sent Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Broadcast special plot discounts, commission bonus alerts, or project updates to your channel partners and buyers.
            </p>
            <button
              onClick={handleOpenCreate}
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors inline-flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Send First Notification</span>
            </button>
          </div>
        ) : (
          notifications.map(n => {
            const config = typeConfig[n.notification_type] || {
              icon: Bell,
              color: 'text-slate-600 bg-slate-50 border-slate-200',
              badge: 'bg-slate-100 text-slate-800 border-slate-200',
              label: 'Alert',
            };
            const Icon = config.icon;

            return (
              <div
                key={n.id}
                className="p-5 hover:bg-slate-50/80 transition-colors flex items-start gap-4"
              >
                {/* Category Icon */}
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 border shadow-2xs ${config.color}`}>
                  <Icon size={20} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${config.badge}`}>
                        {config.label}
                      </span>
                      <h3 className="text-xs font-extrabold text-slate-900 leading-tight">
                        {n.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Recipient Audience Tag */}
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                        <Users size={11} className="text-slate-500" />
                        <span>{n.target_label || 'Everyone'}</span>
                        {n.recipient_count ? ` (${n.recipient_count})` : ''}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(n.created_at).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal whitespace-pre-line bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                    {n.message}
                  </p>

                  {/* Recipient Preview Avatars if specific user or limited */}
                  {n.recipients_preview && n.recipients_preview.length > 0 && (
                    <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-500">
                      <span className="font-bold text-slate-600">Recipients:</span>
                      <div className="flex items-center gap-1 overflow-x-auto">
                        {n.recipients_preview.slice(0, 5).map(r => (
                          <span
                            key={r.user_id}
                            className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded-md text-[10px] text-slate-700 font-medium"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>{r.user_name || r.user_email}</span>
                          </span>
                        ))}
                        {n.recipients_preview.length > 5 && (
                          <span className="text-[10px] text-slate-400 font-bold">
                            +{n.recipients_preview.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* CREATE & BROADCAST NOTIFICATION MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create & Broadcast Notification"
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {/* Notification Category */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Notification Category *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'offer', label: 'Special Offer', icon: Sparkles, desc: 'Promos & Discounts' },
                { id: 'announcement', label: 'Announcement', icon: Megaphone, desc: 'Project news' },
                { id: 'reminder', label: 'Reminder', icon: Clock, desc: 'Payments / Deadlines' },
                { id: 'system', label: 'System Notice', icon: Shield, desc: 'Portal updates' },
              ].map(cat => {
                const CatIcon = cat.icon;
                const active = form.notification_type === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, notification_type: cat.id }))}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      active
                        ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <CatIcon size={15} className={active ? 'text-blue-600' : 'text-slate-400'} />
                      <span className={`text-xs font-black ${active ? 'text-blue-950' : 'text-slate-700'}`}>
                        {cat.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">{cat.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Audience Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Target Audience / Recipient Group *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              {[
                { id: 'all_channel_partners', label: '🤝 All Channel Partners', desc: 'Brokers registered in portal' },
                { id: 'all_customers', label: '👥 All Registered Customers', desc: 'Active plot buyers & leads' },
                { id: 'broadcast_all', label: '📢 Broadcast to Everyone', desc: 'All portal users' },
                { id: 'specific_user', label: '🎯 Specific User', desc: 'Select one partner or customer' },
              ].map(aud => {
                const active = form.target_audience === aud.id;
                return (
                  <button
                    key={aud.id}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, target_audience: aud.id }))}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      active
                        ? 'border-indigo-600 bg-indigo-50/80 font-bold text-indigo-950 ring-1 ring-indigo-500 shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{aud.label}</div>
                      <div className="text-[10px] text-slate-400">{aud.desc}</div>
                    </div>
                    {active && <CheckCircle size={15} className="text-indigo-600 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Specific User Dropdown (if selected) */}
            {form.target_audience === 'specific_user' && (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 animate-in fade-in duration-200">
                <label className="text-xs font-bold text-slate-700 block">
                  Select Recipient User *
                </label>

                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    placeholder="Search user by name, email, or role..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                  />
                </div>

                <div className="max-h-44 overflow-y-auto divide-y divide-slate-100 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  {loadingUsers ? (
                    <div className="p-4 text-center text-xs text-slate-400">Loading user accounts...</div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">No users found matching search</div>
                  ) : (
                    filteredUsers.map(u => (
                      <button
                        key={u.user_id}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, target_user_id: u.user_id }))}
                        className={`w-full p-2.5 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                          form.target_user_id === u.user_id ? 'bg-blue-50/90 font-bold text-blue-900' : 'text-slate-700'
                        }`}
                      >
                        <div>
                          <div className="font-bold">{u.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{u.email}</div>
                        </div>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {u.role}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Notification Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. 🎉 Special Festive Discount: ₹200 OFF per sq.ft on East-Facing Plots"
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Message Content */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Message Body *
            </label>
            <textarea
              rows={4}
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Type your announcement, special offer details, terms, or reminder instructions here..."
              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-blue-500 font-normal leading-relaxed"
              required
            />
            <div className="text-right text-[10px] text-slate-400 mt-0.5">
              {form.message.length} characters
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/25 flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Broadcasting to Database...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Send Notification</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
