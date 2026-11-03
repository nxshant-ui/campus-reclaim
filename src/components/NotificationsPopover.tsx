import React from 'react';
import { AppNotification } from '../types';
import {
  Bell,
  CheckCheck,
  CheckCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  X,
  AlertCircle,
} from 'lucide-react';

interface NotificationsPopoverProps {
  isOpen: boolean;
  notifications: AppNotification[];
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onSelectNotification?: (notif: AppNotification) => void;
}

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({
  isOpen,
  notifications,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onSelectNotification,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIconForType = (type: AppNotification['type']) => {
    switch (type) {
      case 'claim_approved':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'claim_rejected':
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
      case 'match_found':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      case 'item_recovered':
        return <ShieldCheck className="w-4 h-4 text-indigo-600" />;
      default:
        return <Bell className="w-4 h-4 text-purple-600" />;
    }
  };

  const getBgForType = (type: AppNotification['type']) => {
    switch (type) {
      case 'claim_approved':
        return 'bg-[#D8F5E5] border-[#A7F3D0]';
      case 'claim_rejected':
        return 'bg-[#FFE4EC] border-[#FECDD3]';
      case 'match_found':
        return 'bg-[#FEF3C7] border-[#FDE68A]';
      case 'item_recovered':
        return 'bg-[#E8E2F8] border-[#DDD6FE]';
      default:
        return 'bg-[#EDE9FE] border-[#DDD6FE]';
    }
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
      {/* Header */}
      <div className="p-3.5 bg-gradient-to-r from-[#EDE9FE] via-[#FCE7F3] to-[#FEF3C7] border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white/80 text-[#7C3AED]">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-[#1E293B]">Notifications</h4>
            <p className="text-[10px] text-slate-500">
              {unreadCount > 0 ? `${unreadCount} unread updates` : 'All caught up!'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-[10px] font-bold text-[#6D28D9] hover:underline flex items-center gap-1 bg-white/70 px-2 py-1 rounded-lg"
            >
              <CheckCheck className="w-3 h-3" />
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="py-8 text-center px-4">
            <p className="text-xs text-slate-400 font-medium">No notifications yet</p>
            <p className="text-[11px] text-slate-400 mt-1">
              You will be alerted when claims or matching items are detected.
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                if (!notif.read) onMarkAsRead(notif.id);
                onSelectNotification?.(notif);
              }}
              className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 ${
                notif.read ? 'bg-white hover:bg-slate-50' : 'bg-[#FAF8F5] hover:bg-[#F3E8FF]/20'
              }`}
            >
              <div
                className={`p-2 rounded-xl border shrink-0 ${getBgForType(notif.type)}`}
              >
                {getIconForType(notif.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h5 className="text-xs font-bold text-slate-800 truncate">{notif.title}</h5>
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-[#7C3AED] shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed line-clamp-2">
                  {notif.message}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1.5 font-medium">
                  <Clock className="w-3 h-3" />
                  <span>
                    {new Date(notif.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
