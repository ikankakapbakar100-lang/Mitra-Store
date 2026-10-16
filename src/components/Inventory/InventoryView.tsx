/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { usePOS } from '../../context/POSContext';
import { Product } from '../../types/pos';
import { formatRupiah } from '../../utils/format';
import { 
  Package, 
  Search, 
  Plus, 
  Flame, 
  AlertTriangle, 
  XCircle, 
  Trash2, 
  X, 
  Camera, 
  Edit3, 
  Check, 
  RefreshCw,
  ShoppingBag,
  LayoutGrid,
  List
} from 'lucide-react';
import { CameraScannerModal } from '../Camera/CameraScannerModal';

type HighlightFilter = 'all' | 'top_seller' | 'low_stock' | 'out_of_stock';

export const InventoryView: React.FC = () => {
  const { 
    products, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    categories,
    addCategory,
    deleteCategory,
    syncShopeeInventory,
    transactions,
  } = usePOS();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [highlightFilter, setHighlightFilter] = useState<HighlightFilter>('all');

  // Modals state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isCategoryManageOpen, setIsCategoryManageOpen] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isConfirmingDeleteProduct, setIsConfirmingDeleteProduct] = useState<boolean>(false);
  const [isCameraPhotoModalOpen, setIsCameraPhotoModalOpen] = useState<boolean>(false);
  const [isSyncingShopee, setIsSyncingShopee] = useState<boolean>(false);
  const [viewDensity, setViewDensity] = useState<'compact' | 'grid'>('compact');

  const getOptimizedThumb = (url?: string) => {
    if (!url) return 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=120&q=70';
    if (url.includes('unsplash.com')) {
      const base = url.split('?')[0];
      return `${base}?auto=format&fit=crop&w=120&q=70`;
    }
    return url;
  };

  // Form state for Edit / Add
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formCategory, setFormCategory] = useState('Cetakan Kue');
  const [formBuyPrice, setFormBuyPrice] = useState('50000');
  const [formSellPrice, setFormSellPrice] = useState('85000');
  const [formStock, setFormStock] = useState('20');
  const [formMinStock, setFormMinStock] = useState('5');
  const [formUnit, setFormUnit] = useState('buah');
  const [formShopeeSync, setFormShopeeSync] = useState(true);
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formError, setFormError] = useState('');

  // 1. Calculate Top Seller Products from Transactions
  const topSellerIds = useMemo(() => {
    const countMap: Record<string, number> = {};
    transactions.forEach(t => {
      t.items.forEach(item => {
        countMap[item.product.id] = (countMap[item.product.id] || 0) + item.qty;
      });
    });
    // Top 5 products by quantity sold
    const sorted = Object.entries(countMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);

    // Fallback default top sellers if fresh transactions
    if (sorted.length === 0 && products.length > 0) {
      return new Set([products[0]?.id, products[1]?.id, products[4]?.id].filter(Boolean));
    }
    return new Set(sorted);
  }, [transactions, products]);

  // Counts for highlights
  const lowStockCount = useMemo(() => {
    return products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
  }, [products]);

  const outOfStockCount = useMemo(() => {
    return products.filter(p => p.stock <= 0).length;
  }, [products]);

  const topSellerCount = useMemo(() => {
    return products.filter(p => topSellerIds.has(p.id)).length;
  }, [products, topSellerIds]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q);

      let matchHighlight = true;
      if (highlightFilter === 'top_seller') {
        matchHighlight = topSellerIds.has(p.id);
      } else if (highlightFilter === 'low_stock') {
        matchHighlight = p.stock > 0 && p.stock <= p.minStock;
      } else if (highlightFilter === 'out_of_stock') {
        matchHighlight = p.stock <= 0;
      }

      return matchCat && matchSearch && matchHighlight;
    });
  }, [products, selectedCategory, searchQuery, highlightFilter, topSellerIds]);

  // Open Edit Modal when product card is clicked ("tinggal tekan aja produknya, kemudian tinggal diedit deh")
  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setFormError('');
    setFormName(p.name);
    setFormSku(p.sku);
    setFormBarcode(p.barcode);
    setFormCategory(p.category);
    setFormBuyPrice(p.buyPrice.toString());
    setFormSellPrice(p.sellPrice.toString());
    setFormStock(p.stock.toString());
    setFormMinStock(p.minStock.toString());
    setFormUnit(p.unit);
    setFormShopeeSync(p.shopeeSyncEnabled);
    setFormImageUrl(p.imageUrl || '');
  };

  const handleOpenAddProduct = () => {
    const randSku = 'PRB-' + Math.floor(100 + Math.random() * 900);
    const randBarcode = '899' + Math.floor(1000000 + Math.random() * 9000000);
    setEditingProduct(null);
    setFormError('');
    setFormName('');
    setFormSku(randSku);
    setFormBarcode(randBarcode);
    setFormCategory(categories[1] || 'Cetakan Kue');
    setFormBuyPrice('45000');
    setFormSellPrice('75000');
    setFormStock('20');
    setFormMinStock('5');
    setFormUnit('buah');
    setFormShopeeSync(true);
    setFormImageUrl('https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80');
    setIsAddModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!formName.trim()) {
      setFormError('Nama produk wajib diisi!');
      return;
    }

    const buyPriceNum = parseInt(formBuyPrice.toString().replace(/\D/g, ''), 10) || 0;
    const sellPriceNum = parseInt(formSellPrice.toString().replace(/\D/g, ''), 10) || 0;
    const stockNum = parseInt(formStock.toString().replace(/\D/g, ''), 10) || 0;
    const minStockNum = parseInt(formMinStock.toString().replace(/\D/g, ''), 10) || 0;

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: formName.trim(),
        sku: formSku.trim(),
        barcode: formBarcode.trim(),
        category: formCategory,
        buyPrice: buyPriceNum,
        sellPrice: sellPriceNum,
        stock: stockNum,
        minStock: minStockNum,
        unit: formUnit.trim() || 'buah',
        shopeeSyncEnabled: formShopeeSync,
        imageUrl: formImageUrl.trim(),
      });
      setEditingProduct(null);
    } else {
      addProduct({
        name: formName.trim(),
        sku: formSku.trim(),
        barcode: formBarcode.trim(),
        category: formCategory,
        buyPrice: buyPriceNum,
        sellPrice: sellPriceNum,
        stock: stockNum,
        minStock: minStockNum,
        unit: formUnit.trim() || 'buah',
        shopeeSyncEnabled: formShopeeSync,
        imageUrl: formImageUrl.trim(),
      });
      setIsAddModalOpen(false);
    }
  };

  const executeDeleteProduct = (id: string) => {
    deleteProduct(id);
    setEditingProduct(null);
    setIsConfirmingDeleteProduct(false);
  };

  const executeDeleteCategory = (catName: string) => {
    if (catName === 'Semua') return;
    deleteCategory(catName);
    if (selectedCategory === catName) {
      setSelectedCategory('Semua');
    }
    setCategoryToDelete(null);
  };

  const handleManualShopeeSync = async () => {
    setIsSyncingShopee(true);
    await syncShopeeInventory();
    setIsSyncingShopee(false);
  };

  return (
    <div className="space-y-2.5 sm:space-y-4">
      
      {/* 1. HIGHLIGHT SECTION: SEMUA, TERLARIS, MENIPIS, HABIS (KOMPAK HP) */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
        
        {/* Highlight 1: Semua Produk */}
        <button
          onClick={() => setHighlightFilter('all')}
          className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer ${
            highlightFilter === 'all'
              ? 'bg-[#F43F5E] text-white border-[#F43F5E] shadow-xs'
              : 'bg-white hover:bg-pink-50/50 border-pink-100 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider truncate opacity-90">
              Semua
            </span>
            <Package className="w-3 h-3 sm:w-4 sm:h-4 opacity-80 shrink-0" />
          </div>
          <div className="text-sm sm:text-xl font-black font-mono mt-0.5">
            {products.length} <span className="text-[9px] sm:text-xs font-normal opacity-80 hidden sm:inline">item</span>
          </div>
        </button>

        {/* Highlight 2: Produk Terlaris */}
        <button
          onClick={() => setHighlightFilter(highlightFilter === 'top_seller' ? 'all' : 'top_seller')}
          className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer ${
            highlightFilter === 'top_seller'
              ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
              : 'bg-white hover:bg-amber-50/50 border-amber-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider truncate text-amber-600">
              🔥 Laris
            </span>
            <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
          </div>
          <div className="text-sm sm:text-xl font-black font-mono text-amber-600 mt-0.5">
            {topSellerCount} <span className="text-[9px] sm:text-xs font-normal opacity-80 hidden sm:inline">item</span>
          </div>
        </button>

        {/* Highlight 3: Stok Menipis */}
        <button
          onClick={() => setHighlightFilter(highlightFilter === 'low_stock' ? 'all' : 'low_stock')}
          className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer ${
            highlightFilter === 'low_stock'
              ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
              : 'bg-white hover:bg-rose-50/50 border-rose-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider truncate text-rose-600">
              ⚠️ Tipis
            </span>
            <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-rose-500 shrink-0" />
          </div>
          <div className="text-sm sm:text-xl font-black font-mono text-rose-600 mt-0.5">
            {lowStockCount} <span className="text-[9px] sm:text-xs font-normal opacity-80 hidden sm:inline">item</span>
          </div>
        </button>

        {/* Highlight 4: Stok Habis */}
        <button
          onClick={() => setHighlightFilter(highlightFilter === 'out_of_stock' ? 'all' : 'out_of_stock')}
          className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer ${
            highlightFilter === 'out_of_stock'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider truncate text-slate-600">
              🔴 Habis
            </span>
            <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 shrink-0" />
          </div>
          <div className="text-sm sm:text-xl font-black font-mono text-slate-900 mt-0.5">
            {outOfStockCount} <span className="text-[9px] sm:text-xs font-normal opacity-80 hidden sm:inline">item</span>
          </div>
        </button>
      </div>

      {/* 2. SEARCH & KATEGORI BAR (TAMBAH & HAPUS KATEGORI) */}
      <div className="bg-white p-3.5 rounded-3xl border border-pink-100 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari cetakan kue, loyang, perabot..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-pink-100 bg-pink-50/20 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F43F5E]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setViewDensity(viewDensity === 'compact' ? 'grid' : 'compact')}
              className={`p-1.5 sm:px-2.5 sm:py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                viewDensity === 'compact'
                  ? 'bg-rose-50 text-[#F43F5E] border-rose-200'
                  : 'bg-white text-slate-600 border-pink-200 hover:bg-pink-50'
              }`}
              title={viewDensity === 'compact' ? 'Mode Kompak HP (Muat 10+ Stok Sekaligus Tanpa Scroll)' : 'Mode Grid Mini'}
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

            <button
              onClick={handleManualShopeeSync}
              disabled={isSyncingShopee}
              className="p-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold border border-pink-200 bg-pink-50/60 text-[#F43F5E] hover:bg-pink-100 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Sinkronkan dengan Shopee"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingShopee ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Shopee</span>
            </button>

            <button
              onClick={() => setIsCategoryManageOpen(true)}
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold border border-pink-200 bg-white text-slate-700 hover:bg-pink-50/60 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Kelola & Hapus Kategori"
            >
              <span>Kategori</span>
            </button>

            <button
              onClick={handleOpenAddProduct}
              className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold text-white bg-[#F43F5E] hover:bg-[#E11D48] transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah</span>
            </button>
          </div>
        </div>

        {/* Categories Chips with Quick Delete Support */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const isDeletable = cat !== 'Semua';

            return (
              <div key={cat} className="relative group shrink-0 flex items-center">
                <button
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? 'bg-[#F43F5E] text-white shadow-2xs'
                      : 'bg-pink-50/50 text-slate-700 hover:bg-pink-100/60 border border-pink-100'
                  }`}
                >
                  <span>{cat}</span>
                </button>

                {/* Quick Delete Category Button */}
                {isDeletable && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCategoryToDelete(cat);
                      setIsCategoryManageOpen(true);
                    }}
                    title={`Hapus kategori ${cat}`}
                    className="ml-0.5 p-1 text-slate-400 hover:text-rose-600 hover:bg-pink-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Quick Add Category Button */}
          <button
            onClick={() => setIsCategoryManageOpen(true)}
            className="px-2.5 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap bg-white text-[#F43F5E] border border-dashed border-pink-300 hover:bg-pink-50 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Kategori</span>
          </button>
        </div>
      </div>

      {/* 3. DESAIN STOK BARANG MINIMALIS & HEMAT SPACE (FOTO + NAMA STOK) */}
      {/* Saat produk ditekan, langsung buka edit modal untuk ubah stok, harga, & saldo */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-2 text-xs text-slate-500">
          <span>Menampilkan {filteredProducts.length} produk cetakan &amp; perabot</span>
          <span className="text-[11px] text-[#F43F5E] font-medium">
            💡 Tekan produk untuk mengedit stok &amp; harga
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-pink-100 p-12 text-center">
            <Package className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
            <h4 className="text-sm font-bold text-slate-800">
              Tidak Ada Stok Sesuai Filter
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Coba ganti filter highlight atau pilih kategori lain.
            </p>
          </div>
        ) : (
          viewDensity === 'compact' ? (
            /* MODE 1 (DEFAULT HP): Ultra-Kompak 2 Kolom, Image 38-42px Terkompresi, Muat 10+ Stok Langsung di HP Tanpa Scroll */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1.5 sm:gap-2">
              {filteredProducts.map((p) => {
                const isTopSeller = topSellerIds.has(p.id);
                const isOutOfStock = p.stock <= 0;
                const isLowStock = !isOutOfStock && p.stock <= p.minStock;

                return (
                  <div
                    key={p.id}
                    onClick={() => handleOpenEditProduct(p)}
                    className={`group relative bg-white rounded-xl border p-1.5 sm:p-2 text-left transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 hover:border-[#F43F5E] hover:shadow-xs h-[50px] sm:h-[56px] ${
                      isOutOfStock
                        ? 'border-slate-200 bg-slate-50/40 opacity-70'
                        : isLowStock
                        ? 'border-rose-200 bg-rose-50/20'
                        : 'border-pink-100'
                    }`}
                    title="Klik untuk mengubah stok & info barang"
                  >
                    {/* Foto Stok Mini Terkompresi (38x38 di HP, 44x44 di desktop) */}
                    <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-pink-50/40 overflow-hidden shrink-0 border border-pink-100/60 flex items-center justify-center">
                      <Package className="w-4 h-4 text-pink-300 absolute pointer-events-none" />
                      <img
                        src={getOptimizedThumb(p.imageUrl)}
                        alt={p.name}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover relative z-1 group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      {isTopSeller && (
                        <span className="absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full bg-amber-500 z-10" title="Terlaris" />
                      )}
                    </div>

                    {/* Info Stok Ringkas & Hemat Tampilan */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="text-[11px] sm:text-xs font-bold text-slate-900 truncate leading-tight group-hover:text-[#F43F5E] transition-colors">
                          {p.name}
                        </h3>
                        <span className={`text-[9px] font-mono px-1 rounded font-bold shrink-0 ${
                          isOutOfStock 
                            ? 'bg-slate-900 text-white' 
                            : isLowStock 
                            ? 'bg-rose-100 text-rose-700' 
                            : 'text-slate-500'
                        }`}>
                          {p.stock}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10.5px] sm:text-xs font-black font-mono text-[#F43F5E] leading-none">
                          {formatRupiah(p.sellPrice)}
                        </span>
                        <span className="text-[9px] text-slate-400 group-hover:text-slate-700 flex items-center gap-0.5">
                          <Edit3 className="w-2.5 h-2.5" />
                          <span className="hidden sm:inline">Edit</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* MODE 2: Grid Mini dengan Gambar Kompresi Rendah Space (h-14 sm:h-16) */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-2.5">
              {filteredProducts.map((p) => {
                const isTopSeller = topSellerIds.has(p.id);
                const isOutOfStock = p.stock <= 0;
                const isLowStock = !isOutOfStock && p.stock <= p.minStock;

                return (
                  <div
                    key={p.id}
                    onClick={() => handleOpenEditProduct(p)}
                    className={`group relative bg-white rounded-xl border p-1.5 text-left transition-all cursor-pointer flex flex-col justify-between hover:border-[#F43F5E] hover:shadow-xs ${
                      isOutOfStock
                        ? 'border-slate-200 bg-slate-50/40 opacity-70'
                        : isLowStock
                        ? 'border-rose-200'
                        : 'border-pink-100'
                    }`}
                    title="Klik untuk mengubah stok & info barang"
                  >
                    {/* Visual Foto Stok Mini Terkompresi (h-14 sm:h-16) */}
                    <div className="relative w-full h-14 sm:h-16 rounded-lg bg-pink-50/30 overflow-hidden mb-1.5 flex items-center justify-center">
                      <Package className="w-5 h-5 text-pink-300 absolute pointer-events-none" />
                      <img
                        src={getOptimizedThumb(p.imageUrl)}
                        alt={p.name}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover relative z-1 group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />

                      {/* Highlight Badge */}
                      <div className="absolute top-1 left-1 flex flex-col gap-0.5 z-10">
                        {isTopSeller && (
                          <span className="px-1 py-0.2 rounded text-[7px] font-bold bg-amber-500 text-white">
                            🔥 Laris
                          </span>
                        )}
                        {isOutOfStock && (
                          <span className="px-1 py-0.2 rounded text-[7px] font-bold bg-slate-900 text-white">
                            Habis
                          </span>
                        )}
                        {isLowStock && (
                          <span className="px-1 py-0.2 rounded text-[7px] font-bold bg-rose-500 text-white">
                            Tipis
                          </span>
                        )}
                      </div>

                      {/* Stock pill */}
                      <div className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/70 text-[8px] font-mono text-white">
                        {p.stock} {p.unit}
                      </div>
                    </div>

                    {/* Nama Stok & Harga */}
                    <div className="space-y-0.5">
                      <h3 className="text-[11px] font-bold text-slate-900 line-clamp-1 leading-tight group-hover:text-[#F43F5E] transition-colors">
                        {p.name}
                      </h3>

                      <div className="flex items-center justify-between text-[10.5px] pt-1 border-t border-pink-50">
                        <span className="font-mono font-bold text-[#F43F5E]">
                          {formatRupiah(p.sellPrice)}
                        </span>
                        <span className="text-[9px] text-slate-400 group-hover:text-slate-700 flex items-center gap-0.5 font-medium">
                          <Edit3 className="w-2.5 h-2.5" />
                          Edit
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* 4. MODAL EDIT STOK & INFO PRODUK (TINGGAL TEKAN LANGSUNG EDIT!) */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-pink-100 max-w-lg w-full p-6 animate-in zoom-in-95 duration-150 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-pink-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-pink-50 text-[#F43F5E] flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Edit Info &amp; Saldo Stok Barang
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    SKU: {editingProduct.sku}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setEditingProduct(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5">
              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              
              {/* Product Photo & Camera Capture */}
              <div className="flex items-center gap-3 p-3 bg-pink-50/30 rounded-2xl border border-pink-100">
                <img 
                  src={formImageUrl || editingProduct.imageUrl || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80'} 
                  alt="Preview" 
                  className="w-14 h-14 rounded-xl object-cover border border-pink-200 shrink-0" 
                />
                <div className="flex-1 space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Foto Produk / Cetakan
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCameraPhotoModalOpen(true)}
                      className="px-2.5 py-1 text-xs font-bold text-[#F43F5E] bg-white border border-pink-200 rounded-lg hover:bg-pink-50 flex items-center gap-1 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Ambil via Kamera
                    </button>
                    <input
                      type="url"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      placeholder="Atau tempel URL gambar..."
                      className="flex-1 px-2 py-1 text-xs rounded-lg border border-pink-100 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Nama Barang */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Barang / Cetakan:
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-pink-200 bg-white text-slate-900 focus:ring-2 focus:ring-[#F43F5E]"
                  required
                />
              </div>

              {/* Kategori & Satuan */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori:
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-pink-200 bg-white text-slate-900 focus:ring-2 focus:ring-[#F43F5E]"
                  >
                    {categories.filter(c => c !== 'Semua').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Satuan:
                  </label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    placeholder="buah, loyang, set, pcs"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-pink-200 bg-white text-slate-900"
                  />
                </div>
              </div>

              {/* Saldo Stok Fisik & Batas Minimum Stok */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-pink-50/40 rounded-2xl border border-pink-200">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Saldo Stok Fisik:
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFormStock(Math.max(0, (parseInt(formStock, 10) || 0) - 1).toString())}
                      className="w-8 h-8 rounded-lg bg-white border border-pink-200 font-bold text-slate-700 hover:bg-pink-100 flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={formStock}
                      onChange={(e) => setFormStock(e.target.value)}
                      className="w-full text-center py-1.5 text-sm font-black font-mono rounded-lg border border-pink-300 bg-white text-[#F43F5E]"
                      min="0"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setFormStock(((parseInt(formStock, 10) || 0) + 1).toString())}
                      className="w-8 h-8 rounded-lg bg-white border border-pink-200 font-bold text-slate-700 hover:bg-pink-100 flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Batas Peringatan Minimum:
                  </label>
                  <input
                    type="number"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-pink-200 bg-white text-slate-900"
                    min="1"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Pemicu alert stok menipis
                  </p>
                </div>
              </div>

              {/* Harga Beli (Modal) & Harga Jual */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Harga Modal (HPP):
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">Rp</span>
                    <input
                      type="text"
                      value={formBuyPrice}
                      onChange={(e) => setFormBuyPrice(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs font-mono font-bold rounded-xl border border-pink-200 bg-white text-slate-900"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Harga Jual Toko:
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#F43F5E] font-bold">Rp</span>
                    <input
                      type="text"
                      value={formSellPrice}
                      onChange={(e) => setFormSellPrice(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs font-mono font-bold rounded-xl border border-pink-200 bg-white text-[#F43F5E]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Barcode & Shopee Sync */}
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-pink-100 bg-pink-50/20 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formShopeeSync}
                    onChange={(e) => setFormShopeeSync(e.target.checked)}
                    className="rounded text-[#F43F5E] focus:ring-[#F43F5E]"
                  />
                  <span className="font-semibold text-slate-800">Sinkronisasi Otomatis ke Shopee</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">Barcode: {editingProduct.barcode}</span>
              </div>

              {/* Action Buttons: Delete Product & Save */}
              <div className="pt-3 flex items-center justify-between gap-3 border-t border-pink-100">
                {isConfirmingDeleteProduct ? (
                  <div className="flex items-center gap-1.5 p-1 bg-rose-50 border border-rose-200 rounded-xl animate-in fade-in">
                    <span className="text-[11px] font-bold text-rose-700 pl-1.5">Hapus barang ini?</span>
                    <button
                      type="button"
                      onClick={() => executeDeleteProduct(editingProduct.id)}
                      className="px-2.5 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
                    >
                      Ya, Hapus
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDeleteProduct(false)}
                      className="px-2 py-1 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 rounded-lg cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDeleteProduct(true)}
                    className="px-3.5 py-2.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Hapus produk ini dari stok"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Barang</span>
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-xs font-bold text-white bg-[#F43F5E] hover:bg-[#E11D48] rounded-xl transition-colors shadow-2xs cursor-pointer"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL TAMBAH PRODUK BARU */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-pink-100 max-w-lg w-full p-6 animate-in zoom-in-95 duration-150 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-pink-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-pink-50 text-[#F43F5E] flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">
                  Tambah Produk Cetakan &amp; Perabot Baru
                </h3>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5">
              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Barang:
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Cetakan Pukis 10 Lubang Teflon"
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-pink-200 bg-white text-slate-900 focus:ring-2 focus:ring-[#F43F5E]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori:
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-pink-200 bg-white text-slate-900"
                  >
                    {categories.filter(c => c !== 'Semua').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Satuan:
                  </label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    placeholder="buah, loyang, set, pcs"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-pink-200 bg-white text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jumlah Stok Masuk:
                  </label>
                  <input
                    type="number"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-pink-200 bg-white text-slate-900"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Batas Minimum Alert:
                  </label>
                  <input
                    type="number"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-pink-200 bg-white text-slate-900"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Harga Modal (HPP):
                  </label>
                  <input
                    type="text"
                    value={formBuyPrice}
                    onChange={(e) => setFormBuyPrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-pink-200 bg-white text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Harga Jual:
                  </label>
                  <input
                    type="text"
                    value={formSellPrice}
                    onChange={(e) => setFormSellPrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-pink-200 bg-white text-[#F43F5E]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  URL Gambar Produk:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-pink-200 bg-white text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCameraPhotoModalOpen(true)}
                    className="px-3 py-2 text-xs font-bold text-[#F43F5E] bg-pink-50 border border-pink-200 rounded-xl hover:bg-pink-100 flex items-center gap-1 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Kamera
                  </button>
                </div>
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#F43F5E] hover:bg-[#E11D48] rounded-xl transition-colors shadow-2xs cursor-pointer"
                >
                  Tambahkan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL KELOLA & HAPUS KATEGORI STOK */}
      {isCategoryManageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-pink-100 max-w-md w-full p-6 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-pink-100">
              <h3 className="font-bold text-sm text-slate-900">
                Kelola Kategori Stok
              </h3>
              <button 
                onClick={() => {
                  setIsCategoryManageOpen(false);
                  setNewCategoryName('');
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Tambah Kategori Baru */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newCategoryName.trim()) return;
                addCategory(newCategoryName.trim());
                setNewCategoryName('');
              }}
              className="space-y-2"
            >
              <label className="block text-xs font-semibold text-slate-700">
                Tambah Kategori Baru:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Contoh: Cetakan Silikon, Loyang Pizza, dll"
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-pink-200 bg-white text-slate-900 focus:ring-2 focus:ring-[#F43F5E]"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 text-xs font-bold text-white bg-[#F43F5E] hover:bg-[#E11D48] rounded-xl cursor-pointer shrink-0"
                >
                  Tambah
                </button>
              </div>
            </form>

            {/* List Kategori dengan Tombol Hapus */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-semibold text-slate-700">
                Daftar Kategori Saat Ini:
              </label>
              <div className="max-h-56 overflow-y-auto space-y-1.5 divide-y divide-pink-50">
                {categories.map((cat) => {
                  const isDeletable = cat !== 'Semua';
                  const prodCount = products.filter(p => cat === 'Semua' || p.category === cat).length;

                  return (
                    <div key={cat} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{cat}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5 font-mono">({prodCount} produk)</span>
                      </div>

                      {isDeletable ? (
                        categoryToDelete === cat ? (
                          <div className="flex items-center gap-1.5 animate-in fade-in">
                            <span className="text-[10px] text-rose-600 font-bold">Hapus kategori?</span>
                            <button
                              type="button"
                              onClick={() => executeDeleteCategory(cat)}
                              className="px-2 py-0.5 text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-md cursor-pointer transition-colors shadow-2xs"
                            >
                              Ya, Hapus
                            </button>
                            <button
                              type="button"
                              onClick={() => setCategoryToDelete(null)}
                              className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer transition-colors"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setCategoryToDelete(cat)}
                            className="px-2.5 py-1 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Hapus</span>
                          </button>
                        )
                      ) : (
                        <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 bg-slate-100 rounded-lg">
                          Default
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-pink-100 flex justify-end">
              <button
                onClick={() => {
                  setIsCategoryManageOpen(false);
                  setNewCategoryName('');
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. CAMERA MODAL UNTUK AMBIL FOTO PRODUK FISIK */}
      {isCameraPhotoModalOpen && (
        <CameraScannerModal
          isOpen={isCameraPhotoModalOpen}
          onClose={() => setIsCameraPhotoModalOpen(false)}
          onCapturePhoto={(dataUrl) => {
            setFormImageUrl(dataUrl);
            setIsCameraPhotoModalOpen(false);
          }}
          mode="photo"
        />
      )}

    </div>
  );
};
