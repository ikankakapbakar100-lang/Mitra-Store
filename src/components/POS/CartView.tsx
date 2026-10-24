/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { formatRupiah } from '../../utils/format';
import {
  ShoppingCart,
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  UserPlus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  ArrowDownCircle,
  FileText,
  Package
} from 'lucide-react';
import { PaymentModal } from './PaymentModal';
import { CashExpenseModal } from './CashExpenseModal';
import { MultiCartBar } from './MultiCartBar';

interface CartViewProps {
  onBackToCatalog?: () => void;
}

export const CartView: React.FC<CartViewProps> = ({ onBackToCatalog }) => {
  const {
    cart,
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
    currentUser,
    setActivePosTab,
    expenses,
    isExpenseModalOpen,
    setIsExpenseModalOpen,
    activeCartSession,
    cartSessions,
    setActiveCartSessionId,
    createNewCartSession,
  } = usePOS();

  const [isConfirmingClearCart, setIsConfirmingClearCart] = useState<boolean>(false);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [itemNotes, setItemNotes] = useState<{ [productId: string]: string }>({});
  const [activeNoteProductId, setActiveNoteProductId] = useState<string | null>(null);

  const totalCartCount = cart.reduce((acc, item) => acc + item.qty, 0);

  const todayExpenseTotal = expenses
    .filter((e) => {
      const d = new Date(e.date);
      const now = new Date();
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const handleBack = () => {
    if (onBackToCatalog) {
      onBackToCatalog();
    } else {
      setActivePosTab('catalog');
    }
  };

  const handleClearCart = () => {
    clearCart();
    setIsConfirmingClearCart(false);
  };

  const getOptimizedThumb = (url?: string) => {
    if (!url) return 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=150&q=70';
    if (url.includes('unsplash.com')) {
      const base = url.split('?')[0];
      return `${base}?auto=format&fit=crop&w=150&q=70`;
    }
    return url;
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-3 sm:py-6 text-black pb-28 sm:pb-32">
      
      {/* Top Header Halaman Khusus Keranjang Belanja */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#FCE4E8] shadow-sm p-3.5 sm:p-5 mb-4">
        <div className="flex items-center justify-between gap-2">
          
          {/* Tombol Kembali ke Katalog Produk */}
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FCE8EB] hover:bg-[#F8CCD4] text-[#800020] font-bold text-xs sm:text-sm transition-colors cursor-pointer shrink-0"
            title="Kembali ke Katalog Produk"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Katalog</span>
          </button>

          {/* Judul Halaman Khusus Keranjang */}
          <div className="text-center flex-1 min-w-0">
            <div className="flex items-center justify-center gap-1.5">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-[#800020] text-white flex items-center justify-center">
                <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <h1 className="text-sm sm:text-lg font-black text-black truncate">
                Keranjang: {activeCartSession.name}
              </h1>
            </div>
            <p className="text-[10px] sm:text-xs text-stone-600 font-medium mt-0.5">
              {totalCartCount} item ({cart.length} jenis produk) • Total: {formatRupiah(cartTotal)}
            </p>
          </div>

          {/* Tombol Kosongkan Keranjang */}
          <div className="shrink-0">
            {cart.length > 0 && (
              isConfirmingClearCart ? (
                <div className="flex items-center gap-1 bg-[#FFF5F7] p-1 rounded-xl border border-rose-300">
                  <button
                    onClick={handleClearCart}
                    className="px-2.5 py-1 text-[11px] font-bold bg-[#800020] text-white rounded-lg hover:bg-[#660019] cursor-pointer"
                  >
                    Ya, Hapus
                  </button>
                  <button
                    onClick={() => setIsConfirmingClearCart(false)}
                    className="px-2 py-1 text-[11px] text-stone-600 hover:text-black cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsConfirmingClearCart(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#FCE4E8] text-stone-700 hover:text-[#800020] hover:bg-[#FCE8EB] text-xs font-semibold transition-colors cursor-pointer"
                  title="Kosongkan Semua Item di Keranjang Ini"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Kosongkan</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Status Strip: Kasir & Penyimpanan Otomatis */}
        <div className="mt-3 pt-3 border-t border-[#FCE4E8] flex items-center justify-between text-[11px] text-stone-600">
          <div className="flex items-center gap-1.5 text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tersimpan Otomatis (Aman)</span>
          </div>
          <div className="font-medium text-black">
            Kasir: <strong className="font-bold text-[#800020]">{currentUser.name}</strong>
          </div>
        </div>
      </div>

      {/* Antrean Multi-Pelanggan (Bisa Simpan Belanjaan Banyak Orang Sekaligus) */}
      <MultiCartBar />

      {/* Konten Utama Keranjang */}
      {cart.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#FCE4E8] p-6 sm:p-10 text-center shadow-xs">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#FFF5F7] border border-[#FCE4E8] flex items-center justify-center mx-auto mb-3">
            <ShoppingBag className="w-7 h-7 sm:w-8 sm:h-8 text-[#800020]" />
          </div>
          <h2 className="text-base sm:text-lg font-black text-black">
            Keranjang ({activeCartSession.name}) Masih Kosong
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-sm mx-auto font-medium">
            Belum ada produk yang dipilih untuk {activeCartSession.name}. Buka katalog untuk memilih cetakan kue, loyang, atau perlengkapan dapur.
          </p>

          {/* Cek jika ada antrean pelanggan lain yang sudah punya item */}
          {cartSessions.some((s) => s.id !== activeCartSession.id && s.items.length > 0) && (
            <div className="mt-4 p-3 bg-[#FFF5F7] rounded-2xl border border-[#FCE4E8] max-w-md mx-auto text-left">
              <span className="text-[11px] font-bold text-[#800020] block mb-1.5">
                Ada antrean pelanggan lain yang tersimpan:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {cartSessions
                  .filter((s) => s.id !== activeCartSession.id && s.items.length > 0)
                  .map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setActiveCartSessionId(s.id)}
                      className="px-2.5 py-1 rounded-xl bg-white border border-[#800020]/30 hover:border-[#800020] text-xs font-bold text-black flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <ShoppingCart className="w-3 h-3 text-[#800020]" />
                      <span>{s.name} ({s.items.reduce((sum, i) => sum + i.qty, 0)} item)</span>
                    </button>
                  ))}
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#800020] hover:bg-[#660019] text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-950/20 active:scale-95 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Pilih Produk di Katalog</span>
            </button>
            <button
              onClick={() => createNewCartSession()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#FCE8EB] hover:bg-[#F8CCD4] text-[#800020] font-bold text-xs sm:text-sm border border-[#F8CCD4] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Buka Antrean Baru</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Section 1: Member / CRM Pelanggan Setia */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#FCE4E8] p-3.5 sm:p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#800020]" />
                <span className="text-xs sm:text-sm font-black text-black">
                  Pelanggan / Member Loyalitas
                </span>
              </div>
              {selectedCustomer ? (
                <button
                  onClick={() => {
                    setSelectedCustomer(null);
                    setPointsToRedeem(0);
                  }}
                  className="text-xs text-[#800020] hover:underline font-bold cursor-pointer"
                >
                  Ganti Pelanggan
                </button>
              ) : (
                <button
                  onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                  className="text-xs text-[#800020] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Pilih Member</span>
                </button>
              )}
            </div>

            {selectedCustomer ? (
              <div className="mt-2.5 p-3 bg-[#FFF8F8] rounded-2xl border border-[#FCE4E8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs sm:text-sm font-bold text-black flex items-center gap-2">
                    <span>{selectedCustomer.name}</span>
                    <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-[#FCE8EB] text-[#800020] border border-[#F8CCD4]">
                      {selectedCustomer.tier}
                    </span>
                    <span className="text-xs text-stone-500 font-mono">
                      {selectedCustomer.phone}
                    </span>
                  </div>
                  <div className="text-xs text-stone-600 mt-0.5">
                    Saldo: <strong className="text-[#800020] font-mono font-bold">{selectedCustomer.points} Poin</strong> (1 Poin = Rp 100)
                  </div>
                </div>

                {selectedCustomer.points > 0 && (
                  <div className="shrink-0 flex items-center gap-2">
                    {pointsToRedeem > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-emerald-800 font-bold bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                          Diskon: {formatRupiah(pointsDiscountValue)}
                        </span>
                        <button
                          onClick={() => setPointsToRedeem(0)}
                          className="px-3 py-1.5 text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          const maxRedeemablePts = Math.min(
                            selectedCustomer.points,
                            Math.floor(cartSubtotal / 100)
                          );
                          setPointsToRedeem(maxRedeemablePts);
                        }}
                        className="px-3.5 py-1.5 text-xs font-bold bg-[#800020] hover:bg-[#660019] text-white rounded-xl shadow-xs cursor-pointer"
                      >
                        Tukar Poin Diskon
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : isCustomerDropdownOpen ? (
              <div className="mt-2.5 space-y-1 max-h-48 overflow-y-auto bg-white p-2 rounded-2xl border border-[#FCE4E8] shadow-md">
                <p className="text-[11px] text-stone-500 px-2 pb-1 border-b border-[#FCE4E8]">
                  Pilih member untuk mengumpulkan &amp; menukar poin:
                </p>
                {customers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCustomer(c);
                      setIsCustomerDropdownOpen(false);
                    }}
                    className="w-full text-left p-2 rounded-xl hover:bg-[#FFF5F7] text-xs flex justify-between items-center cursor-pointer transition-colors"
                  >
                    <div>
                      <span className="font-bold text-black">{c.name}</span>
                      <span className="text-stone-500 ml-2 font-mono text-[11px]">({c.phone})</span>
                    </div>
                    <span className="text-xs font-mono text-[#800020] font-bold">
                      {c.points} Pts ({c.tier})
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* Section 2: Daftar Item Keranjang Belanja */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#FCE4E8] shadow-xs overflow-hidden">
            <div className="p-3.5 sm:p-4 bg-[#FFF5F7] border-b border-[#FCE4E8] flex items-center justify-between">
              <span className="text-xs sm:text-sm font-black text-black">
                Daftar Barang Belanja ({cart.length} Jenis Produk)
              </span>
              <button
                onClick={handleBack}
                className="text-xs text-[#800020] font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Produk Lain</span>
              </button>
            </div>

            <div className="divide-y divide-[#FCE4E8]">
              {cart.map((item) => {
                const itemTotal = item.product.sellPrice * item.qty;
                const hasNote = Boolean(itemNotes[item.product.id]);
                const isWritingNote = activeNoteProductId === item.product.id;

                return (
                  <div key={item.product.id} className="p-3 sm:p-4 hover:bg-[#FFFBFB] transition-colors">
                    <div className="flex items-start sm:items-center gap-3">
                      
                      {/* Foto Produk */}
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#FFF5F5] border border-[#FCE4E8] overflow-hidden shrink-0 flex items-center justify-center relative">
                        <Package className="w-5 h-5 text-[#F8CCD4] absolute pointer-events-none" />
                        <img
                          src={getOptimizedThumb(item.product.imageUrl)}
                          alt={item.product.name}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover relative z-1"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>

                      {/* Detail Nama & Harga Produk */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs sm:text-sm font-extrabold text-black leading-tight">
                          {item.product.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs font-mono font-bold text-[#800020]">
                            {formatRupiah(item.product.sellPrice)}
                          </span>
                          <span className="text-[10px] text-stone-500 font-mono">
                            / {item.product.unit}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-stone-100 text-stone-700">
                            Stok: {item.product.stock}
                          </span>
                        </div>

                        {/* Catatan Item */}
                        {hasNote && !isWritingNote && (
                          <div className="mt-1 text-[11px] text-stone-600 bg-stone-50 px-2 py-0.5 rounded-lg border border-stone-200 inline-flex items-center gap-1">
                            <FileText className="w-3 h-3 text-stone-500" />
                            <span>{itemNotes[item.product.id]}</span>
                          </div>
                        )}
                      </div>

                      {/* Kontrol Kuantitas Touch-Friendly (Min 44px hit area di HP) */}
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <button
                          onClick={() => updateCartQty(item.product.id, item.qty - 1)}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FCE8EB] hover:bg-[#F8CCD4] active:scale-95 flex items-center justify-center text-[#800020] font-black cursor-pointer transition-all"
                          title="Kurangi kuantitas"
                          aria-label="Kurangi kuantitas"
                        >
                          <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        
                        <span className="w-7 sm:w-9 text-center font-mono font-black text-xs sm:text-sm text-black">
                          {item.qty}
                        </span>

                        <button
                          onClick={() => updateCartQty(item.product.id, item.qty + 1)}
                          disabled={item.qty >= item.product.stock}
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-black cursor-pointer transition-all ${
                            item.qty >= item.product.stock
                              ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                              : 'bg-[#FCE8EB] hover:bg-[#F8CCD4] active:scale-95 text-[#800020]'
                          }`}
                          title={item.qty >= item.product.stock ? 'Stok maksimal tercapai' : 'Tambah kuantitas'}
                          aria-label="Tambah kuantitas"
                        >
                          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>

                      {/* Subtotal Item & Tombol Hapus */}
                      <div className="text-right shrink-0 min-w-[75px] sm:min-w-[95px]">
                        <div className="text-xs sm:text-sm font-black text-black font-mono">
                          {formatRupiah(itemTotal)}
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-1">
                          <button
                            type="button"
                            onClick={() => setActiveNoteProductId(isWritingNote ? null : item.product.id)}
                            className="text-[10px] text-stone-500 hover:text-black font-medium cursor-pointer"
                            title="Tambah Catatan"
                          >
                            {hasNote ? 'Edit Catatan' : '+ Catatan'}
                          </button>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-[11px] text-[#800020] hover:underline font-bold cursor-pointer"
                            title="Hapus produk dari keranjang"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Form Input Catatan Produk */}
                    {isWritingNote && (
                      <div className="mt-2.5 pt-2 border-t border-[#FCE4E8] flex items-center gap-2">
                        <input
                          type="text"
                          value={itemNotes[item.product.id] || ''}
                          onChange={(e) =>
                            setItemNotes({ ...itemNotes, [item.product.id]: e.target.value })
                          }
                          placeholder="Contoh: bungkus rapi, pisahkan struk..."
                          className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-[#FCE4E8] bg-white text-black placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#800020]"
                        />
                        <button
                          type="button"
                          onClick={() => setActiveNoteProductId(null)}
                          className="px-3 py-1.5 text-xs font-bold bg-[#800020] text-white rounded-xl cursor-pointer"
                        >
                          Simpan
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Ringkasan Pembayaran & Total */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#FCE4E8] p-4 sm:p-5 shadow-xs space-y-2.5">
            <h3 className="text-xs sm:text-sm font-black text-black border-b border-[#FCE4E8] pb-2">
              Rincian Biaya &amp; Kalkulasi
            </h3>

            {/* Subtotal */}
            <div className="flex justify-between items-center text-xs sm:text-sm text-stone-700 font-semibold">
              <span>Subtotal ({totalCartCount} item)</span>
              <span className="font-mono font-bold text-black">{formatRupiah(cartSubtotal)}</span>
            </div>

            {/* Diskon Poin Member */}
            {pointsDiscountValue > 0 && (
              <div className="flex justify-between items-center text-xs sm:text-sm text-[#800020] font-bold">
                <span>Diskon Loyalitas Poin ({pointsToRedeem} pts)</span>
                <span className="font-mono">-{formatRupiah(pointsDiscountValue)}</span>
              </div>
            )}

            {/* PPN 11% Toggle */}
            <div className="flex items-center justify-between text-xs sm:text-sm text-stone-700 pt-2 border-t border-[#FCE4E8]">
              <label className="flex items-center gap-2 cursor-pointer font-semibold select-none">
                <input
                  type="checkbox"
                  checked={taxEnabled}
                  onChange={(e) => setTaxEnabled(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#800020] text-[#800020] focus:ring-[#800020]"
                />
                <span>PPN Toko (11%)</span>
              </label>
              <span className="font-mono font-bold text-black">
                {taxEnabled ? formatRupiah(cartTax) : 'Rp 0'}
              </span>
            </div>

            {/* Kas Keluar / Beli Stok Toko */}
            <div className="flex items-center justify-between text-xs text-stone-700 pt-2 border-t border-[#FCE4E8]">
              <div className="flex items-center gap-1.5 font-semibold">
                <ArrowDownCircle className="w-3.5 h-3.5 text-[#800020]" />
                <span>Pengeluaran Kas Toko:</span>
              </div>
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(true)}
                className="text-xs font-bold text-[#800020] hover:underline cursor-pointer"
              >
                {todayExpenseTotal > 0
                  ? `-${formatRupiah(todayExpenseTotal)} (+Catat)`
                  : '+ Catat Pengeluaran/Beli Stok'}
              </button>
            </div>

            {/* Grand Total */}
            <div className="pt-3 border-t-2 border-[#800020]/20 flex justify-between items-baseline">
              <div>
                <span className="text-xs sm:text-sm font-black text-black uppercase tracking-wider block">
                  Total Tagihan
                </span>
                <span className="text-[10px] text-stone-500 font-medium">
                  {cart.length} produk • Bebas biaya admin
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#800020] font-mono">
                {formatRupiah(cartTotal)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STICKY BOTTOM CHECKOUT ACTION BAR (Sangat Nyaman di Layar HP) */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#FCE4E8] p-3 sm:p-4 shadow-2xl">
          <div className="max-w-4xl mx-auto flex items-center gap-2.5 sm:gap-4">
            
            {/* Tombol Tambah Barang Lain (Kembali ke Katalog) */}
            <button
              type="button"
              onClick={handleBack}
              className="px-3.5 sm:px-5 py-3 rounded-2xl border border-[#FCE4E8] bg-[#FFF5F7] hover:bg-[#FCE8EB] text-black font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              title="Kembali ke katalog untuk menambah produk"
            >
              <ArrowLeft className="w-4 h-4 text-[#800020]" />
              <span className="hidden sm:inline">Tambah Barang</span>
              <span className="sm:hidden">Katalog</span>
            </button>

            {/* Tombol Utama Bayar Sekarang */}
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(true)}
              className="flex-1 py-3 px-4 sm:px-6 rounded-2xl bg-[#800020] hover:bg-[#660019] active:scale-[0.99] text-white font-extrabold text-xs sm:text-base shadow-lg shadow-rose-950/20 transition-all flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Bayar Sekarang</span>
              </div>
              <span className="font-mono font-black text-sm sm:text-lg">
                {formatRupiah(cartTotal)}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Payment Options Modal */}
      {isPaymentModalOpen && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
        />
      )}

      {/* Cash Expense Modal */}
      {isExpenseModalOpen && (
        <CashExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
        />
      )}
    </div>
  );
};
