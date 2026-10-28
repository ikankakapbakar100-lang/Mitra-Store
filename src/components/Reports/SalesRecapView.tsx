/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { usePOS } from '../../context/POSContext';
import { Transaction, DailyCashRecord } from '../../types/pos';
import {
  formatRupiah,
  formatDateTime,
  formatTimeOnly,
  formatDateOnly,
} from '../../utils/format';
import {
  Wallet,
  Lock,
  Banknote,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ShoppingBag,
  Coins,
  FileSpreadsheet,
  Receipt,
  X,
  Check,
  Edit3,
  Eye,
  Printer,
  Sparkles,
  Info,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface SalesRecapViewProps {
  onOpenShiftModal?: () => void;
}

export const SalesRecapView: React.FC<SalesRecapViewProps> = () => {
  const {
    transactions,
    currentShift,
    updateShiftBalances,
    dailyCashHistory,
    addOrUpdateDailyCashRecord,
    storeProfile,
    currentUser,
    expenses,
  } = usePOS();

  // Helper tanggal hari ini
  const getTodayISO = () => new Date().toISOString().split('T')[0];
  const todayISO = getTodayISO();

  // State mode tanggal: 'harian' (default) vs 'periode'
  const [dateMode, setDateMode] = useState<'harian' | 'periode'>('harian');
  const [selectedDate, setSelectedDate] = useState<string>(todayISO);

  // State untuk periode
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(todayISO);

  // State Modals
  const [isInitialCashModalOpen, setIsInitialCashModalOpen] = useState(false);
  const [isClosingCashModalOpen, setIsClosingCashModalOpen] = useState(false);
  const [isCashSummaryModalOpen, setIsCashSummaryModalOpen] = useState(false);
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null);

  // Form input state untuk Modal Saldo Awal
  const [initialCashInput, setInitialCashInput] = useState<string>('');
  const [initialCashNotes, setInitialCashNotes] = useState<string>('');

  // Form input state untuk Modal Saldo Akhir
  const [closingCashInput, setClosingCashInput] = useState<string>('');
  const [closingCashNotes, setClosingCashNotes] = useState<string>('');

  // Navigasi Tanggal Harian
  const handleShiftDay = (deltaDays: number) => {
    const current = new Date(selectedDate + 'T00:00:00');
    current.setDate(current.getDate() + deltaDays);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  // Format tanggal dalam Bahasa Indonesia
  const formatIndonesianDate = (isoDateStr: string) => {
    try {
      const date = new Date(isoDateStr + 'T00:00:00');
      return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoDateStr;
    }
  };

  // Preset filter periode
  const handleSetPresetPeriod = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const handleSetThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(todayISO);
  };

  // Filter transaksi berdasarkan tanggal / rentang periode
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const tDay = new Date(t.date).toISOString().split('T')[0];
      if (dateMode === 'harian') {
        return tDay === selectedDate;
      } else {
        return tDay >= startDate && tDay <= endDate;
      }
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, dateMode, selectedDate, startDate, endDate]);

  // Filter pengeluaran kas berdasarkan tanggal / rentang periode
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const eDay = new Date(e.date).toISOString().split('T')[0];
      if (dateMode === 'harian') {
        return eDay === selectedDate;
      } else {
        return eDay >= startDate && eDay <= endDate;
      }
    });
  }, [expenses, dateMode, selectedDate, startDate, endDate]);

  // Rekaman Daily Cash Record untuk tanggal terpilih
  const currentDailyCashRecord = useMemo(() => {
    return dailyCashHistory.find(
      (r) => new Date(r.date).toISOString().split('T')[0] === selectedDate
    );
  }, [dailyCashHistory, selectedDate]);

  // Perhitungan Keuangan Harian
  const dayCashSales = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.paymentMethod === 'tunai')
      .reduce((sum, t) => sum + t.total, 0);
  }, [filteredTransactions]);

  const dayDigitalSales = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.paymentMethod !== 'tunai')
      .reduce((sum, t) => sum + t.total, 0);
  }, [filteredTransactions]);

  const dayCashExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  // Nilai Saldo Awal aktif
  const activeInitialCash = useMemo(() => {
    if (dateMode === 'harian') {
      if (currentDailyCashRecord) return currentDailyCashRecord.initialCash;
      if (selectedDate === todayISO && currentShift) return currentShift.initialCash;
      return 0;
    } else {
      // Pada mode periode: akumulasi saldo awal seluruh hari yang tercatat
      const recordsInRange = dailyCashHistory.filter((r) => {
        const d = new Date(r.date).toISOString().split('T')[0];
        return d >= startDate && d <= endDate;
      });
      return recordsInRange.reduce((sum, r) => sum + r.initialCash, 0);
    }
  }, [dateMode, currentDailyCashRecord, selectedDate, todayISO, currentShift, dailyCashHistory, startDate, endDate]);

  // Nilai Saldo Kas Akhir aktif
  const activeClosingCash = useMemo(() => {
    if (dateMode === 'harian') {
      if (currentDailyCashRecord && typeof currentDailyCashRecord.actualCash === 'number') {
        return currentDailyCashRecord.actualCash;
      }
      if (selectedDate === todayISO && currentShift && typeof currentShift.actualCash === 'number') {
        return currentShift.actualCash;
      }
      return null;
    } else {
      const recordsInRange = dailyCashHistory.filter((r) => {
        const d = new Date(r.date).toISOString().split('T')[0];
        return d >= startDate && d <= endDate;
      });
      return recordsInRange.reduce((sum, r) => sum + (r.actualCash || 0), 0);
    }
  }, [dateMode, currentDailyCashRecord, selectedDate, todayISO, currentShift, dailyCashHistory, startDate, endDate]);

  // Apakah sudah tutup kas
  const isCashClosed = useMemo(() => {
    if (dateMode === 'harian') {
      if (currentDailyCashRecord) return !currentDailyCashRecord.isOpen && typeof currentDailyCashRecord.actualCash === 'number';
      if (selectedDate === todayISO && currentShift) return !currentShift.isOpen;
      return false;
    }
    return false;
  }, [dateMode, currentDailyCashRecord, selectedDate, todayISO, currentShift]);

  // Kas Seluruhnya Seharusnya di Laci (Fisik)
  // Rumus: Saldo Awal + Penjualan Tunai - Pengeluaran Kas
  const expectedTotalCash = useMemo(() => {
    return Math.max(0, activeInitialCash + dayCashSales - dayCashExpenses);
  }, [activeInitialCash, dayCashSales, dayCashExpenses]);

  // Selisih Kas
  const cashDifference = useMemo(() => {
    if (activeClosingCash === null) return 0;
    return activeClosingCash - expectedTotalCash;
  }, [activeClosingCash, expectedTotalCash]);

  // Highlight Metrik Penjualan (Part 2)
  const totalItemsSold = useMemo(() => {
    return filteredTransactions.reduce(
      (sum, t) => sum + t.items.reduce((iSum, item) => iSum + item.qty, 0),
      0
    );
  }, [filteredTransactions]);

  const totalRevenue = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => sum + t.total, 0);
  }, [filteredTransactions]);

  const totalCost = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => sum + (t.costTotal || 0), 0);
  }, [filteredTransactions]);

  const totalProfit = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => sum + (t.profit || 0), 0);
  }, [filteredTransactions]);

  const marginPercentage = useMemo(() => {
    if (totalRevenue <= 0) return 0;
    return ((totalProfit / totalRevenue) * 100).toFixed(1);
  }, [totalRevenue, totalProfit]);

  // Buka Modal Saldo Awal
  const handleOpenInitialCashModal = () => {
    setInitialCashInput(activeInitialCash > 0 ? String(activeInitialCash) : '');
    setInitialCashNotes(currentDailyCashRecord?.notes || '');
    setIsInitialCashModalOpen(true);
  };

  // Simpan Saldo Awal
  const handleSaveInitialCash = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(initialCashInput.replace(/[^\d]/g, '')) || 0;
    const existing = currentDailyCashRecord;
    const expected = num + dayCashSales - dayCashExpenses;
    const actual = existing?.actualCash ?? 0;
    const diff = existing && !existing.isOpen ? actual - expected : 0;

    addOrUpdateDailyCashRecord({
      id: existing?.id,
      date: existing ? existing.date : new Date(selectedDate + 'T08:00:00').toISOString(),
      cashierName: existing?.cashierName || currentUser.name || 'Owner',
      initialCash: num,
      cashSales: dayCashSales,
      digitalSales: dayDigitalSales,
      cashExpenses: dayCashExpenses,
      expectedCash: expected,
      actualCash: actual,
      difference: diff,
      isOpen: existing ? existing.isOpen : true,
      notes: initialCashNotes || existing?.notes || 'Saldo awal diatur pemilik toko',
    });

    if (selectedDate === todayISO && updateShiftBalances) {
      updateShiftBalances(num, currentShift?.actualCash ?? 0, initialCashNotes);
    }

    setIsInitialCashModalOpen(false);
  };

  // Buka Modal Saldo Akhir
  const handleOpenClosingCashModal = () => {
    setClosingCashInput(activeClosingCash !== null && activeClosingCash > 0 ? String(activeClosingCash) : String(expectedTotalCash));
    setClosingCashNotes(currentDailyCashRecord?.notes || '');
    setIsClosingCashModalOpen(true);
  };

  // Simpan Saldo Akhir (Tutup Kas)
  const handleSaveClosingCash = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(closingCashInput.replace(/[^\d]/g, '')) || 0;
    const existing = currentDailyCashRecord;
    const init = activeInitialCash;
    const expected = init + dayCashSales - dayCashExpenses;
    const diff = num - expected;

    addOrUpdateDailyCashRecord({
      id: existing?.id,
      date: existing ? existing.date : new Date(selectedDate + 'T17:00:00').toISOString(),
      cashierName: existing?.cashierName || currentUser.name || 'Kasir',
      initialCash: init,
      cashSales: dayCashSales,
      digitalSales: dayDigitalSales,
      cashExpenses: dayCashExpenses,
      expectedCash: expected,
      actualCash: num,
      difference: diff,
      isOpen: false, // Ditutup
      notes: closingCashNotes || (diff === 0 ? 'Tutup kas seimbang' : `Selisih kas ${diff > 0 ? '+' : ''}${formatRupiah(diff)}`),
    });

    if (selectedDate === todayISO && updateShiftBalances) {
      updateShiftBalances(init, num, closingCashNotes);
    }

    setIsClosingCashModalOpen(false);
  };

  // Ekspor Excel Pembukuan Langsung (Itemized + Transaksi Komprehensif)
  const handleExportBookkeepingExcel = () => {
    let csvContent = '\uFEFF'; // UTF-8 BOM untuk Microsoft Excel
    const headers = [
      'No Faktur',
      'Tanggal & Jam',
      'Kasir',
      'Pelanggan',
      'Metode Pembayaran',
      'Rincian Produk Terjual',
      'Total Qty (pcs)',
      'Total Omset (Rp)',
      'Total HPP Modal (Rp)',
      'Laba Kotor (Rp)',
      'Margin Laba (%)',
      'Jumlah Diterima (Rp)',
      'Kembalian (Rp)',
      'Catatan',
    ];

    csvContent += headers.map((h) => `"${h}"`).join(',') + '\r\n';

    filteredTransactions.forEach((tx) => {
      const itemsDetail = tx.items
        .map((i) => `${i.product.name} (x${i.qty} @${i.product.sellPrice})`)
        .join('; ');
      const totalQty = tx.items.reduce((sum, i) => sum + i.qty, 0);
      const profit = tx.profit || 0;
      const margin = tx.total > 0 ? ((profit / tx.total) * 100).toFixed(1) : '0';

      const row = [
        tx.invoiceNo,
        formatDateTime(tx.date),
        tx.cashierName,
        tx.customerName || 'Pelanggan Umum',
        tx.paymentMethod.toUpperCase(),
        itemsDetail.replace(/"/g, '""'),
        totalQty,
        tx.total,
        tx.costTotal || 0,
        profit,
        `${margin}%`,
        tx.amountPaid,
        tx.change,
        (tx.notes || '-').replace(/"/g, '""'),
      ];

      csvContent += row.map((val) => `"${val}"`).join(',') + '\r\n';
    });

    // Buat Blob dan download otomatis
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateLabel = dateMode === 'harian' ? selectedDate : `${startDate}_sd_${endDate}`;
    link.setAttribute(
      'download',
      `Pembukuan_Penjualan_${storeProfile.name.replace(/\s+/g, '_')}_${dateLabel}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 text-black pb-12">
      {/* =========================================================================
          PART 1: PENGATUR TANGGAL & 3 IKON TERPISAH (SALDO AWAL, AKHIR, KAS SELURUHNYA)
          ========================================================================= */}
      <div className="bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-3xl border border-[#FCE4E8] shadow-2xs space-y-3.5">
        {/* Header Bar Kontrol Tanggal / Periode */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-[#FCE4E8]/80">
          <div>
            <h2 className="text-base sm:text-lg font-black text-black tracking-tight flex items-center gap-2">
              <span>Rekap Penjualan &amp; Pembukuan Kas</span>
            </h2>
            <p className="text-xs text-stone-700 mt-0.5">
              Atur tanggal untuk memantau saldo harian atau akumulasi kas periode tertentu.
            </p>
          </div>

          {/* Pengatur Tanggal & Mode Switcher */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Toggle Mode: Harian vs Periode */}
            <div className="flex items-center p-0.5 bg-[#FFF0F3] rounded-xl border border-[#F8CCD4] shadow-2xs">
              <button
                type="button"
                onClick={() => setDateMode('harian')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  dateMode === 'harian'
                    ? 'bg-[#800020] text-white shadow-2xs'
                    : 'text-stone-700 hover:text-black'
                }`}
              >
                Harian
              </button>
              <button
                type="button"
                onClick={() => setDateMode('periode')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  dateMode === 'periode'
                    ? 'bg-[#800020] text-white shadow-2xs'
                    : 'text-stone-700 hover:text-black'
                }`}
              >
                Periode Tertentu
              </button>
            </div>

            {/* Kontrol Harian */}
            {dateMode === 'harian' ? (
              <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-[#FCE4E8] shadow-2xs">
                <button
                  type="button"
                  onClick={() => handleShiftDay(-1)}
                  className="p-1 rounded-lg text-stone-700 hover:text-black hover:bg-[#FFF5F7] transition-colors cursor-pointer"
                  title="Hari Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="relative flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#800020] shrink-0" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="text-xs font-bold text-black bg-transparent border-none focus:outline-none cursor-pointer"
                  />
                  <span className="text-[11px] font-semibold text-stone-700 hidden lg:inline">
                    ({formatIndonesianDate(selectedDate)})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleShiftDay(1)}
                  className="p-1 rounded-lg text-stone-700 hover:text-black hover:bg-[#FFF5F7] transition-colors cursor-pointer"
                  title="Hari Berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {selectedDate !== todayISO && (
                  <button
                    type="button"
                    onClick={() => setSelectedDate(todayISO)}
                    className="ml-1 px-2 py-0.5 text-[10px] font-extrabold bg-[#FFF0F3] text-[#800020] border border-[#F8CCD4] rounded-md hover:bg-[#800020] hover:text-white transition-colors cursor-pointer"
                  >
                    Hari Ini
                  </button>
                )}
              </div>
            ) : (
              /* Kontrol Periode Tertentu */
              <div className="flex flex-wrap items-center gap-1.5">
                <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-[#FCE4E8] text-xs shadow-2xs">
                  <span className="text-[11px] font-semibold text-stone-700">Mulai:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="font-bold text-black bg-transparent focus:outline-none cursor-pointer"
                  />
                  <span className="text-stone-700 mx-1">s/d</span>
                  <span className="text-[11px] font-semibold text-stone-700">Akhir:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="font-bold text-black bg-transparent focus:outline-none cursor-pointer"
                  />
                </div>

                {/* Preset Chips */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleSetPresetPeriod(7)}
                    className="px-2 py-1 text-[11px] font-bold rounded-lg bg-white border border-[#FCE4E8] text-stone-700 hover:bg-[#FFF5F7] hover:text-[#800020] transition-colors cursor-pointer"
                  >
                    7 Hari
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetPresetPeriod(30)}
                    className="px-2 py-1 text-[11px] font-bold rounded-lg bg-white border border-[#FCE4E8] text-stone-700 hover:bg-[#FFF5F7] hover:text-[#800020] transition-colors cursor-pointer"
                  >
                    30 Hari
                  </button>
                  <button
                    type="button"
                    onClick={handleSetThisMonth}
                    className="px-2 py-1 text-[11px] font-bold rounded-lg bg-white border border-[#FCE4E8] text-stone-700 hover:bg-[#FFF5F7] hover:text-[#800020] transition-colors cursor-pointer"
                  >
                    Bulan Ini
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3 ICON TERPISAH (SALDO AWAL, SALDO AKHIR, KAS SELURUHNYA) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 1. IKON / KARTU SALDO AWAL */}
          <div className="p-3.5 rounded-2xl border border-[#F8CCD4] bg-gradient-to-br from-[#FFF5F7] to-white flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-700">
                  {dateMode === 'harian' ? 'Saldo Kas Awal' : 'Total Saldo Awal'}
                </span>
                <div className="text-lg sm:text-xl font-black font-mono text-[#800020] mt-1">
                  {formatRupiah(activeInitialCash)}
                </div>
                <p className="text-[11px] text-stone-700 mt-0.5">
                  {dateMode === 'harian'
                    ? 'Modal kembalian kasir pagi hari'
                    : 'Akumulasi kas awal periode terpilih'}
                </p>
              </div>

              {/* Ikon Khusus Saldo Awal */}
              <div className="w-10 h-10 rounded-2xl bg-[#FFF0F3] border border-[#F8CCD4] text-[#800020] flex items-center justify-center shrink-0 shadow-2xs">
                <Wallet className="w-5 h-5" />
              </div>
            </div>

            {dateMode === 'harian' && (
              <div className="mt-3 pt-2.5 border-t border-[#F8CCD4]/60 flex items-center justify-between">
                <span className="text-[10px] text-stone-700 font-medium">
                  {activeInitialCash > 0 ? 'Sudah ditentukan' : 'Belum ditentukan'}
                </span>
                <button
                  type="button"
                  onClick={handleOpenInitialCashModal}
                  className="px-2.5 py-1 text-xs font-bold rounded-xl bg-white border border-[#F8CCD4] text-[#800020] hover:bg-[#800020] hover:text-white transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                  title="Input atau ubah nominal kas awal"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Input Saldo Awal</span>
                </button>
              </div>
            )}
          </div>

          {/* 2. IKON / KARTU SALDO AKHIR */}
          <div className="p-3.5 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/70 to-white flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-700">
                    {dateMode === 'harian' ? 'Saldo Kas Akhir' : 'Total Kas Akhir Fisik'}
                  </span>
                  {dateMode === 'harian' && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-md font-extrabold ${
                        isCashClosed
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {isCashClosed ? 'Tutup Kas' : 'Belum Ditutup'}
                    </span>
                  )}
                </div>

                <div className="text-lg sm:text-xl font-black font-mono text-amber-900 mt-1">
                  {activeClosingCash !== null
                    ? formatRupiah(activeClosingCash)
                    : 'Belum Diinput'}
                </div>

                <p className="text-[11px] text-stone-700 mt-0.5">
                  {dateMode === 'harian'
                    ? isCashClosed
                      ? cashDifference === 0
                        ? 'Kas seimbang dengan sistem'
                        : `Selisih kas ${cashDifference > 0 ? '+' : ''}${formatRupiah(cashDifference)}`
                      : 'Uang fisik dihitung saat toko tutup'
                    : 'Total fisik kas yang dilaporkan'}
                </p>
              </div>

              {/* Ikon Khusus Saldo Akhir */}
              <div className="w-10 h-10 rounded-2xl bg-amber-100/80 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0 shadow-2xs">
                <Lock className="w-5 h-5" />
              </div>
            </div>

            {dateMode === 'harian' && (
              <div className="mt-3 pt-2.5 border-t border-amber-200/60 flex items-center justify-between">
                <span className="text-[10px] text-stone-700 font-medium">
                  {isCashClosed ? 'Tutup kas tersimpan' : 'Perlu dihitung saat tutup'}
                </span>
                <button
                  type="button"
                  onClick={handleOpenClosingCashModal}
                  className="px-2.5 py-1 text-xs font-bold rounded-xl bg-white border border-amber-300 text-amber-800 hover:bg-amber-700 hover:text-white transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                  title="Input penghitungan kas akhir / tutup kas"
                >
                  <Lock className="w-3 h-3" />
                  <span>Input Kas Akhir</span>
                </button>
              </div>
            )}
          </div>

          {/* 3. IKON / KARTU KAS SELURUHNYA */}
          <div className="p-3.5 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-white flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-700">
                  {dateMode === 'harian' ? 'Kas Seluruhnya' : 'Total Kas Bersih'}
                </span>
                <div className="text-lg sm:text-xl font-black font-mono text-emerald-900 mt-1">
                  {formatRupiah(expectedTotalCash)}
                </div>
                <p className="text-[11px] text-stone-700 mt-0.5">
                  Total fisik laci = Awal + Tunai - Pengeluaran
                </p>
              </div>

              {/* Ikon Khusus Kas Seluruhnya */}
              <div className="w-10 h-10 rounded-2xl bg-emerald-100/80 border border-emerald-200 text-emerald-800 flex items-center justify-center shrink-0 shadow-2xs">
                <Banknote className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-emerald-200/60 flex items-center justify-between">
              <span className="text-[10px] text-stone-700 font-medium">
                Tunai: {formatRupiah(dayCashSales)}
              </span>
              <button
                type="button"
                onClick={() => setIsCashSummaryModalOpen(true)}
                className="px-2.5 py-1 text-xs font-bold rounded-xl bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-700 hover:text-white transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                title="Cek rincian perhitungan uang kas seluruhnya"
              >
                <Eye className="w-3 h-3" />
                <span>Cek Rincian Kas</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          PART 2: TABEL KHUSUS RINGKAS HIGHLIGHT (TIDAK TERLALU BESAR)
          Jumlah Produk Terjual, Estimasi Laba Kotor, Total Omset
          ========================================================================= */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-[#FCE4E8] p-3 sm:p-3.5 shadow-2xs">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#FCE4E8]/70">
          <div className="flex items-center gap-1.5 text-xs font-bold text-black">
            <Sparkles className="w-3.5 h-3.5 text-[#800020]" />
            <span>
              Highlight Ringkasan{' '}
              {dateMode === 'harian'
                ? `Hari Ini (${formatIndonesianDate(selectedDate)})`
                : `Periode (${startDate} s/d ${endDate})`}
            </span>
          </div>
          <span className="text-[11px] text-stone-700 font-medium">
            {filteredTransactions.length} Transaksi Selesai
          </span>
        </div>

        {/* Tabel Ringkas Highlight */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#FFF5F7] text-stone-800 text-[11px] font-bold">
                <th className="py-2 px-3 text-left rounded-l-xl">Jumlah Produk Terjual</th>
                <th className="py-2 px-3 text-left">Estimasi Laba Kotor</th>
                <th className="py-2 px-3 text-right rounded-r-xl">Total Omset Penjualan</th>
              </tr>
            </thead>
            <tbody>
              <tr className="divide-x divide-stone-100">
                {/* 1. Jumlah Produk Terjual */}
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#FFF0F3] text-[#800020] flex items-center justify-center shrink-0 border border-[#F8CCD4]">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-sm sm:text-base text-black font-mono">
                        {totalItemsSold.toLocaleString('id-ID')}{' '}
                        <span className="text-xs font-normal text-stone-700">pcs</span>
                      </div>
                      <div className="text-[10px] text-stone-700">
                        Total {filteredTransactions.length} nota transaksi
                      </div>
                    </div>
                  </div>
                </td>

                {/* 2. Estimasi Laba Kotor */}
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-sm sm:text-base text-emerald-800 font-mono">
                        {formatRupiah(totalProfit)}
                      </div>
                      <div className="text-[10px] text-emerald-800 font-medium">
                        Margin keuntungan: {marginPercentage}% (Modal: {formatRupiah(totalCost)})
                      </div>
                    </div>
                  </div>
                </td>

                {/* 3. Total Omset Penjualan */}
                <td className="py-2.5 px-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="text-right">
                      <div className="font-extrabold text-sm sm:text-base text-[#800020] font-mono">
                        {formatRupiah(totalRevenue)}
                      </div>
                      <div className="text-[10px] text-stone-700">
                        Tunai: {formatRupiah(dayCashSales)} | Digital:{' '}
                        {formatRupiah(dayDigitalSales)}
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-[#FFF0F3] text-[#800020] flex items-center justify-center shrink-0 border border-[#F8CCD4]">
                      <Coins className="w-4 h-4" />
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          PART 3: KOLOM KHUSUS RINCIAN TRANSAKSI (FOKUS PEMBUKUAN)
          Search bar no faktur DIHAPUS. Akses langsung ekspor ke Excel disediakan.
          ========================================================================= */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-[#FCE4E8] shadow-2xs overflow-hidden">
        {/* Header Rincian Transaksi & Tombol Ekspor Excel */}
        <div className="p-3.5 sm:p-4 border-b border-[#FCE4E8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#FFF5F7]/40">
          <div>
            <h3 className="text-sm sm:text-base font-black text-black flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#800020]" />
              <span>Rincian Transaksi &amp; Pembukuan</span>
            </h3>
            <p className="text-xs text-stone-700 mt-0.5">
              Jurnal pembukuan detail per transaksi untuk pencatatan keuangan toko.
            </p>
          </div>

          {/* Tombol Ekspor Langsung ke Excel */}
          <button
            type="button"
            onClick={handleExportBookkeepingExcel}
            disabled={filteredTransactions.length === 0}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs shrink-0 ${
              filteredTransactions.length === 0
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/20'
            }`}
            title="Download jurnal rincian transaksi langsung ke file Excel (.csv)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Excel Pembukuan</span>
          </button>
        </div>

        {/* Tabel Pembukuan Rincian Transaksi */}
        {filteredTransactions.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF0F3] text-[#800020] flex items-center justify-center mx-auto border border-[#F8CCD4]">
              <Receipt className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-sm text-black">
              Belum ada transaksi pada {dateMode === 'harian' ? 'hari ini' : 'periode ini'}
            </h4>
            <p className="text-xs text-stone-700 max-w-sm mx-auto">
              Setiap transaksi yang berhasil dicatat di kasir POS akan otomatis tercatat di jurnal pembukuan ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-stone-50/90 text-stone-700 text-[11px] font-bold border-b border-[#FCE4E8]">
                  <th className="py-2.5 px-3 text-left">Waktu</th>
                  <th className="py-2.5 px-3 text-left">No. Faktur</th>
                  <th className="py-2.5 px-3 text-left">Rincian Produk &amp; Qty</th>
                  <th className="py-2.5 px-3 text-right">Total Omset</th>
                  <th className="py-2.5 px-3 text-right">HPP Modal</th>
                  <th className="py-2.5 px-3 text-right">Laba Kotor</th>
                  <th className="py-2.5 px-3 text-center">Metode</th>
                  <th className="py-2.5 px-3 text-left">Kasir</th>
                  <th className="py-2.5 px-3 text-center">Struk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredTransactions.map((tx) => {
                  const txProfit = tx.profit || 0;
                  const totalQty = tx.items.reduce((s, i) => s + i.qty, 0);

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-[#FFF5F7]/50 transition-colors group"
                    >
                      {/* Waktu */}
                      <td className="py-2.5 px-3 font-mono text-[11px] text-stone-700 whitespace-nowrap">
                        {dateMode === 'periode'
                          ? formatDateTime(tx.date)
                          : formatTimeOnly(tx.date)}
                      </td>

                      {/* No Faktur */}
                      <td className="py-2.5 px-3 font-mono font-bold text-black whitespace-nowrap">
                        {tx.invoiceNo}
                      </td>

                      {/* Rincian Produk & Qty */}
                      <td className="py-2.5 px-3 max-w-xs">
                        <div className="space-y-0.5">
                          {tx.items.slice(0, 3).map((item, idx) => (
                            <div
                              key={idx}
                              className="text-[11px] text-stone-800 flex items-center justify-between gap-2"
                            >
                              <span className="truncate">{item.product.name}</span>
                              <span className="font-mono font-bold text-black shrink-0">
                                x{item.qty}
                              </span>
                            </div>
                          ))}
                          {tx.items.length > 3 && (
                            <div className="text-[10px] text-stone-700 italic">
                              +{tx.items.length - 3} produk lainnya ({totalQty} pcs)
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Total Omset */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#800020] whitespace-nowrap">
                        {formatRupiah(tx.total)}
                      </td>

                      {/* HPP Modal */}
                      <td className="py-2.5 px-3 text-right font-mono text-stone-700 whitespace-nowrap">
                        {formatRupiah(tx.costTotal || 0)}
                      </td>

                      {/* Laba Kotor */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800 whitespace-nowrap">
                        {formatRupiah(txProfit)}
                      </td>

                      {/* Metode Bayar */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            tx.paymentMethod === 'tunai'
                              ? 'bg-emerald-100 text-emerald-800'
                              : tx.paymentMethod === 'qris'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {tx.paymentMethod}
                        </span>
                      </td>

                      {/* Kasir */}
                      <td className="py-2.5 px-3 text-stone-700 whitespace-nowrap">
                        {tx.cashierName}
                      </td>

                      {/* Tombol Lihat Struk */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedReceiptTx(tx)}
                          className="p-1 rounded-lg text-stone-700 hover:text-[#800020] hover:bg-[#FFF0F3] transition-colors cursor-pointer"
                          title="Lihat Detail Struk"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL 1: INPUT / EDIT SALDO KAS AWAL
          ========================================================================= */}
      {isInitialCashModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 border border-[#F8CCD4] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#FCE4E8]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FFF0F3] text-[#800020] flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-black">Input Saldo Kas Awal</h3>
                  <p className="text-[11px] text-stone-700">{formatIndonesianDate(selectedDate)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInitialCashModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveInitialCash} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Nominal Modal Kas Awal (Rp):
                </label>
                <input
                  type="number"
                  value={initialCashInput}
                  onChange={(e) => setInitialCashInput(e.target.value)}
                  placeholder="Contoh: 200000"
                  className="w-full px-3 py-2 text-base font-mono font-bold text-black border border-[#F8CCD4] rounded-xl focus:ring-2 focus:ring-[#800020] focus:outline-none"
                  autoFocus
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-4 gap-1.5">
                {[50000, 100000, 200000, 500000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setInitialCashInput(String(amt))}
                    className="px-1.5 py-1 text-[10px] font-bold rounded-lg border border-[#F8CCD4] bg-[#FFF5F7] text-[#800020] hover:bg-[#800020] hover:text-white transition-colors cursor-pointer text-center"
                  >
                    {amt / 1000}rb
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Catatan (Opsional):
                </label>
                <input
                  type="text"
                  value={initialCashNotes}
                  onChange={(e) => setInitialCashNotes(e.target.value)}
                  placeholder="Contoh: Modal kembalian pecahan 2rb-20rb"
                  className="w-full px-3 py-1.5 text-xs border border-[#FCE4E8] rounded-xl focus:ring-2 focus:ring-[#800020] focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInitialCashModalOpen(false)}
                  className="w-1/2 py-2 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 rounded-xl text-xs font-bold bg-[#800020] hover:bg-[#990026] text-white shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: INPUT / EDIT SALDO KAS AKHIR (TUTUP KAS)
          ========================================================================= */}
      {isClosingCashModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 border border-amber-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-amber-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-black">Input Kas Akhir / Tutup Kas</h3>
                  <p className="text-[11px] text-stone-700">{formatIndonesianDate(selectedDate)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsClosingCashModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Rekap perhitungan sistem */}
            <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs space-y-1.5">
              <div className="flex justify-between text-stone-700">
                <span>Saldo Kas Awal:</span>
                <span className="font-mono font-bold text-black">{formatRupiah(activeInitialCash)}</span>
              </div>
              <div className="flex justify-between text-stone-700">
                <span>(+) Penjualan Tunai:</span>
                <span className="font-mono font-bold text-emerald-800">{formatRupiah(dayCashSales)}</span>
              </div>
              <div className="flex justify-between text-stone-700">
                <span>(-) Pengeluaran Kas:</span>
                <span className="font-mono font-bold text-rose-800">{formatRupiah(dayCashExpenses)}</span>
              </div>
              <div className="pt-1.5 border-t border-amber-200 flex justify-between font-extrabold text-amber-950">
                <span>Total Seharusnya di Laci:</span>
                <span className="font-mono text-sm">{formatRupiah(expectedTotalCash)}</span>
              </div>
            </div>

            <form onSubmit={handleSaveClosingCash} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Uang Fisik Dihitung di Laci (Rp):
                </label>
                <input
                  type="number"
                  value={closingCashInput}
                  onChange={(e) => setClosingCashInput(e.target.value)}
                  placeholder={String(expectedTotalCash)}
                  className="w-full px-3 py-2 text-base font-mono font-bold text-black border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  autoFocus
                />
              </div>

              {/* Status Selisih Live */}
              {closingCashInput && (
                <div
                  className={`p-2 rounded-xl text-xs flex items-center justify-between font-bold ${
                    parseFloat(closingCashInput) - expectedTotalCash === 0
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                      : parseFloat(closingCashInput) - expectedTotalCash > 0
                      ? 'bg-blue-100 text-blue-900 border border-blue-200'
                      : 'bg-rose-100 text-rose-900 border border-rose-200'
                  }`}
                >
                  <span>Hasil Selisih Fisik:</span>
                  <span className="font-mono">
                    {parseFloat(closingCashInput) - expectedTotalCash === 0
                      ? 'Pas (Sesuai 100%)'
                      : `${parseFloat(closingCashInput) - expectedTotalCash > 0 ? '+' : ''}${formatRupiah(
                          parseFloat(closingCashInput) - expectedTotalCash
                        )}`}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Catatan Tutup Kas:
                </label>
                <input
                  type="text"
                  value={closingCashNotes}
                  onChange={(e) => setClosingCashNotes(e.target.value)}
                  placeholder="Contoh: Kas fisik dihitung bersama kasir malam"
                  className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsClosingCashModalOpen(false)}
                  className="w-1/2 py-2 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 rounded-xl text-xs font-bold bg-amber-700 hover:bg-amber-800 text-white shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Tutup Kas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: CEK RINCIAN KAS SELURUHNYA
          ========================================================================= */}
      {isCashSummaryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 border border-emerald-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-black">Rincian Kas Seluruhnya</h3>
                  <p className="text-[11px] text-stone-700">
                    {dateMode === 'harian'
                      ? formatIndonesianDate(selectedDate)
                      : `${startDate} s/d ${endDate}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCashSummaryModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Breakdown Rinci Kas Fisik */}
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
                <div className="flex justify-between items-center text-stone-700">
                  <span>(+) Saldo Kas Awal (Modal):</span>
                  <span className="font-mono font-bold text-black">{formatRupiah(activeInitialCash)}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-800">
                  <span>(+) Total Penjualan Tunai:</span>
                  <span className="font-mono font-bold">{formatRupiah(dayCashSales)}</span>
                </div>
                <div className="flex justify-between items-center text-rose-800">
                  <span>(-) Pengeluaran Kas Toko:</span>
                  <span className="font-mono font-bold">{formatRupiah(dayCashExpenses)}</span>
                </div>
                <div className="pt-2 border-t border-stone-200 flex justify-between items-center font-extrabold text-sm text-emerald-950">
                  <span>Total Kas Fisik Seharusnya:</span>
                  <span className="font-mono text-base">{formatRupiah(expectedTotalCash)}</span>
                </div>
              </div>

              {/* Info Tambahan Non Tunai */}
              <div className="p-3 bg-[#FFF5F7] rounded-2xl border border-[#F8CCD4] space-y-1.5">
                <div className="text-[11px] font-bold text-[#800020] flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  <span>Pendapatan Digital (Bank / QRIS):</span>
                </div>
                <div className="flex justify-between items-center text-stone-700">
                  <span>Penjualan Non-Tunai Masuk:</span>
                  <span className="font-mono font-bold text-black">{formatRupiah(dayDigitalSales)}</span>
                </div>
                <p className="text-[10px] text-stone-700">
                  Uang digital langsung masuk ke rekening bank/merchant dan tidak mempengaruhi fisik laci kasir.
                </p>
              </div>

              {/* Status Kas Akhir jika sudah diinput */}
              {activeClosingCash !== null && (
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 space-y-1">
                  <div className="flex justify-between items-center text-xs text-amber-950 font-bold">
                    <span>Kas Fisik Aktual Dihitung:</span>
                    <span className="font-mono">{formatRupiah(activeClosingCash)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-stone-700">Status Selisih:</span>
                    <span
                      className={`font-mono font-extrabold ${
                        cashDifference === 0
                          ? 'text-emerald-700'
                          : cashDifference > 0
                          ? 'text-blue-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {cashDifference === 0
                        ? 'Seimbang (Rp 0)'
                        : `${cashDifference > 0 ? '+' : ''}${formatRupiah(cashDifference)}`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsCashSummaryModalOpen(false)}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#800020] hover:bg-[#990026] text-white cursor-pointer"
            >
              Tutup Rincian
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: DETAIL STRUK TRANSAKSI
          ========================================================================= */}
      {selectedReceiptTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 border border-[#FCE4E8] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#FCE4E8]">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#800020]" />
                <h3 className="font-black text-sm text-black">Detail Struk Pembelian</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceiptTx(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nota Struk Sederhana */}
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-2 font-mono">
              <div className="text-center pb-2 border-b border-dashed border-stone-300">
                <div className="font-extrabold text-black uppercase">{storeProfile.name}</div>
                <div className="text-[10px] text-stone-700">{formatDateTime(selectedReceiptTx.date)}</div>
                <div className="text-[10px] text-stone-700 font-bold mt-0.5">
                  No: {selectedReceiptTx.invoiceNo} | Kasir: {selectedReceiptTx.cashierName}
                </div>
              </div>

              {/* Items */}
              <div className="space-y-1.5 py-1 border-b border-dashed border-stone-300">
                {selectedReceiptTx.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-[11px]">
                    <div>
                      <div className="font-bold text-black">{item.product.name}</div>
                      <div className="text-[10px] text-stone-700">
                        {item.qty} x {formatRupiah(item.product.sellPrice)}
                      </div>
                    </div>
                    <div className="font-bold text-black">
                      {formatRupiah(item.qty * item.product.sellPrice)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1 pt-1 text-[11px]">
                <div className="flex justify-between text-stone-700">
                  <span>Subtotal:</span>
                  <span>{formatRupiah(selectedReceiptTx.subtotal)}</span>
                </div>
                {selectedReceiptTx.discount > 0 && (
                  <div className="flex justify-between text-rose-700">
                    <span>Diskon:</span>
                    <span>-{formatRupiah(selectedReceiptTx.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-sm text-black pt-1 border-t border-stone-300">
                  <span>Total Bayar:</span>
                  <span>{formatRupiah(selectedReceiptTx.total)}</span>
                </div>
                <div className="flex justify-between text-stone-700 text-[10px]">
                  <span>Metode: {selectedReceiptTx.paymentMethod.toUpperCase()}</span>
                  <span>Kembalian: {formatRupiah(selectedReceiptTx.change)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-1/2 py-2 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-800 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Struk</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedReceiptTx(null)}
                className="w-1/2 py-2 rounded-xl text-xs font-bold bg-[#800020] hover:bg-[#990026] text-white cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
