/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { usePOS } from '../context/POSContext';
import { 
  Bell, 
  Package, 
  ShoppingBag, 
  CloudCheck, 
  Info, 
  CheckCheck,
  Volume2,
  PackageCheck
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
    unreadNotificationsCount,
    lowStockProducts,
    outOfStockProducts,
    setIsVoiceSettingsModalOpen,
    voiceSettings
  } = usePOS();

  const getIcon = (type: string) => {
    switch (type) {
      case 'stock_alert':
        return <Package className="w-4 h-4 text-[#800020] shrink-0 mt-0.5" />;
      case 'shopee_order':
        return <ShoppingBag className="w-4 h-4 text-[#800020] shrink-0 mt-0.5" />;
      case 'backup':
        return <CloudCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />;
      default:
        return <Info className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />;
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

  const totalStockAlerts = lowStockProducts.length + outOfStockProducts.length;

  return (
    <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-sm sm:w-96 bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-[#FCE4E8] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 text-black">
      
      {/* Header */}
      <div className="px-4 py-3 bg-[#FFF5F7] border-b border-[#FCE4E8] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#800020]" />
          <span className="text-xs font-black text-black">
            Pusat Notifikasi ({unreadNotificationsCount})
          </span>
        </div>
        {unreadNotificationsCount > 0 && (
          <button
            onClick={markAllNotificationsAsRead}
            className="text-[11px] font-bold text-[#800020] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Tandai Dibaca
          </button>
        )}
      </div>

      {/* Quick Voice Notification Settings Bar for Owner */}
      <div className="px-3.5 py-2.5 bg-[#FFF0F3] border-b border-[#FCE4E8] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-[#800020] text-white flex items-center justify-center shrink-0">
            <Volume2 className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <div className="text-[11px] font-bold text-black flex items-center gap-1.5 truncate">
              <span>Suara Stok Owner:</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                voiceSettings.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
              }`}>
                {voiceSettings.enabled ? 'Aktif' : 'Off'}
              </span>
            </div>
            <div className="text-[10px] text-stone-600 truncate">
              {voiceSettings.soundSource === 'custom_file'
                ? `File: ${voiceSettings.customAudioFileName || 'Audio Pribadi'}`
                : voiceSettings.presetSound === 'speech_id'
                ? 'Bicara Bahasa Indonesia'
                : 'Bel / Nada Toko'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsVoiceSettingsModalOpen(true);
            onClose();
          }}
          className="px-2.5 py-1 text-[11px] font-bold text-white bg-[#800020] hover:bg-[#660019] rounded-xl transition-all shadow-2xs whitespace-nowrap cursor-pointer shrink-0"
        >
          Atur Suara
        </button>
      </div>

      {/* Stock Alert Summary if low or out */}
      {totalStockAlerts > 0 && (
        <div 
          onClick={() => {
            onNavigateTab('inventory');
            onClose();
          }}
          className="px-3.5 py-2 bg-[#FFF0F3] border-b border-[#FCE4E8] flex items-center justify-between cursor-pointer hover:bg-[#FCE8EB] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Package className="w-3.5 h-3.5 text-[#800020] shrink-0" />
            <span className="text-[11px] font-bold text-[#800020]">
              {outOfStockProducts.length > 0 && `${outOfStockProducts.length} Habis • `}
              {lowStockProducts.length} Menipis
            </span>
          </div>
          <span className="text-[10px] font-bold text-[#800020] underline">
            Lihat Stok &rarr;
          </span>
        </div>
      )}

      {/* Notifications List */}
      <div className="max-h-72 overflow-y-auto divide-y divide-[#FCE4E8]">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-600 font-medium">
            Tidak ada notifikasi saat ini
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleAction(notif)}
              className={`p-3.5 text-left transition-colors cursor-pointer flex gap-3 ${
                !notif.read
                  ? 'bg-[#FFF5F7] hover:bg-[#FCE8EB]'
                  : 'hover:bg-[#FFF5F7] opacity-80'
              }`}
            >
              {getIcon(notif.type)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className={`text-xs font-bold truncate ${!notif.read ? 'text-black' : 'text-stone-700'}`}>
                    {notif.title}
                  </h4>
                  <span className="text-[9px] text-stone-500 shrink-0 font-mono">
                    {formatDateTime(notif.timestamp).split(',')[1] || 'Baru'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-700 mt-0.5 line-clamp-2 leading-relaxed font-medium">
                  {notif.message}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-2.5 bg-white border-t border-[#FCE4E8] text-center">
        <button
          onClick={onClose}
          className="text-xs text-black hover:text-[#800020] font-bold cursor-pointer"
        >
          Tutup
        </button>
      </div>
    </div>
  );
};
