/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { POSProvider, usePOS } from './context/POSContext';
import { WelcomeScreen } from './components/WelcomeScreen';
import { Header } from './components/Header';
import { CashierView } from './components/POS/CashierView';
import { InventoryView } from './components/Inventory/InventoryView';
import { SalesRecapView } from './components/Reports/SalesRecapView';
import { ShopeeSyncView } from './components/Shopee/ShopeeSyncView';
import { ShiftModal } from './components/Shift/ShiftModal';
import { CashierLoginModal } from './components/POS/CashierLoginModal';
import { StaffManagementModal } from './components/Staff/StaffManagementModal';
import { OfflineSyncModal } from './components/Offline/OfflineSyncModal';
import { SupabaseModal } from './components/Supabase/SupabaseModal';

function POSApp() {
  const { 
    isStaffModalOpen, 
    setIsStaffModalOpen, 
    isOfflineModalOpen, 
    setIsOfflineModalOpen,
    isSupabaseModalOpen,
    setIsSupabaseModalOpen,
  } = usePOS();

  // App mode: 'welcome' (layar awal masuk), 'pos' (mode kasir khusus transaksi), 'management' (mode kelola toko)
  const [appMode, setAppMode] = useState<'welcome' | 'pos' | 'management'>('welcome');
  const [activeManagementTab, setActiveManagementTab] = useState<string>('inventory');
  const [isShiftModalOpen, setIsShiftModalOpen] = useState<boolean>(false);
  const [isCashierLoginModalOpen, setIsCashierLoginModalOpen] = useState<boolean>(false);

  const handleSwitchMode = (mode: 'pos' | 'management') => {
    setAppMode(mode);
  };

  // Keyboard shortcut listeners (ESC to return to welcome, F1 for POS, F2 for Management)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAppMode('welcome');
      } else if (e.key === 'F1') {
        e.preventDefault();
        setIsCashierLoginModalOpen(true);
      } else if (e.key === 'F2') {
        e.preventDefault();
        setAppMode('management');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 1. Tampilan Awal Masuk Aplikasi: Logo MitraStore & 2 Opsi Mode
  if (appMode === 'welcome') {
    return (
      <WelcomeScreen 
        onSelectMode={(mode, initialTab) => {
          setAppMode(mode);
          if (initialTab) {
            setActiveManagementTab(initialTab);
          }
        }} 
      />
    );
  }

  // 2. Mode Kasir POS atau Mode Kelola Toko
  return (
    <div className="min-h-screen text-black flex flex-col font-sans selection:bg-[#800020] selection:text-white">
      
      {/* Top Header */}
      <Header
        appMode={appMode}
        onBackToWelcome={() => setAppMode('welcome')}
        onSwitchMode={handleSwitchMode}
        activeManagementTab={activeManagementTab}
        setActiveManagementTab={setActiveManagementTab}
        onOpenShiftModal={() => setIsShiftModalOpen(true)}
        onOpenCashierLoginModal={() => setIsCashierLoginModalOpen(true)}
      />

      {/* Main Content Area */}
      <main 
        className="flex-1 bg-cover bg-center bg-fixed min-h-[calc(100vh-4rem)]"
        style={
          appMode === 'pos'
            ? {
                backgroundImage: `linear-gradient(to bottom, rgba(15, 8, 12, 0.40), rgba(15, 8, 12, 0.58)), url('/assets/aistudio/Sakura_wallpapers_a356b72b.jpg')`,
              }
            : appMode === 'management'
            ? {
                backgroundImage: `linear-gradient(to bottom, rgba(255, 245, 247, 0.85), rgba(255, 240, 243, 0.92)), url('/assets/aistudio/Pink_aesthetic_background_91fc2399.jpg')`,
              }
            : undefined
        }
      >
        {/* OPSI 1: KHUSUS KASIR POS (Hanya Catat & Terima Pesanan, Tanpa Tambah Stok) */}
        {appMode === 'pos' && (
          <CashierView />
        )}

        {/* OPSI 2: MANAJEMEN TOKO */}
        {appMode === 'management' && (
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-2.5 sm:py-6">
            {activeManagementTab === 'inventory' && <InventoryView />}
            {(activeManagementTab === 'sales_recap' || activeManagementTab === 'reports' || activeManagementTab === 'shift_recap') && (
              <SalesRecapView onOpenShiftModal={() => setIsShiftModalOpen(true)} />
            )}
            {activeManagementTab === 'shopee' && <ShopeeSyncView />}
          </div>
        )}
      </main>

      {/* Cashier Shift Reconciliation Modal */}
      <ShiftModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
      />

      {/* Cashier Multi-User Login Modal (Saat masuk ke mode POS atau ganti kasir) */}
      <CashierLoginModal
        isOpen={isCashierLoginModalOpen}
        onClose={() => setIsCashierLoginModalOpen(false)}
        onSuccess={() => {
          setIsCashierLoginModalOpen(false);
        }}
      />

      {/* Staff Management & Password Reset Modal for Verified Boss Only */}
      <StaffManagementModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
      />

      {/* Offline Network Status & Local Storage Sync Modal */}
      <OfflineSyncModal
        isOpen={isOfflineModalOpen}
        onClose={() => setIsOfflineModalOpen(false)}
      />

      {/* Supabase PostgreSQL Cloud Database Integration Modal */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />

      {/* Minimalist Footer in Cream Pink & Maroon */}
      <footer className="border-t border-[#FCE4E8] bg-[#FFF0F3]/95 py-4 text-center text-xs text-black">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>&copy; 2026</span>
            <strong className="text-black font-extrabold">MitraStore</strong>
            <span className="text-[#800020] font-bold">· POS Kasir Cream Pink &amp; Merah Marron</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-black">
            <button 
              onClick={() => setAppMode('welcome')}
              className="text-[#800020] hover:underline font-bold cursor-pointer"
            >
              Ganti Mode [ESC]
            </button>
            <span>·</span>
            <span>Shopee v2.0 Sync</span>
            <span>·</span>
            <span>Kamera Barcode</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <POSProvider>
      <POSApp />
    </POSProvider>
  );
}
