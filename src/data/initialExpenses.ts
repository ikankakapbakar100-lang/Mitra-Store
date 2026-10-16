/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CashExpense } from '../types/pos';

export function getInitialExpenses(): CashExpense[] {
  const now = new Date();
  const getDateOffset = (daysAgo: number, hour: number = 11, minute: number = 30): string => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  };

  return [
    {
      id: 'exp-1',
      date: getDateOffset(0, 10, 15),
      amount: 85000,
      category: 'pembelian_stok',
      categoryLabel: 'Pembelian Stok Barang / Supplier',
      notes: 'Beli 2 pcs Cetakan Pukis 10 Lubang Teflon dari supplier lokal (restock cepat)',
      cashierId: 'user-kasir-1',
      cashierName: 'Budi Santoso',
    },
    {
      id: 'exp-2',
      date: getDateOffset(1, 14, 20),
      amount: 35000,
      category: 'kemasan_packaging',
      categoryLabel: 'Kemasan & Plastik',
      notes: 'Beli 3 ikat kantong kresek pink tebal & lakban bening untuk packing',
      cashierId: 'user-kasir-2',
      cashierName: 'Dewi Lestari',
    },
    {
      id: 'exp-3',
      date: getDateOffset(2, 16, 45),
      amount: 50000,
      category: 'konsumsi_transport',
      categoryLabel: 'Konsumsi & Transport',
      notes: 'Bensin motor kurir toko antar pesanan cetakan ke Ibu Ratna Bakery',
      cashierId: 'user-kasir-1',
      cashierName: 'Budi Santoso',
    },
    {
      id: 'exp-4',
      date: getDateOffset(4, 11, 0),
      amount: 120000,
      category: 'pembelian_stok',
      categoryLabel: 'Pembelian Stok Barang / Supplier',
      notes: 'Beli 4 pcs Loyang Pizza Mini 20cm dari toko grosir perabot',
      cashierId: 'user-kasir-2',
      cashierName: 'Dewi Lestari',
    },
  ];
}
