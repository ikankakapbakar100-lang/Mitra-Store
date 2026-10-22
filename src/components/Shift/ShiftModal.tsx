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
  const { currentShift, openShift, closeShift, transactions, expenses } = usePOS();
  
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-[#FCE4E8] max-w-md w-full p-6 text-black animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-[#FCE4E8]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#FCE8EB] text-[#800020] border border-[#F8CCD4]">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-black">
                Shift Kasir &amp; Saldo Laci
              </h3>
              <p className="text-[11px] text-[#800020] font-bold">
                Rekonsiliasi Uang Fisik Kasir
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full text-stone-500 hover:text-black hover:bg-[#FCE8EB] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {currentShift && currentShift.isOpen ? (
          <div className="mt-4 space-y-4">
            <div className="bg-[#FFF5F7] rounded-2xl p-4 border border-[#FCE4E8] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-700 font-medium">Kasir Aktif:</span>
                <span className="font-bold text-black">{currentShift.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-700 font-medium">Waktu Mulai:</span>
                <span className="font-mono text-black">{formatDateTime(currentShift.startTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-700 font-medium">Saldo Awal Laci:</span>
                <span className="font-mono font-bold text-black">{formatRupiah(currentShift.initialCash)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-700 font-medium">Penjualan Tunai ({shiftTrxCount} trx):</span>
                <span className="font-mono font-bold text-emerald-700">+{formatRupiah(shiftCashTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-700 font-medium">Pengeluaran Kas ({shiftExpenseCount} kali):</span>
                <span className="font-mono font-bold text-[#800020]">-{formatRupiah(shiftExpenseTotal)}</span>
              </div>
              <div className="pt-2 border-t border-[#FCE4E8] flex justify-between text-xs font-bold text-black">
                <span>Saldo Akhir Target (Fisik):</span>
                <span className="font-mono text-[#800020] text-sm">{formatRupiah(expectedCash)}</span>
              </div>
            </div>

            <form onSubmit={handleCloseShift} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Hitung Uang Fisik di Laci (Rp):
                </label>
                <input
                  type="text"
                  value={actualCashInput}
                  onChange={(e) => setActualCashInput(e.target.value)}
                  placeholder="Misal: 450000"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#FCE4E8] bg-white text-black font-mono focus:ring-2 focus:ring-[#800020] focus:outline-none"
                  required
                />
              </div>

              {actualCashInput && (
                <div className={`p-3 rounded-xl text-xs flex items-center justify-between font-bold ${
                  difference === 0 
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                    : difference > 0 
                    ? 'bg-blue-100 text-blue-900 border border-blue-300' 
                    : 'bg-[#FCE8EB] text-[#800020] border border-[#F8CCD4]'
                }`}>
                  <span>Selisih Kas:</span>
                  <span className="font-mono text-sm">
                    {difference >= 0 ? '+' : ''}{formatRupiah(difference)} ({difference === 0 ? 'Seimbang' : difference > 0 ? 'Kelebihan' : 'Kekurangan'})
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Catatan Rekonsiliasi (Opsional):
                </label>
                <textarea
                  rows={2}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Catatan serah terima kasir..."
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#FCE4E8] bg-white text-black focus:ring-2 focus:ring-[#800020] focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 text-xs font-bold text-black bg-[#FCE8EB] hover:bg-[#F8CCD4] rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-[#800020] hover:bg-[#660019] rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <DoorClosed className="w-4 h-4" />
                  <span>Tutup &amp; Setor Shift</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <form onSubmit={handleOpenShift} className="mt-4 space-y-4">
            <div className="bg-[#FFF5F7] p-3 rounded-2xl border border-[#F8CCD4] text-xs text-[#800020] font-medium leading-relaxed">
              Shift kasir belum aktif. Masukkan uang modal saldo awal di laci kasir untuk mulai bertransaksi.
            </div>

            <div>
              <label className="block text-xs font-bold text-black mb-1">
                Saldo Awal di Laci (Rp):
              </label>
              <input
                type="text"
                value={initialCashInput}
                onChange={(e) => setInitialCashInput(e.target.value)}
                placeholder="200000"
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#FCE4E8] bg-white text-black font-mono focus:ring-2 focus:ring-[#800020] focus:outline-none"
                required
              />
            </div>

            <div className="flex gap-2">
              {[100000, 200000, 500000].map(amount => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setInitialCashInput(amount.toString())}
                  className="flex-1 py-1.5 text-xs bg-[#FFF5F7] hover:bg-[#FCE8EB] border border-[#FCE4E8] text-black rounded-xl font-mono font-bold transition-colors cursor-pointer"
                >
                  {formatRupiah(amount)}
                </button>
              ))}
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 text-xs font-bold text-black bg-[#FCE8EB] hover:bg-[#F8CCD4] rounded-xl cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="submit"
                className="flex-1 py-2 text-xs font-bold text-white bg-[#800020] hover:bg-[#660019] rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
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
