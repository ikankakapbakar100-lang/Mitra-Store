/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DailyCashRecord } from '../types/pos';

export function getInitialDailyCashRecords(): DailyCashRecord[] {
  const now = new Date();
  
  const getDateOffset = (daysAgo: number, hour: number = 8): string => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };

  return [
    {
      id: 'cash-rec-today',
      date: getDateOffset(0, 8),
      cashierName: 'Budi Santoso',
      initialCash: 200000,
      cashSales: 147000,
      digitalSales: 403000,
      cashExpenses: 85000,
      expectedCash: 262000,
      actualCash: 262000,
      difference: 0,
      isOpen: true,
      notes: 'Shift aktif berjalan hari ini. Pembelian stok cetakan pukis Rp 85.000 dari kas laci.',
    },
    {
      id: 'cash-rec-1',
      date: getDateOffset(1, 21),
      cashierName: 'Dewi Lestari',
      initialCash: 250000,
      cashSales: 620000,
      digitalSales: 780000,
      cashExpenses: 35000,
      expectedCash: 835000,
      actualCash: 835000,
      difference: 0,
      isOpen: false,
      notes: 'Tutup kasir malam. Beli plastik packing Rp 35.000. Fisik uang laci sesuai.',
    },
    {
      id: 'cash-rec-2',
      date: getDateOffset(2, 21),
      cashierName: 'Budi Santoso',
      initialCash: 300000,
      cashSales: 890000,
      digitalSales: 1150000,
      cashExpenses: 50000,
      expectedCash: 1140000,
      actualCash: 1140000,
      difference: 0,
      isOpen: false,
      notes: 'Bensin kurir Rp 50.000. Ramai pesanan cetakan kue & loyang.',
    },
    {
      id: 'cash-rec-3',
      date: getDateOffset(3, 21),
      cashierName: 'Siti Rahma',
      initialCash: 200000,
      cashSales: 450000,
      digitalSales: 600000,
      cashExpenses: 0,
      expectedCash: 650000,
      actualCash: 650000,
      difference: 0,
      isOpen: false,
      notes: 'Serah terima kasir sore lancar.',
    },
    {
      id: 'cash-rec-4',
      date: getDateOffset(4, 21),
      cashierName: 'Dewi Lestari',
      initialCash: 150000,
      cashSales: 580000,
      digitalSales: 920000,
      cashExpenses: 120000,
      expectedCash: 610000,
      actualCash: 615000,
      difference: 5000,
      isOpen: false,
      notes: 'Beli 4 pcs loyang pizza mini Rp 120.000. Ada kelebihan Rp 5.000 dari pembeli.',
    },
    {
      id: 'cash-rec-5',
      date: getDateOffset(5, 21),
      cashierName: 'Budi Santoso',
      initialCash: 250000,
      cashSales: 740000,
      digitalSales: 830000,
      cashExpenses: 0,
      expectedCash: 990000,
      actualCash: 990000,
      difference: 0,
      isOpen: false,
      notes: 'Hasil penjualan disetor sebagian ke brankas toko.',
    },
    {
      id: 'cash-rec-6',
      date: getDateOffset(6, 21),
      cashierName: 'Hendra Wijaya (Owner)',
      initialCash: 200000,
      cashSales: 510000,
      digitalSales: 640000,
      cashExpenses: 0,
      expectedCash: 710000,
      actualCash: 710000,
      difference: 0,
      isOpen: false,
      notes: 'Kas awal disiapkan dengan uang pecahan kecil.',
    },
  ];
}
