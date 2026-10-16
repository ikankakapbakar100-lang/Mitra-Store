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
import { CustomerView } from './components/Customers/CustomerView';
import { ShopeeSyncView } from './components/Shopee/ShopeeSyncView';
import { BackupView } from './components/Backup/BackupView';
import { ShiftModal } from './components/Shift/ShiftModal';
import { CashierLoginModal } from './components/POS/CashierLoginModal';

function POSApp() {
  // App mode: 'welcome' (layar awal masuk), 'pos' (mode kasir khusus transaksi), 'management' (mode kelola toko)
  const [appMode, setAppMode] = useState<'welcome' | 'pos' | 'management'>('welcome');
  const [activeManagementTab, setActiveManagementTab] = useState<string>('inventory');
  const [isShiftModalOpen, setIsShiftModalOpen] = useState<boolean>(false);
  const [isCashierLoginModalOpen, setIsCashierLoginModalOpen] = useState<boolean>(false);

  const handleSwitchMode = (mode: 'pos' | 'management') => {
    if (mode === 'pos') {
      setIsCashierLoginModalOpen(true);
    } else {
      setAppMode('management');
    }
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
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-[#F43F5E] selection:text-white">
      
      {/* Top Header */}
      <Header
        appMode={appMode}
        onBackToWelcome={() => setAppMode('welcome')}
        onSwitchMode={handleSwitchMode}
        activeManagementTab={activeManagementTab}
        setActiveManagementTab={setActiveManagementTab}
        onOpenShiftModal={() => setIsShiftModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
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
            {activeManagementTab === 'customers' && <CustomerView />}
            {activeManagementTab === 'shopee' && <ShopeeSyncView />}
            {activeManagementTab === 'backup' && <BackupView />}
          </div>
        )}
      </main>

      {/* Cashier Shift Reconciliation Modal */}
      <ShiftModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
      />

      {/* Cashier Multi-User Login Modal (Saat masuk ke mode POS) */}
      <CashierLoginModal
        isOpen={isCashierLoginModalOpen}
        onClose={() => setIsCashierLoginModalOpen(false)}
        onSuccess={() => {
          setIsCashierLoginModalOpen(false);
          setAppMode('pos');
        }}
      />

      {/* Minimalist Footer in Pink & White */}
      <footer className="border-t border-pink-100 bg-white/90 py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>&copy; 2026</span>
            <strong className="text-slate-800">MitraStore</strong>
            <span className="text-[#F43F5E] font-semibold">· POS Kasir Pink &amp; Putih Minimalis</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <button 
              onClick={() => setAppMode('welcome')}
              className="text-[#F43F5E] hover:underline font-semibold"
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
