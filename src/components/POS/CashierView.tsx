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
import { CartView } from './CartView';
import { MultiCartBar } from './MultiCartBar';

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
    activePosTab,
    setActivePosTab,
    activeCartSession,
    cartSessions,
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

  // 1. JIKA MODE TAB KERANJANG AKTIF: TAMPILKAN HALAMAN KHUSUS KERANJANG BELANJA (TIDAK DI BAWAH)
  if (activePosTab === 'cart') {
    return (
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-2.5 sm:py-5 text-black">
        {/* Tab Navigasi Atas: Mudah Beralih Antara Katalog & Keranjang */}
        <div className="max-w-4xl mx-auto mb-3 bg-white p-1 rounded-2xl border border-[#FCE4E8] shadow-2xs flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setActivePosTab('catalog')}
            className="flex-1 py-2 sm:py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer text-stone-700 hover:text-black hover:bg-[#FCE8EB]"
          >
            <Package className="w-4 h-4 text-stone-500" />
            <span>Katalog Produk</span>
          </button>
          <button
            type="button"
            onClick={() => setActivePosTab('cart')}
            className="flex-1 py-2 sm:py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer bg-[#800020] text-white shadow-2xs"
          >
            <ShoppingCart className="w-4 h-4 text-white" />
            <span>Keranjang ({activeCartSession.name})</span>
            {totalCartCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white text-[#800020]">
                {totalCartCount} item • {formatRupiah(cartTotal)}
              </span>
            )}
          </button>
        </div>

        {/* Halaman Khusus Keranjang Belanja */}
        <CartView onBackToCatalog={() => setActivePosTab('catalog')} />

        {/* Printable Receipt Modal */}
        {isReceiptModalOpen && (
          <ReceiptModal
            isOpen={isReceiptModalOpen}
            onClose={() => setIsReceiptModalOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-2.5 sm:py-5 text-black">
      
      {/* Tab Navigasi Atas: Mudah Beralih Antara Katalog & Keranjang */}
      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-2.5 bg-white p-1 rounded-2xl border border-[#FCE4E8] shadow-2xs">
        <button
          type="button"
          onClick={() => setActivePosTab('catalog')}
          className="flex-1 py-2 sm:py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer bg-[#800020] text-white shadow-2xs"
        >
          <Package className="w-4 h-4 text-white" />
          <span>Katalog Produk</span>
        </button>

        <button
          type="button"
          onClick={() => setActivePosTab('cart')}
          className="flex-1 py-2 sm:py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer text-stone-700 hover:text-black hover:bg-[#FCE8EB] relative"
        >
          <ShoppingCart className="w-4 h-4 text-stone-600" />
          <span>Keranjang ({activeCartSession.name})</span>
          {totalCartCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#800020] text-white">
              {totalCartCount} item • {formatRupiah(cartTotal)}
            </span>
          )}
        </button>
      </div>

      {/* Bar Antrean Multi-Pelanggan (Bisa Simpan Keranjang Banyak Orang Sekaligus) */}
      <MultiCartBar compact />

      <div className={`grid grid-cols-1 ${isCartOpen ? 'lg:grid-cols-12' : 'grid-cols-1'} gap-3 sm:gap-5 items-start`}>
        
        {/* Kolom Katalog Produk */}
        <div className={`${isCartOpen ? 'lg:col-span-7 xl:col-span-8' : 'w-full'} space-y-2 sm:space-y-3.5`}>
          
          {/* Top Bar: Search, Kamera Barcode, Toggle Density HP, & Icon Keranjang */}
          <div className="space-y-2">
            <div className="flex gap-1.5 sm:gap-2 items-center">
              
              {/* Search Bar Minimalis */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Cari cetakan, loyang, alat masak, barcode..."
                  className="w-full pl-8 sm:pl-9 pr-7 sm:pr-8 py-1.5 sm:py-2 text-xs rounded-xl sm:rounded-2xl border border-[#FCE4E8] bg-white text-black placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-[#800020] shadow-2xs font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-black cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Kamera Barcode Scanner Trigger */}
              <button
                onClick={() => setIsCameraScannerOpen(true)}
                className="p-1.5 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl font-bold text-xs bg-[#FCE8EB] text-[#800020] border border-[#F8CCD4] hover:bg-[#F8CCD4] transition-all flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
                title="Buka Kamera Barcode"
              >
                <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden md:inline">Scan</span>
              </button>

              {/* Tombol Catat Kas Keluar / Pengeluaran (Beli Stok / Operasional) */}
              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="p-1.5 sm:px-2.5 sm:py-2 rounded-xl sm:rounded-2xl font-bold text-xs bg-[#FCE8EB] hover:bg-[#F8CCD4] text-[#800020] border border-[#F8CCD4] transition-all flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
                title="Catat Kas Keluar (Beli Stok / Operasional Toko)"
              >
                <ArrowDownCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#800020]" />
                <span className="hidden sm:inline">Kas Keluar</span>
                {todayExpenseTotal > 0 && (
                  <span className="text-[10px] bg-[#800020] text-white font-mono font-bold px-1.5 py-0.2 rounded-full hidden md:inline">
                    -{formatRupiah(todayExpenseTotal)}
                  </span>
                )}
              </button>

              {/* Toggle Mode Tampilan HP: Kompak (10+ Produk) vs Grid Mini */}
              <button
                onClick={() => setViewDensity(viewDensity === 'compact' ? 'grid' : 'compact')}
                className={`p-1.5 sm:px-2.5 sm:py-2 rounded-xl sm:rounded-2xl font-bold text-xs border transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                  viewDensity === 'compact'
                    ? 'bg-[#FCE8EB] text-[#800020] border-[#F8CCD4]'
                    : 'bg-white text-black border-[#FCE4E8] hover:bg-[#FCE8EB]'
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

              {/* FITUR KHUSUS ICON KERANJANG */}
              <button
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    setActivePosTab('cart');
                  } else {
                    setIsCartOpen(!isCartOpen);
                  }
                }}
                className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl font-bold text-xs transition-all flex items-center gap-1.5 sm:gap-2 shadow-sm cursor-pointer shrink-0 ${
                  isCartOpen
                    ? 'bg-black text-white hover:bg-stone-900'
                    : 'bg-[#800020] hover:bg-[#660019] text-white shadow-rose-950/20 active:scale-95'
                }`}
                title={isCartOpen ? 'Tutup Panel Keranjang' : 'Buka Halaman / Panel Keranjang'}
              >
                <div className="relative">
                  <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {totalCartCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-3.5 h-3.5 px-0.5 bg-white text-[#800020] rounded-full text-[8px] sm:text-[9px] font-black flex items-center justify-center shadow-xs">
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
                      ? 'bg-[#800020] text-white shadow-2xs font-bold'
                      : 'bg-white text-black hover:bg-[#FCE8EB] border border-[#FCE4E8]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid / List Produk */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#FCE4E8] p-8 text-center">
              <Search className="w-7 h-7 text-stone-400 mx-auto mb-2 opacity-50" />
              <h4 className="text-xs sm:text-sm font-bold text-black">
                Produk Tidak Ditemukan
              </h4>
              <p className="text-[11px] text-stone-600 mt-0.5">
                Ubah kata kunci pencarian atau pilih kategori lain.
              </p>
            </div>
          ) : viewDensity === 'compact' ? (
            /* MODE 1 (DEFAULT HP): Ultra-Kompak */
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
                        ? 'opacity-50 cursor-not-allowed bg-stone-100 border-stone-200'
                        : 'bg-white border-[#FCE4E8] hover:border-[#800020] hover:shadow-xs active:scale-[0.98]'
                    }`}
                  >
                    {/* Visual Foto Produk */}
                    <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-[#FFF5F5] overflow-hidden shrink-0 border border-[#FCE4E8] flex items-center justify-center">
                      <Package className="w-4 h-4 text-[#F8CCD4] absolute pointer-events-none" />
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
                        <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full bg-[#800020]" title="Shopee Sync" />
                      )}
                    </div>

                    {/* Info Produk Ringkas: Nama & Harga */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="text-[11px] sm:text-xs font-extrabold text-black truncate leading-tight group-hover:text-[#800020] transition-colors">
                          {product.name}
                        </h3>
                        <span className="text-[9px] font-mono text-stone-600 font-bold shrink-0">
                          {isOutOfStock ? '0' : product.stock}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10.5px] sm:text-xs font-black font-mono text-[#800020] leading-none">
                          {formatRupiah(product.sellPrice)}
                        </span>
                        <div className="w-4 h-4 rounded bg-[#FCE8EB] group-hover:bg-[#800020] group-hover:text-white text-[#800020] flex items-center justify-center shrink-0 transition-colors">
                          <Plus className="w-2.5 h-2.5" />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* MODE 2: Grid Mini */
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
                        ? 'opacity-60 cursor-not-allowed bg-stone-100 border-stone-200'
                        : 'bg-white border-[#FCE4E8] hover:border-[#800020] hover:shadow-xs active:scale-[0.98]'
                    }`}
                  >
                    <div className="relative w-full h-14 sm:h-16 bg-[#FFF5F5] overflow-hidden shrink-0 flex items-center justify-center">
                      <Package className="w-5 h-5 text-[#F8CCD4] absolute pointer-events-none" />
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
                        <div className="absolute top-1 left-1 px-1 py-0.2 rounded bg-white/90 backdrop-blur-xs text-[7px] font-bold text-[#800020] border border-[#F8CCD4]">
                          Shopee
                        </div>
                      )}

                      {/* Stock Pill Minimalis */}
                      <div className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/75 backdrop-blur-xs text-[8px] font-mono text-white">
                        {isOutOfStock ? 'Habis' : `${product.stock} ${product.unit}`}
                      </div>
                    </div>

                    {/* Info Produk Ringkas */}
                    <div className="p-1.5 flex-1 flex flex-col justify-between">
                      <h3 className="text-[11px] font-extrabold text-black line-clamp-1 leading-tight group-hover:text-[#800020] transition-colors">
                        {product.name}
                      </h3>

                      <div className="mt-1 pt-1 border-t border-[#FCE4E8] flex items-center justify-between">
                        <span className="text-[10.5px] font-black font-mono text-[#800020]">
                          {formatRupiah(product.sellPrice)}
                        </span>
                        <div className="w-4 h-4 rounded-md bg-[#FCE8EB] group-hover:bg-[#800020] group-hover:text-white text-[#800020] flex items-center justify-center transition-colors">
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

        {/* Kolom Keranjang Kasir (Khusus Layar Desktop lg+, di HP menggunakan Halaman Khusus) */}
        {isCartOpen && (
          <div className="hidden lg:block lg:col-span-5 xl:col-span-4 sticky top-20 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-white rounded-3xl border border-[#FCE4E8] shadow-xl overflow-hidden flex flex-col">
              
              {/* Header Keranjang dengan Tombol Tutup (X) */}
              <div className="px-4 py-3 border-b border-[#FCE4E8] flex items-center justify-between bg-[#FFF5F5]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-[#800020] text-white flex items-center justify-center">
                    <ShoppingCart className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-black leading-tight">
                      Keranjang Kasir
                    </h3>
                    <span className="text-[10px] font-mono text-stone-600">
                      {totalCartCount} item pesanan
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Buka Layar Penuh Dedicated */}
                  <button
                    onClick={() => setActivePosTab('cart')}
                    className="px-2 py-1 rounded-xl text-stone-700 hover:text-[#800020] hover:bg-[#FCE8EB] text-[10px] font-bold border border-[#FCE4E8] transition-colors cursor-pointer"
                    title="Buka Halaman Khusus Keranjang Belanja"
                  >
                    Layar Penuh
                  </button>

                  {cart.length > 0 && (
                    isConfirmingClearCart ? (
                      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-rose-300">
                        <button
                          onClick={handleClearCart}
                          className="px-2 py-0.5 text-[10px] font-bold bg-[#800020] text-white rounded-lg hover:bg-[#660019] cursor-pointer"
                        >
                          Ya, Kosongkan
                        </button>
                        <button
                          onClick={() => setIsConfirmingClearCart(false)}
                          className="px-1.5 py-0.5 text-[10px] text-stone-600 hover:text-black cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsConfirmingClearCart(true)}
                        className="p-1.5 rounded-xl text-stone-600 hover:text-[#800020] hover:bg-[#FCE8EB] transition-colors cursor-pointer"
                        title="Kosongkan Keranjang"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )
                  )}

                  {/* Tombol Tutup Keranjang */}
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="p-1.5 rounded-xl text-stone-600 hover:text-black hover:bg-[#FCE8EB] transition-colors cursor-pointer"
                    title="Tutup Keranjang"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Status Aman Data Otomatis */}
              <div className="px-3.5 py-1.5 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between text-[10px] text-emerald-900">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-700 shrink-0" />
                  <span className="font-bold">Tersimpan Otomatis</span>
                </div>
                <span className="font-mono text-stone-600 text-[10px] font-semibold">
                  Kasir: {currentUser.name.split(' ')[0]}
                </span>
              </div>

              {/* Pelanggan / Member CRM */}
              <div className="p-3 border-b border-[#FCE4E8] bg-[#FFF8F8]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-black">
                    Pelanggan:
                  </span>
                  {selectedCustomer ? (
                    <button
                      onClick={() => {
                        setSelectedCustomer(null);
                        setPointsToRedeem(0);
                      }}
                      className="text-[11px] text-stone-600 hover:text-[#800020] font-semibold cursor-pointer"
                    >
                      Ganti
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                      className="text-xs text-[#800020] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Pilih Member
                    </button>
                  )}
                </div>

                {selectedCustomer ? (
                  <div className="mt-2 p-2 bg-white rounded-xl border border-[#FCE4E8] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-black flex items-center gap-1.5">
                        <span>{selectedCustomer.name}</span>
                        <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.2 rounded bg-[#FCE8EB] text-[#800020]">
                          {selectedCustomer.tier}
                        </span>
                      </div>
                      <div className="text-[10px] text-stone-600">
                        Saldo: <strong className="text-[#800020] font-mono">{selectedCustomer.points} Poin</strong>
                      </div>
                    </div>

                    {selectedCustomer.points > 0 && (
                      <div>
                        {pointsToRedeem > 0 ? (
                          <button
                            onClick={() => setPointsToRedeem(0)}
                            className="px-2 py-1 text-[10px] font-bold bg-[#FCE8EB] text-[#800020] rounded-lg cursor-pointer"
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
                            className="px-2.5 py-1 text-[10px] font-bold bg-[#800020] text-white rounded-lg hover:bg-[#660019] cursor-pointer"
                          >
                            Tukar Poin
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : isCustomerDropdownOpen ? (
                  <div className="mt-2 space-y-1 max-h-36 overflow-y-auto bg-white p-1.5 rounded-xl border border-[#FCE4E8] shadow-md">
                    {customers.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedCustomer(c);
                          setIsCustomerDropdownOpen(false);
                        }}
                        className="w-full text-left p-1.5 rounded-lg hover:bg-[#FFF5F5] text-xs flex justify-between items-center cursor-pointer"
                      >
                        <span className="font-bold text-black truncate">
                          {c.name}
                        </span>
                        <span className="text-[10px] font-mono text-[#800020] font-bold">
                          {c.points} Pts
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Daftar Item Keranjang */}
              <div className="p-3 max-h-64 overflow-y-auto space-y-2.5 flex-1 divide-y divide-[#FCE4E8]">
                {cart.length === 0 ? (
                  <div className="py-8 text-center">
                    <ShoppingBag className="w-8 h-8 text-[#F8CCD4] mx-auto mb-2" />
                    <p className="text-xs font-bold text-black">
                      Keranjang masih kosong
                    </p>
                    <p className="text-[11px] text-stone-600 mt-0.5">
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
                        className="w-9 h-9 rounded-lg object-cover shrink-0 border border-[#FCE4E8]"
                      />

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-black truncate">
                          {item.product.name}
                        </h4>
                        <div className="text-[10px] text-[#800020] font-mono font-bold">
                          {formatRupiah(item.product.sellPrice)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => updateCartQty(item.product.id, item.qty - 1)}
                          className="w-5 h-5 rounded-md bg-[#FCE8EB] hover:bg-[#F8CCD4] flex items-center justify-center text-[#800020] font-bold cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center text-xs font-bold font-mono text-black">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateCartQty(item.product.id, item.qty + 1)}
                          className="w-5 h-5 rounded-md bg-[#FCE8EB] hover:bg-[#F8CCD4] flex items-center justify-center text-[#800020] font-bold cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right shrink-0 min-w-[65px]">
                        <div className="text-xs font-bold text-black font-mono">
                          {formatRupiah(item.product.sellPrice * item.qty)}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-[9px] text-[#800020] hover:underline font-bold cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Rincian Total & Tombol Pembayaran */}
              <div className="p-3.5 bg-[#FFF8F8] border-t border-[#FCE4E8] space-y-1.5">
                <div className="flex justify-between text-xs text-stone-700 font-semibold">
                  <span>Subtotal</span>
                  <span className="font-mono font-bold text-black">{formatRupiah(cartSubtotal)}</span>
                </div>

                {pointsDiscountValue > 0 && (
                  <div className="flex justify-between text-xs text-[#800020] font-bold">
                    <span>Diskon Poin ({pointsToRedeem} pts)</span>
                    <span className="font-mono">-{formatRupiah(pointsDiscountValue)}</span>
                  </div>
                )}

                {/* Toggle PPN */}
                <div className="flex items-center justify-between text-xs text-stone-700 pt-1 border-t border-[#FCE4E8]">
                  <label className="flex items-center gap-1.5 cursor-pointer font-semibold">
                    <input
                      type="checkbox"
                      checked={taxEnabled}
                      onChange={(e) => setTaxEnabled(e.target.checked)}
                      className="rounded accent-[#800020] text-[#800020] focus:ring-[#800020]"
                    />
                    <span>PPN (11%)</span>
                  </label>
                  <span className="font-mono font-bold text-black">{taxEnabled ? formatRupiah(cartTax) : 'Rp 0'}</span>
                </div>

                {/* Info Kas Keluar / Beli Stok Hari Ini */}
                <div className="flex items-center justify-between text-xs text-stone-700 pt-1 border-t border-[#FCE4E8]">
                  <div className="flex items-center gap-1 text-[11px] font-semibold">
                    <ArrowDownCircle className="w-3 h-3 text-[#800020]" />
                    <span>Kas Keluar Toko:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsExpenseModalOpen(true)}
                    className="text-[11px] font-bold text-[#800020] hover:underline cursor-pointer"
                  >
                    {todayExpenseTotal > 0 ? `-${formatRupiah(todayExpenseTotal)} (+Catat)` : '+ Catat Beli Stok'}
                  </button>
                </div>

                <div className="pt-2 border-t border-[#FCE4E8] flex justify-between items-baseline">
                  <div>
                    <span className="text-xs font-black text-black uppercase tracking-wider">
                      Total Bayar
                    </span>
                  </div>
                  <div className="text-xl font-black text-[#800020] font-mono">
                    {formatRupiah(cartTotal)}
                  </div>
                </div>

                {/* Tombol Bayar */}
                <button
                  disabled={cart.length === 0}
                  onClick={() => setIsPaymentModalOpen(true)}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-2 mt-2 shadow-md ${
                    cart.length === 0
                      ? 'bg-stone-300 cursor-not-allowed text-stone-500'
                      : 'bg-[#800020] hover:bg-[#660019] active:scale-[0.99] cursor-pointer shadow-rose-950/20'
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

      {/* FLOATING ACTION PILL UNTUK HP & DESKTOP (AKSES LANGSUNG KE HALAMAN KERANJANG) */}
      {/* 1. Mobile Pill: Selalu muncul jika ada isi keranjang saat browsing katalog */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-30 max-w-md w-[92%] bg-black/95 backdrop-blur-md text-white rounded-2xl p-2.5 px-3.5 shadow-2xl flex items-center justify-between border border-[#800020]/60 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div 
            onClick={() => setActivePosTab('cart')}
            className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
          >
            <div className="w-8 h-8 rounded-xl bg-[#800020] flex items-center justify-center font-bold text-xs shadow-xs text-white shrink-0">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold truncate flex items-center gap-1.5">
                <span>{activeCartSession.name} ({totalCartCount} item)</span>
                {cartSessions.length > 1 && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/20 text-pink-100 font-bold shrink-0">
                    {cartSessions.length} Antrean
                  </span>
                )}
              </div>
              <div className="text-xs font-black font-mono text-[#FCE8EB]">
                {formatRupiah(cartTotal)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActivePosTab('cart')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#800020] hover:bg-[#660019] text-white transition-colors shadow-xs cursor-pointer active:scale-95"
            >
              Lihat Keranjang
            </button>
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white text-black hover:bg-stone-200 transition-colors shadow-xs cursor-pointer"
            >
              Bayar
            </button>
          </div>
        </div>
      )}

      {/* 2. Desktop Pill: Muncul jika panel samping ditutup dan ada item di keranjang */}
      {!isCartOpen && cart.length > 0 && (
        <div className="hidden lg:flex fixed bottom-5 left-1/2 -translate-x-1/2 z-30 max-w-md w-11/12 bg-black/95 backdrop-blur-md text-white rounded-2xl p-2.5 px-3.5 shadow-2xl items-center justify-between border border-[#800020]/60 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div 
            onClick={() => setActivePosTab('cart')}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-[#800020] flex items-center justify-center font-bold text-xs shadow-xs text-white">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold flex items-center gap-1.5">
                <span>{activeCartSession.name} ({totalCartCount} item)</span>
                {cartSessions.length > 1 && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/20 text-pink-100 font-bold">
                    {cartSessions.length} Antrean
                  </span>
                )}
              </div>
              <div className="text-xs font-black font-mono text-[#FCE8EB]">
                {formatRupiah(cartTotal)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActivePosTab('cart')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              Buka Keranjang
            </button>
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#800020] hover:bg-[#660019] text-white transition-colors shadow-xs cursor-pointer"
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
