/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { usePOS } from '../../context/POSContext';
import { formatRupiah } from '../../utils/format';
import {
  ShoppingCart,
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  ShoppingBag,
  Sparkles,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Edit3,
  PauseCircle,
  PlusCircle,
  Receipt,
  FileText
} from 'lucide-react';
import { PaymentModal } from './PaymentModal';
import { CustomerCartSession } from '../../types/pos';

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
    activeCartSession,
    cartSessions,
    setActiveCartSessionId,
    createNewCartSession,
    deleteCartSession,
  } = usePOS();

  const [isConfirmingClearCart, setIsConfirmingClearCart] = useState<boolean>(false);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [itemNotes, setItemNotes] = useState<{ [productId: string]: string }>({});
  const [activeNoteProductId, setActiveNoteProductId] = useState<string | null>(null);
  const [confirmCancelSessionId, setConfirmCancelSessionId] = useState<string | null>(null);

  const totalCartCount = cart.reduce((acc, item) => acc + item.qty, 0);

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

  // Simpan / Tunda Pesanan Saat Ini ke Daftar Belum Dibayar
  const handleHoldCurrentOrder = () => {
    if (cart.length === 0) return;
    // Buka sesi keranjang baru secara otomatis (numerisasi otomatis seperti Pesanan #2, Pesanan #3, dst.)
    createNewCartSession();
  };

  // Daftar Semua Pesanan yang Belum Dibayar (memiliki item belanja)
  const unpaidOrders = useMemo(() => {
    return cartSessions.filter((s) => s.items && s.items.length > 0);
  }, [cartSessions]);

  // Pesanan belum dibayar selain yang sedang aktif dibuka di layar
  const otherUnpaidOrders = useMemo(() => {
    return unpaidOrders.filter((s) => s.id !== activeCartSession.id);
  }, [unpaidOrders, activeCartSession.id]);

  const formatOrderTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    } catch {
      return '';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-6 py-2.5 sm:py-5 text-black pb-28">
      
      {/* Top Header Halaman Khusus Keranjang Belanja */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-[#FCE4E8] shadow-xs p-3 sm:p-4 mb-3">
        <div className="flex items-center justify-between gap-2">
          
          {/* Tombol Simbolik Kembali ke Katalog Produk */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBack}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-stone-100 hover:bg-[#FCE8EB] hover:text-[#800020] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Kembali Belanja di Katalog Produk"
            >
              <ArrowLeft className="w-4 h-4 text-[#800020]" />
              <span className="hidden sm:inline">Tambah Produk</span>
            </button>
            
            <div className="flex items-center p-0.5 bg-stone-100/80 rounded-xl border border-stone-200/80">
              <button
                type="button"
                onClick={handleBack}
                className="p-1.5 rounded-lg text-stone-600 hover:text-black hover:bg-white cursor-pointer"
                title="Buka Katalog Produk"
              >
                <Package className="w-4 h-4" />
              </button>
              <div 
                className="p-1.5 rounded-lg bg-[#800020] text-white shadow-2xs"
                title="Halaman Keranjang (Aktif)"
              >
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Judul Otomatisasi Numerisasi (e.g. Pesanan #1, Pesanan #2) */}
          <div className="text-center flex-1 min-w-0 px-2">
            <div className="flex items-center justify-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
              <h1 className="text-sm sm:text-base font-black text-black truncate">
                {activeCartSession.name}
              </h1>
            </div>
            <p className="text-[10px] sm:text-xs text-stone-600 font-medium mt-0.5">
              {totalCartCount} item • Total: <strong className="text-[#800020] font-bold font-mono">{formatRupiah(cartTotal)}</strong>
            </p>
          </div>

          {/* Tombol Aksi Keranjang: Tunda / Simpan Belum Dibayar & Kosongkan */}
          <div className="flex items-center gap-1.5 shrink-0">
            {cart.length > 0 && (
              <button
                type="button"
                onClick={handleHoldCurrentOrder}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#FFF0F3] hover:bg-[#FCE8EB] text-[#800020] border border-[#FCE4E8] text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-2xs"
                title="Simpan pesanan ini ke daftar belum dibayar dan layani pelanggan baru"
              >
                <PauseCircle className="w-3.5 h-3.5 text-[#800020]" />
                <span className="hidden md:inline">Tunda Pembayaran</span>
              </button>
            )}

            {cart.length > 0 && (
              isConfirmingClearCart ? (
                <div className="flex items-center gap-1 bg-[#FFF5F7] p-1 rounded-xl border border-rose-300">
                  <button
                    onClick={handleClearCart}
                    className="px-2 py-1 text-[11px] font-bold bg-[#800020] text-white rounded-lg hover:bg-[#660019] cursor-pointer"
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
                  className="flex items-center gap-1 p-2 rounded-xl border border-stone-200 text-stone-600 hover:text-[#800020] hover:bg-[#FCE8EB] text-xs font-semibold transition-colors cursor-pointer"
                  title="Kosongkan Semua Item di Pesanan Ini"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* LAYOUT DUA KOLOM: KERANJANG AKTIF SAAT INI (KIRI) & DAFTAR PESANAN BELUM DIBAYAR (KANAN) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start">
        
        {/* KOLOM 1 (KIRI, 7 Cols): KERANJANG AKTIF YANG SEDANG DILAYANI */}
        <div className="lg:col-span-7 space-y-3">
          
          {/* Card Daftar Produk di Keranjang Aktif */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-[#FCE4E8] shadow-xs p-3 sm:p-4">
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#FCE4E8]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#800020] text-white flex items-center justify-center">
                  <ShoppingCart className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-xs sm:text-sm font-black text-black">
                  Item di {activeCartSession.name}
                </h2>
              </div>

              <button
                type="button"
                onClick={handleBack}
                className="text-xs font-bold text-[#800020] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Produk</span>
              </button>
            </div>

            {cart.length === 0 ? (
              /* Empty state keranjang aktif */
              <div className="py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-[#FFF5F7] border border-[#FCE4E8] flex items-center justify-center mx-auto mb-2.5">
                  <ShoppingBag className="w-6 h-6 text-[#800020]" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-black">
                  {activeCartSession.name} Masih Kosong
                </h3>
                <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                  Belum ada produk yang dipilih. Silakan kembali ke katalog untuk memilih produk jualan.
                </p>
                <button
                  type="button"
                  onClick={handleBack}
                  className="mt-3 px-4 py-2 rounded-xl bg-[#800020] hover:bg-[#660019] text-white font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  Buka Katalog Produk &rarr;
                </button>
              </div>
            ) : (
              /* Daftar Item */
              <div className="divide-y divide-[#FCE4E8]/80">
                {cart.map((item) => {
                  const itemDiscount = (item.discountPercent || 0) / 100;
                  const itemSubtotal = item.product.sellPrice * item.qty * (1 - itemDiscount);

                  return (
                    <div key={item.product.id} className="py-2.5 flex items-center gap-2.5 group">
                      {/* Thumbnail Produk */}
                      <img
                        src={getOptimizedThumb(item.product.imageUrl)}
                        alt={item.product.name}
                        className="w-12 h-12 rounded-xl object-cover border border-[#FCE4E8] shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />

                      {/* Detail Nama & Harga */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-black line-clamp-1 group-hover:text-[#800020] transition-colors">
                          {item.product.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-mono font-bold text-[#800020]">
                            {formatRupiah(item.product.sellPrice)}
                          </span>
                          <span className="text-[10px] text-stone-500 font-mono">
                            / {item.product.unit}
                          </span>
                        </div>
                      </div>

                      {/* Stepper & Kolom Ketik Jumlah yang Dapat Diedit */}
                      <div className="flex items-center gap-1 bg-[#FFF0F3] p-1 rounded-xl border border-[#FCE4E8] shrink-0">
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.product.id, item.qty - 1)}
                          className="w-6 h-6 rounded-lg bg-white hover:bg-stone-200 text-black flex items-center justify-center font-bold text-xs cursor-pointer active:scale-90 shadow-2xs"
                          title="Kurangi 1"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        
                        <input
                          type="number"
                          min="1"
                          max={item.product.stock}
                          value={item.qty}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) updateCartQty(item.product.id, val);
                          }}
                          className="w-10 text-center font-black font-mono text-xs bg-white rounded-md border border-[#FCE4E8] py-0.5 focus:outline-none focus:ring-1 focus:ring-[#800020]"
                          title="Ketik jumlah langsung"
                        />

                        <button
                          type="button"
                          disabled={item.qty >= item.product.stock}
                          onClick={() => updateCartQty(item.product.id, item.qty + 1)}
                          className="w-6 h-6 rounded-lg bg-[#800020] hover:bg-[#660019] disabled:opacity-40 text-white flex items-center justify-center font-bold text-xs cursor-pointer active:scale-90 shadow-2xs"
                          title="Tambah 1"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Total Baris & Tombol Hapus */}
                      <div className="text-right shrink-0 min-w-[70px]">
                        <div className="text-xs font-black font-mono text-black">
                          {formatRupiah(itemSubtotal)}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-[10px] text-stone-400 hover:text-rose-600 font-semibold cursor-pointer mt-0.5"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ringkasan Pembayaran & Tombol Bayar Sekarang */}
          {cart.length > 0 && (
            <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-[#FCE4E8] shadow-xs p-3.5 sm:p-4">
              <div className="space-y-1.5 text-xs pb-3 border-b border-[#FCE4E8]">
                <div className="flex items-center justify-between text-stone-600">
                  <span>Subtotal ({totalCartCount} item)</span>
                  <span className="font-mono font-bold text-black">{formatRupiah(cartSubtotal)}</span>
                </div>
                {pointsDiscountValue > 0 && (
                  <div className="flex items-center justify-between text-emerald-700">
                    <span>Diskon Poin Pelanggan</span>
                    <span className="font-mono font-bold">-{formatRupiah(pointsDiscountValue)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 text-sm font-black text-black">
                  <span>Total Tagihan:</span>
                  <span className="font-mono text-base font-black text-[#800020]">{formatRupiah(cartTotal)}</span>
                </div>
              </div>

              {/* Tombol Kasir: Bayar Sekarang & Tunda Pesanan */}
              <div className="pt-3 flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={handleHoldCurrentOrder}
                  className="w-full sm:w-auto px-4 py-3 rounded-2xl border border-[#FCE4E8] bg-[#FFF0F3] hover:bg-[#FCE8EB] text-[#800020] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  title="Simpan pesanan ini agar pelanggan bisa bayar nanti"
                >
                  <PauseCircle className="w-4 h-4" />
                  <span>Tunda Pembayaran (Hold)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="flex-1 w-full py-3 px-4 rounded-2xl bg-[#800020] hover:bg-[#660019] text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Bayar Sekarang ({formatRupiah(cartTotal)})</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* KOLOM 2 (KANAN, 5 Cols): KOLOM KHUSUS DAFTAR PESANAN PELANGGAN YANG BELUM DIBAYAR */}
        <div className="lg:col-span-5 space-y-3">
          
          <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-[#FCE4E8] shadow-xs p-3 sm:p-4">
            
            {/* Header Kolom Pesanan Belum Dibayar */}
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#FCE4E8]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-2xs">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-black leading-tight flex items-center gap-1.5">
                    <span>Pesanan Belum Dibayar</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#800020] text-white">
                      {unpaidOrders.length}
                    </span>
                  </h3>
                  <p className="text-[10px] text-stone-500">
                    Daftar belanja pelanggan yang tertunda
                  </p>
                </div>
              </div>

              {/* Tombol Buat Pesanan Baru Otomatis */}
              <button
                type="button"
                onClick={() => createNewCartSession()}
                className="px-2.5 py-1.5 rounded-xl bg-[#800020] hover:bg-[#660019] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer active:scale-95 transition-all shadow-2xs"
                title="Buka pesanan baru untuk melayani pelanggan berikutnya"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Pesanan Baru</span>
              </button>
            </div>

            {/* List Pesanan Belum Dibayar */}
            {unpaidOrders.length === 0 ? (
              <div className="py-8 text-center px-3">
                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-2 text-stone-400">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-black">
                  Tidak Ada Pesanan Tertunda
                </h4>
                <p className="text-[11px] text-stone-500 mt-1 max-w-xs mx-auto">
                  Jika pelanggan ingin memilih barang lain atau bayar nanti, klik tombol <strong>"Tunda Pembayaran"</strong> untuk menyimpannya di sini.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-0.5">
                {unpaidOrders.map((session) => {
                  const isCurrent = session.id === activeCartSession.id;
                  const sessionTotal = session.items.reduce(
                    (sum, i) => sum + i.product.sellPrice * i.qty,
                    0
                  );
                  const sessionCount = session.items.reduce((sum, i) => sum + i.qty, 0);

                  return (
                    <div
                      key={session.id}
                      className={`rounded-2xl p-3 border transition-all text-left relative ${
                        isCurrent
                          ? 'bg-[#FFF5F7] border-[#800020] ring-1 ring-[#800020]/20 shadow-xs'
                          : 'bg-white border-[#FCE4E8] hover:border-[#800020]/60 hover:shadow-xs'
                      }`}
                    >
                      {/* Top Bar Pesanan: Nomor Otomatis & Status */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-black">
                            {session.name}
                          </span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 rounded-md bg-[#800020] text-white text-[9px] font-bold">
                              Sedang Dibuka
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] font-mono text-stone-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-400" />
                          {formatOrderTime(session.createdAt)}
                        </span>
                      </div>

                      {/* Rincian Produk Singkat */}
                      <div className="text-[11px] text-stone-600 line-clamp-2 mb-2 leading-snug">
                        {session.items.map((i) => `${i.product.name} (x${i.qty})`).join(', ')}
                      </div>

                      {/* Baris Total & Tombol Aksi (Edit, Cancel, Bayar) */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#FCE4E8]/80">
                        <div>
                          <span className="text-[10px] text-stone-500 block leading-none">
                            {sessionCount} item
                          </span>
                          <span className="text-xs font-black font-mono text-[#800020] leading-tight block mt-0.5">
                            {formatRupiah(sessionTotal)}
                          </span>
                        </div>

                        {/* Aksi: Edit / Lanjutkan & Batalkan (Cancel) */}
                        <div className="flex items-center gap-1">
                          
                          {/* Tombol Batalkan Pesanan (Cancel) */}
                          {confirmCancelSessionId === session.id ? (
                            <div className="flex items-center gap-1 bg-rose-50 p-0.5 rounded-lg border border-rose-200">
                              <button
                                type="button"
                                onClick={() => {
                                  deleteCartSession(session.id);
                                  setConfirmCancelSessionId(null);
                                }}
                                className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold cursor-pointer"
                              >
                                Ya, Batal
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmCancelSessionId(null)}
                                className="px-1 text-stone-500 text-[10px] hover:text-black cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmCancelSessionId(session.id)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Batalkan Pesanan Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Tombol Edit / Lanjutkan Pesanan Ini */}
                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => setActiveCartSessionId(session.id)}
                              className="px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-[#FCE8EB] text-stone-800 hover:text-[#800020] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                              title="Muat pesanan ini untuk diedit atau ditambah barang"
                            >
                              <Edit3 className="w-3 h-3 text-[#800020]" />
                              <span>Edit</span>
                            </button>
                          )}

                          {/* Tombol Bayar Langsung */}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveCartSessionId(session.id);
                              setIsPaymentModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-[#800020] hover:bg-[#660019] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 flex items-center gap-1"
                            title="Proses Pembayaran untuk Pesanan Ini"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Bayar</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
        />
      )}
    </div>
  );
};
