/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { Logo } from './Logo';
import { 
  Bell, 
  Bluetooth, 
  ArrowLeft,
  ShoppingCart,
  Volume2
} from 'lucide-react';
import { NotificationDrawer } from './NotificationDrawer';
import { VoiceAlertSettingsModal } from './Notifications/VoiceAlertSettingsModal';
import { BluetoothPrinterModal } from './POS/BluetoothPrinterModal';
import { formatRupiah } from '../utils/format';

interface HeaderProps {
  appMode: 'pos' | 'management';
  onBackToWelcome: () => void;
  onSwitchMode: (mode: 'pos' | 'management') => void;
  activeManagementTab: string;
  setActiveManagementTab: (tab: string) => void;
  onOpenShiftModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  appMode, 
  onBackToWelcome, 
  onSwitchMode, 
  activeManagementTab, 
  setActiveManagementTab, 
  onOpenShiftModal 
}) => {
  const { 
    currentUser, 
    bluetoothStatus, 
    unreadNotificationsCount,
    lowStockProducts,
    outOfStockProducts,
    currentShift,
    cart,
    cartTotal,
    activePosTab,
    setActivePosTab,
    isVoiceSettingsModalOpen,
    setIsVoiceSettingsModalOpen,
    voiceSettings,
  } = usePOS();

  const totalCartCount = cart.reduce((acc, item) => acc + item.qty, 0);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isBluetoothModalOpen, setIsBluetoothModalOpen] = useState(false);

  const totalStockAlerts = lowStockProducts.length + outOfStockProducts.length;

  // Navigasi Mode Kelola Toko
  const managementNavLinks = [
    { id: 'inventory', label: 'Stok Barang' },
    { id: 'sales_recap', label: 'Rekap Penjualan' },
    { id: 'customers', label: 'Pelanggan Setia' },
    { id: 'shopee', label: 'Shopee Sync' },
    { id: 'backup', label: 'Cadangan & Keamanan' },
  ];

  return (
    <>
      <header className={`sticky top-0 z-40 backdrop-blur-md transition-colors text-black border-b ${
        appMode === 'pos' 
          ? 'bg-white/90 border-[#FCE4E8] shadow-2xs' 
          : 'bg-[#FFF0F3]/95 border-[#FCE4E8]'
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-13 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Zona Kiri: Tombol Back ke Welcoming Page (Tanpa Logo & Tanpa Teks POS/Toko di Mode Kasir) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={onBackToWelcome}
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-black hover:text-[#800020] hover:bg-[#FCE8EB] transition-colors cursor-pointer flex items-center gap-1.5"
              title="Kembali ke Layar Awal"
            >
              <ArrowLeft className="w-4 h-4 text-[#800020]" />
              <span className="text-xs font-bold hidden sm:inline">Menu Awal</span>
            </button>

            {/* Logo hanya ditampilkan jika di Mode Kelola Toko */}
            {appMode === 'management' && (
              <div onClick={onBackToWelcome} className="cursor-pointer">
                <Logo size="sm" />
              </div>
            )}
          </div>

          {/* Zona Tengah: Status Kasir Berisi Nama Kasir Saja (Mode Kasir POS) atau Tab Navigasi (Mode Kelola Toko) */}
          <div className="flex-1 flex justify-center px-1">
            {appMode === 'pos' ? (
              /* Status Kasir: Yang isinya Nama Kasir Saja */
              <div 
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#FCE4E8] text-xs font-bold text-black shadow-2xs select-none"
                title={`Kasir: ${currentUser.name}`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                <span className="truncate max-w-[150px] sm:max-w-[240px] font-bold">
                  {currentUser.name}
                </span>
              </div>
            ) : (
              <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-stone-700">
                {managementNavLinks.map((link) => {
                  const isActive = 
                    activeManagementTab === link.id || 
                    (link.id === 'sales_recap' && (activeManagementTab === 'reports' || activeManagementTab === 'shift_recap'));
                  
                  return (
                    <button
                      key={link.id}
                      type="button"
                      onClick={() => setActiveManagementTab(link.id)}
                      className={`py-1 text-xs whitespace-nowrap transition-colors relative cursor-pointer ${
                        isActive
                          ? 'text-[#800020] font-black'
                          : 'hover:text-black font-semibold'
                      }`}
                    >
                      {link.label}
                      {link.id === 'inventory' && totalStockAlerts > 0 && (
                        <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.2 text-[9px] font-bold text-white bg-[#800020] rounded-full">
                          {totalStockAlerts}
                        </span>
                      )}
                      {isActive && (
                        <span className="absolute bottom-[-20px] left-0 right-0 h-0.5 bg-[#800020] rounded-full" />
                      )}
                    </button>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Zona Kanan: Keranjang (Tanpa Teks Jumlah Pelanggan), Shift, Bluetooth Printer, Suara Notifikasi, Lonceng */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Tombol Halaman Khusus Keranjang di Header (Mode Kasir POS) */}
            {appMode === 'pos' && (
              <button
                type="button"
                onClick={() => setActivePosTab(activePosTab === 'cart' ? 'catalog' : 'cart')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer relative ${
                  activePosTab === 'cart'
                    ? 'bg-[#800020] text-white border-[#800020] shadow-sm'
                    : 'bg-[#FCE8EB] text-[#800020] border-[#F8CCD4] hover:bg-[#F8CCD4]'
                }`}
                title="Buka Keranjang Belanja"
                aria-label="Keranjang Belanja"
              >
                <div className="relative">
                  <ShoppingCart className="w-4 h-4" />
                  {totalCartCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-3.5 h-3.5 px-0.5 bg-white text-[#800020] border border-[#800020] rounded-full text-[8px] font-black flex items-center justify-center shadow-2xs">
                      {totalCartCount > 99 ? '99+' : totalCartCount}
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline font-mono">
                  {totalCartCount > 0 ? formatRupiah(cartTotal) : 'Keranjang'}
                </span>
              </button>
            )}

            {/* Shift Status (Saldo Laci) */}
            <button
              type="button"
              onClick={onOpenShiftModal}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-bold rounded-xl border border-[#FCE4E8] bg-white text-black hover:bg-[#FCE8EB] transition-colors cursor-pointer"
              title="Status Shift Kasir"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${currentShift?.isOpen ? 'bg-emerald-600' : 'bg-[#800020]'}`} />
              <span className="hidden sm:inline whitespace-nowrap">{currentShift?.isOpen ? 'Shift Aktif' : 'Buka Shift'}</span>
              <span className="sm:hidden text-[10px] font-bold">{currentShift?.isOpen ? 'Shift' : 'Buka'}</span>
            </button>

            {/* Bluetooth Thermal Printer (Diperbaiki & Terhubung ke Modal Pengaturan) */}
            <button
              type="button"
              onClick={() => setIsBluetoothModalOpen(true)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer relative ${
                bluetoothStatus.isConnected
                  ? 'border-[#F8CCD4] bg-[#FCE8EB] text-[#800020] hover:bg-[#F8CCD4]'
                  : 'border-[#FCE4E8] bg-white text-stone-700 hover:bg-[#FCE8EB]'
              }`}
              title={bluetoothStatus.isConnected ? `Printer Bluetooth: ${bluetoothStatus.deviceName || 'Terhubung'}` : 'Hubungkan Printer Bluetooth'}
              aria-label="Printer Bluetooth"
            >
              <Bluetooth className="w-4 h-4" />
              {bluetoothStatus.isConnected && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              )}
            </button>

            {/* Tombol Suara Notifikasi Stok Owner */}
            <button
              type="button"
              onClick={() => setIsVoiceSettingsModalOpen(true)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer relative ${
                voiceSettings.enabled
                  ? 'border-[#F8CCD4] bg-[#FCE8EB] text-[#800020] hover:bg-[#F8CCD4]'
                  : 'border-[#FCE4E8] bg-white text-stone-400 hover:bg-[#FCE8EB]'
              }`}
              title={`Pengaturan Suara Notifikasi Stok: ${voiceSettings.enabled ? 'Aktif' : 'Nonaktif'}`}
              aria-label="Pengaturan Suara Notifikasi"
            >
              <Volume2 className="w-4 h-4" />
              {voiceSettings.enabled && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              )}
            </button>

            {/* Logo Lonceng Notifikasi (Tetap Dibiarkan) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 rounded-xl border border-[#FCE4E8] bg-white text-black hover:bg-[#FCE8EB] transition-colors relative cursor-pointer"
                title="Notifikasi"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#800020] text-white rounded-full text-[9px] font-black flex items-center justify-center shadow-2xs">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <NotificationDrawer 
                  onClose={() => setIsNotifOpen(false)} 
                  onNavigateTab={(tab) => {
                    onSwitchMode('management');
                    setActiveManagementTab(tab === 'reports' ? 'sales_recap' : tab);
                    setIsNotifOpen(false);
                  }}
                />
              )}
            </div>

          </div>
        </div>

        {/* Mobile Sub Navigation in Management Mode */}
        {appMode === 'management' && (
          <div className="lg:hidden overflow-x-auto border-t border-[#FCE4E8] px-4 py-2 flex items-center gap-2 scrollbar-none bg-[#FFF0F3]">
            {managementNavLinks.map((link) => {
              const isActive = 
                activeManagementTab === link.id || 
                (link.id === 'sales_recap' && (activeManagementTab === 'reports' || activeManagementTab === 'shift_recap'));
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => setActiveManagementTab(link.id)}
                  className={`px-3 py-1 text-xs font-bold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#800020] text-white shadow-2xs'
                      : 'bg-[#FCE8EB] text-black hover:bg-[#F8CCD4]'
                  }`}
                >
                  {link.label}
                  {link.id === 'inventory' && totalStockAlerts > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.2 text-[9px] font-bold text-white bg-black rounded-full">
                      {totalStockAlerts}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Bluetooth Printer Modal */}
      <BluetoothPrinterModal
        isOpen={isBluetoothModalOpen}
        onClose={() => setIsBluetoothModalOpen(false)}
      />

      {/* Voice Alert Settings Modal for Owner */}
      <VoiceAlertSettingsModal
        isOpen={isVoiceSettingsModalOpen}
        onClose={() => setIsVoiceSettingsModalOpen(false)}
      />
    </>
  );
};
