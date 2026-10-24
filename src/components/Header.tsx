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
  Camera,
  ArrowLeft,
  Store,
  ShoppingCart
} from 'lucide-react';
import { NotificationDrawer } from './NotificationDrawer';
import { CameraScannerModal } from './Camera/CameraScannerModal';
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
    connectBluetooth,
    unreadNotificationsCount,
    lowStockProducts,
    outOfStockProducts,
    currentShift,
    addToCart,
    cart,
    cartTotal,
    activePosTab,
    setActivePosTab,
    activeCartSession,
    cartSessions
  } = usePOS();

  const totalCartCount = cart.reduce((acc, item) => acc + item.qty, 0);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  const totalStockAlerts = lowStockProducts.length + outOfStockProducts.length;

  // Navigasi Mode Kelola Toko
  const managementNavLinks = [
    { id: 'inventory', label: 'Stok Barang' },
    { id: 'sales_recap', label: 'Rekap Penjualan' },
    { id: 'customers', label: 'Pelanggan Setia' },
    { id: 'shopee', label: 'Shopee Sync' },
    { id: 'backup', label: 'Cloud & Enkripsi' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FFF0F3]/90 backdrop-blur-md border-b border-[#FCE4E8] transition-colors text-black">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-13 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Zone 1: Brand & Back to Mode Menu */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onBackToWelcome}
              className="p-2 rounded-xl text-black hover:text-[#800020] hover:bg-[#FCE8EB] transition-colors cursor-pointer"
              title="Kembali ke Layar Awal [ESC]"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div onClick={onBackToWelcome} className="cursor-pointer">
              <Logo size="sm" />
            </div>

            {/* Mode Indicator Badge (Simbolik) */}
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FCE8EB] text-[#800020] border border-[#F8CCD4]">
              {appMode === 'pos' ? (
                <>
                  <ShoppingCart className="w-3 h-3 text-[#800020]" />
                  <span>POS</span>
                </>
              ) : (
                <>
                  <Store className="w-3 h-3 text-[#800020]" />
                  <span>Toko</span>
                </>
              )}
            </span>
          </div>

          {/* Zone 2: Navigation Links (Management Mode Only) or Switch to Management (POS Mode) */}
          <div className="flex-1 flex justify-center">
            {appMode === 'management' ? (
              <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-stone-700">
                {managementNavLinks.map((link) => {
                  const isActive = 
                    activeManagementTab === link.id || 
                    (link.id === 'sales_recap' && (activeManagementTab === 'reports' || activeManagementTab === 'shift_recap'));
                  
                  return (
                    <button
                      key={link.id}
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
            ) : (
              <div className="hidden sm:flex items-center gap-2 text-xs text-stone-600">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>Kasir: <strong className="text-black font-bold">{currentUser.name}</strong></span>
              </div>
            )}
          </div>

          {/* Zone 3: Actions & Multi-User Cashier Controls (Simbolik Minimalis) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Switch: Simbolik Ikon POS atau Kelola Toko */}
            {appMode === 'management' ? (
              <button
                onClick={() => onSwitchMode('pos')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-[#800020] text-white hover:bg-[#660019] transition-colors shadow-xs cursor-pointer"
                title="Buka Kasir POS"
                aria-label="Kasir POS"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">POS</span>
              </button>
            ) : (
              <button
                onClick={() => onSwitchMode('management')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-[#FCE8EB] text-[#800020] border border-[#F8CCD4] hover:bg-[#F8CCD4] transition-colors shadow-xs cursor-pointer"
                title="Buka Kelola Toko"
                aria-label="Kelola Toko"
              >
                <Store className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Toko</span>
              </button>
            )}

            {/* Quick Camera Barcode Scanner (POS Mode) */}
            {appMode === 'pos' && (
              <>
                <button
                  onClick={() => setIsCameraModalOpen(true)}
                  className="flex items-center gap-1.5 p-2 rounded-xl bg-[#FCE8EB] text-[#800020] border border-[#F8CCD4] hover:bg-[#F8CCD4] transition-colors cursor-pointer"
                  title="Buka Kamera Barcode"
                >
                  <Camera className="w-4 h-4" />
                </button>

                {/* Tombol Halaman Khusus Keranjang di Header */}
                <button
                  onClick={() => setActivePosTab(activePosTab === 'cart' ? 'catalog' : 'cart')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer relative ${
                    activePosTab === 'cart'
                      ? 'bg-[#800020] text-white border-[#800020] shadow-sm'
                      : 'bg-[#FCE8EB] text-[#800020] border-[#F8CCD4] hover:bg-[#F8CCD4]'
                  }`}
                  title={`Buka Keranjang: ${activeCartSession.name} (${cartSessions.length} antrean pelanggan)`}
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
                  <span className="hidden md:inline font-mono">
                    {activeCartSession.name}: {totalCartCount > 0 ? formatRupiah(cartTotal) : '0 item'}
                  </span>
                  {cartSessions.length > 1 && (
                    <span className="hidden xl:inline text-[9px] px-1 py-0.2 rounded-full bg-white/20 font-mono font-bold">
                      +{cartSessions.length - 1}
                    </span>
                  )}
                </button>
              </>
            )}

            {/* Shift Status (Saldo Laci) - Tampil di HP & Desktop */}
            <button
              onClick={onOpenShiftModal}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-bold rounded-xl border border-[#FCE4E8] bg-white text-black hover:bg-[#FCE8EB] transition-colors cursor-pointer"
              title="Status Shift & Saldo Laci Kasir"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${currentShift?.isOpen ? 'bg-emerald-600' : 'bg-[#800020]'}`} />
              <span className="hidden sm:inline whitespace-nowrap">{currentShift?.isOpen ? 'Shift Aktif' : 'Buka Shift'}</span>
              <span className="sm:hidden text-[10px] font-bold">{currentShift?.isOpen ? 'Shift' : 'Buka'}</span>
            </button>

            {/* Bluetooth Printer */}
            <button
              onClick={connectBluetooth}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                bluetoothStatus.isConnected
                  ? 'border-[#F8CCD4] bg-[#FCE8EB] text-[#800020]'
                  : 'border-[#FCE4E8] bg-white text-black hover:bg-[#FCE8EB]'
              }`}
              title={bluetoothStatus.isConnected ? bluetoothStatus.statusMessage : 'Printer Bluetooth'}
            >
              <Bluetooth className="w-4 h-4" />
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 rounded-xl border border-[#FCE4E8] bg-white text-black hover:bg-[#FCE8EB] transition-colors relative cursor-pointer"
                title="Notifikasi"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#800020] text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse">
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

            {/* Kasir Aktif Indikator */}
            {appMode === 'pos' && (
              <div
                className="flex items-center gap-2 p-1.5 pl-2.5 pr-3 rounded-xl border border-[#FCE4E8] bg-white select-none"
                title={`Kasir Aktif: ${currentUser.name}`}
              >
                <div className={`w-6 h-6 rounded-lg text-white text-xs font-bold flex items-center justify-center shrink-0 ${currentUser.avatarColor}`}>
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden sm:block text-left text-xs leading-tight">
                  <div className="font-extrabold text-black truncate max-w-[85px]">
                    {currentUser.name.split(' ')[0]}
                  </div>
                  <div className="text-[9px] text-[#800020] uppercase font-bold">
                    {currentUser.role}
                  </div>
                </div>
              </div>
            )}
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

      {/* Camera Live Barcode Scanner Modal */}
      {isCameraModalOpen && (
        <CameraScannerModal
          isOpen={isCameraModalOpen}
          onClose={() => setIsCameraModalOpen(false)}
          onDetectedProduct={(prod) => {
            addToCart(prod, 1);
            setIsCameraModalOpen(false);
          }}
          mode="scan"
        />
      )}
    </>
  );
};
