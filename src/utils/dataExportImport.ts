/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product } from '../types/pos';

/**
 * Utilitas Ekspor & Impor Data Produk MitraStore (CSV / Excel & JSON)
 * Membantu toko mengamankan ratusan data stok ke file lokal komputer/HP.
 */

// Format data produk ke CSV yang kompatibel dengan Microsoft Excel dan Google Sheets
export const exportProductsToCSV = (products: Product[]): void => {
  const headers = [
    'ID Produk',
    'Nama Produk',
    'Kategori',
    'Harga Beli (HPP)',
    'Harga Jual',
    'Stok Saat Ini',
    'Batas Min Stok',
    'Satuan',
    'SKU',
    'Barcode',
    'Shopee Sync (true/false)',
  ];

  const escapeCSV = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = products.map((p) => [
    escapeCSV(p.id),
    escapeCSV(p.name),
    escapeCSV(p.category),
    escapeCSV(p.buyPrice),
    escapeCSV(p.sellPrice),
    escapeCSV(p.stock),
    escapeCSV(p.minStock),
    escapeCSV(p.unit),
    escapeCSV(p.sku),
    escapeCSV(p.barcode),
    escapeCSV(p.shopeeSyncEnabled ? 'true' : 'false'),
  ]);

  // Tambahkan UTF-8 BOM agar terbaca sempurna di Excel Indonesia
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  link.download = `MitraStore_Stok_Produk_${dateStr}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Ekspor Seluruh Data Aplikasi ke File JSON Tanpa Password (1-Klik Download Cadangan)
export const exportFullDatabaseJSON = (data: {
  products: Product[];
  transactions: any[];
  customers: any[];
  categories: string[];
  storeProfile: any;
  expenses: any[];
  dailyCashHistory: any[];
}): void => {
  const payload = {
    appName: 'MitraStore POS',
    version: '3.0',
    exportDate: new Date().toISOString(),
    totalProducts: data.products.length,
    totalTransactions: data.transactions.length,
    totalCustomers: data.customers.length,
    ...data,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  link.download = `MitraStore_Backup_Lengkap_${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Parser CSV Produk sederhana & tangguh
export const parseProductsFromCSV = (
  csvText: string,
  existingCategories: string[]
): { products: Omit<Product, 'id'>[]; categoriesToAdd: string[]; errors: string[] } => {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const errors: string[] = [];
  const parsedProducts: Omit<Product, 'id'>[] = [];
  const categoriesToAdd: Set<string> = new Set();

  if (lines.length <= 1) {
    return { products: [], categoriesToAdd: [], errors: ['File CSV kosong atau tidak memiliki baris data.'] };
  }

  // Lewati header (baris 0)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Regex pembagi CSV yang menangani quotes
    const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
    const cleanCols = cols.map((c) => c.replace(/^"|"$/g, '').trim());

    if (cleanCols.length < 5) {
      errors.push(`Baris ${i + 1}: Kolom tidak lengkap`);
      continue;
    }

    // Pemetaan kolom: Nama, Kategori, Harga Beli, Harga Jual, Stok, MinStok, Satuan, SKU, Barcode
    const name = cleanCols[1] || cleanCols[0];
    const category = cleanCols[2] || 'Cetakan Kue';
    const buyPrice = parseInt(cleanCols[3]?.replace(/\D/g, ''), 10) || 0;
    const sellPrice = parseInt(cleanCols[4]?.replace(/\D/g, ''), 10) || 0;
    const stock = parseInt(cleanCols[5]?.replace(/\D/g, ''), 10) || 0;
    const minStock = parseInt(cleanCols[6]?.replace(/\D/g, ''), 10) || 5;
    const unit = cleanCols[7] || 'buah';
    const sku = cleanCols[8] || `SKU-${Date.now()}-${i}`;
    const barcode = cleanCols[9] || sku;
    const shopeeSyncEnabled = cleanCols[10]?.toLowerCase() === 'true';

    if (!name) {
      errors.push(`Baris ${i + 1}: Nama produk kosong.`);
      continue;
    }

    if (!existingCategories.includes(category)) {
      categoriesToAdd.add(category);
    }

    parsedProducts.push({
      name,
      category,
      buyPrice,
      sellPrice,
      stock,
      minStock,
      unit,
      sku,
      barcode,
      shopeeSyncEnabled,
      imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=200&q=80',
    });
  }

  return {
    products: parsedProducts,
    categoriesToAdd: Array.from(categoriesToAdd),
    errors,
  };
};
