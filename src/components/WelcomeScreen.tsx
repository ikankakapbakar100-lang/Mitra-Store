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
    <div className="min-h-screen bg-gradient-to-b from-[#FFF0F2] via-[#FFF5F5] to-[#FCEBED] flex flex-col justify-between p-4 sm:p-8 select-none text-black">
      
      {/* Header Atas: Logo MitraStore */}
      <div className="flex items-center justify-between max-w-4xl mx-auto w-full pt-2">
        <Logo size="md" />
        <span className="text-[11px] font-mono font-bold text-black bg-white/80 px-3 py-1 rounded-full border border-[#FCE4E8]">
          Perabotan &amp; Cetakan Kue
        </span>
      </div>

      {/* Konten Tengah: 2 Pilihan Simbolik Minimalis */}
      <div className="max-w-3xl mx-auto w-full my-auto py-8 space-y-8">
        
        {/* Logo & Judul Ringkas */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center p-3 rounded-3xl bg-[#FCE8EB] text-[#800020] mb-1 border border-[#F8CCD4] shadow-xs">
            <Logo size="xl" showText={false} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-black tracking-tight">
            Mitra<span className="text-[#800020]">Store</span>
          </h1>
          <p className="text-xs font-black text-black uppercase tracking-widest">
            Pilih Mode Akses
          </p>
        </div>

        {/* 2 Pilihan Utama Simbolik: Kasir POS & Kelola Toko */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
          
          {/* SIMBOLIK 1: KASIR POS */}
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="group relative bg-white hover:bg-[#FFF5F5] rounded-3xl p-7 border-2 border-[#FCE4E8] hover:border-[#800020] shadow-sm hover:shadow-xl hover:shadow-rose-950/10 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center gap-4"
          >
            {/* Ikon Simbolik Utama Kasir POS */}
            <div className="w-16 h-16 rounded-3xl bg-[#800020] text-white flex items-center justify-center shadow-lg shadow-rose-950/25 group-hover:scale-110 transition-transform">
              <ShoppingCart className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-black group-hover:text-[#800020] transition-colors">
                Kasir POS
              </h2>
              <span className="text-xs font-bold text-[#800020]">
                Transaksi &amp; Struk
              </span>
            </div>

            <div className="w-9 h-9 rounded-full bg-[#FCE8EB] text-[#800020] group-hover:bg-[#800020] group-hover:text-white flex items-center justify-center transition-colors">
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* SIMBOLIK 2: KELOLA TOKO */}
          <div className="group relative bg-white rounded-3xl p-7 border-2 border-[#FCE4E8] hover:border-[#800020] shadow-sm hover:shadow-xl hover:shadow-rose-950/10 transition-all duration-200 flex flex-col items-center justify-between text-center gap-4">
            
            {/* Tombol Utama Buka Kelola Toko */}
            <button
              onClick={() => onSelectMode('management', 'inventory')}
              className="flex flex-col items-center justify-center gap-3 cursor-pointer w-full"
            >
              <div className="w-16 h-16 rounded-3xl bg-black text-white flex items-center justify-center shadow-lg group-hover:bg-[#800020] group-hover:scale-110 transition-all">
                <Store className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-2xl font-black text-black group-hover:text-[#800020] transition-colors">
                  Kelola Toko
                </h2>
                <span className="text-xs font-bold text-black">
                  Inventaris &amp; Bisnis
                </span>
              </div>
            </button>

            {/* Ikon-Ikon Simbolik Pintasan Kelola Toko */}
            <div className="flex items-center justify-center gap-2 pt-2 border-t border-[#FCE4E8] w-full">
              {quickManagementIcons.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectMode('management', item.id)}
                    className="p-2 rounded-xl bg-[#FFF5F5] hover:bg-[#FCE8EB] text-black hover:text-[#800020] border border-[#FCE4E8] transition-colors cursor-pointer"
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
        <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3.5 border border-[#FCE4E8] shadow-2xs">
          <div className="flex items-center justify-between mb-2.5 px-1">
            <span className="text-[11px] font-bold text-black">
              Koleksi Cetakan &amp; Perabot ({products.length} Item)
            </span>
            <span className="text-[10px] font-bold text-[#800020] bg-[#FCE8EB] px-2 py-0.5 rounded-md border border-[#F8CCD4]">
              Kamera &amp; Keyboard Siap
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {products.slice(0, 4).map((item) => (
              <div 
                key={item.id} 
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center gap-2 p-2 rounded-xl bg-[#FFF8F8] hover:bg-[#FCE8EB] border border-[#FCE4E8] transition-all cursor-pointer"
              >
                <img 
                  src={item.imageUrl} 
                  alt={item.name} 
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-lg object-cover shrink-0 border border-[#F8CCD4]" 
                />
                <div className="truncate text-left">
                  <div className="text-[11px] font-bold text-black truncate">
                    {item.name}
                  </div>
                  <div className="text-[10px] font-bold font-mono text-[#800020]">
                    {formatRupiah(item.sellPrice)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Footer Minimalis */}
      <div className="text-center text-xs text-black pb-1">
        <span className="font-extrabold text-black">MitraStore</span> · POS Kasir Cream Pink &amp; Merah Marron
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
