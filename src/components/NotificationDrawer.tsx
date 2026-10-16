/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { usePOS } from '../context/POSContext';
import { 
  Bell, 
  AlertTriangle, 
  ShoppingBag, 
  CloudCheck, 
  Info, 
  CheckCheck
} from 'lucide-react';
import { formatDateTime } from '../utils/format';

interface NotificationDrawerProps {
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ onClose, onNavigateTab }) => {
  const { 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    unreadNotificationsCount 
  } = usePOS();

  const getIcon = (type: string) => {
    switch (type) {
      case 'stock_alert':
        return <AlertTriangle className="w-4 h-4 text-[#F43F5E] shrink-0 mt-0.5" />;
      case 'shopee_order':
        return <ShoppingBag className="w-4 h-4 text-[#F43F5E] shrink-0 mt-0.5" />;
      case 'backup':
        return <CloudCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />;
      default:
        return <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />;
    }
  };

  const handleAction = (notif: typeof notifications[0]) => {
    markNotificationAsRead(notif.id);
    if (notif.type === 'stock_alert') {
      onNavigateTab('inventory');
    } else if (notif.type === 'shopee_order') {
      onNavigateTab('shopee');
    } else if (notif.type === 'backup') {
      onNavigateTab('backup');
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-sm sm:w-96 bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-pink-100 dark:border-zinc-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
      <div className="px-4 py-3 bg-pink-50/40 dark:bg-zinc-800/40 border-b border-pink-100 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#F43F5E]" />
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            Pusat Notifikasi ({unreadNotificationsCount})
          </span>
        </div>
        {unreadNotificationsCount > 0 && (
          <button
            onClick={markAllNotificationsAsRead}
            className="text-[11px] font-bold text-[#F43F5E] hover:underline flex items-center gap-1"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Tandai Dibaca
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-pink-50 dark:divide-zinc-800">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Tidak ada notifikasi saat ini
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleAction(notif)}
              className={`p-3.5 text-left transition-colors cursor-pointer flex gap-3 ${
                !notif.read
                  ? 'bg-pink-50/50 dark:bg-pink-950/20 hover:bg-pink-100/50'
                  : 'hover:bg-slate-50 dark:hover:bg-zinc-800/40 opacity-80'
              }`}
            >
              {getIcon(notif.type)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className={`text-xs font-bold truncate ${!notif.read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-zinc-400'}`}>
                    {notif.title}
                  </h4>
                  <span className="text-[9px] text-slate-400 shrink-0 font-mono">
                    {formatDateTime(notif.timestamp).split(',')[1] || 'Baru'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">
                  {notif.message}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-2.5 bg-white dark:bg-zinc-900 border-t border-pink-100 dark:border-zinc-800 text-center">
        <button
          onClick={onClose}
          className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white font-semibold"
        >
          Tutup
        </button>
      </div>
    </div>
  );
};
