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
  Package,
  Receipt
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
    <div className="space-y-6">
      
      {/* Top Banner Status */}
      <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-pink-50 text-[#F43F5E] flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">
                Rekap Kas &amp; Saldo Kasir
              </h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                currentShift?.isOpen
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-zinc-100 text-zinc-600'
              }`}>
                {currentShift?.isOpen ? 'SHIFT SEDANG AKTIF' : 'SHIFT DITUTUP'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pantau modal awal di laci kasir, penjualan masuk, pengeluaran kas/beli stok, dan saldo akhir rekonsiliasi.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenShiftModal}
          className="px-4 py-2.5 rounded-2xl text-xs font-bold text-white bg-[#F43F5E] hover:bg-[#E11D48] transition-colors flex items-center gap-2 shadow-xs shrink-0 cursor-pointer"
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
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-pink-100 shadow-sm space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Modal Awal Laci
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900">
            {formatRupiah(initialCash)}
          </div>
          <p className="text-[11px] text-slate-500">
            Uang tunai saat kasir pertama kali dibuka
          </p>
        </div>

        {/* Total Penjualan Tunai */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-pink-100 shadow-sm space-y-2">
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Penjualan Tunai</span>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600">
            +{formatRupiah(cashSales)}
          </div>
          <p className="text-[11px] text-slate-500">
            Masuk ke laci ({shiftTrx.filter(t => t.paymentMethod === 'tunai').length} transaksi)
          </p>
        </div>

        {/* Pengeluaran Kas / Pembelian Stok */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-rose-200 shadow-sm space-y-2 bg-rose-50/20">
          <div className="text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
            <ArrowDownCircle className="w-3.5 h-3.5 text-[#F43F5E]" />
            <span>Kas Keluar / Stok</span>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-rose-600">
            -{formatRupiah(shiftExpenseTotal)}
          </div>
          <p className="text-[11px] text-slate-500">
            Keluar dari laci ({shiftExpenses.length} catatan)
          </p>
        </div>

        {/* Total Penjualan Digital */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-pink-100 shadow-sm space-y-2">
          <div className="text-xs font-bold text-[#F43F5E] uppercase tracking-wider flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Penjualan Digital</span>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-[#F43F5E]">
            +{formatRupiah(digitalSales)}
          </div>
          <p className="text-[11px] text-slate-500">
            QRIS/Non-Tunai ({shiftTrx.filter(t => t.paymentMethod !== 'tunai').length} transaksi)
          </p>
        </div>

        {/* Saldo Akhir Laci */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border-2 border-pink-200 shadow-sm space-y-2 bg-pink-50/20">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Target Kas Akhir
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900">
            {formatRupiah(expectedEndCash)}
          </div>
          <p className="text-[10px] text-pink-600 font-semibold leading-tight">
            (Modal + Tunai - Kas Keluar)
          </p>
        </div>

      </div>

      {/* Rincian Rekonsiliasi & Shift Info */}
      <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-900">
          Rincian Shift Kasir Aktif
        </h3>

        {currentShift ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-3 p-4 rounded-2xl bg-pink-50/40 border border-pink-100">
                <div className="flex justify-between text-slate-600">
                  <span>Kasir Bertugas:</span>
                  <span className="font-bold text-slate-900">{currentShift.cashierName}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Waktu Buka Kasir:</span>
                  <span className="font-mono text-slate-900">{formatDateTime(currentShift.startTime)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Omset Shift Ini:</span>
                  <span className="font-mono font-bold text-[#F43F5E]">{formatRupiah(totalSales)}</span>
                </div>
              </div>

              <div className="space-y-3 p-4 rounded-2xl bg-pink-50/40 border border-pink-100">
                <div className="flex justify-between text-slate-600">
                  <span>Target Uang Fisik di Laci:</span>
                  <span className="font-mono font-bold text-slate-900">{formatRupiah(expectedEndCash)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Saldo Akhir Riil (Dihitung):</span>
                  <span className="font-mono font-bold text-slate-900">
                    {currentShift.isOpen ? 'Menunggu tutup shift' : formatRupiah(actualEndCash)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Selisih Kas Laci:</span>
                  <span className={`font-mono font-bold ${
                    difference === 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {currentShift.isOpen ? '0 (Seimbang)' : `${difference >= 0 ? '+' : ''}${formatRupiah(difference)}`}
                  </span>
                </div>
              </div>
            </div>

            {/* List Pengeluaran Selama Shift Ini */}
            {shiftExpenses.length > 0 && (
              <div className="p-4 rounded-2xl bg-rose-50/30 border border-rose-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-[#F43F5E]" />
                    <span>Daftar Kas Keluar &amp; Beli Stok Selama Shift Ini ({shiftExpenses.length})</span>
                  </span>
                  <span className="text-xs font-bold font-mono text-rose-600">
                    Total: -{formatRupiah(shiftExpenseTotal)}
                  </span>
                </div>
                <div className="divide-y divide-rose-100/60 text-xs">
                  {shiftExpenses.map((exp) => (
                    <div key={exp.id} className="py-2 flex items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold text-slate-800">{exp.notes}</div>
                        <div className="text-[10px] text-slate-400">
                          {formatDateTime(exp.date)} • {exp.categoryLabel}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-rose-600 shrink-0">
                        -{formatRupiah(exp.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            Shift kasir belum dibuka. Klik "Buka Shift Baru" untuk memulai.
          </div>
        )}
      </div>

    </div>
  );
};
