/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { usePOS } from '../../context/POSContext';
import { Product } from '../../types/pos';
import { formatRupiah } from '../../utils/format';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  UserPlus, 
  CreditCard, 
  Camera,
  ShoppingBag,
  ShieldCheck,
  X,
  Trash2,
  LayoutGrid,
  List,
  Package,
  ArrowDownCircle
} from 'lucide-react';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';
import { CashExpenseModal } from './CashExpenseModal';
import { CameraScannerModal } from '../Camera/CameraScannerModal';

export const CashierView: React.FC = () => {
  const {
    products,
    categories,
    cart,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    cartSubtotal,
    cartTax,
    cartTotal,
    selectedCustomer,
    setSelectedCustomer,
    customers,
    pointsToRedeem,
    setPointsToRedeem,
    pointsDiscountValue,
    taxEnabled,
    setTaxEnabled,
    isReceiptModalOpen,
    setIsReceiptModalOpen,
    currentUser,
    isExpenseModalOpen,
    setIsExpenseModalOpen,
    expenses,
  } = usePOS();

  const todayExpenseTotal = useMemo(() => {
    const now = new Date();
    return expenses
      .filter((e) => {
        const d = new Date(e.date);
        return (
          d.getDate() === now.getDate() &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState<boolean>(false);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState<boolean>(false);
  // Fitur Khusus: Keranjang dapat dibuka/tutup melalui Icon Keranjang agar hemat space produk
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isConfirmingClearCart, setIsConfirmingClearCart] = useState<boolean>(false);
  // Mode Kompak Layar HP: Kompres foto produk agar 10+ produk langsung terlihat sekaligus tanpa scroll
  const [viewDensity, setViewDensity] = useState<'compact' | 'grid'>('compact');

  const getOptimizedThumb = (url?: string) => {
    if (!url) return 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=120&q=70';
    if (url.includes('unsplash.com')) {
      const base = url.split('?')[0];
      return `${base}?auto=format&fit=crop&w=120&q=70`;
    }
    return url;
  };

  const totalCartCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.qty, 0);
  }, [cart]);

  // Filtered products: category & search query
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchCategory = selectedCategory === 'Semua' || product.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        product.name.toLowerCase().includes(q) ||
        product.sku.toLowerCase().includes(q) ||
        product.barcode.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Handle barcode quick add via Enter key
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return;

      const exactMatch = products.find(
        (p) => p.barcode === searchQuery.trim() || p.sku.toLowerCase() === q
      );
      if (exactMatch && exactMatch.stock > 0) {
        addToCart(exactMatch, 1);
        setSearchQuery('');
      } else if (filteredProducts.length === 1 && filteredProducts[0].stock > 0) {
        addToCart(filteredProducts[0], 1);
        setSearchQuery('');
      }
    }
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    clearCart();
    setIsConfirmingClearCart(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-2.5 sm:py-5">
      <div className={`grid grid-cols-1 ${isCartOpen ? 'lg:grid-cols-12' : 'grid-cols-1'} gap-3 sm:gap-5 items-start`}>
        
        {/* Kolom Katalog Produk: Melebar Penuh (100%) Saat Keranjang Ditutup untuk Menghemat Space */}
        <div className={`${isCartOpen ? 'lg:col-span-7 xl:col-span-8' : 'w-full'} space-y-2 sm:space-y-3.5`}>
          
          {/* Top Bar: Search, Kamera Barcode, Toggle Density HP (10+ Produk), & Icon Keranjang */}
          <div className="space-y-2">
            <div className="flex gap-1.5 sm:gap-2 items-center">
              
              {/* Search Bar Minimalis */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Cari cetakan, loyang, alat masak, barcode..."
                  className="w-full pl-8 sm:pl-9 pr-7 sm:pr-8 py-1.5 sm:py-2 text-xs rounded-xl sm:rounded-2xl border border-pink-100 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F43F5E] shadow-2xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Kamera Barcode Scanner Trigger */}
              <button
                onClick={() => setIsCameraScannerOpen(true)}
                className="p-1.5 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl font-bold text-xs bg-pink-50 text-[#F43F5E] border border-pink-200 hover:bg-pink-100 transition-all flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
                title="Buka Kamera Barcode"
              >
                <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden md:inline">Scan</span>
              </button>

              {/* Tombol Catat Kas Keluar / Pengeluaran (Beli Stok / Operasional) */}
              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="p-1.5 sm:px-2.5 sm:py-2 rounded-xl sm:rounded-2xl font-bold text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
                title="Catat Kas Keluar (Beli Stok / Operasional Toko)"
              >
                <ArrowDownCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#F43F5E]" />
                <span className="hidden sm:inline">Kas Keluar</span>
                {todayExpenseTotal > 0 && (
                  <span className="text-[10px] bg-rose-200/70 text-rose-800 font-mono font-bold px-1.5 py-0.2 rounded-full hidden md:inline">
                    -{formatRupiah(todayExpenseTotal)}
                  </span>
                )}
              </button>

              {/* Toggle Mode Tampilan HP: Kompak (10+ Produk) vs Grid Mini */}
              <button
                onClick={() => setViewDensity(viewDensity === 'compact' ? 'grid' : 'compact')}
                className={`p-1.5 sm:px-2.5 sm:py-2 rounded-xl sm:rounded-2xl font-bold text-xs border transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                  viewDensity === 'compact'
                    ? 'bg-rose-50 text-[#F43F5E] border-rose-200'
                    : 'bg-white text-slate-600 border-pink-100 hover:bg-pink-50'
                }`}
                title={viewDensity === 'compact' ? 'Mode Kompak HP (Muat 10+ Produk Sekaligus Tanpa Scroll)' : 'Mode Grid Mini'}
              >
                {viewDensity === 'compact' ? (
                  <>
                    <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="text-[10px] sm:text-[11px] font-bold">10+ HP</span>
                  </>
                ) : (
                  <>
                    <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline text-[11px] font-bold">Grid</span>
                  </>
                )}
              </button>

              {/* FITUR KHUSUS ICON KERANJANG (HEMAT SPACE UNTUK IMAGE PRODUK) */}
              <button
                onClick={() => setIsCartOpen(!isCartOpen)}
                className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl font-bold text-xs transition-all flex items-center gap-1.5 sm:gap-2 shadow-sm cursor-pointer shrink-0 ${
                  isCartOpen
                    ? 'bg-slate-900 text-white hover:bg-slate-800'
                    : 'bg-[#F43F5E] hover:bg-[#E11D48] text-white shadow-pink-500/20 active:scale-95'
                }`}
                title={isCartOpen ? 'Tutup Keranjang (Perluas Tampilan Produk)' : 'Buka Keranjang Kasir'}
              >
                <div className="relative">
                  <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {totalCartCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-3.5 h-3.5 px-0.5 bg-white text-[#F43F5E] rounded-full text-[8px] sm:text-[9px] font-black flex items-center justify-center shadow-xs">
                      {totalCartCount > 99 ? '99+' : totalCartCount}
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline font-mono font-bold">
                  {isCartOpen ? 'Tutup' : totalCartCount > 0 ? formatRupiah(cartTotal) : 'Keranjang'}
                </span>
              </button>
            </div>

            {/* Filter Kategori Minimalis */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 text-[11px] sm:text-xs font-semibold rounded-lg sm:rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#F43F5E] text-white shadow-2xs font-bold'
                      : 'bg-white text-slate-600 hover:bg-pink-50/70 border border-pink-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid / List Produk: Desain Image Terkompresi & Hemat Space (10+ Produk Terlihat di HP Tanpa Scroll) */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-pink-100 p-8 text-center">
              <Search className="w-7 h-7 text-slate-300 mx-auto mb-2 opacity-50" />
              <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                Produk Tidak Ditemukan
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Ubah kata kunci pencarian atau pilih kategori lain.
              </p>
            </div>
          ) : viewDensity === 'compact' ? (
            /* MODE 1 (DEFAULT HP): Ultra-Kompak 2 Kolom, Image 38-42px Terkompresi, Muat 10-14 Produk Langsung di HP Tanpa Scroll */
            <div className={`grid gap-1.5 sm:gap-2 ${
              isCartOpen
                ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
                : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
            }`}>
              {filteredProducts.map((product) => {
                const isOutOfStock = product.stock <= 0;

                return (
                  <button
                    key={product.id}
                    onClick={() => !isOutOfStock && addToCart(product, 1)}
                    disabled={isOutOfStock}
                    className={`rounded-xl border text-left p-1.5 sm:p-2 transition-all flex items-center gap-1.5 sm:gap-2 group cursor-pointer h-[50px] sm:h-[56px] ${
                      isOutOfStock
                        ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200'
                        : 'bg-white border-pink-100 hover:border-[#F43F5E] hover:shadow-xs active:scale-[0.98]'
                    }`}
                  >
                    {/* Visual Foto Produk: Terkompresi Mini (38x38 di HP, 44x44 di desktop) */}
                    <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-pink-50/50 overflow-hidden shrink-0 border border-pink-100/60 flex items-center justify-center">
                      <Package className="w-4 h-4 text-pink-300 absolute pointer-events-none" />
                      <img
                        src={getOptimizedThumb(product.imageUrl)}
                        alt={product.name}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover relative z-1 group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      
                      {/* Shopee Sync Dot Indicator */}
                      {product.shopeeSyncEnabled && (
                        <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full bg-[#F43F5E]" title="Shopee Sync" />
                      )}
                    </div>

                    {/* Info Produk Ringkas: Nama & Harga */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="text-[11px] sm:text-xs font-bold text-slate-800 truncate leading-tight group-hover:text-[#F43F5E] transition-colors">
                          {product.name}
                        </h3>
                        <span className="text-[9px] font-mono text-slate-400 shrink-0">
                          {isOutOfStock ? '0' : product.stock}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10.5px] sm:text-xs font-black font-mono text-[#F43F5E] leading-none">
                          {formatRupiah(product.sellPrice)}
                        </span>
                        <div className="w-4 h-4 rounded bg-pink-50 group-hover:bg-[#F43F5E] group-hover:text-white text-[#F43F5E] flex items-center justify-center shrink-0 transition-colors">
                          <Plus className="w-2.5 h-2.5" />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* MODE 2: Grid Mini dengan Gambar Kompresi Rendah Space (h-14 sm:h-16) */
            <div className={`grid gap-1.5 sm:gap-2.5 ${
              isCartOpen
                ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5'
                : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7'
            }`}>
              {filteredProducts.map((product) => {
                const isOutOfStock = product.stock <= 0;

                return (
                  <button
                    key={product.id}
                    onClick={() => !isOutOfStock && addToCart(product, 1)}
                    disabled={isOutOfStock}
                    className={`rounded-xl border text-left transition-all overflow-hidden flex flex-col justify-between group cursor-pointer ${
                      isOutOfStock
                        ? 'opacity-60 cursor-not-allowed bg-slate-50 border-slate-200'
                        : 'bg-white border-pink-100/80 hover:border-[#F43F5E] hover:shadow-xs active:scale-[0.98]'
                    }`}
                  >
                    {/* Visual Foto Mini Terkompresi (h-14 sm:h-16) */}
                    <div className="relative w-full h-14 sm:h-16 bg-pink-50/40 overflow-hidden shrink-0 flex items-center justify-center">
                      <Package className="w-5 h-5 text-pink-300 absolute pointer-events-none" />
                      <img
                        src={getOptimizedThumb(product.imageUrl)}
                        alt={product.name}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover relative z-1 group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      
                      {/* Shopee Sync Badge */}
                      {product.shopeeSyncEnabled && (
                        <div className="absolute top-1 left-1 px-1 py-0.2 rounded bg-white/90 backdrop-blur-xs text-[7px] font-bold text-[#F43F5E] border border-pink-200">
                          Shopee
                        </div>
                      )}

                      {/* Stock Pill Minimalis */}
                      <div className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/60 backdrop-blur-xs text-[8px] font-mono text-white">
                        {isOutOfStock ? 'Habis' : `${product.stock} ${product.unit}`}
                      </div>
                    </div>

                    {/* Info Produk Ringkas: Nama & Harga */}
                    <div className="p-1.5 flex-1 flex flex-col justify-between">
                      <h3 className="text-[11px] font-bold text-slate-800 line-clamp-1 leading-tight group-hover:text-[#F43F5E] transition-colors">
                        {product.name}
                      </h3>

                      <div className="mt-1 pt-1 border-t border-pink-50 flex items-center justify-between">
                        <span className="text-[10.5px] font-black font-mono text-[#F43F5E]">
                          {formatRupiah(product.sellPrice)}
                        </span>
                        <div className="w-4 h-4 rounded-md bg-pink-50 group-hover:bg-[#F43F5E] group-hover:text-white text-[#F43F5E] flex items-center justify-center transition-colors">
                          <Plus className="w-2.5 h-2.5" />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Kolom Keranjang Kasir: Muncul Saat Dibuka via Icon Keranjang */}
        {isCartOpen && (
          <div className="lg:col-span-5 xl:col-span-4 sticky top-20 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-white rounded-3xl border border-pink-100 shadow-xl overflow-hidden flex flex-col">
              
              {/* Header Keranjang dengan Tombol Tutup (X) */}
              <div className="px-4 py-3 border-b border-pink-100 flex items-center justify-between bg-pink-50/40">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-[#F43F5E] text-white flex items-center justify-center">
                    <ShoppingCart className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 leading-tight">
                      Keranjang Kasir
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400">
                      {totalCartCount} item pesanan
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {cart.length > 0 && (
                    isConfirmingClearCart ? (
                      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-rose-200">
                        <button
                          onClick={handleClearCart}
                          className="px-2 py-0.5 text-[10px] font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                        >
                          Ya, Kosongkan
                        </button>
                        <button
                          onClick={() => setIsConfirmingClearCart(false)}
                          className="px-1.5 py-0.5 text-[10px] text-slate-500 hover:text-slate-800"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsConfirmingClearCart(true)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Kosongkan Keranjang"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )
                  )}

                  {/* Tombol Tutup Keranjang */}
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-pink-100 transition-colors cursor-pointer"
                    title="Tutup Keranjang"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Status Aman Data Otomatis */}
              <div className="px-3.5 py-1.5 bg-emerald-50/70 border-b border-emerald-100/60 flex items-center justify-between text-[10px] text-emerald-800">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="font-semibold">Tersimpan Otomatis</span>
                </div>
                <span className="font-mono text-slate-500 text-[10px]">
                  Kasir: {currentUser.name.split(' ')[0]}
                </span>
              </div>

              {/* Pelanggan / Member CRM */}
              <div className="p-3 border-b border-pink-100 bg-pink-50/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">
                    Pelanggan:
                  </span>
                  {selectedCustomer ? (
                    <button
                      onClick={() => {
                        setSelectedCustomer(null);
                        setPointsToRedeem(0);
                      }}
                      className="text-[11px] text-slate-400 hover:text-[#F43F5E] cursor-pointer"
                    >
                      Ganti
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                      className="text-xs text-[#F43F5E] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Pilih Member
                    </button>
                  )}
                </div>

                {selectedCustomer ? (
                  <div className="mt-2 p-2 bg-white rounded-xl border border-pink-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{selectedCustomer.name}</span>
                        <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.2 rounded bg-pink-100 text-[#F43F5E]">
                          {selectedCustomer.tier}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Saldo: <strong className="text-[#F43F5E] font-mono">{selectedCustomer.points} Poin</strong>
                      </div>
                    </div>

                    {selectedCustomer.points > 0 && (
                      <div>
                        {pointsToRedeem > 0 ? (
                          <button
                            onClick={() => setPointsToRedeem(0)}
                            className="px-2 py-1 text-[10px] font-semibold bg-rose-50 text-rose-600 rounded-lg cursor-pointer"
                          >
                            Batal Tukar
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              const maxRedeemablePts = Math.min(
                                selectedCustomer.points,
                                Math.floor(cartSubtotal / 100)
                              );
                              setPointsToRedeem(maxRedeemablePts);
                            }}
                            className="px-2.5 py-1 text-[10px] font-bold bg-[#F43F5E] text-white rounded-lg hover:bg-[#E11D48] cursor-pointer"
                          >
                            Tukar Poin
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : isCustomerDropdownOpen ? (
                  <div className="mt-2 space-y-1 max-h-36 overflow-y-auto bg-white p-1.5 rounded-xl border border-pink-100 shadow-md">
                    {customers.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedCustomer(c);
                          setIsCustomerDropdownOpen(false);
                        }}
                        className="w-full text-left p-1.5 rounded-lg hover:bg-pink-50 text-xs flex justify-between items-center cursor-pointer"
                      >
                        <span className="font-semibold text-slate-800 truncate">
                          {c.name}
                        </span>
                        <span className="text-[10px] font-mono text-[#F43F5E]">
                          {c.points} Pts
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Daftar Item Keranjang */}
              <div className="p-3 max-h-64 overflow-y-auto space-y-2.5 flex-1 divide-y divide-pink-50">
                {cart.length === 0 ? (
                  <div className="py-8 text-center">
                    <ShoppingBag className="w-8 h-8 text-pink-200 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-500">
                      Keranjang masih kosong
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Klik produk untuk menambahkan ke keranjang.
                    </p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.product.id} className="pt-2 first:pt-0 flex items-center justify-between gap-2.5">
                      <img
                        src={item.product.imageUrl || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=200&q=80'}
                        alt={item.product.name}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-lg object-cover shrink-0 border border-pink-100"
                      />

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {item.product.name}
                        </h4>
                        <div className="text-[10px] text-[#F43F5E] font-mono font-semibold">
                          {formatRupiah(item.product.sellPrice)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => updateCartQty(item.product.id, item.qty - 1)}
                          className="w-5 h-5 rounded-md bg-pink-50 hover:bg-pink-100 flex items-center justify-center text-slate-700 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center text-xs font-bold font-mono text-slate-900">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateCartQty(item.product.id, item.qty + 1)}
                          className="w-5 h-5 rounded-md bg-pink-50 hover:bg-pink-100 flex items-center justify-center text-slate-700 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right shrink-0 min-w-[65px]">
                        <div className="text-xs font-bold text-slate-900 font-mono">
                          {formatRupiah(item.product.sellPrice * item.qty)}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-[9px] text-[#F43F5E] hover:underline cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Rincian Total & Tombol Pembayaran */}
              <div className="p-3.5 bg-pink-50/30 border-t border-pink-100 space-y-1.5">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono font-medium">{formatRupiah(cartSubtotal)}</span>
                </div>

                {pointsDiscountValue > 0 && (
                  <div className="flex justify-between text-xs text-[#F43F5E] font-bold">
                    <span>Diskon Poin ({pointsToRedeem} pts)</span>
                    <span className="font-mono">-{formatRupiah(pointsDiscountValue)}</span>
                  </div>
                )}

                {/* Toggle PPN */}
                <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-pink-100/60">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={taxEnabled}
                      onChange={(e) => setTaxEnabled(e.target.checked)}
                      className="rounded text-[#F43F5E] focus:ring-[#F43F5E]"
                    />
                    <span>PPN (11%)</span>
                  </label>
                  <span className="font-mono">{taxEnabled ? formatRupiah(cartTax) : 'Rp 0'}</span>
                </div>

                {/* Info Kas Keluar / Beli Stok Hari Ini */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-pink-100/60">
                  <div className="flex items-center gap-1 text-[11px]">
                    <ArrowDownCircle className="w-3 h-3 text-[#F43F5E]" />
                    <span>Kas Keluar Toko:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsExpenseModalOpen(true)}
                    className="text-[11px] font-bold text-[#F43F5E] hover:underline cursor-pointer"
                  >
                    {todayExpenseTotal > 0 ? `-${formatRupiah(todayExpenseTotal)} (+Catat)` : '+ Catat Beli Stok'}
                  </button>
                </div>

                <div className="pt-2 border-t border-pink-100 flex justify-between items-baseline">
                  <div>
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Total Bayar
                    </span>
                  </div>
                  <div className="text-lg font-black text-[#F43F5E] font-mono">
                    {formatRupiah(cartTotal)}
                  </div>
                </div>

                {/* Tombol Bayar */}
                <button
                  disabled={cart.length === 0}
                  onClick={() => setIsPaymentModalOpen(true)}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-2 mt-2 shadow-md ${
                    cart.length === 0
                      ? 'bg-slate-200 cursor-not-allowed text-slate-400'
                      : 'bg-[#F43F5E] hover:bg-[#E11D48] active:scale-[0.99] cursor-pointer shadow-pink-500/20'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Bayar Sekarang ({formatRupiah(cartTotal)})</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FLOATING ACTION PILL: Muncul saat keranjang ditutup tapi sudah ada produk yang dipilih */}
      {!isCartOpen && cart.length > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 max-w-md w-11/12 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-2.5 px-3.5 shadow-2xl flex items-center justify-between border border-pink-500/30 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div 
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-[#F43F5E] flex items-center justify-center font-bold text-xs shadow-xs text-white">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold">
                {totalCartCount} Item di Keranjang
              </div>
              <div className="text-xs font-black font-mono text-pink-300">
                {formatRupiah(cartTotal)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCartOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              Buka Keranjang
            </button>
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#F43F5E] hover:bg-[#E11D48] text-white transition-colors shadow-xs cursor-pointer"
            >
              Bayar
            </button>
          </div>
        </div>
      )}

      {/* Camera Live Barcode Scanner Modal */}
      {isCameraScannerOpen && (
        <CameraScannerModal
          isOpen={isCameraScannerOpen}
          onClose={() => setIsCameraScannerOpen(false)}
          onDetectedProduct={(prod: Product) => {
            addToCart(prod, 1);
          }}
          mode="scan"
        />
      )}

      {/* Payment Options Modal */}
      {isPaymentModalOpen && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
        />
      )}

      {/* Printable Receipt Modal */}
      {isReceiptModalOpen && (
        <ReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
        />
      )}

      {/* Cash Expense Modal (Pengeluaran Kas / Pembelian Stok) */}
      {isExpenseModalOpen && (
        <CashExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
        />
      )}
    </div>
  );
};
