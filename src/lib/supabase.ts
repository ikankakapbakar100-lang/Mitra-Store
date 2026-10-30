/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  Product, 
  Transaction, 
  Customer, 
  StoreProfile, 
  DailyCashRecord, 
  CashExpense, 
  StaffUser,
  ShopeeConfig 
} from '../types/pos';

// Normalisasi URL Supabase agar mendukung baik https://...co maupun https://...co/rest/v1/
export function normalizeSupabaseUrl(rawUrl: string): { baseUrl: string; restUrl: string } {
  let url = (rawUrl || '').trim();
  url = url.replace(/\/+$/, '');
  if (url.endsWith('/rest/v1')) {
    url = url.substring(0, url.length - '/rest/v1'.length);
  }
  const baseUrl = url || 'https://tgcezwlxcjnsgrwedokq.supabase.co';
  const restUrl = `${baseUrl}/rest/v1/`;
  return { baseUrl, restUrl };
}

// Supabase Project Credentials provided by user
const RAW_SUPABASE_URL = 
  import.meta.env.VITE_SUPABASE_URL || 'https://tgcezwlxcjnsgrwedokq.supabase.co/rest/v1/';

const parsedUrls = normalizeSupabaseUrl(RAW_SUPABASE_URL);

// Base URL untuk createClient (@supabase/supabase-js memerlukan base origin)
export const SUPABASE_URL = parsedUrls.baseUrl;

// REST v1 API Endpoint (PostgREST API)
export const SUPABASE_REST_URL = parsedUrls.restUrl;

export const SUPABASE_ANON_KEY = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnY2V6d2x4Y2puc2dyd2Vkb2txIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyODAzMzgsImV4cCI6MjEwODg1NjMzOH0.PCh_tGHB2N092CvM1ohGHGbb2B9PqN279YNbqmEyCu0';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export interface SupabaseHealthStatus {
  isConnected: boolean;
  hasSchema: boolean;
  missingTables: string[];
  latencyMs: number;
  error?: string;
  url: string;
  restUrl?: string;
}

// Cek apakah koneksi ke Supabase aktif dan tabel-tabel sudah siap
export async function checkSupabaseStatus(): Promise<SupabaseHealthStatus> {
  const start = Date.now();
  const tables = ['products', 'transactions', 'customers', 'categories', 'daily_cash_records'];
  const missingTables: string[] = [];

  try {
    for (const table of tables) {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error) {
        if (error.code === 'PGRST205' || error.message.includes('Could not find the table') || error.message.includes('does not exist')) {
          missingTables.push(table);
        }
      }
    }

    const latencyMs = Date.now() - start;
    const isConnected = true;
    const hasSchema = missingTables.length === 0;

    return {
      isConnected,
      hasSchema,
      missingTables,
      latencyMs,
      url: SUPABASE_URL,
      restUrl: SUPABASE_REST_URL,
    };
  } catch (err: unknown) {
    return {
      isConnected: false,
      hasSchema: false,
      missingTables: tables,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : 'Koneksi ke Supabase gagal.',
      url: SUPABASE_URL,
      restUrl: SUPABASE_REST_URL,
    };
  }
}

// -----------------------------------------------------------------------------
// DATA MAPPERS (CamelCase Frontend <-> Snake_Case PostgreSQL)
// -----------------------------------------------------------------------------

export function mapProductToDb(p: Product) {
  return {
    id: p.id,
    name: p.name,
    sku: p.sku || null,
    barcode: p.barcode || null,
    category: p.category,
    buy_price: p.buyPrice,
    sell_price: p.sellPrice,
    stock: p.stock,
    min_stock: p.minStock,
    unit: p.unit,
    shopee_item_id: p.shopeeItemId || null,
    shopee_sync_enabled: Boolean(p.shopeeSyncEnabled),
    image_url: p.imageUrl || null,
    description: p.description || null,
    updated_at: new Date().toISOString(),
  };
}

export function mapProductFromDb(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku || '',
    barcode: row.barcode || '',
    category: row.category || 'Perabot Dapur',
    buyPrice: Number(row.buy_price) || 0,
    sellPrice: Number(row.sell_price) || 0,
    stock: Number(row.stock) || 0,
    minStock: Number(row.min_stock) || 5,
    unit: row.unit || 'pcs',
    shopeeItemId: row.shopee_item_id || undefined,
    shopeeSyncEnabled: Boolean(row.shopee_sync_enabled),
    imageUrl: row.image_url || undefined,
    description: row.description || undefined,
  };
}

export function mapTransactionToDb(t: Transaction) {
  return {
    id: t.id,
    invoice_no: t.invoiceNo,
    date: t.date,
    items: t.items,
    subtotal: t.subtotal,
    discount: t.discount,
    points_used_discount: t.pointsUsedDiscount || 0,
    tax: t.tax,
    total: t.total,
    cost_total: t.costTotal,
    profit: t.profit,
    payment_method: t.paymentMethod,
    amount_paid: t.amountPaid,
    change: t.change,
    customer_id: t.customerId || null,
    customer_name: t.customerName || null,
    cashier_id: t.cashierId,
    cashier_name: t.cashierName,
    channel: t.channel,
    notes: t.notes || null,
    shopee_order_id: t.shopeeOrderId || null,
    is_offline: Boolean(t.isOffline),
    synced_at: new Date().toISOString(),
  };
}

export function mapTransactionFromDb(row: any): Transaction {
  return {
    id: row.id,
    invoiceNo: row.invoice_no,
    date: row.date,
    items: typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []),
    subtotal: Number(row.subtotal) || 0,
    discount: Number(row.discount) || 0,
    pointsUsedDiscount: Number(row.points_used_discount) || 0,
    tax: Number(row.tax) || 0,
    total: Number(row.total) || 0,
    costTotal: Number(row.cost_total) || 0,
    profit: Number(row.profit) || 0,
    paymentMethod: row.payment_method || 'tunai',
    amountPaid: Number(row.amount_paid) || 0,
    change: Number(row.change) || 0,
    customerId: row.customer_id || undefined,
    customerName: row.customer_name || undefined,
    cashierId: row.cashier_id || 'user-admin',
    cashierName: row.cashier_name || 'Kasir',
    channel: row.channel || 'offline',
    notes: row.notes || undefined,
    shopeeOrderId: row.shopee_order_id || undefined,
    isOffline: Boolean(row.is_offline),
    syncedAt: row.synced_at || undefined,
  };
}

export function mapCustomerToDb(c: Customer) {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone || null,
    email: c.email || null,
    tier: c.tier,
    points: c.points,
    total_spend: c.totalSpend,
    total_visits: c.totalVisits,
    registered_at: c.registeredAt,
    updated_at: new Date().toISOString(),
  };
}

export function mapCustomerFromDb(row: any): Customer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone || '',
    email: row.email || undefined,
    tier: row.tier || 'reguler',
    points: Number(row.points) || 0,
    totalSpend: Number(row.total_spend) || 0,
    totalVisits: Number(row.total_visits) || 1,
    registeredAt: row.registered_at || new Date().toISOString(),
  };
}

export function mapDailyCashRecordToDb(r: DailyCashRecord) {
  return {
    id: r.id,
    date: r.date,
    cashier_name: r.cashierName,
    initial_cash: r.initialCash,
    cash_sales: r.cashSales,
    digital_sales: r.digitalSales,
    cash_expenses: r.cashExpenses,
    expected_cash: r.expectedCash,
    actual_cash: r.actualCash,
    difference: r.difference,
    notes: r.notes || null,
  };
}

export function mapDailyCashRecordFromDb(row: any): DailyCashRecord {
  return {
    id: row.id,
    date: row.date,
    cashierName: row.cashier_name,
    initialCash: Number(row.initial_cash) || 0,
    cashSales: Number(row.cash_sales) || 0,
    digitalSales: Number(row.digital_sales) || 0,
    cashExpenses: Number(row.cash_expenses) || 0,
    expectedCash: Number(row.expected_cash) || 0,
    actualCash: Number(row.actual_cash) || 0,
    difference: Number(row.difference) || 0,
    isOpen: Boolean(row.is_open ?? false),
    notes: row.notes || undefined,
  };
}

export function mapExpenseToDb(e: CashExpense) {
  return {
    id: e.id,
    date: e.date,
    amount: e.amount,
    category: e.category,
    note: e.notes || null,
    cashier_id: e.cashierId || null,
    cashier_name: e.cashierName || null,
  };
}

export function mapExpenseFromDb(row: any): CashExpense {
  return {
    id: row.id,
    date: row.date,
    amount: Number(row.amount) || 0,
    category: row.category || 'operasional',
    categoryLabel: row.category_label || row.category || 'Operasional',
    notes: row.note || row.notes || '',
    cashierId: row.cashier_id || 'user-admin',
    cashierName: row.cashier_name || 'Admin',
  };
}

export function mapStoreProfileToDb(sp: StoreProfile) {
  return {
    id: 'default',
    name: sp.name,
    tagline: sp.tagline || null,
    address: sp.address || null,
    phone: sp.phone || null,
    footer_note: sp.footerNote || null,
    receipt_width: sp.receiptWidth || '58mm',
    tax_rate_percent: sp.taxRatePercent || 11,
    enable_tax: Boolean(sp.enableTax),
    updated_at: new Date().toISOString(),
  };
}

export function mapStoreProfileFromDb(row: any): StoreProfile {
  return {
    name: row.name || 'MitraStore',
    tagline: row.tagline || 'Pusat Cetakan Kue, Alat Masak & Perabotan Dapur',
    address: row.address || 'Jl. Sentra Perabot & Baking No. 45, Bandung',
    phone: row.phone || '0812-3456-7890',
    footerNote: row.footer_note || 'Terima kasih telah berbelanja di MitraStore.',
    receiptWidth: (row.receipt_width as '58mm' | '80mm') || '58mm',
    taxRatePercent: Number(row.tax_rate_percent) || 11,
    enableTax: Boolean(row.enable_tax),
  };
}
