/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Logo } from './Logo';
import { 
  ShoppingCart, 
  Store,
  Package, 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  ShieldCheck, 
  ArrowRight
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { formatRupiah } from '../utils/format';
import { CashierLoginModal } from './POS/CashierLoginModal';

interface WelcomeScreenProps {
  onSelectMode: (mode: 'pos' | 'management', initialTab?: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectMode }) => {
  const { products } = usePOS();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Sub-fitur Kelola Toko: Simbolik dengan ikon
  const quickManagementIcons = [
    { id: 'inventory', title: 'Stok Barang', icon: Package },
    { id: 'sales_recap', title: 'Rekap Penjualan', icon: TrendingUp },
    { id: 'customers', title: 'Pelanggan Setia', icon: Users },
    { id: 'shopee', title: 'Shopee Sync', icon: ShoppingBag },
    { id: 'backup', title: 'Cloud & Enkripsi', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-linear-to-b from-[#FFF5F7] via-white to-[#FFF0F4] flex flex-col justify-between p-4 sm:p-8 select-none">
      
      {/* Header Atas: Logo MitraStore Minimalis */}
      <div className="flex items-center justify-between max-w-4xl mx-auto w-full pt-2">
        <Logo size="md" />
        <span className="text-[11px] font-mono font-semibold text-slate-400">
          Perabotan &amp; Cetakan Kue
        </span>
      </div>

      {/* Konten Tengah: 2 Pilihan Simbolik Minimalis */}
      <div className="max-w-3xl mx-auto w-full my-auto py-8 space-y-8">
        
        {/* Logo & Judul Ringkas */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center p-3 rounded-3xl bg-pink-100/70 text-[#F43F5E] mb-1">
            <Logo size="xl" showText={false} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Mitra<span className="text-[#F43F5E]">Store</span>
          </h1>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Pilih Mode Akses
          </p>
        </div>

        {/* 2 Pilihan Utama Simbolik: Kasir POS & Kelola Toko */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
          
          {/* SIMBOLIK 1: KASIR POS */}
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="group relative bg-white hover:bg-pink-50/30 rounded-3xl p-7 border-2 border-pink-200 hover:border-[#F43F5E] shadow-sm hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center gap-4"
          >
            {/* Ikon Simbolik Utama Kasir POS */}
            <div className="w-16 h-16 rounded-3xl bg-[#F43F5E] text-white flex items-center justify-center shadow-lg shadow-pink-500/25 group-hover:scale-110 transition-transform">
              <ShoppingCart className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900 group-hover:text-[#F43F5E] transition-colors">
                Kasir POS
              </h2>
              <span className="text-xs font-semibold text-[#F43F5E]">
                Transaksi &amp; Struk
              </span>
            </div>

            <div className="w-9 h-9 rounded-full bg-pink-50 text-[#F43F5E] group-hover:bg-[#F43F5E] group-hover:text-white flex items-center justify-center transition-colors">
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* SIMBOLIK 2: KELOLA TOKO */}
          <div className="group relative bg-white rounded-3xl p-7 border-2 border-slate-200 hover:border-[#F43F5E] shadow-sm hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-200 flex flex-col items-center justify-between text-center gap-4">
            
            {/* Tombol Utama Buka Kelola Toko */}
            <button
              onClick={() => onSelectMode('management', 'inventory')}
              className="flex flex-col items-center justify-center gap-3 cursor-pointer w-full"
            >
              <div className="w-16 h-16 rounded-3xl bg-slate-900 text-white flex items-center justify-center shadow-lg group-hover:bg-[#F43F5E] group-hover:scale-110 transition-all">
                <Store className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-900 group-hover:text-[#F43F5E] transition-colors">
                  Kelola Toko
                </h2>
                <span className="text-xs font-semibold text-slate-500">
                  Inventaris &amp; Bisnis
                </span>
              </div>
            </button>

            {/* Ikon-Ikon Simbolik Pintasan Kelola Toko */}
            <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-100 w-full">
              {quickManagementIcons.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectMode('management', item.id)}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-pink-100 text-slate-600 hover:text-[#F43F5E] transition-colors cursor-pointer"
                    title={item.title}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Ringkasan Cepat Koleksi Produk */}
        <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-3 border border-pink-100 shadow-2xs">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] font-bold text-slate-700">
              Koleksi Cetakan &amp; Perabot ({products.length} Item)
            </span>
            <span className="text-[10px] font-semibold text-[#F43F5E]">
              Kamera &amp; Keyboard Siap
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {products.slice(0, 4).map((item) => (
              <div 
                key={item.id} 
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center gap-2 p-1.5 rounded-xl bg-pink-50/40 hover:bg-pink-50 border border-pink-100/60 transition-all cursor-pointer"
              >
                <img 
                  src={item.imageUrl} 
                  alt={item.name} 
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-lg object-cover shrink-0 border border-pink-200/60" 
                />
                <div className="truncate text-left">
                  <div className="text-[11px] font-bold text-slate-800 truncate">
                    {item.name}
                  </div>
                  <div className="text-[10px] font-bold font-mono text-[#F43F5E]">
                    {formatRupiah(item.sellPrice)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Footer Minimalis */}
      <div className="text-center text-xs text-slate-400 pb-1">
        <span className="font-bold text-slate-700">MitraStore</span> · POS Kasir Pink &amp; Putih Minimalis
      </div>

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
