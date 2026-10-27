/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'supervisor' | 'kasir';

export interface StaffUser {
  id: string;
  name: string;
  role: UserRole;
  pin: string;
  avatarColor: string;
}

export type ProductCategory = string;

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: ProductCategory;
  buyPrice: number;    // Harga modal (HPP)
  sellPrice: number;   // Harga jual
  stock: number;       // Stok fisik saat ini
  minStock: number;    // Batas minimum peringatan stok habis
  unit: string;        // pcs, botol, pack, kg, dll
  shopeeItemId?: string; // ID barang di Shopee Open API
  shopeeSyncEnabled: boolean;
  imageUrl?: string;
  description?: string;
}

export interface CartItem {
  product: Product;
  qty: number;
  discountPercent?: number; // diskon per item (0-100)
  note?: string;
}

export type PaymentMethod = 
  | 'tunai' 
  | 'qris' 
  | 'shopeepay' 
  | 'gopay' 
  | 'ovo' 
  | 'dana' 
  | 'transfer' 
  | 'kartu';

export type SalesChannel = 'offline' | 'shopee';

export interface Transaction {
  id: string;
  invoiceNo: string;
  date: string; // ISO String
  items: CartItem[];
  subtotal: number;
  discount: number;
  pointsUsedDiscount?: number;
  tax: number; // 11% PPN jika aktif
  total: number;
  costTotal: number;
  profit: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  change: number;
  customerId?: string;
  customerName?: string;
  cashierId: string;
  cashierName: string;
  channel: SalesChannel;
  notes?: string;
  shopeeOrderId?: string;
}

export type CustomerTier = 'reguler' | 'silver' | 'gold' | 'platinum';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  tier: CustomerTier;
  points: number;
  totalSpend: number;
  totalVisits: number;
  registeredAt: string;
}

export interface CustomerCartSession {
  id: string;
  name: string;           // Nama keranjang/pelanggan (e.g. "Pelanggan 1", "Ibu Rina", "Antrean 2")
  createdAt: string;      // ISO String
  updatedAt: string;      // ISO String
  items: CartItem[];
  selectedCustomer: Customer | null;
  pointsToRedeem: number;
  taxEnabled: boolean;
  notes?: string;
}

export type ExpenseCategory = 
  | 'pembelian_stok'      // Pembelian Stok Barang / Supplier
  | 'kemasan_packaging'   // Kantong Plastik, Lakban, Bubble Wrap
  | 'operasional'         // Listrik, Air, Token, Kebersihan
  | 'konsumsi_transport'  // Makan/Minum Kasir, Bensin/Kurir
  | 'lainnya';            // Pengeluaran Lainnya

export interface CashExpense {
  id: string;
  date: string; // ISO date string
  amount: number;
  category: ExpenseCategory;
  categoryLabel: string;
  notes: string;
  cashierId: string;
  cashierName: string;
  shiftId?: string;
}

export interface CashierShift {
  id: string;
  cashierId: string;
  cashierName: string;
  startTime: string;
  endTime?: string;
  initialCash: number;
  cashExpenses?: number;
  expectedCash?: number;
  actualCash?: number;
  difference?: number;
  notes?: string;
  isOpen: boolean;
}

export interface DailyCashRecord {
  id: string;
  date: string; // ISO date string
  cashierName: string;
  initialCash: number;
  cashSales: number;
  digitalSales: number;
  cashExpenses?: number;
  expectedCash: number;
  actualCash: number;
  difference: number;
  isOpen: boolean;
  notes?: string;
}

export interface ShopeeConfig {
  partnerId: string;
  partnerKey: string;
  shopId: string;
  accessToken: string;
  autoSyncEnabled: boolean;
  lastSyncTime?: string;
  isConnected: boolean;
  webhookSecret: string;
  shopName: string;
}

export interface ShopeeSyncLog {
  id: string;
  timestamp: string;
  type: 'stock_update' | 'order_import' | 'webhook_received' | 'connection_test';
  status: 'success' | 'failed';
  message: string;
  details?: string;
}

export type NotificationType = 'stock_alert' | 'shopee_order' | 'backup' | 'system' | 'sales';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface CloudBackupMeta {
  lastBackupDate?: string;
  totalRecords: number;
  fileSizeBytes: number;
  encryptionAlgorithm: string;
  checksum: string;
  autoBackupEnabled: boolean;
  isCloudSyncing: boolean;
}

export interface StoreProfile {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  footerNote: string;
  receiptWidth: '58mm' | '80mm';
  taxRatePercent: number; // e.g. 11 or 0
  enableTax: boolean;
}

export type PresetNotificationSound = 
  | 'speech_id'       // Suara Bicara Bahasa Indonesia (TTS)
  | 'chime_classic'   // Bel Kasir Ting-Ting
  | 'store_bell'      // Lonceng Toko Modern
  | 'soft_alert'      // Sirene Peringatan Lembut
  | 'radar_pulse';    // Nada Radar Kasir

export interface VoiceAlertSettings {
  enabled: boolean;
  soundSource: 'preset' | 'custom_file'; // Pilihan 1: Tersedia di sistem vs Pilihan 2: Dari file pribadi
  presetSound: PresetNotificationSound;
  customAudioDataUrl?: string;
  customAudioFileName?: string;
  customAudioTarget?: 'both' | 'low_only' | 'out_only';
  voiceStyle?: 'speech_id' | 'chime_bell'; // for backward compat
  lowStockTemplate: string;
  outOfStockTemplate: string;
  speechRate: number;
  speechPitch: number;
  speechVolume: number;
  chimeSound?: string;
  autoSpeakOnCheckout: boolean;
}

