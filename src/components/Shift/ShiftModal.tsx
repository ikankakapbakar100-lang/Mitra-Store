/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { formatRupiah, formatDateTime } from '../../utils/format';
import { 
  Wallet, 
  DoorClosed, 
  DoorOpen, 
  X
} from 'lucide-react';

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShiftModal: React.FC<ShiftModalProps> = ({ isOpen, onClose }) => {
  const { currentShift, openShift, closeShift, currentUser, transactions, expenses } = usePOS();
  
  const [initialCashInput, setInitialCashInput] = useState<string>('200000');
  const [actualCashInput, setActualCashInput] = useState<string>('');
  const [notesInput, setNotesInput] = useState<string>('');

  if (!isOpen) return null;

  let shiftCashTotal = 0;
  let shiftTrxCount = 0;
  let shiftExpenseTotal = 0;
  let shiftExpenseCount = 0;
  let expectedCash = 0;

  if (currentShift && currentShift.isOpen) {
    const shiftStartTime = new Date(currentShift.startTime).getTime();
    const shiftCashTransactions = transactions.filter(
      t => t.cashierId === currentShift.cashierId && 
           new Date(t.date).getTime() >= shiftStartTime && 
           t.paymentMethod === 'tunai'
    );
    shiftTrxCount = shiftCashTransactions.length;
    shiftCashTotal = shiftCashTransactions.reduce((acc, t) => acc + t.total, 0);

    const shiftExpensesList = expenses.filter(
      e => new Date(e.date).getTime() >= shiftStartTime
    );
    shiftExpenseTotal = shiftExpensesList.reduce((acc, e) => acc + e.amount, 0);
    shiftExpenseCount = shiftExpensesList.length;

    expectedCash = currentShift.initialCash + shiftCashTotal - shiftExpenseTotal;
  }

  const actualCashNumber = parseInt(actualCashInput.replace(/\D/g, ''), 10) || 0;
  const difference = actualCashNumber - expectedCash;

  const handleOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    const initial = parseInt(initialCashInput.replace(/\D/g, ''), 10) || 0;
    openShift(initial);
    onClose();
  };

  const handleCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    closeShift(actualCashNumber, notesInput);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-pink-100 dark:border-zinc-800 max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-pink-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#F43F5E]" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Shift Kasir &amp; Saldo Laci
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {currentShift && currentShift.isOpen ? (
          <div className="mt-4 space-y-4">
            <div className="bg-pink-50/40 dark:bg-zinc-800/50 rounded-2xl p-4 border border-pink-100 dark:border-zinc-700 space-y-2">
              <div className="flex justify-between text-xs text-slate-500 dark:text-zinc-400">
                <span>Kasir Aktif:</span>
                <span className="font-bold text-slate-900 dark:text-white">{currentShift.cashierName}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 dark:text-zinc-400">
                <span>Waktu Mulai:</span>
                <span className="font-mono text-slate-900 dark:text-white">{formatDateTime(currentShift.startTime)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 dark:text-zinc-400">
                <span>Saldo Awal Laci:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{formatRupiah(currentShift.initialCash)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 dark:text-zinc-400">
                <span>Penjualan Tunai ({shiftTrxCount} trx):</span>
                <span className="font-mono font-bold text-emerald-600">+{formatRupiah(shiftCashTotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 dark:text-zinc-400">
                <span>Pengeluaran Kas ({shiftExpenseCount} kali):</span>
                <span className="font-mono font-bold text-rose-600">-{formatRupiah(shiftExpenseTotal)}</span>
              </div>
              <div className="pt-2 border-t border-pink-100 dark:border-zinc-700 flex justify-between text-xs font-bold text-slate-900 dark:text-white">
                <span>Saldo Akhir Ekspektasi:</span>
                <span className="font-mono text-[#F43F5E] text-sm">{formatRupiah(expectedCash)}</span>
              </div>
            </div>

            <form onSubmit={handleCloseShift} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                  Hitung Uang Fisik di Laci:
                </label>
                <input
                  type="text"
                  value={actualCashInput}
                  onChange={(e) => setActualCashInput(e.target.value)}
                  placeholder="Misal: 450000"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-pink-100 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-[#F43F5E] focus:outline-none"
                  required
                />
              </div>

              {actualCashInput && (
                <div className={`p-3 rounded-xl text-xs flex items-center justify-between font-bold ${
                  difference === 0 
                    ? 'bg-emerald-50 text-emerald-800' 
                    : difference > 0 
                    ? 'bg-blue-50 text-blue-800' 
                    : 'bg-rose-50 text-rose-800'
                }`}>
                  <span>Selisih Kas:</span>
                  <span className="font-mono text-sm">
                    {difference >= 0 ? '+' : ''}{formatRupiah(difference)} ({difference === 0 ? 'Seimbang' : difference > 0 ? 'Kelebihan' : 'Kekurangan'})
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                  Catatan Rekonsiliasi (Opsional):
                </label>
                <textarea
                  rows={2}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Catatan serah terima kasir..."
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-pink-100 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#F43F5E] resize-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-[#F43F5E] dark:hover:bg-[#F43F5E] dark:hover:text-white rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <DoorClosed className="w-4 h-4 text-pink-400" />
                  <span>Tutup &amp; Setor Shift</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <form onSubmit={handleOpenShift} className="mt-4 space-y-4">
            <div className="bg-pink-50 p-3 rounded-2xl border border-pink-200 text-xs text-[#BE185D]">
              Shift kasir belum aktif. Masukkan uang modal saldo awal di laci kasir untuk mulai bertransaksi.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                Saldo Awal di Laci (Rp):
              </label>
              <input
                type="text"
                value={initialCashInput}
                onChange={(e) => setInitialCashInput(e.target.value)}
                placeholder="200000"
                className="w-full px-3 py-2 text-sm rounded-xl border border-pink-100 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-[#F43F5E]"
                required
              />
            </div>

            <div className="flex gap-2">
              {[100000, 200000, 500000].map(amount => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setInitialCashInput(amount.toString())}
                  className="flex-1 py-1.5 text-xs bg-pink-50/60 dark:bg-zinc-800 hover:bg-pink-100 border border-pink-100 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 rounded-xl font-mono font-semibold transition-colors"
                >
                  {formatRupiah(amount)}
                </button>
              ))}
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 rounded-xl"
              >
                Tutup
              </button>
              <button
                type="submit"
                className="flex-1 py-2 text-xs font-bold text-white bg-[#F43F5E] hover:bg-[#E11D48] rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <DoorOpen className="w-4 h-4" />
                <span>Buka Shift Sekarang</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
