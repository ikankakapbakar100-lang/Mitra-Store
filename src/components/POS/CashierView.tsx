/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { usePOS } from '../../context/POSContext';
import { Product } from '../../types/pos';
import { formatRupiah } from '../../utils/format';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus,
  LayoutGrid,
  Grid,
  List,
  Table,
  Package,
  ArrowDownCircle,
  Check,
  Hash,
  X,
  ChevronRight
} from 'lucide-react';
import { ReceiptModal } from './ReceiptModal';
import { CashExpenseModal } from './CashExpenseModal';
import { CartView } from './CartView';

type LayoutMode = 'grid-lg' | 'grid-sm' | 'list' | 'table';

export const CashierView: React.FC = () => {
  const {
    products,
    categories,
    cart,
    addToCart,
    updateCartQty,
    removeFromCart,
    cartTotal,
    isReceiptModalOpen,
    setIsReceiptModalOpen,
    isExpenseModalOpen,
    setIsExpenseModalOpen,
    expenses,
    activePosTab,
    setActivePosTab,
    activeCartSession,
  } = usePOS();

  // Hari ini total pengeluaran kas
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
  
  // 4 Mode Tampilan Susunan Katalog:
  // 1. 'grid-lg': Grid Foto Besar (Visual Menonjol)
  // 2. 'grid-sm': Grid Kompak (Rapat & Ringkas)
  // 3. 'list': Daftar Baris Horizontal (Lengkap dengan Kontrol Qty)
  // 4. 'table': Tabel Rapat (Kasir Cepat & Barcode Scan)
  const [viewDensity, setViewDensity] = useState<LayoutMode>('grid-lg');

  // Modal Khusus Ketik Jumlah yang Akan Dijual Langsung
  const [qtyModalProduct, setQtyModalProduct] = useState<Product | null>(null);
  const [modalQtyValue, setModalQtyValue] = useState<string>('1');
  const modalInputRef = useRef<HTMLInputElement>(null);

  const getOptimizedThumb = (url?: string) => {
    if (!url) return 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=300&q=80';
    if (url.includes('unsplash.com')) {
      const base = url.split('?')[0];
      return `${base}?auto=format&fit=crop&w=300&q=80`;
    }
    return url;
  };

  const totalCartCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.qty, 0);
  }, [cart]);

  // Map jumlah produk yang ada di keranjang aktif
  const cartQtyMap = useMemo(() => {
    const map: { [productId: string]: number } = {};
    cart.forEach((item) => {
      map[item.product.id] = item.qty;
    });
    return map;
  }, [cart]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Set kuantitas langsung secara aman (typeable qty)
  const handleDirectSetQty = (product: Product, targetQty: number) => {
    if (targetQty <= 0) {
      removeFromCart(product.id);
    } else {
      const clamped = Math.min(targetQty, product.stock);
      const existing = cart.find((item) => item.product.id === product.id);
      if (existing) {
        updateCartQty(product.id, clamped);
      } else {
        addToCart(product, clamped);
      }
    }
  };

  // Buka modal ketik kuantitas untuk produk tertentu
  const openQtyModal = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const currentInCart = cartQtyMap[product.id] || 1;
    setQtyModalProduct(product);
    setModalQtyValue(String(currentInCart));
  };

  useEffect(() => {
    if (qtyModalProduct && modalInputRef.current) {
      modalInputRef.current.focus();
      modalInputRef.current.select();
    }
  }, [qtyModalProduct]);

  const handleApplyModalQty = () => {
    if (!qtyModalProduct) return;
    const num = parseInt(modalQtyValue, 10);
    if (!isNaN(num) && num > 0) {
      handleDirectSetQty(qtyModalProduct, num);
    } else if (num === 0) {
      removeFromCart(qtyModalProduct.id);
    }
    setQtyModalProduct(null);
  };

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

  // 1. JIKA MODE TAB KERANJANG AKTIF: TAMPILKAN HALAMAN KHUSUS KERANJANG BELANJA
  if (activePosTab === 'cart') {
    return (
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-2.5 sm:py-5 text-black">
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

  // 2. MODE KATALOG PRODUK: DOMINAN DAFTAR IMAGE PRODUK JUALAN
  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-2 sm:py-4 text-black">
      
      {/* Top Controls: Search Bar Diperkecil, Tombol Kas Keluar Simbolik, 4 Pola Susunan, & Opsi Pemisah Halaman */}
      <div className="mb-2.5 space-y-2 bg-white/95 backdrop-blur-md p-2 sm:p-2.5 rounded-2xl sm:rounded-3xl border border-[#FCE4E8] shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
          
          {/* Zona Kiri: Kolom Search Produk Diperkecil & Kas Keluar Simbolik */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
            {/* Search Bar Minimalis & Kompak (Tidak Memakan Seluruh Lebar) */}
            <div className="relative w-36 sm:w-52 md:w-64 shrink-0">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Cari produk / SKU..."
                className="w-full pl-7 sm:pl-8 pr-6 sm:pr-7 py-1.5 text-xs rounded-xl border border-[#FCE4E8] bg-white text-black placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#800020] shadow-2xs font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-black cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>

            {/* Tombol Catat Kas Keluar (Lebih Simbolik tapi Tetap Jelas & Menampilkan Detail Pengeluaran Hari Ini) */}
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl font-bold text-xs bg-[#FFF0F3] hover:bg-[#FCE8EB] text-[#800020] border border-[#FCE4E8] transition-all flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer active:scale-95"
              title={`Catat Kas Keluar (Pengeluaran Hari Ini: ${formatRupiah(todayExpenseTotal)})`}
            >
              <ArrowDownCircle className="w-4 h-4 text-[#800020]" />
              <span className="hidden sm:inline font-bold text-[11px] sm:text-xs">Kas Keluar</span>
              {todayExpenseTotal > 0 && (
                <span className="text-[10px] bg-[#800020] text-white font-mono font-bold px-1.5 py-0.2 rounded-full">
                  -{formatRupiah(todayExpenseTotal)}
                </span>
              )}
            </button>
          </div>

          {/* Zona Kanan: Pengatur Pola Susunan Produk (4 Mode) & Opsi Pemisah Halaman Simbolik */}
          <div className="flex items-center gap-1.5 shrink-0">
            
            {/* Segmented Controller: 4 Pola Susunan Produk untuk Berbagai Ukuran Layar */}
            <div className="flex items-center p-0.5 bg-stone-100/90 rounded-xl border border-stone-200/80 shadow-2xs">
              {/* Mode 1: Grid Foto Besar */}
              <button
                type="button"
                onClick={() => setViewDensity('grid-lg')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewDensity === 'grid-lg'
                    ? 'bg-[#800020] text-white shadow-xs'
                    : 'text-stone-600 hover:text-black hover:bg-white/80'
                }`}
                title="Pola 1: Grid Foto Besar (Visual Jelas untuk Tablet & Komputer)"
              >
                <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              {/* Mode 2: Grid Kompak */}
              <button
                type="button"
                onClick={() => setViewDensity('grid-sm')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewDensity === 'grid-sm'
                    ? 'bg-[#800020] text-white shadow-xs'
                    : 'text-stone-600 hover:text-black hover:bg-white/80'
                }`}
                title="Pola 2: Grid Kompak (Rapat & Muat Banyak di Layar Kecil)"
              >
                <Grid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              {/* Mode 3: Daftar Baris Horizontal */}
              <button
                type="button"
                onClick={() => setViewDensity('list')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewDensity === 'list'
                    ? 'bg-[#800020] text-white shadow-xs'
                    : 'text-stone-600 hover:text-black hover:bg-white/80'
                }`}
                title="Pola 3: Daftar Baris (Lengkap dengan Kontrol Qty Langsung)"
              >
                <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              {/* Mode 4: Tabel Kasir Rapat */}
              <button
                type="button"
                onClick={() => setViewDensity('table')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewDensity === 'table'
                    ? 'bg-[#800020] text-white shadow-xs'
                    : 'text-stone-600 hover:text-black hover:bg-white/80'
                }`}
                title="Pola 4: Tabel Rapat (Kasir Cepat & Scan Barcode)"
              >
                <Table className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>

            {/* TOMBOL OPSI PEMISAH HALAMAN (KATALOG VS KERANJANG) - SIMBOLIK TANPA TEKS */}
            <div className="flex items-center p-0.5 bg-white rounded-xl border border-[#FCE4E8] shadow-2xs">
              {/* Simbol Katalog (Aktif) */}
              <button
                type="button"
                onClick={() => setActivePosTab('catalog')}
                className="p-1.5 sm:p-2 rounded-lg transition-all cursor-pointer bg-[#800020] text-white shadow-xs"
                title="Halaman Katalog Produk (Aktif)"
              >
                <Package className="w-4 h-4" />
              </button>

              {/* Simbol Keranjang Belanja Pelanggan (Dengan Badge Jumlah Item) */}
              <button
                type="button"
                onClick={() => setActivePosTab('cart')}
                className="p-1.5 sm:p-2 rounded-lg transition-all cursor-pointer text-stone-600 hover:text-[#800020] hover:bg-[#FFF0F3] relative"
                title={`Buka Keranjang (${activeCartSession.name})`}
              >
                <ShoppingCart className="w-4 h-4" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full text-[9px] font-black bg-[#800020] text-white flex items-center justify-center border-2 border-white animate-in zoom-in-75 duration-150">
                    {totalCartCount > 99 ? '99+' : totalCartCount}
                  </span>
                )}
              </button>
            </div>

          </div>
        </div>

        {/* Susunan Kategori Produk Yang Dioptimalkan Ukurannya (Hemat Ruang Layar) */}
        <div className="flex items-center gap-1 overflow-x-auto pt-0.5 pb-0.5 scrollbar-none border-t border-[#FCE4E8]/60">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 text-[11px] sm:text-xs font-semibold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#800020] text-white shadow-2xs font-bold'
                  : 'bg-white text-stone-700 hover:text-black hover:bg-[#FCE8EB] border border-[#FCE4E8]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* DAFTAR IMAGE PRODUK JUALAN SESUAI POLA SUSUNAN TERPILIH */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-[#FCE4E8] p-10 text-center shadow-xs">
          <Search className="w-8 h-8 text-stone-400 mx-auto mb-2 opacity-50" />
          <h4 className="text-sm font-bold text-black">
            Produk Tidak Ditemukan
          </h4>
          <p className="text-xs text-stone-500 mt-1">
            Ubah kata kunci pencarian atau pilih kategori lain.
          </p>
        </div>
      ) : viewDensity === 'grid-lg' ? (
        
        /* POLA 1: GRID FOTO BESAR (Visual Sangat Menonjol + Fitur Ketik Qty Langsung) */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5 pb-8">
          {filteredProducts.map((product) => {
            const isOutOfStock = product.stock <= 0;
            const inCartQty = cartQtyMap[product.id] || 0;

            return (
              <div
                key={product.id}
                className={`group rounded-2xl border text-left overflow-hidden bg-white/95 backdrop-blur-md transition-all flex flex-col justify-between select-none relative ${
                  isOutOfStock
                    ? 'opacity-60 bg-stone-100/90 border-stone-200'
                    : 'border-[#FCE4E8] hover:border-[#800020] hover:shadow-md'
                }`}
              >
                {/* Visual Image Produk Dominan (Klik foto menambah 1) */}
                <div 
                  onClick={() => !isOutOfStock && addToCart(product, 1)}
                  className={`relative w-full aspect-square sm:aspect-4/3 bg-[#FFF5F5] overflow-hidden flex items-center justify-center ${
                    isOutOfStock ? 'cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  title={isOutOfStock ? 'Stok Habis' : `Klik untuk tambah 1 ${product.name}`}
                >
                  <Package className="w-8 h-8 text-[#F8CCD4] absolute pointer-events-none" />
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

                  {/* Stock Pill Minimalis */}
                  <div className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-lg text-[9px] font-mono font-bold z-2 backdrop-blur-xs ${
                    isOutOfStock
                      ? 'bg-rose-600 text-white'
                      : product.stock <= product.minStock
                      ? 'bg-amber-500 text-white'
                      : 'bg-black/75 text-white'
                  }`}>
                    {isOutOfStock ? 'Habis' : `${product.stock} ${product.unit}`}
                  </div>

                  {/* Indikator Item Sudah di Keranjang Aktif */}
                  {inCartQty > 0 && (
                    <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-lg bg-[#800020] text-white text-[10px] font-black font-mono shadow-xs z-2 flex items-center gap-1">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                      <span>{inCartQty} di keranjang</span>
                    </div>
                  )}
                </div>

                {/* Detail Produk: Judul, Harga, & Kontrol Qty yang Dapat Diketik */}
                <div className="p-2 sm:p-2.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-black line-clamp-2 leading-tight group-hover:text-[#800020] transition-colors mb-1">
                      {product.name}
                    </h3>
                    <div className="text-xs sm:text-sm font-black font-mono text-[#800020]">
                      {formatRupiah(product.sellPrice)}
                    </div>
                  </div>

                  {/* Bagian Kontrol Jumlah: Dapat Ketik Angka Langsung */}
                  <div className="pt-2 border-t border-[#FCE4E8] mt-2">
                    {inCartQty > 0 ? (
                      <div className="flex items-center justify-between gap-1 bg-[#FFF0F3] p-1 rounded-xl border border-[#FCE4E8]">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDirectSetQty(product, inCartQty - 1);
                          }}
                          className="w-6 h-6 rounded-lg bg-white hover:bg-stone-200 text-black flex items-center justify-center font-bold text-xs cursor-pointer active:scale-90"
                          title="Kurangi 1"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        
                        {/* Input Ketik Jumlah Jual Langsung */}
                        <input
                          type="number"
                          min="0"
                          max={product.stock}
                          value={inCartQty}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            handleDirectSetQty(product, isNaN(val) ? 0 : val);
                          }}
                          className="w-10 text-center font-black font-mono text-xs bg-white rounded-md border border-[#FCE4E8] py-0.5 focus:outline-none focus:ring-1 focus:ring-[#800020]"
                          title="Ketik jumlah yang dibeli langsung di sini"
                        />

                        <button
                          type="button"
                          disabled={inCartQty >= product.stock}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDirectSetQty(product, inCartQty + 1);
                          }}
                          className="w-6 h-6 rounded-lg bg-[#800020] hover:bg-[#660019] disabled:opacity-40 text-white flex items-center justify-center font-bold text-xs cursor-pointer active:scale-90"
                          title="Tambah 1"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => addToCart(product, 1)}
                          className="flex-1 py-1 px-2 rounded-xl bg-[#FCE8EB] hover:bg-[#800020] hover:text-white text-[#800020] disabled:opacity-40 transition-colors font-bold text-xs flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                          title="Tambah 1 ke Keranjang"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Pilih</span>
                        </button>

                        {/* Tombol Ketik Qty Langsung */}
                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={(e) => openQtyModal(product, e)}
                          className="p-1 px-1.5 rounded-xl bg-white hover:bg-[#FFF0F3] text-stone-700 hover:text-[#800020] border border-[#FCE4E8] font-bold text-[10px] transition-colors cursor-pointer shrink-0"
                          title="Ketik Jumlah Jual Tertentu (Beli Banyak)"
                        >
                          Qty...
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : viewDensity === 'grid-sm' ? (

        /* POLA 2: GRID KOMPAK (Rapat & Muat Banyak Kartu Produk) */
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-1.5 sm:gap-2 pb-8">
          {filteredProducts.map((product) => {
            const isOutOfStock = product.stock <= 0;
            const inCartQty = cartQtyMap[product.id] || 0;

            return (
              <div
                key={product.id}
                className={`rounded-xl border text-left overflow-hidden bg-white/95 backdrop-blur-md transition-all flex flex-col justify-between p-1.5 group select-none relative ${
                  isOutOfStock
                    ? 'opacity-60 bg-stone-100/90 border-stone-200'
                    : 'border-[#FCE4E8] hover:border-[#800020] hover:shadow-xs'
                }`}
              >
                {/* Visual Thumbnail Kompak */}
                <div 
                  onClick={() => !isOutOfStock && addToCart(product, 1)}
                  className={`relative w-full aspect-square rounded-lg bg-[#FFF5F5] overflow-hidden flex items-center justify-center mb-1 ${
                    isOutOfStock ? 'cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  title={isOutOfStock ? 'Stok Habis' : `Klik untuk tambah 1 ${product.name}`}
                >
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

                  {/* Stock Pill */}
                  <div className={`absolute top-1 right-1 px-1 py-0.2 rounded text-[8px] font-mono font-bold z-2 ${
                    isOutOfStock ? 'bg-rose-600 text-white' : 'bg-black/75 text-white'
                  }`}>
                    {isOutOfStock ? '0' : product.stock}
                  </div>

                  {inCartQty > 0 && (
                    <div className="absolute inset-0 bg-[#800020]/75 text-white text-xs font-black flex items-center justify-center z-2">
                      +{inCartQty}
                    </div>
                  )}
                </div>

                <h3 className="text-[11px] font-bold text-black truncate leading-tight mb-0.5 group-hover:text-[#800020]">
                  {product.name}
                </h3>
                
                <div className="text-[11px] font-black font-mono text-[#800020] mb-1">
                  {formatRupiah(product.sellPrice)}
                </div>

                {/* Kontrol Ketik Qty Kompak */}
                <div className="flex items-center gap-1 mt-auto">
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => addToCart(product, 1)}
                    className="flex-1 py-0.5 rounded-lg bg-[#FCE8EB] hover:bg-[#800020] hover:text-white text-[#800020] text-[10px] font-bold text-center cursor-pointer active:scale-95 transition-colors"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={(e) => openQtyModal(product, e)}
                    className="px-1.5 py-0.5 rounded-lg bg-white border border-[#FCE4E8] text-stone-700 hover:text-[#800020] text-[9px] font-bold cursor-pointer"
                    title="Ketik Jumlah Jual"
                  >
                    Ketik
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : viewDensity === 'list' ? (

        /* POLA 3: DAFTAR BARIS HORIZONTAL (Lengkap dengan Stepper & Kolom Ketik Qty) */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 pb-8">
          {filteredProducts.map((product) => {
            const isOutOfStock = product.stock <= 0;
            const inCartQty = cartQtyMap[product.id] || 0;

            return (
              <div
                key={product.id}
                className={`rounded-2xl border p-2 sm:p-2.5 transition-all flex items-center gap-2.5 bg-white/95 backdrop-blur-md group ${
                  isOutOfStock
                    ? 'opacity-60 bg-stone-100/90 border-stone-200'
                    : 'border-[#FCE4E8] hover:border-[#800020] hover:shadow-xs'
                }`}
              >
                {/* Visual Thumbnail */}
                <div 
                  onClick={() => !isOutOfStock && addToCart(product, 1)}
                  className={`relative w-14 h-14 rounded-xl bg-[#FFF5F5] overflow-hidden shrink-0 border border-[#FCE4E8] flex items-center justify-center ${
                    isOutOfStock ? 'cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  title="Klik untuk tambah 1"
                >
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
                  {inCartQty > 0 && (
                    <div className="absolute top-1 left-1 px-1 rounded bg-[#800020] text-white text-[9px] font-black z-2">
                      {inCartQty}
                    </div>
                  )}
                </div>

                {/* Info Produk */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-mono text-stone-500 uppercase">{product.sku}</span>
                    <span className="text-[10px] bg-stone-100 text-stone-600 px-1 rounded">{product.category}</span>
                  </div>
                  <h3 className="text-xs font-bold text-black truncate leading-tight group-hover:text-[#800020]">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between gap-1 mt-1">
                    <span className="text-xs sm:text-sm font-black font-mono text-[#800020]">
                      {formatRupiah(product.sellPrice)}
                    </span>
                    <span className="text-[10px] text-stone-500 font-mono">
                      Stok: {isOutOfStock ? 'Habis' : `${product.stock} ${product.unit}`}
                    </span>
                  </div>
                </div>

                {/* Kontrol Jumlah Penjualan (Ketik Langsung / Stepper) */}
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1 bg-[#FFF0F3] p-0.5 rounded-xl border border-[#FCE4E8]">
                    <button
                      type="button"
                      disabled={isOutOfStock || inCartQty === 0}
                      onClick={() => handleDirectSetQty(product, inCartQty - 1)}
                      className="w-6 h-6 rounded-lg bg-white disabled:opacity-30 hover:bg-stone-200 text-black flex items-center justify-center font-bold text-xs cursor-pointer"
                      title="Kurangi"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    
                    {/* Input Ketik Jumlah Jual */}
                    <input
                      type="number"
                      min="0"
                      max={product.stock}
                      value={inCartQty}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        handleDirectSetQty(product, isNaN(val) ? 0 : val);
                      }}
                      className="w-10 text-center font-black font-mono text-xs bg-white rounded-md border border-[#FCE4E8] py-0.5 focus:outline-none focus:ring-1 focus:ring-[#800020]"
                      title="Ketik jumlah yang dibeli langsung"
                    />

                    <button
                      type="button"
                      disabled={isOutOfStock || inCartQty >= product.stock}
                      onClick={() => handleDirectSetQty(product, inCartQty + 1)}
                      className="w-6 h-6 rounded-lg bg-[#800020] disabled:opacity-30 hover:bg-[#660019] text-white flex items-center justify-center font-bold text-xs cursor-pointer"
                      title="Tambah"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={(e) => openQtyModal(product, e)}
                    className="text-[10px] text-stone-500 hover:text-[#800020] font-bold cursor-pointer underline"
                  >
                    Ketik Jumlah Besar &rarr;
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (

        /* POLA 4: TABEL KASIR RAPAT (Untuk Transaksi Cepat & Barcode Scanning) */
        <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-[#FCE4E8] overflow-hidden shadow-xs pb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FFF0F3] border-b border-[#FCE4E8] text-stone-700 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Produk</th>
                  <th className="py-2.5 px-2">SKU / Kategori</th>
                  <th className="py-2.5 px-2">Stok</th>
                  <th className="py-2.5 px-2">Harga</th>
                  <th className="py-2.5 px-2 text-center">Ketik Jumlah Jual</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FCE4E8]/60">
                {filteredProducts.map((product) => {
                  const isOutOfStock = product.stock <= 0;
                  const inCartQty = cartQtyMap[product.id] || 0;

                  return (
                    <tr 
                      key={product.id}
                      className={`hover:bg-[#FFF5F7] transition-colors ${
                        isOutOfStock ? 'opacity-50 bg-stone-50' : ''
                      }`}
                    >
                      {/* Foto & Nama */}
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={getOptimizedThumb(product.imageUrl)}
                            alt={product.name}
                            className="w-8 h-8 rounded-lg object-cover border border-[#FCE4E8] shrink-0"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <span className="font-bold text-black line-clamp-1 max-w-[200px] sm:max-w-xs">
                            {product.name}
                          </span>
                        </div>
                      </td>

                      {/* SKU & Kategori */}
                      <td className="py-2 px-2 text-stone-600 font-mono text-[11px]">
                        <div>{product.sku}</div>
                        <div className="text-[9px] text-stone-400">{product.category}</div>
                      </td>

                      {/* Sisa Stok */}
                      <td className="py-2 px-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isOutOfStock
                            ? 'bg-rose-100 text-rose-700'
                            : product.stock <= product.minStock
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-stone-100 text-stone-700'
                        }`}>
                          {isOutOfStock ? 'Habis' : `${product.stock} ${product.unit}`}
                        </span>
                      </td>

                      {/* Harga Satuan */}
                      <td className="py-2 px-2 font-mono font-bold text-[#800020]">
                        {formatRupiah(product.sellPrice)}
                      </td>

                      {/* Input Ketik Jumlah Jual Langsung */}
                      <td className="py-2 px-2 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            disabled={isOutOfStock || inCartQty === 0}
                            onClick={() => handleDirectSetQty(product, inCartQty - 1)}
                            className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 text-stone-800 disabled:opacity-30 font-bold flex items-center justify-center cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            max={product.stock}
                            value={inCartQty}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              handleDirectSetQty(product, isNaN(val) ? 0 : val);
                            }}
                            className="w-12 text-center font-mono font-bold text-xs py-1 border border-[#FCE4E8] rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#800020]"
                          />
                          <button
                            type="button"
                            disabled={isOutOfStock || inCartQty >= product.stock}
                            onClick={() => handleDirectSetQty(product, inCartQty + 1)}
                            className="w-6 h-6 rounded bg-[#800020] hover:bg-[#660019] text-white disabled:opacity-30 font-bold flex items-center justify-center cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={(e) => openQtyModal(product, e)}
                          className="px-2 py-1 rounded-lg bg-[#FCE8EB] hover:bg-[#800020] hover:text-white text-[#800020] font-bold text-xs transition-colors cursor-pointer"
                        >
                          Ketik Qty
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL KHUSUS KETIK JUMLAH YANG AKAN DIJUAL (UNTUK PEMBELIAN LEBIH DARI SATU PRODUK) */}
      {qtyModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-[#FCE4E8] shadow-2xl max-w-sm w-full p-4 sm:p-5 text-black">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-[#FCE4E8]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#800020] text-white flex items-center justify-center shrink-0">
                  <Hash className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-black leading-tight">
                    Ketik Jumlah Jual
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Masukkan kuantitas produk yang dibeli pelanggan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQtyModalProduct(null)}
                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Info Produk */}
            <div className="my-3.5 flex items-center gap-3 p-2.5 rounded-2xl bg-[#FFF5F7] border border-[#FCE4E8]">
              <img
                src={getOptimizedThumb(qtyModalProduct.imageUrl)}
                alt={qtyModalProduct.name}
                className="w-12 h-12 rounded-xl object-cover border border-[#FCE4E8] shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-black truncate">
                  {qtyModalProduct.name}
                </h4>
                <div className="text-xs font-mono font-black text-[#800020] mt-0.5">
                  {formatRupiah(qtyModalProduct.sellPrice)} / {qtyModalProduct.unit}
                </div>
                <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                  Sisa Stok: <strong className="text-black">{qtyModalProduct.stock} {qtyModalProduct.unit}</strong>
                </div>
              </div>
            </div>

            {/* Kolom Ketik Jumlah / Input Angka Utama */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-700">
                Jumlah yang akan dijual:
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const cur = parseInt(modalQtyValue, 10) || 0;
                    if (cur > 0) setModalQtyValue(String(cur - 1));
                  }}
                  className="w-11 h-11 rounded-xl bg-stone-100 hover:bg-stone-200 text-black font-bold text-lg flex items-center justify-center cursor-pointer active:scale-95"
                >
                  -
                </button>
                <input
                  ref={modalInputRef}
                  type="number"
                  min="0"
                  max={qtyModalProduct.stock}
                  value={modalQtyValue}
                  onChange={(e) => setModalQtyValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApplyModalQty();
                    }
                  }}
                  className="flex-1 h-11 text-center font-mono font-black text-2xl border-2 border-[#800020] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/30 shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => {
                    const cur = parseInt(modalQtyValue, 10) || 0;
                    if (cur < qtyModalProduct.stock) setModalQtyValue(String(cur + 1));
                  }}
                  className="w-11 h-11 rounded-xl bg-[#800020] hover:bg-[#660019] text-white font-bold text-lg flex items-center justify-center cursor-pointer active:scale-95"
                >
                  +
                </button>
              </div>

              {/* Subtotal Preview */}
              <div className="flex items-center justify-between px-2 py-1 bg-stone-50 rounded-xl text-xs font-mono">
                <span className="text-stone-500">Estimasi Subtotal:</span>
                <span className="font-bold text-[#800020]">
                  {formatRupiah((parseInt(modalQtyValue, 10) || 0) * qtyModalProduct.sellPrice)}
                </span>
              </div>
            </div>

            {/* Tombol Pintas Preset Jumlah Cepat (+1, +5, +10, +20, Max) */}
            <div className="mt-3">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1.5">
                Pilihan Cepat:
              </span>
              <div className="grid grid-cols-5 gap-1">
                {[1, 5, 10, 20].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setModalQtyValue(String(Math.min(amt, qtyModalProduct.stock)))}
                    className="py-1 px-1 rounded-lg bg-[#FFF0F3] hover:bg-[#FCE8EB] text-[#800020] border border-[#FCE4E8] font-bold font-mono text-xs cursor-pointer text-center"
                  >
                    {amt}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setModalQtyValue(String(qtyModalProduct.stock))}
                  className="py-1 px-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 font-bold font-mono text-[10px] cursor-pointer text-center"
                >
                  Max ({qtyModalProduct.stock})
                </button>
              </div>
            </div>

            {/* Tombol Aksi Simpan ke Keranjang */}
            <div className="mt-4 pt-3 border-t border-[#FCE4E8] flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQtyModalProduct(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 font-bold text-xs text-stone-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApplyModalQty}
                className="flex-2 py-2.5 rounded-xl bg-[#800020] hover:bg-[#660019] text-white font-bold text-xs shadow-md cursor-pointer active:scale-95 transition-all"
              >
                Terapkan ke Keranjang &rarr;
              </button>
            </div>

          </div>
        </div>
      )}

      {/* TOMBOL / BAR KERANJANG ALA GOFOOD (STICKY TETAP DI BAWAH WALAU DI-SCROLL) */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:w-auto sm:min-w-[340px] z-40 animate-in slide-in-from-bottom-3 duration-200">
          <button
            type="button"
            onClick={() => setActivePosTab('cart')}
            className="w-full bg-[#800020] hover:bg-[#660019] text-white p-3 sm:px-4 sm:py-3 rounded-2xl shadow-2xl border-2 border-white/30 flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.98] backdrop-blur-md"
            title="Buka Halaman Khusus Keranjang Belanja"
          >
            {/* Bagian Kiri: Ikon Tas / Keranjang & Total Jumlah Item */}
            <div className="flex items-center gap-2.5 text-left">
              <div className="relative w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <ShoppingCart className="w-5 h-5 text-white" />
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-white text-[#800020] shadow-xs">
                  {totalCartCount}
                </span>
              </div>
              <div>
                <div className="text-xs font-black leading-tight flex items-center gap-1.5">
                  <span>{activeCartSession.name}</span>
                  <span className="text-white/80 font-normal text-[11px]">({cart.length} produk)</span>
                </div>
                <div className="text-sm font-black font-mono leading-tight text-white mt-0.5">
                  {formatRupiah(cartTotal)}
                </div>
              </div>
            </div>

            {/* Bagian Kanan: Tombol Buka Keranjang ala GoFood */}
            <div className="flex items-center gap-1 bg-white text-[#800020] px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs shrink-0">
              <span>Buka Keranjang</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </div>
          </button>
        </div>
      )}

      {/* Cash Expense Modal */}
      {isExpenseModalOpen && (
        <CashExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
        />
      )}

      {/* Printable Receipt Modal */}
      {isReceiptModalOpen && (
        <ReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
        />
      )}
    </div>
  );
};
