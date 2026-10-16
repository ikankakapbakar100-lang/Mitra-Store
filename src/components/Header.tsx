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
    addToCart
  } = usePOS();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  const totalStockAlerts = lowStockProducts.length + outOfStockProducts.length;

  // Navigasi Mode Kelola Toko: Laporan Penjualan & Rekap Kasir digabung menjadi "Rekap Penjualan"
  const managementNavLinks = [
    { id: 'inventory', label: 'Stok Barang' },
    { id: 'sales_recap', label: 'Rekap Penjualan' },
    { id: 'customers', label: 'Pelanggan Setia' },
    { id: 'shopee', label: 'Shopee Sync' },
    { id: 'backup', label: 'Cloud & Enkripsi' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-pink-100 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-13 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Zone 1: Brand & Back to Mode Menu */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onBackToWelcome}
              className="p-2 rounded-xl text-slate-500 hover:text-[#F43F5E] hover:bg-pink-50 transition-colors"
              title="Kembali ke Layar Awal [ESC]"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div onClick={onBackToWelcome} className="cursor-pointer">
              <Logo size="sm" />
            </div>

            {/* Mode Indicator Badge (Simbolik) */}
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-pink-50 text-[#F43F5E] border border-pink-200">
              {appMode === 'pos' ? (
                <>
                  <ShoppingCart className="w-3 h-3 text-[#F43F5E]" />
                  <span>POS</span>
                </>
              ) : (
                <>
                  <Store className="w-3 h-3 text-[#F43F5E]" />
                  <span>Toko</span>
                </>
              )}
            </span>
          </div>

          {/* Zone 2: Navigation Links (Management Mode Only) or Switch to Management (POS Mode) */}
          <div className="flex-1 flex justify-center">
            {appMode === 'management' ? (
              <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-slate-500">
                {managementNavLinks.map((link) => {
                  const isActive = 
                    activeManagementTab === link.id || 
                    (link.id === 'sales_recap' && (activeManagementTab === 'reports' || activeManagementTab === 'shift_recap'));
                  
                  return (
                    <button
                      key={link.id}
                      onClick={() => setActiveManagementTab(link.id)}
                      className={`py-1 text-xs font-semibold whitespace-nowrap transition-colors relative ${
                        isActive
                          ? 'text-[#F43F5E] font-bold'
                          : 'hover:text-slate-900'
                      }`}
                    >
                      {link.label}
                      {link.id === 'inventory' && totalStockAlerts > 0 && (
                        <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.2 text-[9px] font-bold text-white bg-[#F43F5E] rounded-full">
                          {totalStockAlerts}
                        </span>
                      )}
                      {isActive && (
                        <span className="absolute bottom-[-20px] left-0 right-0 h-0.5 bg-[#F43F5E] rounded-full" />
                      )}
                    </button>
                  );
                })}
              </nav>
            ) : (
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Kasir: <strong className="text-slate-800">{currentUser.name}</strong></span>
              </div>
            )}
          </div>

          {/* Zone 3: Actions & Multi-User Cashier Controls (Simbolik Minimalis) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Switch: Simbolik Ikon POS atau Kelola Toko */}
            {appMode === 'management' ? (
              <button
                onClick={() => onSwitchMode('pos')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-[#F43F5E] text-white hover:bg-[#E11D48] transition-colors shadow-xs cursor-pointer"
                title="Buka Kasir POS"
                aria-label="Kasir POS"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">POS</span>
              </button>
            ) : (
              <button
                onClick={() => onSwitchMode('management')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-pink-50 text-[#F43F5E] border border-pink-200 hover:bg-pink-100 transition-colors shadow-xs cursor-pointer"
                title="Buka Kelola Toko"
                aria-label="Kelola Toko"
              >
                <Store className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Toko</span>
              </button>
            )}

            {/* Quick Camera Barcode Scanner (POS Mode) */}
            {appMode === 'pos' && (
              <button
                onClick={() => setIsCameraModalOpen(true)}
                className="flex items-center gap-1.5 p-2 rounded-xl bg-pink-50 text-[#F43F5E] border border-pink-200 hover:bg-pink-100 transition-colors"
                title="Buka Kamera Barcode"
              >
                <Camera className="w-4 h-4" />
              </button>
            )}

            {/* Shift Status (Saldo Laci) - Tampil di HP & Desktop */}
            <button
              onClick={onOpenShiftModal}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-pink-100 bg-white text-slate-700 hover:bg-pink-50/50 transition-colors"
              title="Status Shift & Saldo Laci Kasir"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${currentShift?.isOpen ? 'bg-emerald-500' : 'bg-pink-500'}`} />
              <span className="hidden sm:inline whitespace-nowrap">{currentShift?.isOpen ? 'Shift Aktif' : 'Buka Shift'}</span>
              <span className="sm:hidden text-[10px] font-bold">{currentShift?.isOpen ? 'Shift' : 'Buka'}</span>
            </button>

            {/* Bluetooth Printer */}
            <button
              onClick={connectBluetooth}
              className={`p-2 rounded-xl border transition-colors ${
                bluetoothStatus.isConnected
                  ? 'border-pink-200 bg-pink-50 text-[#F43F5E]'
                  : 'border-pink-100 text-slate-400 hover:bg-pink-50/50'
              }`}
              title={bluetoothStatus.isConnected ? bluetoothStatus.statusMessage : 'Printer Bluetooth'}
            >
              <Bluetooth className="w-4 h-4" />
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 rounded-xl border border-pink-100 text-slate-600 hover:bg-pink-50/50 transition-colors relative"
                title="Notifikasi"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#F43F5E] text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
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

            {/* Kasir Aktif Indikator (Hanya tampil di mode kasir POS, disembunyikan saat di mode Kelola Toko sesuai instruksi) */}
            {appMode === 'pos' && (
              <div
                className="flex items-center gap-2 p-1.5 pl-2.5 pr-3 rounded-xl border border-pink-100 bg-pink-50/40 select-none"
                title={`Kasir Aktif: ${currentUser.name}`}
              >
                <div className={`w-6 h-6 rounded-lg text-white text-xs font-bold flex items-center justify-center shrink-0 ${currentUser.avatarColor}`}>
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden sm:block text-left text-xs leading-tight">
                  <div className="font-bold text-slate-800 truncate max-w-[85px]">
                    {currentUser.name.split(' ')[0]}
                  </div>
                  <div className="text-[9px] text-[#F43F5E] uppercase font-semibold">
                    {currentUser.role}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Sub Navigation in Management Mode */}
        {appMode === 'management' && (
          <div className="lg:hidden overflow-x-auto border-t border-pink-100 px-4 py-2 flex items-center gap-2 scrollbar-none bg-white">
            {managementNavLinks.map((link) => {
              const isActive = 
                activeManagementTab === link.id || 
                (link.id === 'sales_recap' && (activeManagementTab === 'reports' || activeManagementTab === 'shift_recap'));
              return (
                <button
                  key={link.id}
                  onClick={() => setActiveManagementTab(link.id)}
                  className={`px-3 py-1 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-[#F43F5E] text-white shadow-2xs font-bold'
                      : 'bg-pink-50 text-slate-600 hover:bg-pink-100'
                  }`}
                >
                  {link.label}
                  {link.id === 'inventory' && totalStockAlerts > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.2 text-[9px] font-bold text-white bg-slate-900 rounded-full">
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
