/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaction } from '../types/pos';
import { INITIAL_PRODUCTS } from './initialData';

export function getInitialTransactions(): Transaction[] {
  const now = new Date();
  
  // Helper to create timestamp offset by hours/days
  const getDateOffset = (daysAgo: number, hour: number, minute: number): string => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  };

  const p1 = INITIAL_PRODUCTS[0]; // Cetakan Kue Lumpur
  const p2 = INITIAL_PRODUCTS[1]; // Cetakan Pukis
  const p3 = INITIAL_PRODUCTS[2]; // Cetakan Cubit
  const p5 = INITIAL_PRODUCTS[4]; // Loyang Tulban
  const p7 = INITIAL_PRODUCTS[6]; // Spatula Silikon Set
  const p8 = INITIAL_PRODUCTS[7]; // Wajan Granite
  const p10 = INITIAL_PRODUCTS[9]; // Timbangan Digital
  const p12 = INITIAL_PRODUCTS[11]; // Whisk Stainless

  return [
    // Today morning offline sale (Cetakan Kue Lumpur & Loyang Tulban)
    {
      id: 'trx-101',
      invoiceNo: 'TRX-261012-1001',
      date: getDateOffset(0, 8, 45),
      items: [
        { product: p1, qty: 1 },
        { product: p5, qty: 1 },
      ],
      subtotal: 170000,
      discount: 0,
      tax: 0,
      total: 170000,
      costTotal: 110000,
      profit: 60000,
      paymentMethod: 'qris',
      amountPaid: 170000,
      change: 0,
      customerId: 'cust-1',
      customerName: 'Ibu Ratna Bakery',
      cashierId: 'user-kasir-1',
      cashierName: 'Budi Santoso',
      channel: 'offline',
    },
    // Today Shopee Order sync (Wajan Granite & Spatula Silikon Set)
    {
      id: 'trx-102',
      invoiceNo: 'TRX-261012-1002',
      date: getDateOffset(0, 9, 30),
      items: [
        { product: p8, qty: 1 },
        { product: p7, qty: 1 },
      ],
      subtotal: 243000,
      discount: 10000,
      tax: 0,
      total: 233000,
      costTotal: 157000,
      profit: 76000,
      paymentMethod: 'shopeepay',
      amountPaid: 233000,
      change: 0,
      cashierId: 'user-admin',
      cashierName: 'Shopee API Sync',
      channel: 'shopee',
      shopeeOrderId: 'SPX-ID-98A17F20',
      notes: 'Pesanan Shopee Online #SPX-ID-98A17F20 (Resi: JP9912034)',
    },
    // Today lunchtime cash sale (Cetakan Pukis & Whisk)
    {
      id: 'trx-103',
      invoiceNo: 'TRX-261012-1003',
      date: getDateOffset(0, 12, 15),
      items: [
        { product: p2, qty: 1 },
        { product: p12, qty: 1 },
      ],
      subtotal: 147000,
      discount: 0,
      tax: 0,
      total: 147000,
      costTotal: 92000,
      profit: 55000,
      paymentMethod: 'tunai',
      amountPaid: 150000,
      change: 3000,
      customerId: 'cust-2',
      customerName: 'Siti Nurhaliza (Catering)',
      cashierId: 'user-kasir-1',
      cashierName: 'Budi Santoso',
      channel: 'offline',
    },
    // Yesterday offline POS sale
    {
      id: 'trx-091',
      invoiceNo: 'TRX-261011-0901',
      date: getDateOffset(1, 14, 20),
      items: [
        { product: p10, qty: 1 },
        { product: p7, qty: 2 },
      ],
      subtotal: 191000,
      discount: 0,
      tax: 0,
      total: 191000,
      costTotal: 119000,
      profit: 72000,
      paymentMethod: 'qris',
      amountPaid: 191000,
      change: 0,
      cashierId: 'user-kasir-2',
      cashierName: 'Dewi Lestari',
      channel: 'offline',
    },
    // 3 days ago sale
    {
      id: 'trx-085',
      invoiceNo: 'TRX-261009-0855',
      date: getDateOffset(3, 16, 10),
      items: [
        { product: p1, qty: 2 },
        { product: p3, qty: 1 },
      ],
      subtotal: 300000,
      discount: 15000,
      tax: 0,
      total: 285000,
      costTotal: 200000,
      profit: 85000,
      paymentMethod: 'transfer',
      amountPaid: 285000,
      change: 0,
      customerId: 'cust-3',
      customerName: 'Dapur Mama Anisa',
      cashierId: 'user-kasir-1',
      cashierName: 'Budi Santoso',
      channel: 'offline',
    },
    // 5 days ago Shopee sale
    {
      id: 'trx-077',
      invoiceNo: 'TRX-261007-0770',
      date: getDateOffset(5, 11, 40),
      items: [
        { product: p5, qty: 2 },
        { product: p7, qty: 1 },
      ],
      subtotal: 218000,
      discount: 10000,
      tax: 0,
      total: 208000,
      costTotal: 132000,
      profit: 76000,
      paymentMethod: 'shopeepay',
      amountPaid: 208000,
      change: 0,
      cashierId: 'user-admin',
      cashierName: 'Shopee API Sync',
      channel: 'shopee',
      shopeeOrderId: 'SPX-ID-55X9902',
    },
    // 12 days ago sale
    {
      id: 'trx-064',
      invoiceNo: 'TRX-260930-0641',
      date: getDateOffset(12, 10, 15),
      items: [
        { product: p8, qty: 2 },
        { product: p1, qty: 1 },
      ],
      subtotal: 445000,
      discount: 20000,
      tax: 0,
      total: 425000,
      costTotal: 295000,
      profit: 130000,
      paymentMethod: 'kartu',
      amountPaid: 425000,
      change: 0,
      cashierId: 'user-kasir-1',
      cashierName: 'Budi Santoso',
      channel: 'offline',
    },
    // 25 days ago sale
    {
      id: 'trx-045',
      invoiceNo: 'TRX-260917-0450',
      date: getDateOffset(25, 15, 30),
      items: [
        { product: p1, qty: 3 },
        { product: p2, qty: 2 },
      ],
      subtotal: 535000,
      discount: 25000,
      tax: 0,
      total: 510000,
      costTotal: 355000,
      profit: 155000,
      paymentMethod: 'tunai',
      amountPaid: 550000,
      change: 40000,
      customerId: 'cust-1',
      customerName: 'Ibu Ratna Bakery',
      cashierId: 'user-kasir-2',
      cashierName: 'Dewi Lestari',
      channel: 'offline',
    },
    // 35 days ago (1 bulan yang lalu)
    {
      id: 'trx-022',
      invoiceNo: 'TRX-260907-0205',
      date: getDateOffset(35, 13, 20),
      items: [
        { product: p5, qty: 3 },
        { product: p10, qty: 1 },
      ],
      subtotal: 280000,
      discount: 10000,
      tax: 0,
      total: 270000,
      costTotal: 170000,
      profit: 100000,
      paymentMethod: 'qris',
      amountPaid: 270000,
      change: 0,
      cashierId: 'user-kasir-1',
      cashierName: 'Budi Santoso',
      channel: 'offline',
    },
    // 38 days ago (1 bulan yang lalu)
    {
      id: 'trx-015',
      invoiceNo: 'TRX-260904-0118',
      date: getDateOffset(38, 17, 45),
      items: [
        { product: p8, qty: 1 },
        { product: p1, qty: 1 },
        { product: p7, qty: 1 },
      ],
      subtotal: 338000,
      discount: 18000,
      tax: 0,
      total: 320000,
      costTotal: 222000,
      profit: 98000,
      paymentMethod: 'shopeepay',
      amountPaid: 320000,
      change: 0,
      cashierId: 'user-admin',
      cashierName: 'Shopee API Sync',
      channel: 'shopee',
      shopeeOrderId: 'SPX-ID-22Z1108',
    },
  ];
}
