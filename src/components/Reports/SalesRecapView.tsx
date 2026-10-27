/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { usePOS } from '../../context/POSContext';
import { Transaction, DailyCashRecord, CashExpense, ExpenseCategory } from '../../types/pos';
import {
  formatRupiah,
  formatDateOnly,
  formatTimeOnly,
  formatDateTime,
  exportTransactionsToExcel,
  exportDailyCashToExcel,
  exportExpensesToExcel,
  exportDailyItemizedTransactionsToExcel,
} from '../../utils/format';
import {
  TrendingUp,
  CreditCard,
  Calendar,
  Download,
  CheckCircle2,
  Search,
  Eye,
  Trash2,
  Plus,
  X,
  History,
  Receipt,
  ShieldCheck,
  Package,
  ArrowDownCircle,
  ShoppingBag,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Share2,
  Printer,
  FileSpreadsheet,
  ArrowUpRight,
  Layers,
  Clock,
  User,
  Coffee,
  Zap,
  Tag
} from 'lucide-react';
import { CashExpenseModal } from '../POS/CashExpenseModal';

interface SalesRecapViewProps {
  onOpenShiftModal?: () => void;
}

export const SalesRecapView: React.FC<SalesRecapViewProps> = ({ onOpenShiftModal }) => {
  const {
    transactions,
    currentShift,
    updateShiftBalances,
    dailyCashHistory,
    addOrUpdateDailyCashRecord,
    deleteDailyCashRecord,
    storeProfile,
    currentUser,
    expenses,
    deleteExpense,
    isExpenseModalOpen,
    setIsExpenseModalOpen,
  } = usePOS();

  // 4 Tab Utama:
  // 1. 'daily-recap': Rekap Penjualan Per Hari (Jurnal Transaksi Detail: apa yang dibeli, harga, kasir)
  // 2. 'period-recap': Rekap Penjualan Periode Tertentu (Analisis omzet, laba, tren periode)
  // 3. 'cash-history': Riwayat Saldo Kas Laci Harian (Kas Awal / Akhir)
  // 4. 'expenses': Pengeluaran Kas & Pembelian Stok Toko
  const [activeTab, setActiveTab] = useState<'daily-recap' | 'period-recap' | 'cash-history' | 'expenses'>('daily-recap');

  // =========================================================================
  // STATE TAB 1: REKAP PENJUALAN PER HARI
  // =========================================================================
  const getTodayISO = () => new Date().toISOString().split('T')[0];
  const [selectedDay, setSelectedDay] = useState<string>(getTodayISO());
  const [dailySearchQuery, setDailySearchQuery] = useState<string>('');

  // Navigasi Tanggal Harian
  const handleShiftDay = (deltaDays: number) => {
    const current = new Date(selectedDay + 'T00:00:00');
    current.setDate(current.getDate() + deltaDays);
    setSelectedDay(current.toISOString().split('T')[0]);
  };

  // Transaksi pada hari yang dipilih
  const dailyTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const tDay = new Date(t.date).toISOString().split('T')[0];
      if (tDay !== selectedDay) return false;

      if (dailySearchQuery.trim()) {
        const q = dailySearchQuery.toLowerCase();
        const matchesInvoice = (t.invoiceNo || t.id).toLowerCase().includes(q);
        const matchesCashier = t.cashierName.toLowerCase().includes(q);
        const matchesCustomer = (t.customerName || '').toLowerCase().includes(q);
        const matchesItems = t.items.some((i) => i.product.name.toLowerCase().includes(q));
        if (!matchesInvoice && !matchesCashier && !matchesCustomer && !matchesItems) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedDay, dailySearchQuery]);

  // Pengeluaran pada hari yang dipilih
  const dailyExpenses = useMemo(() => {
    return expenses
      .filter((e) => new Date(e.date).toISOString().split('T')[0] === selectedDay)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, selectedDay]);

  // Metrik Penjualan Hari Terpilih
  const dailyMetrics = useMemo(() => {
    let revenue = 0;
    let profit = 0;
    let totalItemsCount = 0;
    let cashRevenue = 0;
    let digitalRevenue = 0;

    dailyTransactions.forEach((t) => {
      revenue += t.total;
      profit += t.profit;
      totalItemsCount += t.items.reduce((sum, item) => sum + item.qty, 0);
      if (t.paymentMethod === 'tunai') cashRevenue += t.total;
      else digitalRevenue += t.total;
    });

    // Pengeluaran kas pada hari ini
    const dayExpenses = expenses
      .filter((e) => new Date(e.date).toISOString().split('T')[0] === selectedDay)
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      revenue,
      profit,
      txCount: dailyTransactions.length,
      totalItemsCount,
      cashRevenue,
      digitalRevenue,
      dayExpenses,
      netCash: cashRevenue - dayExpenses,
      marginPercent: revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0',
    };
  }, [dailyTransactions, expenses, selectedDay]);

  // =========================================================================
  // STATE TAB 2: REKAP PENJUALAN PERIODE TERTENTU
  // =========================================================================
  const [periodPreset, setPeriodPreset] = useState<'today' | '7days' | '30days' | 'this_month' | 'last_month' | 'custom'>('7days');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(getTodayISO());
  const [periodSearchQuery, setPeriodSearchQuery] = useState<string>('');

  // Transaksi dalam rentang periode terpilih
  const periodTransactions = useMemo(() => {
    const now = new Date();

    return transactions.filter((t) => {
      const tDate = new Date(t.date);

      if (periodPreset === 'today') {
        const isToday =
          tDate.getDate() === now.getDate() &&
          tDate.getMonth() === now.getMonth() &&
          tDate.getFullYear() === now.getFullYear();
        if (!isToday) return false;
      } else if (periodPreset === '7days') {
        const diffDays = (now.getTime() - tDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 7) return false;
      } else if (periodPreset === '30days') {
        const diffDays = (now.getTime() - tDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 30) return false;
      } else if (periodPreset === 'this_month') {
        const isThisMonth =
          tDate.getMonth() === now.getMonth() &&
          tDate.getFullYear() === now.getFullYear();
        if (!isThisMonth) return false;
      } else if (periodPreset === 'last_month') {
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const isLastMonth =
          tDate.getMonth() === lastMonthDate.getMonth() &&
          tDate.getFullYear() === lastMonthDate.getFullYear();
        if (!isLastMonth) return false;
      } else if (periodPreset === 'custom') {
        const start = new Date(customStartDate + 'T00:00:00').getTime();
        const end = new Date(customEndDate + 'T23:59:59').getTime();
        const tTime = tDate.getTime();
        if (tTime < start || tTime > end) return false;
      }

      if (periodSearchQuery.trim()) {
        const q = periodSearchQuery.toLowerCase();
        const matchesInvoice = (t.invoiceNo || t.id).toLowerCase().includes(q);
        const matchesCashier = t.cashierName.toLowerCase().includes(q);
        const matchesCustomer = (t.customerName || '').toLowerCase().includes(q);
        const matchesItems = t.items.some((i) => i.product.name.toLowerCase().includes(q));
        if (!matchesInvoice && !matchesCashier && !matchesCustomer && !matchesItems) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, periodPreset, customStartDate, customEndDate, periodSearchQuery]);

  // Metrik Penjualan Periode
  const periodMetrics = useMemo(() => {
    let totalRevenue = 0;
    let totalProfit = 0;
    let totalItemsCount = 0;
    let cashCount = 0;
    let digitalCount = 0;

    periodTransactions.forEach((t) => {
      totalRevenue += t.total;
      totalProfit += t.profit;
      totalItemsCount += t.items.reduce((s, i) => s + i.qty, 0);
      if (t.paymentMethod === 'tunai') cashCount++;
      else digitalCount++;
    });

    const txCount = periodTransactions.length;
    const avgOrderValue = txCount > 0 ? Math.round(totalRevenue / txCount) : 0;
    const marginPercent = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0';

    return {
      totalRevenue,
      totalProfit,
      totalItemsCount,
      txCount,
      avgOrderValue,
      cashCount,
      digitalCount,
      marginPercent,
    };
  }, [periodTransactions]);

  // Rangkuman Agregasi Per Hari dalam Periode
  const periodDailySummary = useMemo(() => {
    const summaryMap: Record<
      string,
      {
        dateStr: string;
        txCount: number;
        revenue: number;
        profit: number;
        itemsCount: number;
        cashRevenue: number;
        digitalRevenue: number;
      }
    > = {};

    periodTransactions.forEach((t) => {
      const dateKey = new Date(t.date).toISOString().split('T')[0];
      if (!summaryMap[dateKey]) {
        summaryMap[dateKey] = {
          dateStr: dateKey,
          txCount: 0,
          revenue: 0,
          profit: 0,
          itemsCount: 0,
          cashRevenue: 0,
          digitalRevenue: 0,
        };
      }
      summaryMap[dateKey].txCount += 1;
      summaryMap[dateKey].revenue += t.total;
      summaryMap[dateKey].profit += t.profit;
      summaryMap[dateKey].itemsCount += t.items.reduce((s, i) => s + i.qty, 0);
      if (t.paymentMethod === 'tunai') summaryMap[dateKey].cashRevenue += t.total;
      else summaryMap[dateKey].digitalRevenue += t.total;
    });

    return Object.values(summaryMap).sort(
      (a, b) => new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime()
    );
  }, [periodTransactions]);

  // Peringkat Produk Terlaris dalam Periode Terpilih
  const topProductsInPeriod = useMemo(() => {
    const prodMap: Record<string, { name: string; category: string; qty: number; revenue: number }> = {};
    periodTransactions.forEach((t) => {
      t.items.forEach((item) => {
        const id = item.product.id;
        if (!prodMap[id]) {
          prodMap[id] = {
            name: item.product.name,
            category: item.product.category,
            qty: 0,
            revenue: 0,
          };
        }
        prodMap[id].qty += item.qty;
        prodMap[id].revenue += item.product.sellPrice * item.qty;
      });
    });

    return Object.values(prodMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [periodTransactions]);

  // =========================================================================
  // STATE TAB 3 & 4: SALDO KAS & PENGELUARAN
  // =========================================================================
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<'all' | ExpenseCategory>('all');
  const [expenseSearchQuery, setExpenseSearchQuery] = useState('');
  const [deleteExpenseConfirmId, setDeleteExpenseConfirmId] = useState<string | null>(null);

  // Modal Kas
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [editingCashRecord, setEditingCashRecord] = useState<DailyCashRecord | null>(null);
  const [cashModalMode, setCashModalMode] = useState<'edit-today' | 'edit-record' | 'add-record'>('edit-today');

  const [formDate, setFormDate] = useState('');
  const [formCashierName, setFormCashierName] = useState('');
  const [formInitialCash, setFormInitialCash] = useState<number>(0);
  const [formActualCash, setFormActualCash] = useState<number>(0);
  const [formCashSales, setFormCashSales] = useState<number>(0);
  const [formDigitalSales, setFormDigitalSales] = useState<number>(0);
  const [formCashExpenses, setFormCashExpenses] = useState<number>(0);
  const [formNotes, setFormNotes] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (expenseCategoryFilter !== 'all' && e.category !== expenseCategoryFilter) return false;
      if (expenseSearchQuery.trim()) {
        const q = expenseSearchQuery.toLowerCase();
        const matchesNotes = (e.notes || '').toLowerCase().includes(q);
        const matchesCashier = (e.cashierName || '').toLowerCase().includes(q);
        const matchesLabel = (e.categoryLabel || '').toLowerCase().includes(q);
        if (!matchesNotes && !matchesCashier && !matchesLabel) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, expenseCategoryFilter, expenseSearchQuery]);

  const expenseTotalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  // Kas Laci Hari Ini
  const todayCashSummary = useMemo(() => {
    const nowStr = getTodayISO();
    let cashSales = 0;
    let digitalSales = 0;
    let todayExpenses = 0;

    transactions.forEach((t) => {
      if (t.date.split('T')[0] === nowStr) {
        if (t.paymentMethod === 'tunai') cashSales += t.total;
        else digitalSales += t.total;
      }
    });

    expenses.forEach((e) => {
      if (e.date.split('T')[0] === nowStr) todayExpenses += e.amount;
    });

    const initial = currentShift?.initialCash || 0;
    const expected = initial + cashSales - todayExpenses;
    const actual = currentShift?.actualCash ?? expected;
    const difference = actual - expected;

    return {
      initial,
      cashSales,
      digitalSales,
      todayExpenses,
      expected,
      actual,
      difference,
      isOpen: currentShift?.isOpen ?? true,
      cashierName: currentShift?.cashierName || currentUser.name,
      notes: currentShift?.notes || '',
    };
  }, [currentShift, currentUser.name, transactions, expenses]);

  // Modal Kas handlers
  const handleOpenEditToday = () => {
    setCashModalMode('edit-today');
    setEditingCashRecord(null);
    setFormDate(getTodayISO());
    setFormCashierName(todayCashSummary.cashierName);
    setFormInitialCash(todayCashSummary.initial);
    setFormActualCash(todayCashSummary.actual);
    setFormCashSales(todayCashSummary.cashSales);
    setFormDigitalSales(todayCashSummary.digitalSales);
    setFormCashExpenses(todayCashSummary.todayExpenses);
    setFormNotes(todayCashSummary.notes);
    setIsCashModalOpen(true);
  };

  const handleOpenEditRecord = (record: DailyCashRecord) => {
    setCashModalMode('edit-record');
    setEditingCashRecord(record);
    setFormDate(record.date.split('T')[0]);
    setFormCashierName(record.cashierName);
    setFormInitialCash(record.initialCash);
    setFormActualCash(record.actualCash);
    setFormCashSales(record.cashSales);
    setFormDigitalSales(record.digitalSales);
    setFormCashExpenses(record.cashExpenses || 0);
    setFormNotes(record.notes || '');
    setIsCashModalOpen(true);
  };

  const handleOpenAddRecord = () => {
    setCashModalMode('add-record');
    setEditingCashRecord(null);
    setFormDate(getTodayISO());
    setFormCashierName(currentUser.name);
    setFormInitialCash(0);
    setFormActualCash(0);
    setFormCashSales(0);
    setFormDigitalSales(0);
    setFormCashExpenses(0);
    setFormNotes('');
    setIsCashModalOpen(true);
  };

  const handleSaveCashModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (cashModalMode === 'edit-today') {
      updateShiftBalances(formInitialCash, formActualCash, formNotes);
      showToast('Saldo kas laci hari ini berhasil diperbarui.');
    } else if (cashModalMode === 'edit-record' && editingCashRecord?.id) {
      const expectedCash = formInitialCash + formCashSales - formCashExpenses;
      const difference = formActualCash - expectedCash;
      addOrUpdateDailyCashRecord({
        id: editingCashRecord.id,
        date: new Date(formDate).toISOString(),
        cashierName: formCashierName.trim() || currentUser.name,
        initialCash: formInitialCash,
        cashSales: formCashSales,
        digitalSales: formDigitalSales,
        cashExpenses: formCashExpenses,
        expectedCash,
        actualCash: formActualCash,
        difference,
        isOpen: editingCashRecord.isOpen ?? false,
        notes: formNotes.trim(),
      });
      showToast('Riwayat kas tanggal berhasil diperbarui.');
    } else {
      const expectedCash = formInitialCash + formCashSales - formCashExpenses;
      const difference = formActualCash - expectedCash;
      addOrUpdateDailyCashRecord({
        date: new Date(formDate).toISOString(),
        cashierName: formCashierName.trim() || currentUser.name,
        initialCash: formInitialCash,
        cashSales: formCashSales,
        digitalSales: formDigitalSales,
        cashExpenses: formCashExpenses,
        expectedCash,
        actualCash: formActualCash,
        difference,
        isOpen: false,
        notes: formNotes.trim(),
      });
      showToast('Catatan kas harian baru berhasil ditambahkan.');
    }
    setIsCashModalOpen(false);
  };

  const handleShareWhatsApp = (tx: Transaction) => {
    let text = `*STRUK RESMI ${storeProfile.name.toUpperCase()}*\n`;
    text += `No Faktur: ${tx.invoiceNo}\n`;
    text += `Waktu: ${formatDateTime(tx.date)}\n`;
    text += `Kasir: ${tx.cashierName}\n`;
    text += `--------------------------------\n`;
    tx.items.forEach((i) => {
      text += `${i.product.name} (x${i.qty} @${formatRupiah(i.product.sellPrice)}) = ${formatRupiah(i.qty * i.product.sellPrice)}\n`;
    });
    text += `--------------------------------\n`;
    text += `*TOTAL: ${formatRupiah(tx.total)}*\n`;
    text += `Metode Bayar: ${tx.paymentMethod.toUpperCase()}\n`;
    text += `Terima kasih.`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-4 sm:space-y-5 text-black">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-[#800020] text-white text-xs font-bold rounded-2xl shadow-xl border border-pink-300 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-pink-200 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER UTAMA & NAVIGASI 4 TAB */}
      <div className="bg-white rounded-3xl border border-[#FCE4E8] p-4 sm:p-5 shadow-sm space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#FCE8EB] text-[#800020] flex items-center justify-center font-black">
                <Receipt className="w-4 h-4" />
              </div>
              <h1 className="text-base sm:text-lg font-black text-black">
                Rekapitulasi Penjualan &amp; Kas Toko
              </h1>
            </div>
            <p className="text-xs text-stone-600 font-medium mt-0.5">
              Pantau transaksi per transaksi tiap hari, laporan periode, saldo kas laci, dan pembelian stok.
            </p>
          </div>

          {onOpenShiftModal && (
            <button
              onClick={onOpenShiftModal}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FFF5F7] hover:bg-[#FCE8EB] text-[#800020] border border-[#FCE4E8] transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#800020]" />
              <span>Shift Kasir &amp; Laci</span>
            </button>
          )}
        </div>

        {/* 4 Tab Navigasi: Rapi, Jelas, & Kontras Tinggi */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2 p-1.5 bg-[#FFF0F3] rounded-2xl border border-[#FCE4E8]">
          {/* Tab 1: Rekap Per Hari */}
          <button
            type="button"
            onClick={() => setActiveTab('daily-recap')}
            className={`py-2 px-2.5 sm:px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'daily-recap'
                ? 'bg-[#800020] text-white shadow-xs font-black'
                : 'bg-white/80 text-black hover:bg-white hover:text-[#800020]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Rekap Per Hari</span>
          </button>

          {/* Tab 2: Rekap Periode */}
          <button
            type="button"
            onClick={() => setActiveTab('period-recap')}
            className={`py-2 px-2.5 sm:px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'period-recap'
                ? 'bg-[#800020] text-white shadow-xs font-black'
                : 'bg-white/80 text-black hover:bg-white hover:text-[#800020]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Rekap Periode Tertentu</span>
          </button>

          {/* Tab 3: Saldo Kas Harian */}
          <button
            type="button"
            onClick={() => setActiveTab('cash-history')}
            className={`py-2 px-2.5 sm:px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'cash-history'
                ? 'bg-[#800020] text-white shadow-xs font-black'
                : 'bg-white/80 text-black hover:bg-white hover:text-[#800020]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Saldo Kas Laci</span>
          </button>

          {/* Tab 4: Pengeluaran Kas Toko */}
          <button
            type="button"
            onClick={() => setActiveTab('expenses')}
            className={`py-2 px-2.5 sm:px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'expenses'
                ? 'bg-[#800020] text-white shadow-xs font-black'
                : 'bg-white/80 text-black hover:bg-white hover:text-[#800020]'
            }`}
          >
            <ArrowDownCircle className="w-3.5 h-3.5" />
            <span>Pengeluaran Toko</span>
          </button>
        </div>
      </div>

      {/* ===================================================================
          TAB 1: REKAP PENJUALAN PER HARI (TRANSAKSI DENGAN DETAIL PRODUK)
          =================================================================== */}
      {activeTab === 'daily-recap' && (
        <div className="space-y-4">
          {/* Bar Pemilih Hari (Date Selector Yang Sangat Nyaman) */}
          <div className="bg-white rounded-3xl border border-[#FCE4E8] p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => handleShiftDay(-1)}
                className="p-2 rounded-xl border border-[#FCE4E8] bg-[#FFF5F7] hover:bg-[#FCE8EB] text-black font-bold text-xs transition-colors cursor-pointer"
                title="Pindah ke Hari Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="relative flex-1 sm:flex-initial">
                <input
                  type="date"
                  value={selectedDay}
                  onChange={(e) => e.target.value && setSelectedDay(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-bold text-black rounded-xl border border-[#FCE4E8] bg-white focus:outline-none focus:ring-1 focus:ring-[#800020]"
                />
              </div>

              <button
                type="button"
                onClick={() => handleShiftDay(1)}
                className="p-2 rounded-xl border border-[#FCE4E8] bg-[#FFF5F7] hover:bg-[#FCE8EB] text-black font-bold text-xs transition-colors cursor-pointer"
                title="Pindah ke Hari Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Quick Pills */}
              <button
                type="button"
                onClick={() => setSelectedDay(getTodayISO())}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                  selectedDay === getTodayISO()
                    ? 'bg-[#800020] text-white border-[#800020]'
                    : 'bg-[#FFF5F7] text-black border-[#FCE4E8] hover:bg-[#FCE8EB]'
                }`}
              >
                Hari Ini
              </button>

              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 1);
                  setSelectedDay(d.toISOString().split('T')[0]);
                }}
                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-[#FCE4E8] bg-[#FFF5F7] text-black hover:bg-[#FCE8EB] transition-colors cursor-pointer hidden sm:inline-block"
              >
                Kemarin
              </button>
            </div>

            {/* Label Hari Terpilih & Tombol Ekspor */}
            <div className="flex items-center justify-between md:justify-end gap-2.5 pt-2 md:pt-0 border-t md:border-t-0 border-[#FCE4E8]">
              <div className="text-left md:text-right">
                <div className="text-xs font-black text-black">
                  {formatDateOnly(selectedDay + 'T00:00:00')}
                </div>
                <div className="text-[11px] text-stone-500 font-mono">
                  {dailyTransactions.length} transaksi selesai
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  exportDailyItemizedTransactionsToExcel(
                    dailyTransactions,
                    selectedDay,
                    storeProfile.name
                  )
                }
                disabled={dailyTransactions.length === 0}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs ${
                  dailyTransactions.length > 0
                    ? 'bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer'
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }`}
                title="Ekspor seluruh transaksi hari ini beserta detail item ke Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Unduh Excel Hari Ini</span>
              </button>
            </div>
          </div>

          {/* 4 Kartu KPI Hari Terpilih */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {/* 1. Omzet Penjualan Hari Ini */}
            <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-[#FCE4E8] shadow-xs">
              <span className="text-[11px] font-bold text-stone-600 block">
                Total Omzet Hari Ini
              </span>
              <div className="text-base sm:text-xl font-black font-mono text-[#800020] mt-1">
                {formatRupiah(dailyMetrics.revenue)}
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">
                {dailyMetrics.txCount} nota penjualan
              </div>
            </div>

            {/* 2. Estimasi Laba Bersih Hari Ini */}
            <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-[#FCE4E8] shadow-xs">
              <span className="text-[11px] font-bold text-stone-600 block">
                Estimasi Laba Kotor
              </span>
              <div className="text-base sm:text-xl font-black font-mono text-emerald-800 mt-1">
                {formatRupiah(dailyMetrics.profit)}
              </div>
              <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                Margin profit {dailyMetrics.marginPercent}%
              </div>
            </div>

            {/* 3. Total Barang Terjual */}
            <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-[#FCE4E8] shadow-xs">
              <span className="text-[11px] font-bold text-stone-600 block">
                Produk Terjual
              </span>
              <div className="text-base sm:text-xl font-black font-mono text-black mt-1">
                {dailyMetrics.totalItemsCount} <span className="text-xs font-normal">item</span>
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">
                {dailyMetrics.cashRevenue > 0 && `Tunai: ${formatRupiah(dailyMetrics.cashRevenue)}`}
              </div>
            </div>

            {/* 4. Arus Kas Bersih Toko Hari Ini */}
            <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-[#FCE4E8] shadow-xs">
              <span className="text-[11px] font-bold text-stone-600 block">
                Kas Masuk vs Keluar
              </span>
              <div className="text-base sm:text-xl font-black font-mono text-black mt-1">
                {formatRupiah(dailyMetrics.netCash)}
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">
                Pengeluaran kas: -{formatRupiah(dailyMetrics.dayExpenses)}
              </div>
            </div>
          </div>

          {/* Pencarian dalam Hari Terpilih */}
          <div className="bg-white rounded-2xl border border-[#FCE4E8] p-2.5 shadow-2xs flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari transaksi berdasarkan No Faktur, nama produk, kasir, atau pelanggan..."
                value={dailySearchQuery}
                onChange={(e) => setDailySearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FFF5F7] border border-[#FCE4E8] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#800020] text-black placeholder-stone-400"
              />
            </div>
            {dailySearchQuery && (
              <button
                onClick={() => setDailySearchQuery('')}
                className="px-2 py-1 text-xs text-stone-500 hover:text-black font-bold cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          {/* DAFTAR TRANSAKSI PER TRANSAKSI DENGAN DETAIL PRODUK YANG DIBELI */}
          {dailyTransactions.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#FCE4E8] p-10 text-center shadow-xs">
              <div className="w-14 h-14 rounded-full bg-[#FFF5F7] border border-[#FCE4E8] flex items-center justify-center mx-auto mb-3">
                <Receipt className="w-7 h-7 text-[#800020]" />
              </div>
              <h3 className="text-base font-black text-black">
                Tidak Ada Transaksi Pada {formatDateOnly(selectedDay + 'T00:00:00')}
              </h3>
              <p className="text-xs text-stone-600 mt-1 max-w-sm mx-auto">
                Belum ada transaksi yang tercatat pada tanggal ini. Pilih tanggal lain atau buka kasir POS untuk melayani pelanggan.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDay(getTodayISO())}
                  className="px-4 py-2 rounded-xl bg-[#800020] text-white text-xs font-bold hover:bg-[#660019] cursor-pointer"
                >
                  Lihat Hari Ini
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-stone-700 px-1">
                <span>Rincian {dailyTransactions.length} Transaksi Hari Ini:</span>
                <span className="text-[11px] text-[#800020]">Semua rincian barang &amp; harga tercantum di bawah</span>
              </div>

              {dailyTransactions.map((tx, txIndex) => {
                const totalItemPcs = tx.items.reduce((sum, item) => sum + item.qty, 0);

                return (
                  <div
                    key={tx.id}
                    className="bg-white rounded-3xl border border-[#FCE4E8] shadow-xs overflow-hidden transition-all hover:border-[#800020]/40"
                  >
                    {/* Header Transaksi */}
                    <div className="p-3.5 sm:p-4 bg-[#FFF8F8] border-b border-[#FCE4E8] flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-[#800020] text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                          {dailyTransactions.length - txIndex}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-xs sm:text-sm text-black">
                              {tx.invoiceNo}
                            </span>
                            <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-[#FCE8EB] text-[#800020] border border-[#F8CCD4] uppercase">
                              {tx.paymentMethod === 'tunai' ? 'Tunai' : tx.paymentMethod.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-600 flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-stone-400" />
                              {formatTimeOnly(tx.date)} WIB
                            </span>
                            <span>•</span>
                            <span>Kasir: <strong className="text-black">{tx.cashierName}</strong></span>
                            <span>•</span>
                            <span>Pelanggan: <strong className="text-black">{tx.customerName || 'Umum'}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Tagihan & Tombol Aksi */}
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-stone-500 uppercase font-bold block">
                            Total Nota
                          </span>
                          <span className="text-sm sm:text-base font-black font-mono text-[#800020]">
                            {formatRupiah(tx.total)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setSelectedTx(tx)}
                            className="p-2 rounded-xl bg-white border border-[#FCE4E8] hover:bg-[#FCE8EB] text-[#800020] transition-colors cursor-pointer"
                            title="Lihat Rincian Lengkap / Cetak Struk"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleShareWhatsApp(tx)}
                            className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                            title="Kirim Struk via WhatsApp"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* DETAIL INFORMASI PRODUK YANG DIBELI: DAFTAR BARANG & HARGA */}
                    <div className="p-3.5 sm:p-4 space-y-2">
                      <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                        Barang yang Dibeli ({tx.items.length} jenis • {totalItemPcs} pcs):
                      </div>

                      <div className="border border-[#FCE4E8] rounded-2xl overflow-hidden divide-y divide-[#FCE4E8] bg-[#FFFBFB]">
                        {tx.items.map((item, idx) => {
                          const itemTotal = item.product.sellPrice * item.qty;

                          return (
                            <div
                              key={idx}
                              className="p-2.5 sm:p-3 flex items-center justify-between gap-3 text-xs hover:bg-[#FFF5F7] transition-colors"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-white border border-[#FCE4E8] overflow-hidden flex items-center justify-center shrink-0">
                                  {item.product.imageUrl ? (
                                    <img
                                      src={item.product.imageUrl}
                                      alt={item.product.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLElement).style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <Package className="w-4 h-4 text-[#F8CCD4]" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-extrabold text-black truncate text-xs sm:text-sm">
                                    {item.product.name}
                                  </div>
                                  <div className="text-[10px] text-stone-500 font-medium">
                                    Kategori: {item.product.category} • SKU: {item.product.sku}
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <div className="font-mono text-xs text-stone-700">
                                  <span className="font-bold text-black">{item.qty} {item.product.unit || 'pcs'}</span>
                                  <span className="text-stone-400 mx-1">×</span>
                                  <span>{formatRupiah(item.product.sellPrice)}</span>
                                </div>
                                <div className="font-mono font-black text-xs text-[#800020] mt-0.5">
                                  {formatRupiah(itemTotal)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Footer Kalkulasi Transaksi */}
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-600">
                        <div className="flex items-center gap-2">
                          {tx.pointsUsedDiscount && tx.pointsUsedDiscount > 0 && (
                            <span className="text-[11px] px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                              Diskon Poin: -{formatRupiah(tx.pointsUsedDiscount)}
                            </span>
                          )}
                          {tx.tax > 0 && (
                            <span className="text-[11px] px-2 py-0.5 rounded-lg bg-stone-100 text-stone-700 font-medium">
                              PPN: {formatRupiah(tx.tax)}
                            </span>
                          )}
                          {tx.notes && (
                            <span className="text-[11px] text-stone-500 italic">
                              Catatan: &ldquo;{tx.notes}&rdquo;
                            </span>
                          )}
                        </div>

                        <div className="text-right font-mono text-[11px]">
                          <span>Bayar: <strong>{formatRupiah(tx.amountPaid)}</strong></span>
                          {tx.change > 0 && (
                            <span className="ml-2 text-stone-500">Kembalian: {formatRupiah(tx.change)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* =========================================================
              BAGIAN RINCIAN PENGELUARAN KAS & BELI STOK PADA HARI INI
              ========================================================= */}
          <div className="bg-white rounded-3xl border border-[#FCE4E8] shadow-sm overflow-hidden p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#FCE4E8]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-rose-50 text-[#800020] border border-rose-200 flex items-center justify-center font-bold">
                  <ArrowDownCircle className="w-5 h-5 text-[#800020]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-black">
                      Pengeluaran Kas &amp; Pembelian Stok Hari Ini
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-rose-100 text-[#800020]">
                      {dailyExpenses.length} Pengeluaran
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600">
                    Catatan uang keluar pada {formatDateOnly(selectedDay + 'T00:00:00')} untuk beli stok, operasional, dll.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-left sm:text-right">
                  <div className="text-[10px] font-bold text-stone-500 uppercase">
                    Total Kas Keluar
                  </div>
                  <div className="text-sm sm:text-base font-black font-mono text-[#800020]">
                    -{formatRupiah(dailyMetrics.dayExpenses)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#800020] hover:bg-[#660019] transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Catat Pengeluaran</span>
                </button>
              </div>
            </div>

            {/* List / Table Pengeluaran Hari Ini */}
            {dailyExpenses.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-500 bg-[#FFF8F8] rounded-2xl border border-dashed border-[#FCE4E8] flex flex-col items-center justify-center gap-2">
                <span>Belum ada pengeluaran kas atau pembelian stok yang dicatat pada hari ini.</span>
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#F8CCD4] text-[#800020] text-xs font-bold hover:bg-[#FCE8EB] cursor-pointer"
                >
                  + Catat Pengeluaran Hari Ini
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#FCE4E8] border border-[#FCE4E8] rounded-2xl overflow-hidden">
                {dailyExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-[#FFF5F7] transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase bg-[#FCE8EB] text-[#800020] border border-[#F8CCD4] shrink-0 mt-0.5">
                        {exp.categoryLabel || exp.category}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-black flex items-center gap-2">
                          <span>{exp.notes || 'Pengeluaran Kas Toko'}</span>
                        </div>
                        <div className="text-[10px] text-stone-500 font-mono mt-0.5 flex items-center gap-2">
                          <span>{formatTimeOnly(exp.date)} WIB</span>
                          <span>•</span>
                          <span>Dicatat oleh: <strong>{exp.cashierName}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-auto w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[#FCE4E8]">
                      <span className="font-mono font-black text-sm text-[#800020]">
                        -{formatRupiah(exp.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDeleteExpenseConfirmId(exp.id)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-[#800020] hover:bg-rose-100 transition-colors cursor-pointer"
                        title="Hapus Pengeluaran Ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Rekap Saldo Kas Bersih Hari Ini (Penjualan Tunai - Pengeluaran) */}
            <div className="p-3 bg-[#FFF5F7] rounded-2xl border border-[#FCE4E8] flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-stone-700 font-medium">
                Kalkulasi Kas Hari Ini: Penjualan Tunai ({formatRupiah(dailyMetrics.cashRevenue)}) &minus; Pengeluaran Kas ({formatRupiah(dailyMetrics.dayExpenses)})
              </span>
              <div className="font-mono text-xs font-bold text-black">
                Sisa Kas Bersih Hari Ini:{' '}
                <span className={`font-black ${dailyMetrics.netCash >= 0 ? 'text-emerald-800' : 'text-[#800020]'}`}>
                  {formatRupiah(dailyMetrics.netCash)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          TAB 2: REKAP PENJUALAN PERIODE TERTENTU (ANALISIS & AGREGASI)
          =================================================================== */}
      {activeTab === 'period-recap' && (
        <div className="space-y-4">
          {/* Bar Filter Rentang Periode */}
          <div className="bg-white rounded-3xl border border-[#FCE4E8] p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs sm:text-sm font-black text-black">
                  Pilih Rentang Periode Penjualan:
                </h3>
                <p className="text-[11px] text-stone-600">
                  Lihat performa penjualan dalam kurun waktu tertentu.
                </p>
              </div>

              {/* Tombol Ekspor Periode */}
              <button
                type="button"
                onClick={() => exportTransactionsToExcel(periodTransactions, storeProfile.name)}
                disabled={periodTransactions.length === 0}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs self-start sm:self-auto ${
                  periodTransactions.length > 0
                    ? 'bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer'
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }`}
                title="Ekspor seluruh transaksi dalam periode ini ke file Excel (.csv)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Laporan Periode (Excel)</span>
              </button>
            </div>

            {/* Tombol Presets Periode */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'today', label: 'Hari Ini' },
                { id: '7days', label: '7 Hari Terakhir' },
                { id: '30days', label: '30 Hari Terakhir' },
                { id: 'this_month', label: 'Bulan Ini' },
                { id: 'last_month', label: 'Bulan Lalu' },
                { id: 'custom', label: 'Rentang Kustom' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriodPreset(p.id as any)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    periodPreset === p.id
                      ? 'bg-[#800020] text-white border-[#800020] shadow-xs'
                      : 'bg-[#FFF5F7] text-black border-[#FCE4E8] hover:bg-[#FCE8EB]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Input Rentang Tanggal Kustom (Jika dipilih) */}
            {periodPreset === 'custom' && (
              <div className="pt-2 border-t border-[#FCE4E8] flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-stone-700">Dari:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-[#FCE4E8] bg-white font-bold text-black"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-stone-700">Sampai:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-[#FCE4E8] bg-white font-bold text-black"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Kartu Metrik Periode */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {/* Total Omzet Periode */}
            <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-[#FCE4E8] shadow-xs">
              <span className="text-[11px] font-bold text-stone-600 block">
                Total Omzet Periode
              </span>
              <div className="text-base sm:text-xl font-black font-mono text-[#800020] mt-1">
                {formatRupiah(periodMetrics.totalRevenue)}
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">
                Rata-rata/nota: {formatRupiah(periodMetrics.avgOrderValue)}
              </div>
            </div>

            {/* Estimasi Laba Kotor */}
            <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-[#FCE4E8] shadow-xs">
              <span className="text-[11px] font-bold text-stone-600 block">
                Estimasi Laba Kotor
              </span>
              <div className="text-base sm:text-xl font-black font-mono text-emerald-800 mt-1">
                {formatRupiah(periodMetrics.totalProfit)}
              </div>
              <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                Margin profit {periodMetrics.marginPercent}%
              </div>
            </div>

            {/* Transaksi Selesai */}
            <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-[#FCE4E8] shadow-xs">
              <span className="text-[11px] font-bold text-stone-600 block">
                Total Transaksi
              </span>
              <div className="text-base sm:text-xl font-black font-mono text-black mt-1">
                {periodMetrics.txCount} <span className="text-xs font-normal">nota</span>
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">
                {periodMetrics.cashCount} Tunai • {periodMetrics.digitalCount} Non-Tunai
              </div>
            </div>

            {/* Total Produk Terjual */}
            <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-[#FCE4E8] shadow-xs">
              <span className="text-[11px] font-bold text-stone-600 block">
                Total Produk Terjual
              </span>
              <div className="text-base sm:text-xl font-black font-mono text-black mt-1">
                {periodMetrics.totalItemsCount} <span className="text-xs font-normal">pcs barang</span>
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">
                Seluruh varian cetakan &amp; perabot
              </div>
            </div>
          </div>

          {/* TABEL AGREGASI: RANGKUMAN PENJUALAN PER HARI DALAM PERIODE */}
          <div className="bg-white rounded-3xl border border-[#FCE4E8] shadow-xs overflow-hidden">
            <div className="p-4 bg-[#FFF8F8] border-b border-[#FCE4E8] flex items-center justify-between">
              <div>
                <h4 className="text-xs sm:text-sm font-black text-black">
                  Rangkuman Penjualan Per Hari dalam Periode Ini
                </h4>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Klik tombol &quot;Buka Detail Hari Ini&quot; untuk melihat transaksi per transaksi dan barang yang dibeli.
                </p>
              </div>
              <span className="text-xs font-bold text-stone-500 font-mono">
                {periodDailySummary.length} Hari Aktif
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FFF0F3] border-b border-[#FCE4E8] text-[11px] font-bold text-stone-700 uppercase">
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-3 text-center">Transaksi</th>
                    <th className="py-3 px-3 text-center">Item Terjual</th>
                    <th className="py-3 px-3 text-right">Omzet Penjualan</th>
                    <th className="py-3 px-3 text-right">Estimasi Laba</th>
                    <th className="py-3 px-3">Metode Bayar</th>
                    <th className="py-3 px-4 text-center">Aksi Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FCE4E8]">
                  {periodDailySummary.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-stone-500 text-xs">
                        Tidak ada catatan penjualan pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    periodDailySummary.map((day) => (
                      <tr key={day.dateStr} className="hover:bg-[#FFF5F7] transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-black">
                            {formatDateOnly(day.dateStr + 'T00:00:00')}
                          </div>
                          <div className="text-[10px] text-stone-500 font-mono">
                            {day.dateStr}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-black font-mono">
                          {day.txCount} nota
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-stone-700">
                          {day.itemsCount} pcs
                        </td>
                        <td className="py-3 px-3 text-right font-black font-mono text-[#800020]">
                          {formatRupiah(day.revenue)}
                        </td>
                        <td className="py-3 px-3 text-right font-black font-mono text-emerald-800">
                          {formatRupiah(day.profit)}
                        </td>
                        <td className="py-3 px-3 text-[11px] text-stone-600">
                          <div>Tunai: {formatRupiah(day.cashRevenue)}</div>
                          <div className="text-[10px] text-stone-500">Non-Tunai: {formatRupiah(day.digitalRevenue)}</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDay(day.dateStr);
                              setActiveTab('daily-recap');
                            }}
                            className="px-2.5 py-1 text-xs font-bold bg-[#FCE8EB] hover:bg-[#800020] text-[#800020] hover:text-white rounded-xl transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                            title="Buka rincian transaksi per barang untuk hari ini"
                          >
                            Buka Detail Hari Ini &rarr;
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* PERINGKAT PRODUK TERLARIS DALAM PERIODE INI */}
          {topProductsInPeriod.length > 0 && (
            <div className="bg-white rounded-3xl border border-[#FCE4E8] p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs sm:text-sm font-black text-black">
                  5 Produk Terlaris Dalam Periode Ini:
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                {topProductsInPeriod.map((prod, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-[#FFF8F8] border border-[#FCE4E8] flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        Top #{idx + 1}
                      </span>
                      <div className="font-extrabold text-black text-xs mt-1 truncate">
                        {prod.name}
                      </div>
                      <div className="text-[10px] text-stone-500 font-medium">
                        {prod.category}
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-[#FCE4E8] flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-black">{prod.qty} pcs</span>
                      <span className="font-bold text-[#800020]">{formatRupiah(prod.revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================
          TAB 3: SALDO KAS LACI HARIAN (KAS AWAL & KAS AKHIR)
          =================================================================== */}
      {activeTab === 'cash-history' && (
        <div className="space-y-4">
          {/* Card Saldo Hari Ini */}
          <div className="bg-white rounded-3xl border border-[#FCE4E8] p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase text-[#800020] bg-[#FCE8EB] px-2.5 py-0.5 rounded-full border border-[#F8CCD4]">
                  STATUS LACI HARI INI
                </span>
                <h3 className="text-base font-black text-black mt-1">
                  Saldo Laci Kasir Hari Ini
                </h3>
                <p className="text-xs text-stone-600">
                  Penjaga Kasir: <strong className="text-black">{todayCashSummary.cashierName}</strong> • {formatDateOnly(getTodayISO() + 'T00:00:00')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenEditToday}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#800020] hover:bg-[#660019] transition-colors shadow-2xs cursor-pointer"
                >
                  Sesuaikan Saldo Kas Hari Ini
                </button>
                <button
                  type="button"
                  onClick={handleOpenAddRecord}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-black bg-[#FFF5F7] hover:bg-[#FCE8EB] border border-[#FCE4E8] transition-colors cursor-pointer"
                >
                  + Catatan Tanggal Lain
                </button>
              </div>
            </div>

            {/* Grid 4 Nilai Kas Hari Ini */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-[#FCE4E8]">
              <div className="p-3 rounded-2xl bg-[#FFF8F8] border border-[#FCE4E8]">
                <span className="text-[11px] font-bold text-stone-600">Kas Awal (Modal)</span>
                <div className="text-sm sm:text-base font-black font-mono text-black mt-0.5">
                  {formatRupiah(todayCashSummary.initial)}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[#FFF8F8] border border-[#FCE4E8]">
                <span className="text-[11px] font-bold text-stone-600">Penjualan Tunai (+)</span>
                <div className="text-sm sm:text-base font-black font-mono text-emerald-800 mt-0.5">
                  +{formatRupiah(todayCashSummary.cashSales)}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[#FFF8F8] border border-[#FCE4E8]">
                <span className="text-[11px] font-bold text-stone-600">Pengeluaran Kas (-)</span>
                <div className="text-sm sm:text-base font-black font-mono text-[#800020] mt-0.5">
                  -{formatRupiah(todayCashSummary.todayExpenses)}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[#FFF8F8] border border-[#FCE4E8]">
                <span className="text-[11px] font-bold text-stone-600">Kas Akhir Riil</span>
                <div className="text-sm sm:text-base font-black font-mono text-black mt-0.5">
                  {formatRupiah(todayCashSummary.actual)}
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5">
                  Selisih: {formatRupiah(todayCashSummary.difference)}
                </div>
              </div>
            </div>
          </div>

          {/* Tabel Riwayat Saldo Kas Harian */}
          <div className="bg-white rounded-3xl border border-[#FCE4E8] shadow-xs overflow-hidden">
            <div className="p-4 bg-[#FFF8F8] border-b border-[#FCE4E8] flex items-center justify-between">
              <div>
                <h4 className="text-xs sm:text-sm font-black text-black">
                  Tabel Riwayat Kas Harian (Semua Tanggal)
                </h4>
                <p className="text-[11px] text-stone-500">
                  Pencatatan pembukuan laci kasir setiap pergantian hari atau shift.
                </p>
              </div>
              <button
                type="button"
                onClick={() => exportDailyCashToExcel(dailyCashHistory, storeProfile.name)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Excel Kas</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FFF0F3] border-b border-[#FCE4E8] text-[11px] font-bold text-stone-700 uppercase">
                    <th className="py-3 px-4">Tanggal &amp; Kasir</th>
                    <th className="py-3 px-3 text-right">Kas Awal</th>
                    <th className="py-3 px-3 text-right">Penjualan Tunai</th>
                    <th className="py-3 px-3 text-right">Pengeluaran Kas</th>
                    <th className="py-3 px-3 text-right">Kas Akhir Fisik</th>
                    <th className="py-3 px-3 text-right">Selisih</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FCE4E8]">
                  {dailyCashHistory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-stone-500 text-xs">
                        Belum ada riwayat saldo kas harian.
                      </td>
                    </tr>
                  ) : (
                    dailyCashHistory.map((rec) => (
                      <tr key={rec.id} className="hover:bg-[#FFF5F7] transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-black">{formatDateOnly(rec.date)}</div>
                          <div className="text-[10px] text-stone-500">Kasir: {rec.cashierName}</div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-black">
                          {formatRupiah(rec.initialCash)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800">
                          +{formatRupiah(rec.cashSales)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-[#800020]">
                          -{formatRupiah(rec.cashExpenses || 0)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-black">
                          {formatRupiah(rec.actualCash)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold">
                          <span
                            className={
                              rec.difference === 0
                                ? 'text-stone-700'
                                : rec.difference > 0
                                ? 'text-emerald-700'
                                : 'text-[#800020]'
                            }
                          >
                            {formatRupiah(rec.difference)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditRecord(rec)}
                              className="p-1.5 rounded-lg text-stone-600 hover:text-black hover:bg-[#FCE8EB] cursor-pointer"
                              title="Edit Catatan Kas"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(rec.id)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-[#800020] hover:bg-[#FCE8EB] cursor-pointer"
                              title="Hapus Catatan Kas"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          TAB 4: PENGELUARAN KAS & PEMBELIAN STOK TOKO
          =================================================================== */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          {/* Header Pengeluaran */}
          <div className="bg-white rounded-3xl border border-[#FCE4E8] p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-black">
                Rekap Pengeluaran Kas Toko
              </h3>
              <p className="text-xs text-stone-600">
                Catatan pembelian stok dari distributor, kemasan packing, dan operasional toko.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#800020] hover:bg-[#660019] transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Catat Pengeluaran Baru</span>
              </button>

              <button
                type="button"
                onClick={() => exportExpensesToExcel(filteredExpenses, storeProfile.name)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-black bg-[#FFF5F7] hover:bg-[#FCE8EB] border border-[#FCE4E8] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Excel</span>
              </button>
            </div>
          </div>

          {/* Filter Kategori Pengeluaran */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'Semua Kategori' },
              { id: 'pembelian_stok', label: 'Beli Stok Cetakan / Perabot' },
              { id: 'kemasan_packaging', label: 'Kemasan & Plastik' },
              { id: 'operasional', label: 'Operasional Toko' },
              { id: 'konsumsi_transport', label: 'Transportasi & Konsumsi' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setExpenseCategoryFilter(cat.id as any)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  expenseCategoryFilter === cat.id
                    ? 'bg-[#800020] text-white border-[#800020] shadow-xs'
                    : 'bg-white text-black border-[#FCE4E8] hover:bg-[#FFF5F7]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Tabel Pengeluaran Kas */}
          <div className="bg-white rounded-3xl border border-[#FCE4E8] shadow-xs overflow-hidden">
            <div className="p-3.5 sm:p-4 bg-[#FFF8F8] border-b border-[#FCE4E8] flex items-center justify-between">
              <span className="text-xs font-bold text-black">
                Total Tercatat: <strong className="text-[#800020] font-mono">{formatRupiah(expenseTotalAmount)}</strong> ({filteredExpenses.length} catatan)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FFF0F3] border-b border-[#FCE4E8] text-[11px] font-bold text-stone-700 uppercase">
                    <th className="py-3 px-4">Waktu &amp; Tanggal</th>
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3">Kasir</th>
                    <th className="py-3 px-4">Keterangan / Alasan</th>
                    <th className="py-3 px-3 text-right">Nominal</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FCE4E8]">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-stone-500 text-xs">
                        Belum ada catatan pengeluaran kas.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-[#FFF5F7] transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-black">{formatDateOnly(exp.date)}</div>
                          <div className="text-[10px] text-stone-500 font-mono">{formatTimeOnly(exp.date)} WIB</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#FCE8EB] text-[#800020] border border-[#F8CCD4]">
                            {exp.categoryLabel}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-medium text-black">
                          {exp.cashierName}
                        </td>
                        <td className="py-3 px-4 text-stone-700">
                          {exp.notes || '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-black font-mono text-[#800020]">
                          -{formatRupiah(exp.amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => setDeleteExpenseConfirmId(exp.id)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-[#800020] hover:bg-[#FCE8EB] cursor-pointer"
                            title="Hapus Catatan Pengeluaran"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL DETAIL NOTA STRUK
          =================================================================== */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#FCE4E8] max-w-md w-full p-5 animate-in zoom-in-95 duration-150 text-black max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#FCE4E8]">
              <div>
                <span className="text-[10px] font-mono text-stone-500 font-bold block">
                  {selectedTx.invoiceNo}
                </span>
                <h3 className="text-sm font-black text-black">
                  Rincian Transaksi
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="p-1 text-stone-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <div className="p-2.5 bg-[#FFF8F8] rounded-2xl border border-[#FCE4E8] text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone-500">Waktu Transaksi:</span>
                  <span className="font-bold text-black">{formatDateTime(selectedTx.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Kasir:</span>
                  <span className="font-bold text-black">{selectedTx.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Pelanggan:</span>
                  <span className="font-bold text-black">{selectedTx.customerName || 'Umum'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Metode Bayar:</span>
                  <span className="font-bold text-[#800020] uppercase">{selectedTx.paymentMethod}</span>
                </div>
              </div>

              {/* Rincian Produk */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto divide-y divide-[#FCE4E8]">
                {selectedTx.items.map((i, idx) => (
                  <div key={idx} className="pt-1.5 first:pt-0 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-black">{i.product.name}</div>
                      <div className="text-[10px] text-stone-500">
                        {i.qty} {i.product.unit || 'pcs'} × {formatRupiah(i.product.sellPrice)}
                      </div>
                    </div>
                    <div className="font-mono font-bold text-black">
                      {formatRupiah(i.product.sellPrice * i.qty)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total & Kalkulasi */}
              <div className="pt-3 border-t border-[#FCE4E8] space-y-1 text-xs">
                <div className="flex justify-between font-bold text-black text-sm">
                  <span>Total Tagihan:</span>
                  <span className="text-[#800020] font-mono">{formatRupiah(selectedTx.total)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Jumlah Dibayar:</span>
                  <span className="font-mono">{formatRupiah(selectedTx.amountPaid)}</span>
                </div>
                {selectedTx.change > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>Kembalian:</span>
                    <span className="font-mono font-bold">{formatRupiah(selectedTx.change)}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleShareWhatsApp(selectedTx)}
                  className="flex-1 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-100 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Kirim WA</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTx(null)}
                  className="flex-1 py-2 rounded-xl bg-[#800020] text-white font-bold text-xs hover:bg-[#660019] cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SESUAIKAN SALDO KAS */}
      {isCashModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#FCE4E8] max-w-md w-full p-5 sm:p-6 animate-in zoom-in-95 duration-150 text-black">
            <div className="flex items-center justify-between pb-3 border-b border-[#FCE4E8]">
              <div>
                <h3 className="text-sm font-black text-black">
                  {cashModalMode === 'edit-today'
                    ? 'Sesuaikan Saldo Kas Laci Hari Ini'
                    : cashModalMode === 'edit-record'
                    ? 'Edit Catatan Kas Tanggal'
                    : 'Tambah Catatan Kas Baru'}
                </h3>
                <p className="text-[11px] text-stone-600">
                  Pastikan uang fisik di laci kasir sesuai dengan pembukuan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCashModalOpen(false)}
                className="p-1 text-stone-400 hover:text-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCashModal} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-black mb-1">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#FCE4E8] rounded-xl font-bold text-black"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-black mb-1">
                    Penjaga Kasir
                  </label>
                  <input
                    type="text"
                    required
                    value={formCashierName}
                    onChange={(e) => setFormCashierName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#FCE4E8] rounded-xl font-bold text-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-black mb-1">
                  Modal Kas Awal (Uang Kembalian di Laci)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={formInitialCash || ''}
                  onChange={(e) => setFormInitialCash(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 border border-[#FCE4E8] rounded-xl font-mono font-bold text-black"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-black mb-1">
                  Kas Akhir Fisik (Uang Tunai Riil di Laci Saat Tutup)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={formActualCash || ''}
                  onChange={(e) => setFormActualCash(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 border border-[#FCE4E8] rounded-xl font-mono font-black text-black"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-black mb-1">
                  Catatan Laci (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Misal: Uang pas, kas awal dari pemilik..."
                  className="w-full px-3 py-1.5 border border-[#FCE4E8] rounded-xl text-black resize-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCashModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[#800020] hover:bg-[#660019] text-white font-bold cursor-pointer"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS CATATAN KAS */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-rose-200 p-5 max-w-sm w-full space-y-3 text-center">
            <h4 className="font-black text-sm text-black">Hapus Riwayat Kas Ini?</h4>
            <p className="text-xs text-stone-600">
              Catatan pembukuan kas pada tanggal tersebut akan dihapus.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteDailyCashRecord(deleteConfirmId);
                  setDeleteConfirmId(null);
                  showToast('Catatan kas berhasil dihapus.');
                }}
                className="flex-1 py-2 rounded-xl bg-[#800020] text-white font-bold text-xs hover:bg-[#660019] cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS CATATAN PENGELUARAN */}
      {deleteExpenseConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-rose-200 p-5 max-w-sm w-full space-y-3 text-center">
            <h4 className="font-black text-sm text-black">Hapus Catatan Pengeluaran Kas?</h4>
            <p className="text-xs text-stone-600">
              Catatan ini akan dihapus dari rekap kas keluar toko.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteExpenseConfirmId(null)}
                className="flex-1 py-2 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteExpense(deleteExpenseConfirmId);
                  setDeleteExpenseConfirmId(null);
                  showToast('Catatan pengeluaran kas telah dihapus.');
                }}
                className="flex-1 py-2 rounded-xl bg-[#800020] text-white font-bold text-xs hover:bg-[#660019] cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
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
