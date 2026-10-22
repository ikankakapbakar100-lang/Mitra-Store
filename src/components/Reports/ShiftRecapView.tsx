/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { usePOS } from '../../context/POSContext';
import { formatRupiah, formatDateTime } from '../../utils/format';
import { 
  Wallet, 
  DoorClosed, 
  DoorOpen, 
  ArrowUpRight,
  ArrowDownCircle,
  Package
} from 'lucide-react';

interface ShiftRecapViewProps {
  onOpenShiftModal: () => void;
}

export const ShiftRecapView: React.FC<ShiftRecapViewProps> = ({ onOpenShiftModal }) => {
  const { currentShift, transactions, expenses } = usePOS();

  // Calculate current shift cash, expenses, and digital totals
  const shiftStartTime = currentShift && currentShift.isOpen ? new Date(currentShift.startTime).getTime() : 0;
  
  const shiftTrx = transactions.filter(t => {
    if (!currentShift || !currentShift.isOpen) return false;
    return new Date(t.date).getTime() >= shiftStartTime;
  });

  const cashSales = shiftTrx
    .filter(t => t.paymentMethod === 'tunai')
    .reduce((sum, t) => sum + t.total, 0);

  const digitalSales = shiftTrx
    .filter(t => t.paymentMethod !== 'tunai')
    .reduce((sum, t) => sum + t.total, 0);

  const shiftExpenses = expenses.filter(e => {
    if (!currentShift || !currentShift.isOpen) return false;
    return new Date(e.date).getTime() >= shiftStartTime;
  });

  const shiftExpenseTotal = shiftExpenses.reduce((sum, e) => sum + e.amount, 0);

  const totalSales = cashSales + digitalSales;
  const initialCash = currentShift ? currentShift.initialCash : 0;
  const expectedEndCash = initialCash + cashSales - shiftExpenseTotal;
  const actualEndCash = currentShift?.actualCash ?? expectedEndCash;
  const difference = currentShift?.difference ?? (actualEndCash - expectedEndCash);

  return (
    <div className="space-y-6 text-black">
      
      {/* Top Banner Status */}
      <div className="bg-white rounded-3xl p-6 border border-[#FCE4E8] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#FCE8EB] text-[#800020] flex items-center justify-center shrink-0 border border-[#F8CCD4]">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-black">
                Rekap Kas &amp; Saldo Kasir
              </h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                currentShift?.isOpen
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-stone-100 text-stone-800 border border-stone-200'
              }`}>
                {currentShift?.isOpen ? 'SHIFT SEDANG AKTIF' : 'SHIFT DITUTUP'}
              </span>
            </div>
            <p className="text-xs text-stone-700 mt-0.5 font-medium">
              Pantau modal awal di laci kasir, penjualan masuk, pengeluaran kas/beli stok, dan saldo akhir rekonsiliasi.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenShiftModal}
          className="px-4 py-2.5 rounded-2xl text-xs font-bold text-white bg-[#800020] hover:bg-[#660019] transition-colors flex items-center gap-2 shadow-xs shrink-0 cursor-pointer"
        >
          {currentShift?.isOpen ? (
            <>
              <DoorClosed className="w-4 h-4" />
              <span>Rekonsiliasi &amp; Tutup Shift</span>
            </>
          ) : (
            <>
              <DoorOpen className="w-4 h-4" />
              <span>Buka Shift Baru</span>
            </>
          )}
        </button>
      </div>

      {/* Saldo Awal, Penjualan, Pengeluaran & Saldo Akhir Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* Saldo Awal */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#FCE4E8] shadow-sm space-y-2">
          <div className="text-xs font-bold text-stone-700 uppercase tracking-wider">
            Modal Awal Laci
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-black">
            {formatRupiah(initialCash)}
          </div>
          <p className="text-[11px] text-stone-600 font-medium">
            Uang tunai saat kasir pertama kali dibuka
          </p>
        </div>

        {/* Total Penjualan Tunai */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#FCE4E8] shadow-sm space-y-2">
          <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-700" />
            <span>Penjualan Tunai</span>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-700">
            +{formatRupiah(cashSales)}
          </div>
          <p className="text-[11px] text-stone-600 font-medium">
            Masuk ke laci ({shiftTrx.filter(t => t.paymentMethod === 'tunai').length} transaksi)
          </p>
        </div>

        {/* Pengeluaran Kas / Pembelian Stok */}
        <div className="bg-[#FFF5F7] p-4 sm:p-5 rounded-3xl border border-[#F8CCD4] shadow-sm space-y-2">
          <div className="text-xs font-bold text-[#800020] uppercase tracking-wider flex items-center gap-1">
            <ArrowDownCircle className="w-3.5 h-3.5 text-[#800020]" />
            <span>Kas Keluar / Stok</span>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-[#800020]">
            -{formatRupiah(shiftExpenseTotal)}
          </div>
          <p className="text-[11px] text-stone-700 font-medium">
            Keluar dari laci ({shiftExpenses.length} catatan)
          </p>
        </div>

        {/* Total Penjualan Digital */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#FCE4E8] shadow-sm space-y-2">
          <div className="text-xs font-bold text-[#800020] uppercase tracking-wider flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-[#800020]" />
            <span>Penjualan Digital</span>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-[#800020]">
            +{formatRupiah(digitalSales)}
          </div>
          <p className="text-[11px] text-stone-600 font-medium">
            QRIS/Non-Tunai ({shiftTrx.filter(t => t.paymentMethod !== 'tunai').length} transaksi)
          </p>
        </div>

        {/* Saldo Akhir Laci */}
        <div className="bg-[#FFF8F9] p-4 sm:p-5 rounded-3xl border-2 border-[#F8CCD4] shadow-sm space-y-2">
          <div className="text-xs font-bold text-black uppercase tracking-wider">
            Target Kas Akhir
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-black">
            {formatRupiah(expectedEndCash)}
          </div>
          <p className="text-[10px] text-[#800020] font-bold leading-tight">
            (Modal + Tunai - Kas Keluar)
          </p>
        </div>

      </div>

      {/* Rincian Rekonsiliasi & Shift Info */}
      <div className="bg-white rounded-3xl p-6 border border-[#FCE4E8] shadow-sm space-y-4">
        <h3 className="font-black text-sm text-black">
          Rincian Shift Kasir Aktif
        </h3>

        {currentShift ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-3 p-4 rounded-2xl bg-[#FFF5F7] border border-[#FCE4E8]">
                <div className="flex justify-between text-black">
                  <span className="font-medium text-stone-700">Kasir Bertugas:</span>
                  <span className="font-bold text-black">{currentShift.cashierName}</span>
                </div>
                <div className="flex justify-between text-black">
                  <span className="font-medium text-stone-700">Waktu Buka Kasir:</span>
                  <span className="font-mono text-black">{formatDateTime(currentShift.startTime)}</span>
                </div>
                <div className="flex justify-between text-black">
                  <span className="font-medium text-stone-700">Total Omset Shift Ini:</span>
                  <span className="font-mono font-bold text-[#800020]">{formatRupiah(totalSales)}</span>
                </div>
              </div>

              <div className="space-y-3 p-4 rounded-2xl bg-[#FFF5F7] border border-[#FCE4E8]">
                <div className="flex justify-between text-black">
                  <span className="font-medium text-stone-700">Target Uang Fisik di Laci:</span>
                  <span className="font-mono font-bold text-black">{formatRupiah(expectedEndCash)}</span>
                </div>
                <div className="flex justify-between text-black">
                  <span className="font-medium text-stone-700">Saldo Akhir Riil (Dihitung):</span>
                  <span className="font-mono font-bold text-black">
                    {currentShift.isOpen ? 'Menunggu tutup shift' : formatRupiah(actualEndCash)}
                  </span>
                </div>
                <div className="flex justify-between text-black">
                  <span className="font-medium text-stone-700">Selisih Kas Laci:</span>
                  <span className={`font-mono font-bold ${
                    difference === 0 ? 'text-emerald-700' : 'text-[#800020]'
                  }`}>
                    {currentShift.isOpen ? '0 (Seimbang)' : `${difference >= 0 ? '+' : ''}${formatRupiah(difference)}`}
                  </span>
                </div>
              </div>
            </div>

            {/* List Pengeluaran Selama Shift Ini */}
            {shiftExpenses.length > 0 && (
              <div className="p-4 rounded-2xl bg-[#FFF5F7] border border-[#F8CCD4] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#800020] flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-[#800020]" />
                    <span>Daftar Kas Keluar &amp; Beli Stok Selama Shift Ini ({shiftExpenses.length})</span>
                  </span>
                  <span className="text-xs font-bold font-mono text-[#800020]">
                    Total: -{formatRupiah(shiftExpenseTotal)}
                  </span>
                </div>
                <div className="divide-y divide-[#FCE4E8] text-xs">
                  {shiftExpenses.map((exp) => (
                    <div key={exp.id} className="py-2 flex items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-black">{exp.notes}</div>
                        <div className="text-[10px] text-stone-700 font-medium">
                          {formatDateTime(exp.date)} • {exp.categoryLabel}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-[#800020] shrink-0">
                        -{formatRupiah(exp.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-stone-700">
            Shift kasir belum dibuka. Klik "Buka Shift Baru" untuk memulai.
          </div>
        )}
      </div>

    </div>
  );
};
