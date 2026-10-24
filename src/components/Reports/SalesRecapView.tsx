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
} from '../../utils/format';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Calendar,
  Download,
  AlertCircle,
  CheckCircle2,
  Search,
  Eye,
  Edit2,
  Trash2,
  Plus,
  X,
  History,
  Receipt,
  ArrowUpRight,
  ShieldCheck,
  Check,
  Package,
  ArrowDownCircle,
  ShoppingBag,
  Zap,
  Coffee,
  MoreHorizontal,
  Tag,
  Sparkles,
  Info,
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

  // Active sub-tab: 'cash-history' (Riwayat Kas Harian), 'expenses' (Rekap Pengeluaran & Stok), vs 'transactions' (Daftar Penjualan)
  const [activeTab, setActiveTab] = useState<'cash-history' | 'expenses' | 'transactions'>('cash-history');

  // Filter range
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | '30days' | 'all'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Expense sub-tab category filter
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<'all' | ExpenseCategory>('all');
  const [expenseSearchQuery, setExpenseSearchQuery] = useState('');
  const [deleteExpenseConfirmId, setDeleteExpenseConfirmId] = useState<string | null>(null);

  // Modal State for Edit / Add Daily Cash
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [editingCashRecord, setEditingCashRecord] = useState<DailyCashRecord | null>(null);
  const [cashModalMode, setCashModalMode] = useState<'edit-today' | 'edit-record' | 'add-record'>('edit-today');

  // Cash Form Fields
  const [formDate, setFormDate] = useState('');
  const [formCashierName, setFormCashierName] = useState('');
  const [formInitialCash, setFormInitialCash] = useState<number>(0);
  const [formActualCash, setFormActualCash] = useState<number>(0);
  const [formCashSales, setFormCashSales] = useState<number>(0);
  const [formDigitalSales, setFormDigitalSales] = useState<number>(0);
  const [formCashExpenses, setFormCashExpenses] = useState<number>(0);
  const [formNotes, setFormNotes] = useState('');

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Success alert indicator
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered transactions for the Sales recap tab
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      const tDate = new Date(t.date);

      if (dateFilter === 'today') {
        const isToday =
          tDate.getDate() === now.getDate() &&
          tDate.getMonth() === now.getMonth() &&
          tDate.getFullYear() === now.getFullYear();
        if (!isToday) return false;
      } else if (dateFilter === '7days') {
        const diffDays = (now.getTime() - tDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 7) return false;
      } else if (dateFilter === '30days') {
        const diffDays = (now.getTime() - tDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 30) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = t.id.toLowerCase().includes(q) || t.invoiceNo.toLowerCase().includes(q);
        const matchesCashier = t.cashierName.toLowerCase().includes(q);
        const matchesCustomer = t.customerName?.toLowerCase().includes(q);
        const matchesItems = t.items.some(i => i.product.name.toLowerCase().includes(q));
        if (!matchesId && !matchesCashier && !matchesCustomer && !matchesItems) return false;
      }

      return true;
    });
  }, [transactions, dateFilter, searchQuery]);

  // Essential Sales KPIs
  const salesMetrics = useMemo(() => {
    let totalRevenue = 0;
    let totalProfit = 0;
    let cashCount = 0;
    let digitalCount = 0;

    filteredTransactions.forEach(t => {
      totalRevenue += t.total;
      totalProfit += t.profit;
      if (t.paymentMethod === 'tunai') cashCount++;
      else digitalCount++;
    });

    const txCount = filteredTransactions.length;
    const avgOrderValue = txCount > 0 ? Math.round(totalRevenue / txCount) : 0;
    const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0';

    return {
      totalRevenue,
      totalProfit,
      txCount,
      avgOrderValue,
      profitMargin,
      cashCount,
      digitalCount,
    };
  }, [filteredTransactions]);

  // Filtered Expenses for the Expenses sub-tab
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter(e => {
      const eDate = new Date(e.date);

      if (dateFilter === 'today') {
        const isToday =
          eDate.getDate() === now.getDate() &&
          eDate.getMonth() === now.getMonth() &&
          eDate.getFullYear() === now.getFullYear();
        if (!isToday) return false;
      } else if (dateFilter === '7days') {
        const diffDays = (now.getTime() - eDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 7) return false;
      } else if (dateFilter === '30days') {
        const diffDays = (now.getTime() - eDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 30) return false;
      }

      if (expenseCategoryFilter !== 'all' && e.category !== expenseCategoryFilter) {
        return false;
      }

      if (expenseSearchQuery.trim()) {
        const q = expenseSearchQuery.toLowerCase();
        const matchesNotes = (e.notes || '').toLowerCase().includes(q);
        const matchesCashier = (e.cashierName || '').toLowerCase().includes(q);
        const matchesLabel = (e.categoryLabel || '').toLowerCase().includes(q);
        if (!matchesNotes && !matchesCashier && !matchesLabel) return false;
      }

      return true;
    });
  }, [expenses, dateFilter, expenseCategoryFilter, expenseSearchQuery]);

  // Metrics for Expenses Tab
  const expenseMetrics = useMemo(() => {
    let totalAmount = 0;
    let stockAmount = 0;
    let packagingAmount = 0;
    let operationalAmount = 0;
    let othersAmount = 0;

    filteredExpenses.forEach(e => {
      totalAmount += e.amount;
      if (e.category === 'pembelian_stok') stockAmount += e.amount;
      else if (e.category === 'kemasan_packaging') packagingAmount += e.amount;
      else if (e.category === 'operasional') operationalAmount += e.amount;
      else othersAmount += e.amount;
    });

    return {
      totalAmount,
      stockAmount,
      packagingAmount,
      operationalAmount,
      othersAmount,
      count: filteredExpenses.length,
    };
  }, [filteredExpenses]);

  // Filtered Daily Cash Records (sorted by date descending)
  const sortedCashHistory = useMemo(() => {
    return [...dailyCashHistory].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [dailyCashHistory]);

  // Quick Today Cash Metrics from Current Shift, Transactions, and Expenses
  const todayCashSummary = useMemo(() => {
    const now = new Date();
    let cashSales = 0;
    let digitalSales = 0;
    let todayExpenses = 0;

    transactions.forEach(t => {
      const d = new Date(t.date);
      if (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      ) {
        if (t.paymentMethod === 'tunai') cashSales += t.total;
        else digitalSales += t.total;
      }
    });

    expenses.forEach(e => {
      const d = new Date(e.date);
      if (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      ) {
        todayExpenses += e.amount;
      }
    });

    const initial = currentShift?.initialCash || 0;
    // Expected cash in drawer = initial modal + cash sales - cash expenses
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

  // Open modal to edit today's shift balances
  const handleOpenEditToday = () => {
    setCashModalMode('edit-today');
    setEditingCashRecord(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormCashierName(todayCashSummary.cashierName);
    setFormInitialCash(todayCashSummary.initial);
    setFormActualCash(todayCashSummary.actual);
    setFormCashSales(todayCashSummary.cashSales);
    setFormDigitalSales(todayCashSummary.digitalSales);
    setFormCashExpenses(todayCashSummary.todayExpenses);
    setFormNotes(todayCashSummary.notes);
    setIsCashModalOpen(true);
  };

  // Open modal to edit an existing history record
  const handleOpenEditRecord = (record: DailyCashRecord) => {
    setCashModalMode('edit-record');
    setEditingCashRecord(record);
    setFormDate(new Date(record.date).toISOString().split('T')[0]);
    setFormCashierName(record.cashierName);
    setFormInitialCash(record.initialCash);
    setFormActualCash(record.actualCash);
    setFormCashSales(record.cashSales);
    setFormDigitalSales(record.digitalSales);
    setFormCashExpenses(record.cashExpenses || 0);
    setFormNotes(record.notes || '');
    setIsCashModalOpen(true);
  };

  // Open modal to add a past/new date record
  const handleOpenAddRecord = () => {
    setCashModalMode('add-record');
    setEditingCashRecord(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormCashierName(currentUser.name);
    setFormInitialCash(0);
    setFormActualCash(0);
    setFormCashSales(0);
    setFormDigitalSales(0);
    setFormCashExpenses(0);
    setFormNotes('');
    setIsCashModalOpen(true);
  };

  // Save Modal
  const handleSaveCashModal = (e: React.FormEvent) => {
    e.preventDefault();

    if (cashModalMode === 'edit-today') {
      updateShiftBalances(formInitialCash, formActualCash, formNotes);
      showToast('Saldo kas hari ini berhasil diperbarui & disimpan ke riwayat.');
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
      showToast('Data riwayat kas tanggal berhasil diperbarui.');
    } else {
      // Add new record
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
      showToast('Riwayat kas harian baru berhasil ditambahkan.');
    }

    setIsCashModalOpen(false);
  };

  const handleDeleteRecord = (id: string) => {
    deleteDailyCashRecord(id);
    setDeleteConfirmId(null);
    showToast('Data riwayat tanggal berhasil dihapus.');
  };

  const handleDeleteExpense = (id: string) => {
    deleteExpense(id);
    setDeleteExpenseConfirmId(null);
    showToast('Catatan pengeluaran kas berhasil dihapus.');
  };

  const getCategoryIcon = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'pembelian_stok':
        return <Package className="w-3.5 h-3.5 text-rose-600" />;
      case 'kemasan_packaging':
        return <ShoppingBag className="w-3.5 h-3.5 text-pink-600" />;
      case 'operasional':
        return <Zap className="w-3.5 h-3.5 text-amber-600" />;
      case 'konsumsi_transport':
        return <Coffee className="w-3.5 h-3.5 text-blue-600" />;
      default:
        return <MoreHorizontal className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-emerald-800 text-white text-xs font-medium rounded-xl shadow-lg border border-emerald-700/50">
          <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar: Clean & Minimal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-neutral-900 tracking-tight">Rekapitulasi Toko &amp; Kas</h2>
            <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
              {storeProfile.name || 'M Store'}
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Laporan saldo kas harian, pembelian stok dari laci kasir, dan performa omset penjualan.
          </p>
        </div>

        {/* Action Controls & Tab Toggle */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {onOpenShiftModal && (
            <button
              onClick={onOpenShiftModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700 border border-neutral-200/80 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-500" />
              <span>Shift Kasir</span>
            </button>
          )}

          <div className="flex items-center bg-neutral-100 p-1 rounded-xl border border-neutral-200/80 overflow-x-auto">
            {/* Tab 1: Riwayat Kas Harian */}
            <button
              onClick={() => setActiveTab('cash-history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'cash-history'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <History className="w-3.5 h-3.5 text-rose-500" />
              <span>Riwayat Kas Harian</span>
              <span className="ml-0.5 text-[10px] bg-neutral-200/80 text-neutral-700 font-bold px-1.5 py-0.2 rounded-full">
                {dailyCashHistory.length}
              </span>
            </button>

            {/* Tab 2: Rekap Pengeluaran & Stok */}
            <button
              onClick={() => setActiveTab('expenses')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'expenses'
                  ? 'bg-white text-[#800020] shadow-xs font-bold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <ArrowDownCircle className="w-3.5 h-3.5 text-[#800020]" />
              <span>Pengeluaran &amp; Stok</span>
              <span className="ml-0.5 text-[10px] bg-[#FCE8EB] text-[#800020] font-bold px-1.5 py-0.2 rounded-full border border-[#F8CCD4]">
                {expenses.length}
              </span>
            </button>

            {/* Tab 3: Rekap Penjualan */}
            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'transactions'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-rose-500" />
              <span>Penjualan</span>
              <span className="ml-0.5 text-[10px] bg-neutral-200/80 text-neutral-700 font-bold px-1.5 py-0.2 rounded-full">
                {filteredTransactions.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          BAGIAN 1: RINGKASAN SALDO HARI INI (LENGKAP DENGAN KAS KELUAR)
         ======================================================== */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
              Saldo Kas Hari Ini ({formatDateOnly(new Date().toISOString())})
            </h3>
            <span className="text-[10px] text-neutral-500 font-medium">
              Kasir: <strong className="text-neutral-700">{todayCashSummary.cashierName}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-[#800020] bg-[#FCE8EB] hover:bg-[#F8CCD4] rounded-lg border border-[#F8CCD4] transition-colors cursor-pointer"
            >
              <ArrowDownCircle className="w-3.5 h-3.5 text-[#800020]" />
              <span>+ Catat Beli Stok / Kas Keluar</span>
            </button>
            <button
              onClick={handleOpenEditToday}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200/80 rounded-lg border border-neutral-200 transition-colors cursor-pointer"
            >
              <Edit2 className="w-3 h-3 text-neutral-500" />
              <span>Sesuaikan Kas</span>
            </button>
          </div>
        </div>

        {/* 5 Poin Penting Saldo Kas Hari Ini Termasuk Pengeluaran Kas */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* 1. Kas Awal Modal */}
          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/60">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-[11px] font-medium">Modal Awal Kasir</span>
              <DollarSign className="w-3.5 h-3.5 text-neutral-400" />
            </div>
            <div className="text-sm sm:text-base font-bold text-neutral-900">
              {formatRupiah(todayCashSummary.initial)}
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">Uang modal buka laci</div>
          </div>

          {/* 2. Penjualan Tunai */}
          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/60">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-[11px] font-medium">Masuk Tunai (Cash)</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-sm sm:text-base font-bold text-emerald-600">
              +{formatRupiah(todayCashSummary.cashSales)}
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">
              QRIS: {formatRupiah(todayCashSummary.digitalSales)}
            </div>
          </div>

          {/* 3. Pengeluaran Kas / Pembelian Stok */}
          <div 
            onClick={() => setActiveTab('expenses')}
            className="p-3 rounded-xl bg-[#FFF5F7] border border-[#FCE4E8] cursor-pointer hover:bg-[#FCE8EB] transition-colors"
            title="Klik untuk melihat rincian pengeluaran kas"
          >
            <div className="flex items-center justify-between text-[#800020] mb-1">
              <span className="text-[11px] font-bold">Kas Keluar / Beli Stok</span>
              <ArrowDownCircle className="w-3.5 h-3.5 text-[#800020]" />
            </div>
            <div className="text-sm sm:text-base font-black font-mono text-[#800020]">
              -{formatRupiah(todayCashSummary.todayExpenses)}
            </div>
            <div className="text-[10px] text-[#800020]/80 mt-0.5 flex items-center justify-between">
              <span>Beli stok &amp; operasional</span>
              <span className="underline font-bold">Rincian &rarr;</span>
            </div>
          </div>

          {/* 4. Kas Akhir Fisik (Uang Riil) */}
          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/60">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-[11px] font-medium">Kas Akhir Fisik</span>
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
            </div>
            <div className="text-sm sm:text-base font-bold text-neutral-900">
              {formatRupiah(todayCashSummary.actual)}
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">
              Target: {formatRupiah(todayCashSummary.expected)}
            </div>
          </div>

          {/* 5. Status Selisih */}
          <div
            className={`p-3 rounded-xl border col-span-2 lg:col-span-1 ${
              todayCashSummary.difference === 0
                ? 'bg-neutral-50 border-neutral-200/60'
                : todayCashSummary.difference > 0
                ? 'bg-emerald-50/50 border-emerald-200'
                : 'bg-rose-50/50 border-rose-200'
            }`}
          >
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-[11px] font-medium">Status Selisih</span>
              {todayCashSummary.difference === 0 ? (
                <Check className="w-3.5 h-3.5 text-neutral-400" />
              ) : (
                <Info className="w-3.5 h-3.5 text-neutral-500" />
              )}
            </div>
            <div
              className={`text-sm sm:text-base font-bold ${
                todayCashSummary.difference === 0
                  ? 'text-neutral-800'
                  : todayCashSummary.difference > 0
                  ? 'text-emerald-600'
                  : 'text-rose-600'
              }`}
            >
              {todayCashSummary.difference === 0
                ? 'Pas (Sesuai)'
                : `${todayCashSummary.difference > 0 ? '+' : ''}${formatRupiah(
                    todayCashSummary.difference
                  )}`}
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">
              {todayCashSummary.difference === 0
                ? 'Fisik kas laci cocok'
                : todayCashSummary.difference > 0
                ? 'Kelebihan kas fisik di laci'
                : 'Kekurangan kas fisik di laci'}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          TAB 1: RIWAYAT KAS HARIAN (History per Tanggal Kas Awal, Masuk, Keluar & Akhir)
         ======================================================== */}
      {activeTab === 'cash-history' && (
        <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
          {/* Header & Action */}
          <div className="p-4 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Riwayat Kas Harian per Tanggal</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Mencatat kas awal, penjualan tunai, pengeluaran kas/beli stok, dan kas akhir rekonsiliasi.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => exportDailyCashToExcel(dailyCashHistory, storeProfile.name)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200/70 rounded-xl transition-colors cursor-pointer"
                title="Ekspor CSV/Excel"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ekspor File</span>
              </button>

              <button
                onClick={handleOpenAddRecord}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Catat Tanggal Lain</span>
              </button>
            </div>
          </div>

          {/* Table / List Riwayat Kas Harian */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50/75 border-b border-neutral-200/70 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Tanggal</th>
                  <th className="py-2.5 px-3">Penjaga Kasir</th>
                  <th className="py-2.5 px-3 text-right">Kas Awal</th>
                  <th className="py-2.5 px-3 text-right">Masuk Tunai (+)</th>
                  <th className="py-2.5 px-3 text-right text-rose-700">Pengeluaran Kas (-)</th>
                  <th className="py-2.5 px-3 text-right">Kas Akhir Fisik</th>
                  <th className="py-2.5 px-3 text-right">Selisih</th>
                  <th className="py-2.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs">
                {sortedCashHistory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-neutral-400">
                      Belum ada riwayat saldo kas harian yang tersimpan.
                    </td>
                  </tr>
                ) : (
                  sortedCashHistory.map(record => {
                    const recDate = new Date(record.date);
                    const isToday =
                      recDate.toDateString() === new Date().toDateString();
                    const hasDiff = record.difference !== 0;

                    return (
                      <tr
                        key={record.id}
                        className={`hover:bg-neutral-50/80 transition-colors ${
                          isToday ? 'bg-rose-50/20' : ''
                        }`}
                      >
                        {/* Tanggal */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <div>
                              <div className="font-semibold text-neutral-900">
                                {formatDateOnly(record.date)}
                              </div>
                              <div className="text-[10px] text-neutral-400">
                                {isToday ? (
                                  <span className="text-rose-600 font-medium">Hari ini (Aktif)</span>
                                ) : (
                                  formatTimeOnly(record.date)
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Kasir */}
                        <td className="py-3 px-3">
                          <span className="font-medium text-neutral-700">{record.cashierName}</span>
                          {record.notes && (
                            <div className="text-[10px] text-neutral-400 truncate max-w-[140px]" title={record.notes}>
                              {record.notes}
                            </div>
                          )}
                        </td>

                        {/* Kas Awal */}
                        <td className="py-3 px-3 text-right font-medium text-neutral-700 font-mono">
                          {formatRupiah(record.initialCash)}
                        </td>

                        {/* Penjualan Tunai */}
                        <td className="py-3 px-3 text-right font-mono">
                          <span className="font-semibold text-emerald-600">
                            +{formatRupiah(record.cashSales)}
                          </span>
                          {record.digitalSales > 0 && (
                            <div className="text-[10px] text-neutral-400">
                              QRIS: {formatRupiah(record.digitalSales)}
                            </div>
                          )}
                        </td>

                        {/* Pengeluaran Kas (Beli Stok / Operasional) */}
                        <td className="py-3 px-3 text-right font-mono font-semibold">
                          {(record.cashExpenses || 0) > 0 ? (
                            <span className="text-rose-600">
                              -{formatRupiah(record.cashExpenses || 0)}
                            </span>
                          ) : (
                            <span className="text-neutral-400">Rp 0</span>
                          )}
                        </td>

                        {/* Kas Akhir */}
                        <td className="py-3 px-3 text-right font-bold text-neutral-900 font-mono">
                          {formatRupiah(record.actualCash)}
                        </td>

                        {/* Selisih */}
                        <td className="py-3 px-3 text-right font-mono">
                          {!hasDiff ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md">
                              <Check className="w-3 h-3 text-neutral-500" /> Pas
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                record.difference > 0
                                  ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                                  : 'text-rose-700 bg-rose-50 border border-rose-200'
                              }`}
                            >
                              {record.difference > 0 ? '+' : ''}
                              {formatRupiah(record.difference)}
                            </span>
                          )}
                        </td>

                        {/* Aksi: Edit & Hapus */}
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditRecord(record)}
                              title="Edit Riwayat Ini"
                              className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(record.id)}
                              title="Hapus Catatan Ini"
                              className="p-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: REKAP PENGELUARAN KAS & PEMBELIAN STOK (NEW DEDICATED TAB)
         ======================================================== */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          
          {/* 4 Kartu KPI Ringkasan Pengeluaran Kas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Total Kas Keluar */}
            <div className="p-4 rounded-2xl bg-[#FFF5F7] border border-[#FCE4E8] shadow-xs">
              <div className="flex items-center justify-between text-neutral-500 mb-1">
                <span className="text-xs font-bold text-[#800020]">Total Pengeluaran Kas</span>
                <ArrowDownCircle className="w-4 h-4 text-[#800020]" />
              </div>
              <div className="text-xl font-black font-mono text-[#800020] tracking-tight">
                {formatRupiah(expenseMetrics.totalAmount)}
              </div>
              <div className="text-[11px] text-stone-500 mt-1 font-medium">
                Dari {expenseMetrics.count} catatan pengeluaran
              </div>
            </div>

            {/* Khusus Pembelian Stok */}
            <div className="p-4 rounded-2xl bg-white border border-neutral-200/80 shadow-xs">
              <div className="flex items-center justify-between text-neutral-500 mb-1">
                <span className="text-xs font-semibold text-neutral-700">Beli Stok / Supplier</span>
                <Package className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-xl font-bold font-mono text-neutral-900 tracking-tight">
                {formatRupiah(expenseMetrics.stockAmount)}
              </div>
              <div className="text-[11px] text-neutral-400 mt-1">
                Restock cetakan kue, loyang &amp; alat
              </div>
            </div>

            {/* Kemasan & Plastik */}
            <div className="p-4 rounded-2xl bg-white border border-neutral-200/80 shadow-xs">
              <div className="flex items-center justify-between text-neutral-500 mb-1">
                <span className="text-xs font-semibold text-neutral-700">Kemasan &amp; Plastik</span>
                <ShoppingBag className="w-4 h-4 text-pink-500" />
              </div>
              <div className="text-xl font-bold font-mono text-neutral-900 tracking-tight">
                {formatRupiah(expenseMetrics.packagingAmount)}
              </div>
              <div className="text-[11px] text-neutral-400 mt-1">
                Kresek, lakban &amp; bubble wrap
              </div>
            </div>

            {/* Operasional & Lainnya */}
            <div className="p-4 rounded-2xl bg-white border border-neutral-200/80 shadow-xs">
              <div className="flex items-center justify-between text-neutral-500 mb-1">
                <span className="text-xs font-semibold text-neutral-700">Operasional &amp; Kurir</span>
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xl font-bold font-mono text-neutral-900 tracking-tight">
                {formatRupiah(expenseMetrics.operationalAmount + expenseMetrics.othersAmount)}
              </div>
              <div className="text-[11px] text-neutral-400 mt-1">
                Listrik, galon, makan &amp; bensin
              </div>
            </div>
          </div>

          {/* Filter Bar: Periode Tanggal, Kategori & Pencarian */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-3.5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              
              {/* Filter Periode */}
              <div className="flex items-center gap-1.5">
                {(['today', '7days', '30days', 'all'] as const).map(range => (
                  <button
                    key={range}
                    onClick={() => setDateFilter(range)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      dateFilter === range
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70'
                    }`}
                  >
                    {range === 'today'
                      ? 'Hari Ini'
                      : range === '7days'
                      ? '7 Hari'
                      : range === '30days'
                      ? '30 Hari'
                      : 'Semua'}
                  </button>
                ))}
              </div>

              {/* Action Buttons: Catat Kas Keluar & Ekspor */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setIsExpenseModalOpen(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-[#800020] hover:bg-[#660019] rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Catat Pengeluaran</span>
                </button>

                <button
                  onClick={() => exportExpensesToExcel(filteredExpenses, storeProfile.name)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200/70 rounded-xl transition-colors shrink-0 cursor-pointer"
                  title="Ekspor CSV Pengeluaran"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ekspor</span>
                </button>
              </div>
            </div>

            {/* Filter Kategori Chips & Search */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-neutral-100">
              <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
                <button
                  onClick={() => setExpenseCategoryFilter('all')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                    expenseCategoryFilter === 'all'
                      ? 'bg-[#FCE8EB] text-[#800020] border border-[#F8CCD4] font-bold'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/60'
                  }`}
                >
                  Semua ({expenses.length})
                </button>
                <button
                  onClick={() => setExpenseCategoryFilter('pembelian_stok')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                    expenseCategoryFilter === 'pembelian_stok'
                      ? 'bg-[#FCE8EB] text-[#800020] border border-[#F8CCD4] font-bold'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/60'
                  }`}
                >
                  <Package className="w-3 h-3" />
                  <span>Beli Stok</span>
                </button>
                <button
                  onClick={() => setExpenseCategoryFilter('kemasan_packaging')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                    expenseCategoryFilter === 'kemasan_packaging'
                      ? 'bg-[#FCE8EB] text-[#800020] border border-[#F8CCD4] font-bold'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/60'
                  }`}
                >
                  <ShoppingBag className="w-3 h-3" />
                  <span>Kemasan</span>
                </button>
                <button
                  onClick={() => setExpenseCategoryFilter('operasional')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                    expenseCategoryFilter === 'operasional'
                      ? 'bg-[#FCE8EB] text-[#800020] border border-[#F8CCD4] font-bold'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/60'
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  <span>Operasional</span>
                </button>
                <button
                  onClick={() => setExpenseCategoryFilter('konsumsi_transport')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                    expenseCategoryFilter === 'konsumsi_transport'
                      ? 'bg-[#FCE8EB] text-[#800020] border border-[#F8CCD4] font-bold'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/60'
                  }`}
                >
                  <Coffee className="w-3 h-3" />
                  <span>Konsumsi &amp; Kurir</span>
                </button>
              </div>

              {/* Input Cari */}
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari keterangan / kasir..."
                  value={expenseSearchQuery}
                  onChange={e => setExpenseSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-400"
                />
              </div>
            </div>
          </div>

          {/* Tabel Catatan Pengeluaran Kas & Pembelian Stok */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-50/75 border-b border-neutral-200/70 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Waktu &amp; Tanggal</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3">Kasir</th>
                    <th className="py-2.5 px-3">Keterangan / Barang Dibeli</th>
                    <th className="py-2.5 px-3 text-right">Nominal (Rp)</th>
                    <th className="py-2.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-neutral-400">
                        Tidak ada pengeluaran kas pada filter ini.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map(exp => {
                      const isRestock = exp.category === 'pembelian_stok';
                      return (
                        <tr key={exp.id} className="hover:bg-neutral-50/70 transition-colors">
                          {/* Waktu & Tanggal */}
                          <td className="py-2.5 px-4">
                            <div className="font-semibold text-neutral-900">{formatDateOnly(exp.date)}</div>
                            <div className="text-[10px] text-neutral-400">{formatTimeOnly(exp.date)}</div>
                          </td>

                          {/* Kategori Badge */}
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-neutral-100 text-neutral-700">
                              {getCategoryIcon(exp.category)}
                              <span>{exp.categoryLabel}</span>
                            </span>
                          </td>

                          {/* Kasir */}
                          <td className="py-2.5 px-3 text-neutral-700 font-medium">
                            {exp.cashierName}
                          </td>

                          {/* Keterangan */}
                          <td className="py-2.5 px-3">
                            <div className="text-neutral-900 font-medium max-w-sm sm:max-w-md">
                              {exp.notes}
                            </div>
                            {isRestock && (
                              <span className="inline-block mt-0.5 text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                Stok Toko Otomatis Diperbarui
                              </span>
                            )}
                          </td>

                          {/* Nominal */}
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600 text-sm">
                            -{formatRupiah(exp.amount)}
                          </td>

                          {/* Aksi Hapus */}
                          <td className="py-2.5 px-4 text-center">
                            <button
                              onClick={() => setDeleteExpenseConfirmId(exp.id)}
                              className="p-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Catatan Pengeluaran"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: REKAP PENJUALAN (OMSET, LABA, NOTA)
         ======================================================== */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          {/* 3 Poin Penting Rekap Penjualan: Omset, Laba, & Jumlah Transaksi */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Omset Total */}
            <div className="p-4 rounded-2xl bg-white border border-neutral-200/80 shadow-xs">
              <div className="flex items-center justify-between text-neutral-500 mb-1">
                <span className="text-xs font-semibold text-neutral-500">Total Omset Kotor</span>
                <DollarSign className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-xl font-bold text-neutral-900 tracking-tight font-mono">
                {formatRupiah(salesMetrics.totalRevenue)}
              </div>
              <div className="text-[11px] text-neutral-400 mt-1">
                Rata-rata/nota: {formatRupiah(salesMetrics.avgOrderValue)}
              </div>
            </div>

            {/* Estimasi Laba Bersih */}
            <div className="p-4 rounded-2xl bg-white border border-neutral-200/80 shadow-xs">
              <div className="flex items-center justify-between text-neutral-500 mb-1">
                <span className="text-xs font-semibold text-neutral-500">Estimasi Laba Bersih</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-xl font-bold text-emerald-600 tracking-tight font-mono">
                {formatRupiah(salesMetrics.totalProfit)}
              </div>
              <div className="text-[11px] text-neutral-400 mt-1">
                Margin profit: <strong className="text-emerald-700">{salesMetrics.profitMargin}%</strong>
              </div>
            </div>

            {/* Jumlah Transaksi */}
            <div className="p-4 rounded-2xl bg-white border border-neutral-200/80 shadow-xs">
              <div className="flex items-center justify-between text-neutral-500 mb-1">
                <span className="text-xs font-semibold text-neutral-500">Transaksi Selesai</span>
                <CreditCard className="w-4 h-4 text-neutral-400" />
              </div>
              <div className="text-xl font-bold text-neutral-900 tracking-tight">
                {salesMetrics.txCount} Transaksi
              </div>
              <div className="text-[11px] text-neutral-400 mt-1">
                {salesMetrics.cashCount} Tunai • {salesMetrics.digitalCount} Non-Tunai/QRIS
              </div>
            </div>
          </div>

          {/* Arus Kas Ringkas Banner */}
          <div className="p-3 bg-[#FFF5F7] rounded-2xl border border-[#FCE4E8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-black">
              <Sparkles className="w-4 h-4 text-[#800020]" />
              <span>
                Omset Penjualan: <strong>{formatRupiah(salesMetrics.totalRevenue)}</strong> | 
                Total Pengeluaran Kas: <strong className="text-[#800020]">-{formatRupiah(expenseMetrics.totalAmount)}</strong>
              </span>
            </div>
            <div className="font-semibold text-black">
              Arus Kas Bersih: <span className="font-mono font-bold text-[#800020]">{formatRupiah(salesMetrics.totalRevenue - expenseMetrics.totalAmount)}</span>
            </div>
          </div>

          {/* Filter & Search Bar: Kompak */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              {(['today', '7days', '30days', 'all'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setDateFilter(range)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    dateFilter === range
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70'
                  }`}
                >
                  {range === 'today'
                    ? 'Hari Ini'
                    : range === '7days'
                    ? '7 Hari'
                    : range === '30days'
                    ? '30 Hari'
                    : 'Semua'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari transaksi / kasir..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-400"
                />
              </div>

              <button
                onClick={() => exportTransactionsToExcel(filteredTransactions, storeProfile.name)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200/70 rounded-lg transition-colors shrink-0 cursor-pointer"
                title="Ekspor Rekap Penjualan"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ekspor</span>
              </button>
            </div>
          </div>

          {/* Tabel Transaksi Ringkas */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-50/75 border-b border-neutral-200/70 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Nota &amp; Waktu</th>
                    <th className="py-2.5 px-3">Kasir / Pelanggan</th>
                    <th className="py-2.5 px-3">Produk</th>
                    <th className="py-2.5 px-3">Metode</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                    <th className="py-2.5 px-4 text-center">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-neutral-400">
                        Tidak ada transaksi pada filter periode ini.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-neutral-50/70 transition-colors">
                        <td className="py-2.5 px-4">
                          <div className="font-semibold text-neutral-900">{tx.invoiceNo || tx.id}</div>
                          <div className="text-[10px] text-neutral-400">{formatDateTime(tx.date)}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="text-neutral-800 font-medium">{tx.cashierName}</div>
                          <div className="text-[10px] text-neutral-400">{tx.customerName || 'Umum'}</div>
                        </td>
                        <td className="py-2.5 px-3 text-neutral-600">
                          {tx.items.length} item ({tx.items.reduce((s, i) => s + i.qty, 0)} pcs)
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="capitalize text-neutral-600 font-medium">
                            {tx.paymentMethod === 'tunai' ? 'Tunai' : tx.paymentMethod.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-neutral-900 font-mono">
                          {formatRupiah(tx.total)}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <button
                            onClick={() => setSelectedTx(tx)}
                            className="p-1 text-neutral-400 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 cursor-pointer"
                            title="Lihat Rincian Nota"
                          >
                            <Eye className="w-3.5 h-3.5" />
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

      {/* ========================================================
          MODAL: EDIT ATAU TAMBAH RIWAYAT KAS (Kas Awal, Kas Masuk, Kas Keluar, Kas Akhir)
         ======================================================== */}
      {isCashModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl border border-neutral-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  {cashModalMode === 'edit-today'
                    ? 'Sesuaikan Saldo Kas Hari Ini'
                    : cashModalMode === 'edit-record'
                    ? 'Edit Catatan Kas Tanggal'
                    : 'Tambah Catatan Kas Baru'}
                </h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Hitung kas awal, penjualan tunai, pengeluaran kas, dan kas akhir fisik laci.
                </p>
              </div>
              <button
                onClick={() => setIsCashModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCashModal} className="p-5 space-y-3.5 text-xs">
              {/* Tanggal & Penjaga Kasir */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    Tanggal Catatan
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    disabled={cashModalMode === 'edit-today'}
                    className="w-full px-3 py-1.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-800 disabled:bg-neutral-100 disabled:text-neutral-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    Nama Kasir
                  </label>
                  <input
                    type="text"
                    required
                    value={formCashierName}
                    onChange={e => setFormCashierName(e.target.value)}
                    placeholder="Nama penjaga kasir"
                    className="w-full px-3 py-1.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-800"
                  />
                </div>
              </div>

              {/* Kas Awal Modal */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Kas Awal (Modal Buka Toko)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-semibold text-xs">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={formInitialCash || ''}
                    onChange={e => setFormInitialCash(Number(e.target.value) || 0)}
                    placeholder="Contoh: 300000"
                    className="w-full pl-9 pr-3 py-1.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-800 font-mono font-medium"
                  />
                </div>
                <p className="text-[10px] text-neutral-400 mt-0.5">Uang modal receh di laci saat buka</p>
              </div>

              {/* Penjualan Tunai & Digital (Hanya untuk tambah/edit catatan lama manual) */}
              {cashModalMode !== 'edit-today' && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                      Penjualan Tunai (Cash)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 font-semibold text-xs">
                        Rp
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={formCashSales || ''}
                        onChange={e => setFormCashSales(Number(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full pl-8 pr-2.5 py-1.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-800 font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                      Penjualan Digital (QRIS)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 font-semibold text-xs">
                        Rp
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={formDigitalSales || ''}
                        onChange={e => setFormDigitalSales(Number(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full pl-8 pr-2.5 py-1.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-800 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Pengeluaran Kas (Beli Stok / Operasional) */}
              {cashModalMode !== 'edit-today' && (
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1 text-rose-700">
                    Pengeluaran Kas / Beli Stok (-)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500 font-semibold text-xs">
                      Rp
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={formCashExpenses || ''}
                      onChange={e => setFormCashExpenses(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full pl-9 pr-3 py-1.5 border border-rose-200 bg-rose-50/20 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono font-medium"
                    />
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Pengeluaran kas laci untuk restock atau operasional</p>
                </div>
              )}

              {/* Kas Akhir Fisik */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Kas Akhir Fisik (Uang Riil Tutup Toko)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-semibold text-xs">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={formActualCash || ''}
                    onChange={e => setFormActualCash(Number(e.target.value) || 0)}
                    placeholder="Hitung fisik uang tunai di laci"
                    className="w-full pl-9 pr-3 py-1.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-800 font-mono font-medium"
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-neutral-500 mt-1">
                  <span>
                    Seharusnya:{' '}
                    <strong>{formatRupiah(formInitialCash + formCashSales - formCashExpenses)}</strong>
                  </span>
                  <span>
                    Selisih:{' '}
                    <strong
                      className={
                        formActualCash - (formInitialCash + formCashSales - formCashExpenses) === 0
                          ? 'text-neutral-700'
                          : formActualCash - (formInitialCash + formCashSales - formCashExpenses) > 0
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }
                    >
                      {formatRupiah(formActualCash - (formInitialCash + formCashSales - formCashExpenses))}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Catatan / Keterangan */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Misal: Beli 2 cetakan kue dari supplier, selisih pas..."
                  className="w-full px-3 py-1.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-800 resize-none"
                />
              </div>

              {/* Tombol Simpan */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCashModalOpen(false)}
                  className="px-3 py-1.5 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Simpan Catatan Kas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: KONFIRMASI HAPUS RIWAYAT KAS
         ======================================================== */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-neutral-200 p-5 shadow-xl space-y-3">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h4 className="text-sm font-bold text-neutral-900">Hapus Riwayat Kas Tanggal Ini?</h4>
              <p className="text-xs text-neutral-500 mt-1">
                Catatan kas awal dan kas akhir pada tanggal tersebut akan dihapus dari history laporan.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-1.5 text-xs font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200/80 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => handleDeleteRecord(deleteConfirmId)}
                className="flex-1 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: KONFIRMASI HAPUS CATATAN PENGELUARAN KAS
         ======================================================== */}
      {deleteExpenseConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-neutral-200 p-5 shadow-xl space-y-3">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h4 className="text-sm font-bold text-neutral-900">Hapus Catatan Pengeluaran Kas?</h4>
              <p className="text-xs text-neutral-500 mt-1">
                Catatan ini akan dihapus dari rekap kas keluar dan laporan keuangan.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setDeleteExpenseConfirmId(null)}
                className="flex-1 py-1.5 text-xs font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200/80 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => handleDeleteExpense(deleteExpenseConfirmId)}
                className="flex-1 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: DETAIL NOTA TRANSAKSI
         ======================================================== */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-neutral-200 shadow-xl overflow-hidden p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div>
                <span className="font-mono text-neutral-400 font-bold text-[10px]">{selectedTx.invoiceNo || selectedTx.id}</span>
                <div className="font-bold text-neutral-900 text-sm">{formatDateTime(selectedTx.date)}</div>
              </div>
              <button onClick={() => setSelectedTx(null)} className="p-1 text-neutral-400 hover:text-neutral-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 divide-y divide-neutral-100 max-h-60 overflow-y-auto">
              {selectedTx.items.map((item, idx) => (
                <div key={idx} className="pt-1.5 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-neutral-800">{item.product.name}</div>
                    <div className="text-[10px] text-neutral-400">
                      {item.qty} x {formatRupiah(item.product.sellPrice)}
                    </div>
                  </div>
                  <div className="font-semibold text-neutral-900 font-mono">
                    {formatRupiah(item.product.sellPrice * item.qty)}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-neutral-100 space-y-1">
              <div className="flex justify-between font-bold text-neutral-900 text-sm font-mono">
                <span>Total Belanja</span>
                <span>{formatRupiah(selectedTx.total)}</span>
              </div>
              <div className="flex justify-between text-neutral-500 text-[11px]">
                <span>Metode Bayar</span>
                <span className="capitalize font-medium">{txPaymentLabel(selectedTx.paymentMethod)}</span>
              </div>
              {selectedTx.change !== undefined && selectedTx.change > 0 && (
                <div className="flex justify-between text-neutral-500 text-[11px] font-mono">
                  <span>Kembalian</span>
                  <span>{formatRupiah(selectedTx.change)}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedTx(null)}
              className="w-full mt-2 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Cash Expense Modal when triggered from Recap */}
      {isExpenseModalOpen && (
        <CashExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
        />
      )}
    </div>
  );
};

function txPaymentLabel(method: string): string {
  if (method === 'tunai') return 'Tunai';
  return method.toUpperCase();
}
