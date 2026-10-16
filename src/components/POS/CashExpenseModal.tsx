/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { ExpenseCategory } from '../../types/pos';
import { formatRupiah } from '../../utils/format';
import { 
  X, 
  ArrowDownCircle, 
  Package, 
  ShoppingBag, 
  Zap, 
  Coffee, 
  MoreHorizontal, 
  CheckCircle2,
  AlertCircle,
  Wallet,
  PlusCircle,
  TrendingDown,
  Sparkles
} from 'lucide-react';

interface CashExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CashExpenseModal: React.FC<CashExpenseModalProps> = ({ isOpen, onClose }) => {
  const { 
    currentUser, 
    currentShift, 
    addExpense, 
    transactions, 
    expenses,
    products,
    updateProduct
  } = usePOS();

  const [category, setCategory] = useState<ExpenseCategory>('pembelian_stok');
  const [amountInput, setAmountInput] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Optional: Auto increase product stock when buying stock
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [stockAddedQty, setStockAddedQty] = useState<number>(0);

  if (!isOpen) return null;

  // Calculate approximate current drawer cash available
  let currentDrawerCash = 0;
  if (currentShift && currentShift.isOpen) {
    const shiftStartTime = new Date(currentShift.startTime).getTime();
    const cashSales = transactions
      .filter(t => new Date(t.date).getTime() >= shiftStartTime && t.paymentMethod === 'tunai')
      .reduce((sum, t) => sum + t.total, 0);
    const shiftExpenses = expenses
      .filter(e => new Date(e.date).getTime() >= shiftStartTime)
      .reduce((sum, e) => sum + e.amount, 0);
    currentDrawerCash = currentShift.initialCash + cashSales - shiftExpenses;
  }

  const numericAmount = parseInt(amountInput.replace(/\D/g, ''), 10) || 0;
  const projectedRemainingCash = currentDrawerCash - numericAmount;

  const categoryOptions: { 
    id: ExpenseCategory; 
    label: string; 
    icon: React.ComponentType<{ className?: string }>; 
    desc: string; 
  }[] = [
    { 
      id: 'pembelian_stok', 
      label: 'Beli Stok / Supplier', 
      icon: Package, 
      desc: 'Restock cetakan, loyang, atau alat masak dari supplier/pasar' 
    },
    { 
      id: 'kemasan_packaging', 
      label: 'Kemasan & Plastik', 
      icon: ShoppingBag, 
      desc: 'Kantong kresek, lakban, kardus packing' 
    },
    { 
      id: 'operasional', 
      label: 'Operasional Toko', 
      icon: Zap, 
      desc: 'Listrik, air/galon, kebersihan, perlengkapan toko' 
    },
    { 
      id: 'konsumsi_transport', 
      label: 'Konsumsi & Kurir', 
      icon: Coffee, 
      desc: 'Makan/minum kasir atau bensin motor kirim paket' 
    },
    { 
      id: 'lainnya', 
      label: 'Lain-lain', 
      icon: MoreHorizontal, 
      desc: 'Pengeluaran kas laci lainnya' 
    },
  ];

  const quickAmounts = [20000, 50000, 100000, 200000, 500000];

  const quickSuggestions: Record<ExpenseCategory, string[]> = {
    pembelian_stok: [
      'Beli cetakan pukis tambahan dari supplier',
      'Restock loyang brownies & martabak',
      'Beli sodet & capitan silikon dari toko grosir'
    ],
    kemasan_packaging: [
      'Beli kantong plastik kresek tebal 3 pack',
      'Beli lakban cokelat & bening untuk packing',
      'Beli bubble wrap 1 roll untuk kiriman kurir'
    ],
    operasional: [
      'Beli token listrik kasir / toko',
      'Beli galon air minum toko & tisu',
      'Biaya kebersihan & pembuangan sampah toko'
    ],
    konsumsi_transport: [
      'Makan siang & konsumsi kasir shift ini',
      'Bensin motor kurir toko kirim pesanan',
      'Ongkos antar paket ke agen ekspedisi'
    ],
    lainnya: [
      'Fotokopi nota & perlengkapan kasir',
      'Beli baterai timbangan digital',
      'Pengeluaran kas laci kasir mendadak'
    ]
  };

  const handleQuickAmount = (val: number) => {
    setAmountInput(val.toLocaleString('id-ID'));
    setErrorMessage('');
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId);
    const prod = products.find(p => p.id === productId);
    if (prod) {
      if (!notes) {
        setNotes(`Beli stok tambahan: ${prod.name}`);
      }
      if (stockAddedQty === 0) {
        setStockAddedQty(1);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (numericAmount <= 0) {
      setErrorMessage('Nominal pengeluaran harus lebih besar dari Rp 0!');
      return;
    }

    if (!notes.trim()) {
      setErrorMessage('Keterangan pengeluaran wajib diisi (misal: Beli 2 cetakan pukis dari supplier).');
      return;
    }

    const selectedCategoryOption = categoryOptions.find(c => c.id === category);

    // Build final note with stock info if selected
    let finalNotes = notes.trim();
    if (category === 'pembelian_stok' && selectedProductId && stockAddedQty > 0) {
      const prod = products.find(p => p.id === selectedProductId);
      if (prod) {
        updateProduct(prod.id, { stock: prod.stock + stockAddedQty });
        if (!finalNotes.includes(`[+${stockAddedQty}`)) {
          finalNotes = `[Stok Masuk +${stockAddedQty} ${prod.unit || 'pcs'} ${prod.name}] ${finalNotes}`;
        }
      }
    }

    addExpense({
      amount: numericAmount,
      category,
      categoryLabel: selectedCategoryOption?.label || 'Pengeluaran Kas',
      notes: finalNotes,
      cashierId: currentUser.id,
      cashierName: currentUser.name,
    });

    // Reset & Close
    setAmountInput('');
    setNotes('');
    setCategory('pembelian_stok');
    setSelectedProductId('');
    setStockAddedQty(0);
    onClose();
  };

  const chosenProduct = products.find(p => p.id === selectedProductId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-pink-100 max-w-lg w-full p-4 sm:p-6 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-pink-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#F43F5E] flex items-center justify-center border border-rose-100 shadow-2xs">
              <ArrowDownCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 leading-tight">
                Catat Kas Keluar / Pengeluaran
              </h3>
              <p className="text-xs text-slate-400">
                Pengambilan kas laci untuk pembelian stok barang atau operasional
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner: Kasir & Saldo Kas Laci Saat Ini */}
        <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-pink-50/70 to-rose-50/40 border border-pink-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#F43F5E]" />
            <div>
              <span className="text-slate-500 text-[11px] block">Kasir Bertugas:</span>
              <strong className="text-slate-800">{currentUser.name}</strong>
            </div>
          </div>
          {currentShift?.isOpen && (
            <div className="text-right">
              <span className="text-slate-500 text-[11px] block">Kas Laci Saat Ini:</span>
              <span className="font-mono font-black text-[#F43F5E]">
                {formatRupiah(currentDrawerCash)}
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-3.5 space-y-3.5">
          
          {/* Pilihan Kategori Pengeluaran */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Kategori Pengeluaran:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categoryOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = category === opt.id;
                return (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => {
                      setCategory(opt.id);
                      setErrorMessage('');
                    }}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#F43F5E] bg-rose-50/60 text-[#F43F5E] ring-2 ring-[#F43F5E]/20 shadow-2xs'
                        : 'border-pink-100 bg-white text-slate-700 hover:border-pink-200 hover:bg-pink-50/30'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className="w-4 h-4 shrink-0 text-[#F43F5E]" />
                      <span className="font-bold text-xs truncate">{opt.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 leading-tight line-clamp-2">
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* FITUR KHUSUS: Pilih Produk untuk Tambah Stok Otomatis saat Kategori Pembelian Stok */}
          {category === 'pembelian_stok' && (
            <div className="p-3 rounded-2xl bg-rose-50/40 border border-rose-200/80 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                <PlusCircle className="w-4 h-4 text-[#F43F5E]" />
                <span>Tambah Stok Produk Otomatis (Opsional)</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Pilih barang yang dibeli dari supplier untuk menambah stok toko secara langsung.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <select
                    value={selectedProductId}
                    onChange={(e) => handleSelectProduct(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-pink-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#F43F5E]"
                  >
                    <option value="">-- Pilih Produk Yang Dibeli --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stok: {p.stock} {p.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-slate-500 shrink-0 font-medium">+Qty:</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      disabled={!selectedProductId}
                      value={stockAddedQty || ''}
                      onChange={(e) => setStockAddedQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      placeholder="Qty"
                      className="w-full px-2 py-1.5 text-xs rounded-xl border border-pink-200 bg-white text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-[#F43F5E] disabled:bg-slate-100"
                    />
                  </div>
                </div>
              </div>

              {chosenProduct && (
                <div className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <span>
                    Stok saat ini: <strong>{chosenProduct.stock} {chosenProduct.unit}</strong>
                  </span>
                  <span>
                    Setelah restock: <strong className="font-bold text-emerald-800">{chosenProduct.stock + (stockAddedQty || 0)} {chosenProduct.unit}</strong>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Nominal Pengeluaran */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Nominal Uang Kas Dikeluarkan (Rp):
              </label>
              {currentShift?.isOpen && numericAmount > 0 && (
                <span className={`text-[11px] font-semibold ${
                  projectedRemainingCash < 0 ? 'text-rose-600 font-bold' : 'text-slate-500'
                }`}>
                  Sisa kas: {formatRupiah(projectedRemainingCash)}
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#F43F5E]">
                Rp
              </span>
              <input
                type="text"
                value={amountInput}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setAmountInput(raw ? parseInt(raw, 10).toLocaleString('id-ID') : '');
                  setErrorMessage('');
                }}
                placeholder="0"
                className="w-full pl-10 pr-4 py-2 text-base font-black font-mono rounded-xl border border-pink-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F43F5E]"
                autoFocus
                required
              />
            </div>

            {/* Quick Amount Pills */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickAmounts.map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => handleQuickAmount(amt)}
                  className="px-2.5 py-1 text-xs font-semibold font-mono rounded-xl bg-pink-50/70 hover:bg-pink-100 border border-pink-100 text-slate-700 cursor-pointer transition-colors"
                >
                  {formatRupiah(amt)}
                </button>
              ))}
            </div>
          </div>

          {/* Keterangan Detail */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Keterangan / Rincian Pengeluaran:
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setErrorMessage('');
              }}
              placeholder="Contoh: Beli 2 pcs Cetakan Pukis 10 Lubang Teflon dari Supplier Pak Joko"
              className="w-full px-3 py-2 text-xs rounded-xl border border-pink-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F43F5E] resize-none"
              required
            />
            
            {/* Quick Note Suggestions */}
            <div className="mt-1.5 flex flex-wrap gap-1">
              <span className="text-[10px] text-slate-400 flex items-center gap-0.5 mr-1">
                <Sparkles className="w-3 h-3 text-pink-400" /> Contoh:
              </span>
              {quickSuggestions[category]?.map((sug, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setNotes(sug)}
                  className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-pink-50 text-slate-600 hover:text-[#F43F5E] transition-colors border border-slate-200/60"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message Banner */}
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Warning if amount exceeds drawer cash */}
          {currentShift?.isOpen && projectedRemainingCash < 0 && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Perhatian: Nominal pengeluaran melebihi estimasi kas laci saat ini.</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 text-xs font-bold text-white bg-[#F43F5E] hover:bg-[#E11D48] rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Kas Keluar</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
