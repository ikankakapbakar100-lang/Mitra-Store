/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Logo } from './Logo';
import { 
  ShoppingCart, 
  Store, 
  ArrowRight,
} from 'lucide-react';
import { CashierLoginModal } from './POS/CashierLoginModal';

interface WelcomeScreenProps {
  onSelectMode: (mode: 'pos' | 'management', initialTab?: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectMode }) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <div 
      className="min-h-screen w-full relative flex flex-col justify-between p-4 sm:p-8 select-none overflow-x-hidden text-black"
      style={{
        backgroundImage: `url('/assets/aistudio/download_d328c0b1.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Soft Ambient Overlay for Optimal Text Contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/15 to-[#800020]/25 pointer-events-none" />

      {/* Top Bar: Brand Logo & Store Tag */}
      <header className="relative z-10 flex items-center justify-between max-w-4xl mx-auto w-full pt-1 sm:pt-2 gap-2">
        <div className="bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/60 shadow-xs">
          <Logo size="sm" />
        </div>
        
        <span className="text-[11px] font-mono font-bold text-[#800020] bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/60 shadow-xs">
          Perabotan &amp; Cetakan Kue
        </span>
      </header>

      {/* Center Zone: Logo Showcase & 2 Main Options */}
      <main className="relative z-10 max-w-xl mx-auto w-full my-auto py-6 sm:py-8 space-y-6">
        
        {/* Logo Card */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3.5 sm:p-4 rounded-3xl bg-white/90 backdrop-blur-md border border-white/80 shadow-md shadow-rose-950/10 transition-transform hover:scale-105">
            <Logo size="xl" showText={false} />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-black tracking-tight drop-shadow-xs">
              Mitra<span className="text-[#800020]">Store</span>
            </h1>
            <p className="text-xs sm:text-sm font-bold text-[#660019] mt-0.5">
              Silakan pilih mode menu untuk memulai
            </p>
          </div>
        </div>

        {/* Cuma 2 Tombol Opsi: Kasir POS & Kelola Toko */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          
          {/* OPSI 1: KASIR POS */}
          <button
            type="button"
            onClick={() => setIsLoginModalOpen(true)}
            className="group relative bg-white/95 hover:bg-white active:scale-[0.98] rounded-3xl p-6 sm:p-7 border-2 border-white/80 hover:border-[#800020] shadow-md hover:shadow-xl hover:shadow-rose-950/20 backdrop-blur-md transition-all duration-200 cursor-pointer flex flex-col items-center justify-between text-center gap-4 min-h-[200px]"
          >
            {/* Badge Status Ringkas */}
            <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full bg-[#FCE8EB] text-[#800020] border border-[#F8CCD4]">
              Kasir Aktif
            </span>

            {/* Ikon Kasir POS */}
            <div className="w-16 h-16 rounded-2xl bg-[#800020] text-white flex items-center justify-center shadow-lg shadow-rose-950/25 group-hover:scale-110 transition-transform">
              <ShoppingCart className="w-8 h-8" />
            </div>

            {/* Label & Keterangan */}
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-black group-hover:text-[#800020] transition-colors">
                Kasir POS
              </h2>
              <p className="text-xs font-semibold text-stone-600 mt-0.5">
                Transaksi &amp; Struk Belanja
              </p>
            </div>

            {/* Tombol Panah Masuk */}
            <div className="w-9 h-9 rounded-full bg-[#FCE8EB] text-[#800020] group-hover:bg-[#800020] group-hover:text-white flex items-center justify-center transition-colors">
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* OPSI 2: KELOLA TOKO */}
          <button
            type="button"
            onClick={() => onSelectMode('management')}
            className="group relative bg-white/95 hover:bg-white active:scale-[0.98] rounded-3xl p-6 sm:p-7 border-2 border-white/80 hover:border-[#800020] shadow-md hover:shadow-xl hover:shadow-rose-950/20 backdrop-blur-md transition-all duration-200 cursor-pointer flex flex-col items-center justify-between text-center gap-4 min-h-[200px]"
          >
            {/* Badge Status Ringkas */}
            <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
              Manajemen Toko
            </span>

            {/* Ikon Kelola Toko */}
            <div className="w-16 h-16 rounded-2xl bg-black text-white flex items-center justify-center shadow-lg group-hover:bg-[#800020] group-hover:scale-110 transition-all">
              <Store className="w-8 h-8" />
            </div>

            {/* Label & Keterangan */}
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-black group-hover:text-[#800020] transition-colors">
                Kelola Toko
              </h2>
              <p className="text-xs font-semibold text-stone-600 mt-0.5">
                Stok Barang &amp; Laporan
              </p>
            </div>

            {/* Tombol Panah Masuk */}
            <div className="w-9 h-9 rounded-full bg-stone-100 text-stone-700 group-hover:bg-[#800020] group-hover:text-white flex items-center justify-center transition-colors">
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

        </div>

      </main>

      {/* Footer Minimalis */}
      <footer className="relative z-10 text-center text-xs text-black/90 font-bold pb-2 pt-4">
        <span className="bg-white/80 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/60 shadow-2xs">
          MitraStore · Sistem Kasir POS &amp; Kelola Toko
        </span>
      </footer>

      {/* Cashier Login Password Modal */}
      <CashierLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => {
          setIsLoginModalOpen(false);
          onSelectMode('pos');
        }}
      />

    </div>
  );
};
