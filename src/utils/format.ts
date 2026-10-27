/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaction, StoreProfile, DailyCashRecord, CashExpense } from '../types/pos';

export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return 'Rp 0';
  return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
}

export function formatDateTime(isoString: string): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return isoString;
  }
}

export function formatTimeOnly(isoString: string): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return isoString;
  }
}

export function formatDateOnly(isoString: string): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return isoString;
  }
}

export function generateInvoiceNo(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `TRX-${year}${month}${day}-${rand}`;
}

export function generateShopeeOrderNo(): string {
  const chars = '0123456789ABCDEF';
  let rand = '';
  for (let i = 0; i < 8; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SPX-ID-${rand}`;
}

/**
 * Export transactions to Excel (CSV with UTF-8 BOM)
 */
export function exportTransactionsToExcel(transactions: Transaction[], storeName: string) {
  // UTF-8 BOM so Excel opens with correct encoding
  let csvContent = '\uFEFF';
  
  // Header row
  const headers = [
    'No Faktur',
    'Tanggal & Waktu',
    'Saluran',
    'Kasir',
    'Pelanggan',
    'Rincian Item',
    'Total Item',
    'Subtotal',
    'Diskon',
    'Pajak (PPN)',
    'Total Pembayaran',
    'Total HPP (Modal)',
    'Laba Bersih / Margin',
    'Metode Pembayaran',
    'Jumlah Bayar',
    'Kembalian',
    'Catatan / ID Shopee',
  ];

  csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',') + '\r\n';

  transactions.forEach(t => {
    const itemsSummary = t.items
      .map(i => `${i.product.name} (x${i.qty} @${formatRupiah(i.product.sellPrice)})`)
      .join('; ');
    const totalQty = t.items.reduce((acc, i) => acc + i.qty, 0);

    const row = [
      t.invoiceNo,
      formatDateTime(t.date),
      t.channel === 'shopee' ? 'Shopee Online' : 'Kasir Offline',
      t.cashierName,
      t.customerName || 'Pelanggan Umum',
      itemsSummary,
      totalQty.toString(),
      t.subtotal.toString(),
      t.discount.toString(),
      t.tax.toString(),
      t.total.toString(),
      t.costTotal.toString(),
      t.profit.toString(),
      t.paymentMethod.toUpperCase(),
      t.amountPaid.toString(),
      t.change.toString(),
      t.shopeeOrderId || t.notes || '-',
    ];

    csvContent += row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',') + '\r\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const now = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `Laporan_Penjualan_${storeName.replace(/\s+/g, '_')}_${now}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Print / Save as PDF helper
 */
export function printReceiptOrReport(elementId: string) {
  const content = document.getElementById(elementId);
  if (!content) {
    window.print();
    return;
  }
  window.print();
}

/**
 * Export daily cash register history to Excel CSV
 */
export function exportDailyCashToExcel(records: DailyCashRecord[], storeName: string) {
  let csvContent = '\uFEFF';
  const headers = [
    'Tanggal',
    'Kasir',
    'Kas Awal (Modal)',
    'Penjualan Tunai (+)',
    'Pengeluaran Kas (-)',
    'Penjualan Digital / Non-Tunai',
    'Ekspektasi Kas Laci',
    'Kas Akhir Riil',
    'Selisih Kas',
    'Status',
    'Catatan Laci',
  ];
  csvContent += headers.map((h) => `"${h}"`).join(',') + '\r\n';

  records.forEach((r) => {
    const row = [
      formatDateOnly(r.date),
      r.cashierName,
      r.initialCash,
      r.cashSales,
      r.cashExpenses || 0,
      r.digitalSales,
      r.expectedCash,
      r.actualCash,
      r.difference,
      r.isOpen ? 'Sedang Berjalan' : 'Tutup / Selesai',
      (r.notes || '').replace(/"/g, '""'),
    ];
    csvContent += row.map((val) => `"${val}"`).join(',') + '\r\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const now = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `Riwayat_Kas_Harian_${storeName.replace(/\s+/g, '_')}_${now}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export cash expenses to Excel CSV
 */
export function exportExpensesToExcel(expenses: CashExpense[], storeName: string) {
  let csvContent = '\uFEFF';
  const headers = [
    'ID Pengeluaran',
    'Tanggal & Waktu',
    'Kategori',
    'Kasir Yang Mengeluarkan',
    'Nominal (Rp)',
    'Keterangan / Alasan Pengeluaran',
  ];
  csvContent += headers.map((h) => `"${h}"`).join(',') + '\r\n';

  expenses.forEach((e) => {
    const row = [
      e.id,
      formatDateTime(e.date),
      e.categoryLabel,
      e.cashierName,
      e.amount,
      (e.notes || '').replace(/"/g, '""'),
    ];
    csvContent += row.map((val) => `"${val}"`).join(',') + '\r\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const now = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `Laporan_Pengeluaran_Kas_${storeName.replace(/\s+/g, '_')}_${now}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export itemized transaction details per day to Excel CSV
 */
export function exportDailyItemizedTransactionsToExcel(
  transactions: Transaction[],
  dateLabel: string,
  storeName: string
) {
  let csvContent = '\uFEFF';
  const headers = [
    'No Faktur',
    'Tanggal & Jam',
    'Kasir',
    'Pelanggan',
    'Metode Pembayaran',
    'Nama Produk',
    'Kategori',
    'Jumlah (Qty)',
    'Satuan',
    'Harga Satuan (Rp)',
    'Subtotal Produk (Rp)',
    'Diskon Nota',
    'PPN Nota',
    'Total Bayar Transaksi',
    'Catatan',
  ];

  csvContent += headers.map((h) => `"${h}"`).join(',') + '\r\n';

  transactions.forEach((tx) => {
    tx.items.forEach((item) => {
      const row = [
        tx.invoiceNo,
        formatDateTime(tx.date),
        tx.cashierName,
        tx.customerName || 'Pelanggan Umum',
        tx.paymentMethod.toUpperCase(),
        item.product.name.replace(/"/g, '""'),
        item.product.category,
        item.qty,
        item.product.unit || 'buah',
        item.product.sellPrice,
        item.product.sellPrice * item.qty,
        tx.pointsUsedDiscount || tx.discount || 0,
        tx.tax || 0,
        tx.total,
        (tx.notes || '').replace(/"/g, '""'),
      ];
      csvContent += row.map((val) => `"${val}"`).join(',') + '\r\n';
    });
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const safeDate = dateLabel.replace(/[^\w-]/g, '_');
  link.setAttribute('download', `Rekap_Transaksi_Harian_${safeDate}_${storeName.replace(/\s+/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
