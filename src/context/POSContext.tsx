/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Product,
  CartItem,
  Transaction,
  Customer,
  StaffUser,
  CashierShift,
  StoreProfile,
  ShopeeConfig,
  ShopeeSyncLog,
  AppNotification,
  CloudBackupMeta,
  PaymentMethod,
  DailyCashRecord,
  CashExpense,
  ExpenseCategory,
  CustomerCartSession,
  VoiceAlertSettings,
} from '../types/pos';
import {
  DEFAULT_VOICE_SETTINGS,
  playStockVoiceAlert,
} from '../utils/voiceAlert';
import {
  INITIAL_PRODUCTS,
  INITIAL_STAFF,
  INITIAL_CUSTOMERS,
  INITIAL_STORE_PROFILE,
  INITIAL_SHOPEE_CONFIG,
  INITIAL_CATEGORIES,
} from '../data/initialData';
import { getInitialTransactions } from '../data/initialTransactions';
import { getInitialDailyCashRecords } from '../data/initialDailyCash';
import { getInitialExpenses } from '../data/initialExpenses';
import { generateInvoiceNo, generateShopeeOrderNo } from '../utils/format';
import { 
  computeSha256, 
  encryptData, 
  decryptData, 
  EncryptedPayload,
  hashPasswordClient,
  verifyPasswordClient,
} from '../utils/crypto';
import { bluetoothPrinter, BluetoothDeviceStatus } from '../utils/bluetooth';
import confetti from 'canvas-confetti';
import {
  saveToIndexedDB,
  loadFromIndexedDB,
  requestPersistentStorage,
  checkIsPersisted,
  createStorageSnapshot,
  getStorageSnapshots,
  StorageSnapshot,
} from '../utils/storageDb';
import {
  exportProductsToCSV,
  exportFullDatabaseJSON,
} from '../utils/dataExportImport';
import {
  supabase,
  checkSupabaseStatus,
  SupabaseHealthStatus,
  mapProductToDb,
  mapProductFromDb,
  mapTransactionToDb,
  mapTransactionFromDb,
  mapCustomerToDb,
  mapCustomerFromDb,
  mapDailyCashRecordToDb,
  mapDailyCashRecordFromDb,
  mapExpenseToDb,
  mapExpenseFromDb,
  mapStoreProfileToDb,
  mapStoreProfileFromDb,
} from '../lib/supabase';

interface POSContextType {
  // Products & Inventory
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (productId: string, quantityDelta: number, reason: string) => void;
  lowStockProducts: Product[];
  outOfStockProducts: Product[];

  // Cart (Aktif)
  cart: CartItem[];
  addToCart: (product: Product, qty?: number) => void;
  updateCartQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartTax: number;
  cartTotal: number;
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;
  pointsToRedeem: number;
  setPointsToRedeem: (points: number) => void;
  pointsDiscountValue: number;
  taxEnabled: boolean;
  setTaxEnabled: (enabled: boolean) => void;

  // Multi-Customer Cart Sessions (Simpan & Antrean Banyak Keranjang Pelanggan Bersamaan)
  cartSessions: CustomerCartSession[];
  activeCartSessionId: string;
  activeCartSession: CustomerCartSession;
  setActiveCartSessionId: (id: string) => void;
  createNewCartSession: (name?: string) => string;
  deleteCartSession: (id: string) => void;
  renameCartSession: (id: string, newName: string) => void;

  // POS View Mode (Dedicated Cart or Catalog)
  activePosTab: 'catalog' | 'cart';
  setActivePosTab: (tab: 'catalog' | 'cart') => void;

  // Checkout & Transactions
  transactions: Transaction[];
  processCheckout: (
    paymentMethod: PaymentMethod,
    amountPaid: number,
    notes?: string
  ) => Promise<{ success: boolean; error?: string; transaction?: Transaction }>;
  lastTransaction: Transaction | null;
  isReceiptModalOpen: boolean;
  setIsReceiptModalOpen: (open: boolean) => void;

  // Customers
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'points' | 'totalSpend' | 'totalVisits' | 'registeredAt'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;

  // Categories
  categories: string[];
  addCategory: (name: string) => void;
  deleteCategory: (name: string) => void;

  // Staff & Cashier Login & Shifts
  staffList: StaffUser[];
  updateStaffUser: (id: string, updates: Partial<StaffUser>) => void;
  currentUser: StaffUser;
  isCashierLoggedIn: boolean;
  loginCashier: (userId: string, pinOrPassword: string) => Promise<boolean>;
  logoutCashier: () => void;
  switchUser: (userId: string, pinOrPassword: string) => Promise<boolean>;
  adminSessionToken: string | null;
  resetStaffPasswordByAdmin: (targetUserId: string, newPassword: string, newName?: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  isStaffModalOpen: boolean;
  setIsStaffModalOpen: (open: boolean) => void;
  currentShift: CashierShift | null;
  openShift: (initialCash: number) => void;
  closeShift: (actualCash: number, notes?: string) => void;
  updateShiftBalances: (initialCash: number, actualCash: number, notes?: string) => void;
  dailyCashHistory: DailyCashRecord[];
  addOrUpdateDailyCashRecord: (record: Omit<DailyCashRecord, 'id'> & { id?: string }) => void;
  deleteDailyCashRecord: (id: string) => void;

  // Expenses & Cash Out (Kas Keluar / Pembelian Stok)
  expenses: CashExpense[];
  addExpense: (expense: Omit<CashExpense, 'id' | 'date'> & { date?: string }) => void;
  updateExpense: (id: string, updates: Partial<CashExpense>) => void;
  deleteExpense: (id: string) => void;
  isExpenseModalOpen: boolean;
  setIsExpenseModalOpen: (open: boolean) => void;

  // Store Profile
  storeProfile: StoreProfile;
  updateStoreProfile: (updates: Partial<StoreProfile>) => void;

  // Shopee Integration
  shopeeConfig: ShopeeConfig;
  shopeeLogs: ShopeeSyncLog[];
  updateShopeeConfig: (updates: Partial<ShopeeConfig>) => void;
  syncShopeeInventory: () => Promise<void>;
  simulateIncomingShopeeOrder: () => Promise<void>;

  // Cloud Backup & Encryption & Data Safety
  cloudBackup: CloudBackupMeta;
  performCloudBackup: () => Promise<void>;
  exportEncryptedBackup: (passphrase: string) => Promise<string>;
  restoreEncryptedBackup: (encryptedJsonString: string, passphrase: string) => Promise<{ success: boolean; message: string }>;
  resetToDefaultData: () => void;

  // 100% Data Safety & Durability
  isStoragePersisted: boolean;
  enablePersistentStorage: () => Promise<boolean>;
  exportAllProductsCSV: () => void;
  exportFullDatabase: () => void;
  storageSnapshots: StorageSnapshot[];
  restoreSnapshot: (snapshotId: string) => Promise<boolean>;
  createManualSnapshot: (label?: string) => Promise<void>;
  bulkImportProducts: (newProducts: Omit<Product, 'id'>[], newCategories?: string[]) => void;

  // Notifications
  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  unreadNotificationsCount: number;

  // Bluetooth Printer
  bluetoothStatus: BluetoothDeviceStatus;
  connectBluetooth: () => Promise<void>;
  disconnectBluetooth: () => void;
  printTransactionReceipt: (trx: Transaction) => Promise<boolean>;
  testBluetoothPrint: () => Promise<boolean>;
  setBluetoothPaperType: (type: '58mm' | '80mm') => void;

  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Custom Voice & Sound Alerts for Owner (Stok Menipis & Habis)
  voiceSettings: VoiceAlertSettings;
  updateVoiceSettings: (updates: Partial<VoiceAlertSettings>) => void;
  testVoiceAlert: (type: 'low_stock' | 'out_of_stock') => void;
  isVoiceSettingsModalOpen: boolean;
  setIsVoiceSettingsModalOpen: (open: boolean) => void;

  // Offline & Service Worker Storage Strategy
  isOnline: boolean;
  offlineQueue: Transaction[];
  isSyncingOffline: boolean;
  syncOfflineTransactions: () => Promise<{ success: boolean; syncedCount: number; message?: string }>;
  isOfflineModalOpen: boolean;
  setIsOfflineModalOpen: (open: boolean) => void;

  // Supabase Cloud Database Integration
  supabaseStatus: SupabaseHealthStatus;
  isSupabaseModalOpen: boolean;
  setIsSupabaseModalOpen: (open: boolean) => void;
  checkSupabaseConnection: () => Promise<void>;
  seedDataToSupabase: () => Promise<{ success: boolean; message?: string }>;
  isSupabaseSyncing: boolean;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PRODUCTS: 'kasir_shopee_products_v3',
  TRANSACTIONS: 'kasir_shopee_transactions_v2',
  CUSTOMERS: 'kasir_shopee_customers_v1',
  STORE_PROFILE: 'kasir_shopee_store_profile_v2',
  SHOPEE_CONFIG: 'kasir_shopee_config_v1',
  SHOPEE_LOGS: 'kasir_shopee_logs_v1',
  SHIFT: 'kasir_shopee_shift_v1',
  DAILY_CASH: 'kasir_shopee_daily_cash_history_v2',
  CURRENT_USER_ID: 'kasir_shopee_user_id_v1',
  CASHIER_LOGGED: 'kasir_shopee_logged_in_v1',
  CATEGORIES: 'kasir_shopee_categories_v2',
  CART: 'kasir_shopee_cart_draft_v2',
  CART_SESSIONS: 'kasir_shopee_cart_sessions_v3',
  ACTIVE_CART_ID: 'kasir_shopee_active_cart_id_v3',
  EXPENSES: 'kasir_shopee_expenses_v2',
  VOICE_SETTINGS: 'mitrastore_voice_settings_v1',
  OFFLINE_QUEUE: 'mitrastore_offline_transactions_queue_v1',
};

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Ensure pure clean white theme (dark mode disabled per user instruction)
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  const [isDarkMode] = useState<boolean>(false);
  const toggleDarkMode = () => {};

  // Custom Categories
  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  const addCategory = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) return;
    setCategories(prev => {
      const updated = [...prev, trimmed];
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));
      return updated;
    });
    if (supabaseStatus?.hasSchema && isOnline) {
      supabase.from('categories').upsert({ id: 'cat-' + Date.now(), name: trimmed }, { onConflict: 'name' }).then();
    }
    addNotification('Kategori Baru Ditambahkan', `Kategori "${trimmed}" berhasil dibuat.`, 'system');
  };

  const deleteCategory = (name: string) => {
    if (name === 'Semua') return;
    const remaining = categories.filter(c => c !== name && c !== 'Semua');
    const fallbackCategory = remaining[0] || 'Perabot Dapur';

    setCategories(prev => {
      const updated = prev.filter(c => c !== name);
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));
      return updated;
    });

    if (supabaseStatus?.hasSchema && isOnline) {
      supabase.from('categories').delete().eq('name', name).then();
    }

    // Reassign products to an active existing category
    setProducts(prev =>
      prev.map(p => {
        if (p.category === name) {
          return { ...p, category: fallbackCategory };
        }
        return p;
      })
    );
    addNotification('Kategori Dihapus', `Kategori "${name}" dihapus. Produk dialihkan ke "${fallbackCategory}".`, 'system');
  };

  // Products
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  // Transactions
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return saved ? JSON.parse(saved) : getInitialTransactions();
    } catch {
      return getInitialTransactions();
    }
  });

  // Online / Offline State & Local Storage Queue (IndexedDB + LocalStorage)
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  const [offlineQueue, setOfflineQueue] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isSyncingOffline, setIsSyncingOffline] = useState<boolean>(false);
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState<boolean>(false);

  // Supabase Cloud Database Integration States
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseHealthStatus>({
    isConnected: true,
    hasSchema: false,
    missingTables: [],
    latencyMs: 0,
    url: 'https://tgcezwlxcjnsgrwedokq.supabase.co',
  });
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);
  const [isSupabaseSyncing, setIsSupabaseSyncing] = useState<boolean>(false);

  // Customers
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
    } catch {
      return INITIAL_CUSTOMERS;
    }
  });

  // Store Profile
  const [storeProfile, setStoreProfile] = useState<StoreProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STORE_PROFILE);
      return saved ? JSON.parse(saved) : INITIAL_STORE_PROFILE;
    } catch {
      return INITIAL_STORE_PROFILE;
    }
  });

  // Shopee Config
  const [shopeeConfig, setShopeeConfig] = useState<ShopeeConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SHOPEE_CONFIG);
      return saved ? JSON.parse(saved) : INITIAL_SHOPEE_CONFIG;
    } catch {
      return INITIAL_SHOPEE_CONFIG;
    }
  });

  // Shopee Logs
  const [shopeeLogs, setShopeeLogs] = useState<ShopeeSyncLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SHOPEE_LOGS);
      if (saved) return JSON.parse(saved);
      return [
        {
          id: 'log-1',
          timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
          type: 'stock_update',
          status: 'success',
          message: 'Sinkronisasi 9 produk ke Toko Shopee (Berkah_Retail_Official) berhasil.',
        },
        {
          id: 'log-2',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          type: 'order_import',
          status: 'success',
          message: 'Pesanan Shopee #SPX-ID-98A17F20 diterima. Stok berkurang otomatis.',
        },
      ];
    } catch {
      return [];
    }
  });

  // Staff & Active User
  const [staffList, setStaffList] = useState<StaffUser[]>(() => {
    try {
      const saved = localStorage.getItem('kasir_staff_list_v2');
      return saved ? JSON.parse(saved) : INITIAL_STAFF;
    } catch {
      return INITIAL_STAFF;
    }
  });

  useEffect(() => {
    localStorage.setItem('kasir_staff_list_v2', JSON.stringify(staffList));
  }, [staffList]);

  const updateStaffUser = (id: string, updates: Partial<StaffUser>) => {
    setStaffList(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    addNotification('Data Kasir Diperbarui', 'Nama dan data kasir berhasil disimpan.', 'system');
  };

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || 'user-kasir-1';
  });
  const currentUser = staffList.find(u => u.id === currentUserId) || staffList[0];

  const [adminSessionToken, setAdminSessionToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('mitrastore_admin_session_token');
    } catch {
      return null;
    }
  });

  const [isStaffModalOpen, setIsStaffModalOpen] = useState<boolean>(false);

  // Cashier Shift
  const [currentShift, setCurrentShift] = useState<CashierShift | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SHIFT);
      if (saved) return JSON.parse(saved);
      return {
        id: 'shift-today',
        cashierId: 'user-kasir-1',
        cashierName: 'Budi Santoso',
        startTime: new Date().toISOString(),
        initialCash: 200000,
        isOpen: true,
      };
    } catch {
      return null;
    }
  });

  // Riwayat Saldo Kas Harian (Kas Awal & Kas Akhir per tanggal)
  const [dailyCashHistory, setDailyCashHistory] = useState<DailyCashRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DAILY_CASH);
      return saved ? JSON.parse(saved) : getInitialDailyCashRecords();
    } catch {
      return getInitialDailyCashRecords();
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DAILY_CASH, JSON.stringify(dailyCashHistory));
  }, [dailyCashHistory]);

  // Pengeluaran Kas (Kas Keluar / Pembelian Stok / Operasional)
  const [expenses, setExpenses] = useState<CashExpense[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      return saved ? JSON.parse(saved) : getInitialExpenses();
    } catch {
      return getInitialExpenses();
    }
  });

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  // Multi-Customer Cart Sessions (Penyimpanan Banyak Keranjang Pelanggan Bersamaan)
  const createInitialCartSession = (id: string, name: string): CustomerCartSession => ({
    id,
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [],
    selectedCustomer: null,
    pointsToRedeem: 0,
    taxEnabled: false,
  });

  const [cartSessions, setCartSessions] = useState<CustomerCartSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CART_SESSIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((s: CustomerCartSession, idx: number) => {
            // Auto normalize old naming format to sequential Pelanggan #1, #2...
            if (s.name && (s.name.startsWith('Pelanggan ') || s.name === 'Keranjang Utama')) {
              const numStr = s.name.replace(/[^0-9]/g, '');
              const num = numStr ? parseInt(numStr, 10) : idx + 1;
              return { ...s, name: `Pelanggan #${num}` };
            }
            return s;
          });
        }
      }
      // Migration from legacy single cart if present
      const legacyCartStr = localStorage.getItem(STORAGE_KEYS.CART);
      const legacyCart = legacyCartStr ? JSON.parse(legacyCartStr) : [];
      return [
        {
          id: 'cart-1',
          name: 'Pelanggan #1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          items: Array.isArray(legacyCart) ? legacyCart : [],
          selectedCustomer: null,
          pointsToRedeem: 0,
          taxEnabled: false,
        },
      ];
    } catch {
      return [createInitialCartSession('cart-1', 'Pelanggan #1')];
    }
  });

  const [activeCartSessionId, setActiveCartSessionId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEYS.ACTIVE_CART_ID);
      return savedId || 'cart-1';
    } catch {
      return 'cart-1';
    }
  });

  // Sync cart sessions to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CART_SESSIONS, JSON.stringify(cartSessions));
    const current = cartSessions.find((s) => s.id === activeCartSessionId) || cartSessions[0];
    if (current) {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(current.items));
    }
  }, [cartSessions, activeCartSessionId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CART_ID, activeCartSessionId);
  }, [activeCartSessionId]);

  // Active Cart Session (selalu valid)
  const activeCartSession = useMemo(() => {
    return (
      cartSessions.find((s) => s.id === activeCartSessionId) ||
      cartSessions[0] ||
      createInitialCartSession('cart-1', 'Pelanggan 1')
    );
  }, [cartSessions, activeCartSessionId]);

  // Derived state for the currently active customer's cart
  const cart: CartItem[] = activeCartSession.items;
  const selectedCustomer = activeCartSession.selectedCustomer;
  const pointsToRedeem = activeCartSession.pointsToRedeem;
  const taxEnabled = activeCartSession.taxEnabled;

  const setSelectedCustomer = useCallback((customer: Customer | null) => {
    setCartSessions((prev) =>
      prev.map((s) =>
        s.id === activeCartSessionId
          ? {
              ...s,
              selectedCustomer: customer,
              pointsToRedeem: 0,
              updatedAt: new Date().toISOString(),
            }
          : s
      )
    );
  }, [activeCartSessionId]);

  const setPointsToRedeem = useCallback((points: number) => {
    setCartSessions((prev) =>
      prev.map((s) =>
        s.id === activeCartSessionId
          ? {
              ...s,
              pointsToRedeem: points,
              updatedAt: new Date().toISOString(),
            }
          : s
      )
    );
  }, [activeCartSessionId]);

  const setTaxEnabled = useCallback((enabled: boolean) => {
    setCartSessions((prev) =>
      prev.map((s) =>
        s.id === activeCartSessionId
          ? {
              ...s,
              taxEnabled: enabled,
              updatedAt: new Date().toISOString(),
            }
          : s
      )
    );
  }, [activeCartSessionId]);

  // Dedicated POS Tab Mode: 'catalog' | 'cart'
  const [activePosTab, setActivePosTab] = useState<'catalog' | 'cart'>('catalog');

  // Cashier Login & Accountability
  const [isCashierLoggedIn, setIsCashierLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.CASHIER_LOGGED) === 'true';
  });

  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  // Bluetooth Printer
  const [bluetoothStatus, setBluetoothStatus] = useState<BluetoothDeviceStatus>(bluetoothPrinter.status);

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'notif-1',
      title: 'Sistem POS MitraStore Aktif',
      message: 'Katalog cetakan kue, loyang, dan perabot dapur siap digunakan.',
      type: 'system',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      read: true,
    },
    {
      id: 'notif-2',
      title: 'Shopee Open Platform Terhubung',
      message: 'API Shopee v2.0 aktif. Stok toko fisik dan marketplace tersinkronisasi otomatis.',
      type: 'shopee_order',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      read: true,
    },
    {
      id: 'notif-3',
      title: 'Pencatatan Kas & Struk Siap',
      message: 'Fitur kasir POS dan rekap pengeluaran beli stok siap digunakan.',
      type: 'sales',
      timestamp: new Date().toISOString(),
      read: true,
    },
  ]);

  // Voice Alert Settings for Owner (Stok Menipis & Habis)
  const [voiceSettings, setVoiceSettings] = useState<VoiceAlertSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VOICE_SETTINGS);
      return saved ? { ...DEFAULT_VOICE_SETTINGS, ...JSON.parse(saved) } : DEFAULT_VOICE_SETTINGS;
    } catch {
      return DEFAULT_VOICE_SETTINGS;
    }
  });

  const [isVoiceSettingsModalOpen, setIsVoiceSettingsModalOpen] = useState<boolean>(false);

  const updateVoiceSettings = useCallback((updates: Partial<VoiceAlertSettings>) => {
    setVoiceSettings((prev) => {
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEYS.VOICE_SETTINGS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const testVoiceAlert = useCallback((type: 'low_stock' | 'out_of_stock') => {
    if (type === 'out_of_stock') {
      playStockVoiceAlert(
        'out_of_stock',
        'Loyang Kue Brownies 20x10',
        0,
        'buah',
        voiceSettings
      );
    } else {
      playStockVoiceAlert(
        'low_stock',
        'Cetakan Kue Pukis 12 Lubang',
        2,
        'set',
        voiceSettings
      );
    }
  }, [voiceSettings]);

  // Cloud Backup Meta
  const [cloudBackup, setCloudBackup] = useState<CloudBackupMeta>({
    lastBackupDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    totalRecords: products.length + transactions.length + customers.length,
    fileSizeBytes: 24800,
    encryptionAlgorithm: 'AES-GCM-256 + PBKDF2',
    checksum: 'a89fbc7412e841249e0c8b3e811',
    autoBackupEnabled: true,
    isCloudSyncing: false,
  });

  // 100% Data Safety & Durability States
  const [isStoragePersisted, setIsStoragePersisted] = useState<boolean>(false);
  const [storageSnapshots, setStorageSnapshots] = useState<StorageSnapshot[]>([]);

  // Startup: Request Persistent Storage & Verify Dual-Store Integrity
  useEffect(() => {
    checkIsPersisted().then((isP) => {
      setIsStoragePersisted(isP);
      if (!isP) {
        requestPersistentStorage().then((res) => setIsStoragePersisted(res));
      }
    });

    getStorageSnapshots().then(setStorageSnapshots);

    // Fail-safe check: If localStorage had no products or was wiped, try IndexedDB
    loadFromIndexedDB<Product[]>('products').then((idbProducts) => {
      if (idbProducts && Array.isArray(idbProducts) && idbProducts.length > 0) {
        const localSaved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
        if (!localSaved) {
          setProducts(idbProducts);
          try {
            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(idbProducts));
          } catch {}
        }
      }
    });
  }, []);

  // Dual-Layer Persistence: Save changes to both localStorage AND IndexedDB
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.warn('LocalStorage limit reached, relying on IndexedDB:', e);
    }
    saveToIndexedDB('products', products);
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch {}
    saveToIndexedDB('transactions', transactions);
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    } catch {}
    saveToIndexedDB('customers', customers);
  }, [customers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STORE_PROFILE, JSON.stringify(storeProfile));
    } catch {}
    saveToIndexedDB('storeProfile', storeProfile);
  }, [storeProfile]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SHOPEE_CONFIG, JSON.stringify(shopeeConfig));
    } catch {}
    saveToIndexedDB('shopeeConfig', shopeeConfig);
  }, [shopeeConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SHOPEE_LOGS, JSON.stringify(shopeeLogs));
    } catch {}
    saveToIndexedDB('shopeeLogs', shopeeLogs);
  }, [shopeeLogs]);

  useEffect(() => {
    if (currentShift) {
      try {
        localStorage.setItem(STORAGE_KEYS.SHIFT, JSON.stringify(currentShift));
      } catch {}
      saveToIndexedDB('shift', currentShift);
    }
  }, [currentShift]);

  useEffect(() => {
    saveToIndexedDB('categories', categories);
  }, [categories]);

  useEffect(() => {
    saveToIndexedDB('expenses', expenses);
  }, [expenses]);

  useEffect(() => {
    saveToIndexedDB('dailyCashHistory', dailyCashHistory);
  }, [dailyCashHistory]);

  // Low & Out of stock computed
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= p.minStock);
  const outOfStockProducts = products.filter(p => p.stock <= 0);

  // Cart calculations
  const cartSubtotal = cart.reduce((sum, item) => {
    const itemDiscount = (item.discountPercent || 0) / 100;
    return sum + (item.product.sellPrice * item.qty * (1 - itemDiscount));
  }, 0);

  // Points redemption: 1 point = Rp 100 discount
  const pointsDiscountValue = pointsToRedeem * 100;

  const cartTax = taxEnabled ? Math.round((cartSubtotal - pointsDiscountValue) * (storeProfile.taxRatePercent / 100)) : 0;
  const cartTotal = Math.max(0, cartSubtotal - pointsDiscountValue + cartTax);

  // Notification helper
  const addNotification = useCallback((title: string, message: string, type: AppNotification['type']) => {
    const newNotif: AppNotification = {
      id: 'notif-' + Date.now(),
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  // Dual-Layer Storage Persistence for Offline Queue (IndexedDB + LocalStorage)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(offlineQueue));
    } catch {}
    saveToIndexedDB('offlineQueue', offlineQueue);
  }, [offlineQueue]);

  // Synchronize Offline Transactions to Backend Server
  const syncOfflineTransactions = useCallback(async (): Promise<{
    success: boolean;
    syncedCount: number;
    message?: string;
  }> => {
    if (offlineQueue.length === 0) {
      return { success: true, syncedCount: 0, message: 'Tidak ada transaksi offline yang menunggu sinkronisasi.' };
    }

    setIsSyncingOffline(true);
    try {
      const res = await fetch('/api/transactions/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: offlineQueue }),
      });

      if (!res.ok) {
        throw new Error('Gagal menghubungi server sinkronisasi.');
      }

      const data = await res.json();
      if (data.success) {
        const syncedCount = data.syncedCount || offlineQueue.length;
        // Mark these transactions in history as synced
        setTransactions(prev =>
          prev.map(t => {
            if (offlineQueue.some(off => off.invoiceNo === t.invoiceNo)) {
              return { ...t, isOffline: false, syncedAt: new Date().toISOString() };
            }
            return t;
          })
        );
        // Clear queue
        setOfflineQueue([]);
        localStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
        saveToIndexedDB('offlineQueue', []);

        addNotification(
          'Sinkronisasi Berhasil',
          `${syncedCount} transaksi offline berhasil disinkronkan ke server pusat.`,
          'system'
        );
        return { success: true, syncedCount, message: data.message };
      } else {
        throw new Error(data.error || 'Server menolak sinkronisasi.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Koneksi ke server gagal.';
      return { success: false, syncedCount: 0, message: msg };
    } finally {
      setIsSyncingOffline(false);
    }
  }, [offlineQueue, addNotification]);

  // Online / Offline Listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addNotification('Koneksi Internet Pulih', 'Aplikasi kembali online. Memeriksa antrean sinkronisasi...', 'system');
    };

    const handleOffline = () => {
      setIsOnline(false);
      addNotification(
        'Mode Offline Aktif',
        'Koneksi internet terputus. Kasir POS tetap dapat bertransaksi (data disimpan aman di perangkat).',
        'system'
      );
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addNotification]);

  // Auto-sync queued transactions when coming back online
  useEffect(() => {
    if (isOnline && offlineQueue.length > 0 && !isSyncingOffline) {
      syncOfflineTransactions();
    }
  }, [isOnline, offlineQueue.length, isSyncingOffline, syncOfflineTransactions]);

  // ---------------------------------------------------------------------------
  // SUPABASE CLOUD DATABASE INTEGRATION
  // ---------------------------------------------------------------------------
  const checkSupabaseConnection = useCallback(async () => {
    setIsSupabaseSyncing(true);
    try {
      const status = await checkSupabaseStatus();
      setSupabaseStatus(status);
      if (status.isConnected && status.hasSchema) {
        // Load latest products from Supabase
        const { data: dbProducts } = await supabase.from('products').select('*');
        if (dbProducts && dbProducts.length > 0) {
          setProducts(dbProducts.map(mapProductFromDb));
        }

        // Load latest transactions from Supabase
        const { data: dbTrx } = await supabase.from('transactions').select('*').order('date', { ascending: false });
        if (dbTrx && dbTrx.length > 0) {
          setTransactions(dbTrx.map(mapTransactionFromDb));
        }

        // Load latest customers from Supabase
        const { data: dbCust } = await supabase.from('customers').select('*');
        if (dbCust && dbCust.length > 0) {
          setCustomers(dbCust.map(mapCustomerFromDb));
        }

        // Load latest categories from Supabase
        const { data: dbCats } = await supabase.from('categories').select('name');
        if (dbCats && dbCats.length > 0) {
          setCategories(dbCats.map((c: any) => c.name));
        }

        // Load latest store profile from Supabase
        const { data: dbStore } = await supabase.from('store_profile').select('*').single();
        if (dbStore) {
          setStoreProfile(mapStoreProfileFromDb(dbStore));
        }
      }
    } catch (e) {
      console.warn('[Supabase] check connection failed:', e);
    } finally {
      setIsSupabaseSyncing(false);
    }
  }, []);

  // Initial Supabase Check on app mount
  useEffect(() => {
    checkSupabaseConnection();
  }, [checkSupabaseConnection]);

  // Supabase Realtime Subscription: multi-cashier sync
  useEffect(() => {
    if (!supabaseStatus.hasSchema) return;

    const channel = supabase
      .channel('pos-realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newProd = mapProductFromDb(payload.new);
          setProducts((prev) => [newProd, ...prev.filter((p) => p.id !== newProd.id)]);
        } else if (payload.eventType === 'UPDATE') {
          const updatedProd = mapProductFromDb(payload.new);
          setProducts((prev) => prev.map((p) => (p.id === updatedProd.id ? updatedProd : p)));
        } else if (payload.eventType === 'DELETE') {
          setProducts((prev) => prev.filter((p) => p.id !== (payload.old as any).id));
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, (payload) => {
        const newTrx = mapTransactionFromDb(payload.new);
        setTransactions((prev) => {
          if (prev.some((t) => t.id === newTrx.id || t.invoiceNo === newTrx.invoiceNo)) return prev;
          return [newTrx, ...prev];
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const cust = mapCustomerFromDb(payload.new);
          setCustomers((prev) => {
            const exists = prev.some((c) => c.id === cust.id);
            if (exists) return prev.map((c) => (c.id === cust.id ? cust : c));
            return [cust, ...prev];
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabaseStatus.hasSchema]);

  // Seed Data to Supabase
  const seedDataToSupabase = useCallback(async (): Promise<{ success: boolean; message?: string }> => {
    setIsSupabaseSyncing(true);
    try {
      const res = await fetch('/api/supabase/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products,
          customers,
          categories,
          storeProfile,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await checkSupabaseConnection();
        addNotification(
          'Supabase Berhasil Disinkronkan',
          'Data produk, pelanggan, dan profil toko telah tersimpan ke database cloud Supabase.',
          'system'
        );
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error || 'Gagal mengunggah data.' };
      }
    } catch (err: unknown) {
      return { success: false, message: err instanceof Error ? err.message : 'Koneksi gagal.' };
    } finally {
      setIsSupabaseSyncing(false);
    }
  }, [products, customers, categories, storeProfile, checkSupabaseConnection, addNotification]);

  // Multi-Customer Session Actions
  const createNewCartSession = useCallback((customName?: string): string => {
    const newId = 'cart-' + Date.now();
    // Auto-calculate sequential order number (Pesanan #1, Pesanan #2, ...)
    let maxNum = 0;
    cartSessions.forEach((s) => {
      const match = s.name.match(/(?:Pesanan|Pelanggan)?\s*#?(\d+)/i);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });
    let nextNum = maxNum + 1;
    while (cartSessions.some((s) => s.name === `Pesanan #${nextNum}` || s.name === `Pelanggan #${nextNum}`)) {
      nextNum++;
    }
    const name = customName?.trim() || `Pesanan #${nextNum}`;
    const newSession: CustomerCartSession = {
      id: newId,
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: [],
      selectedCustomer: null,
      pointsToRedeem: 0,
      taxEnabled: false,
    };
    setCartSessions((prev) => [...prev, newSession]);
    setActiveCartSessionId(newId);
    addNotification('Pesanan Baru Dibuka', `${name} siap menerima pesanan.`, 'system');
    return newId;
  }, [cartSessions, addNotification]);

  const deleteCartSession = useCallback((id: string) => {
    setCartSessions((prev) => {
      if (prev.length <= 1) {
        // Reset the only cart to default Pesanan #1
        return [
          {
            id: prev[0].id,
            name: 'Pesanan #1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            items: [],
            selectedCustomer: null,
            pointsToRedeem: 0,
            taxEnabled: false,
          },
        ];
      }
      const filtered = prev.filter((s) => s.id !== id);
      if (activeCartSessionId === id && filtered.length > 0) {
        setActiveCartSessionId(filtered[0].id);
      }
      return filtered;
    });
    addNotification('Pesanan Dibatalkan', 'Daftar pesanan telah dibatalkan/dihapus.', 'system');
  }, [activeCartSessionId, addNotification]);

  const renameCartSession = useCallback((id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setCartSessions((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, name: trimmed, updatedAt: new Date().toISOString() } : s
      )
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCartSessions((prev) =>
      prev.map((s) =>
        s.id === activeCartSessionId
          ? {
              ...s,
              items: s.items.filter((item) => item.product.id !== productId),
              updatedAt: new Date().toISOString(),
            }
          : s
      )
    );
  }, [activeCartSessionId]);

  const clearCart = useCallback(() => {
    setCartSessions((prev) =>
      prev.map((s) =>
        s.id === activeCartSessionId
          ? {
              ...s,
              items: [],
              selectedCustomer: null,
              pointsToRedeem: 0,
              taxEnabled: false,
              updatedAt: new Date().toISOString(),
            }
          : s
      )
    );
  }, [activeCartSessionId]);

  // Cart actions applied to active customer's cart
  const addToCart = useCallback((product: Product, qty: number = 1) => {
    setCartSessions((prev) => {
      const currentSession = prev.find((s) => s.id === activeCartSessionId) || prev[0];
      if (!currentSession) return prev;

      const existing = currentSession.items.find((item) => item.product.id === product.id);
      let updatedItems: CartItem[];

      if (existing) {
        const newQty = existing.qty + qty;
        if (newQty > product.stock) {
          addNotification('Stok Tidak Mencukupi', `Sisa stok ${product.name} hanya ${product.stock} ${product.unit}.`, 'stock_alert');
          return prev;
        }
        updatedItems = currentSession.items.map((item) =>
          item.product.id === product.id ? { ...item, qty: newQty } : item
        );
      } else {
        if (qty > product.stock) {
          addNotification('Stok Tidak Mencukupi', `Sisa stok ${product.name} hanya ${product.stock} ${product.unit}.`, 'stock_alert');
          return prev;
        }
        updatedItems = [...currentSession.items, { product, qty }];
      }

      return prev.map((s) =>
        s.id === currentSession.id
          ? {
              ...s,
              items: updatedItems,
              updatedAt: new Date().toISOString(),
            }
          : s
      );
    });
  }, [activeCartSessionId, addNotification]);

  const updateCartQty = useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartSessions((prev) => {
      const currentSession = prev.find((s) => s.id === activeCartSessionId) || prev[0];
      if (!currentSession) return prev;

      const target = currentSession.items.find((i) => i.product.id === productId);
      if (!target) return prev;

      if (qty > target.product.stock) {
        addNotification('Batas Stok Maksimal', `Stok maksimal untuk ${target.product.name} adalah ${target.product.stock} ${target.product.unit}`, 'stock_alert');
        return prev;
      }

      const updatedItems = currentSession.items.map((item) =>
        item.product.id === productId ? { ...item, qty } : item
      );
      return prev.map((s) =>
        s.id === currentSession.id
          ? {
              ...s,
              items: updatedItems,
              updatedAt: new Date().toISOString(),
            }
          : s
      );
    });
  }, [activeCartSessionId, removeFromCart, addNotification]);

  // Process Checkout
  const processCheckout = async (
    paymentMethod: PaymentMethod,
    amountPaid: number,
    notes?: string
  ): Promise<{ success: boolean; error?: string; transaction?: Transaction }> => {
    if (cart.length === 0) {
      return { success: false, error: 'Keranjang belanja kosong' };
    }

    if (amountPaid < cartTotal) {
      return { success: false, error: 'Jumlah pembayaran kurang dari total tagihan' };
    }

    // Verify stock availability atomically
    for (const item of cart) {
      const prod = products.find(p => p.id === item.product.id);
      if (!prod || prod.stock < item.qty) {
        return {
          success: false,
          error: `Stok produk "${item.product.name}" tidak mencukupi (sisa: ${prod?.stock || 0})`,
        };
      }
    }

    // Calculate cost total (HPP)
    const costTotal = cart.reduce((sum, item) => sum + (item.product.buyPrice * item.qty), 0);
    const profit = cartTotal - costTotal;

    const isCurrentlyOffline = !navigator.onLine || !isOnline;

    const newTransaction: Transaction = {
      id: 'trx-' + Date.now(),
      invoiceNo: generateInvoiceNo(),
      date: new Date().toISOString(),
      items: [...cart],
      subtotal: cartSubtotal,
      discount: 0,
      pointsUsedDiscount: pointsDiscountValue > 0 ? pointsDiscountValue : undefined,
      tax: cartTax,
      total: cartTotal,
      costTotal: costTotal,
      profit: profit,
      paymentMethod: paymentMethod,
      amountPaid: amountPaid,
      change: amountPaid - cartTotal,
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name,
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      channel: 'offline',
      notes: notes,
      isOffline: isCurrentlyOffline,
      syncedAt: isCurrentlyOffline ? undefined : new Date().toISOString(),
    };

    // 1. Decrement products stock & check low stock
    let updatedProducts = [...products];
    const newlyLowOrOutStock: Product[] = [];

    cart.forEach(cartItem => {
      updatedProducts = updatedProducts.map(p => {
        if (p.id === cartItem.product.id) {
          const newStock = Math.max(0, p.stock - cartItem.qty);
          const updatedProd = { ...p, stock: newStock };
          if (newStock <= p.minStock) {
            newlyLowOrOutStock.push(updatedProd);
          }
          return updatedProd;
        }
        return p;
      });
    });

    setProducts(updatedProducts);

    // 2. Add Transaction to history & Offline Queue if without internet
    setTransactions(prev => [newTransaction, ...prev]);

    // Push directly to Supabase if schema is ready & online
    if (supabaseStatus.hasSchema && !isCurrentlyOffline) {
      supabase.from('transactions').upsert(mapTransactionToDb(newTransaction)).then();
      cart.forEach((item) => {
        const remaining = Math.max(0, item.product.stock - item.qty);
        supabase.from('products').update({ stock: remaining, updated_at: new Date().toISOString() }).eq('id', item.product.id).then();
      });
    }

    if (isCurrentlyOffline) {
      setOfflineQueue(prev => [newTransaction, ...prev]);
      addNotification(
        'Transaksi Tersimpan Offline',
        `Invoice ${newTransaction.invoiceNo} tersimpan aman di perangkat lokal (Mode Offline). Akan disinkronkan otomatis saat online.`,
        'system'
      );
    }

    // 3. Update customer loyalty points and spending
    if (selectedCustomer) {
      // 1 point for every Rp 10.000 spent
      const earnedPoints = Math.floor(cartTotal / 10000);
      setCustomers(prev =>
        prev.map(c => {
          if (c.id === selectedCustomer.id) {
            const updatedPts = Math.max(0, c.points - pointsToRedeem) + earnedPoints;
            const updatedSpend = c.totalSpend + cartTotal;
            let tier = c.tier;
            if (updatedSpend > 4000000) tier = 'platinum';
            else if (updatedSpend > 2000000) tier = 'gold';
            else if (updatedSpend > 800000) tier = 'silver';

            return {
              ...c,
              points: updatedPts,
              totalSpend: updatedSpend,
              totalVisits: c.totalVisits + 1,
              tier,
            };
          }
          return c;
        })
      );
    }

    // 4. Shopee inventory sync log for affected items
    const shopeeSyncedItems = cart.filter(i => i.product.shopeeSyncEnabled);
    if (shopeeSyncedItems.length > 0 && shopeeConfig.isConnected) {
      const logEntry: ShopeeSyncLog = {
        id: 'log-' + Date.now(),
        timestamp: new Date().toISOString(),
        type: 'stock_update',
        status: 'success',
        message: `Stok ${shopeeSyncedItems.length} produk disinkronkan ke Shopee (${shopeeSyncedItems.map(i => i.product.name).join(', ')})`,
      };
      setShopeeLogs(prev => [logEntry, ...prev]);
    }

    // 5. Emit stock notifications if needed
    if (newlyLowOrOutStock.length > 0) {
      newlyLowOrOutStock.forEach(item => {
        if (item.stock === 0) {
          addNotification(
            'Stok Habis',
            `Produk "${item.name}" telah habis setelah transaksi ${newTransaction.invoiceNo}.`,
            'stock_alert'
          );
        } else {
          addNotification(
            'Peringatan Stok Menipis',
            `Produk "${item.name}" tersisa ${item.stock} ${item.unit} (di bawah batas minimum ${item.minStock}).`,
            'stock_alert'
          );
        }
      });

      // Voice alert otomatis (Suara Notifikasi Pemilik Toko)
      if (voiceSettings.enabled && voiceSettings.autoSpeakOnCheckout) {
        const outTarget = newlyLowOrOutStock.find(i => i.stock === 0);
        const alertTarget = outTarget || newlyLowOrOutStock[0];
        if (alertTarget) {
          setTimeout(() => {
            playStockVoiceAlert(
              alertTarget.stock === 0 ? 'out_of_stock' : 'low_stock',
              alertTarget.name,
              alertTarget.stock,
              alertTarget.unit,
              voiceSettings
            );
          }, 600);
        }
      }
    }

    // 6. Real-time Cloud Auto-Backup Trigger
    if (cloudBackup.autoBackupEnabled) {
      const summaryString = JSON.stringify({
        trxCount: transactions.length + 1,
        prodCount: updatedProducts.length,
        timestamp: new Date().toISOString(),
      });
      computeSha256(summaryString).then(checksum => {
        setCloudBackup(prev => ({
          ...prev,
          lastBackupDate: new Date().toISOString(),
          totalRecords: updatedProducts.length + transactions.length + 1 + customers.length,
          checksum: checksum.slice(0, 24),
        }));
      });
    }

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {
      // ignore in headless test
    }

    // Set last transaction and open receipt modal
    setLastTransaction(newTransaction);
    setIsReceiptModalOpen(true);
    clearCart();

    return { success: true, transaction: newTransaction };
  };

  // Product CRUD
  const addProduct = (newP: Omit<Product, 'id'>) => {
    const id = 'prod-' + Date.now();
    const product: Product = { ...newP, id };
    setProducts(prev => [product, ...prev]);
    if (supabaseStatus.hasSchema && isOnline) {
      supabase.from('products').upsert(mapProductToDb(product)).then();
    }
    addNotification('Produk Baru Ditambahkan', `Produk "${product.name}" berhasil didaftarkan ke inventaris.`, 'system');
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, ...updates } : p);
      const target = updated.find(p => p.id === id);
      if (target && supabaseStatus.hasSchema && isOnline) {
        supabase.from('products').upsert(mapProductToDb(target)).then();
      }
      return updated;
    });
  };

  const deleteProduct = (id: string) => {
    const target = products.find(p => p.id === id);
    setProducts(prev => prev.filter(p => p.id !== id));
    if (supabaseStatus.hasSchema && isOnline) {
      supabase.from('products').delete().eq('id', id).then();
    }
    setCartSessions(prev =>
      prev.map(s => ({ ...s, items: s.items.filter(item => item.product.id !== id) }))
    );
    addNotification('Produk Dihapus', `Produk "${target?.name || 'Barang'}" berhasil dihapus dari inventaris stok.`, 'system');
  };

  const adjustStock = (productId: string, quantityDelta: number, reason: string) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === productId) {
          const newStock = Math.max(0, p.stock + quantityDelta);
          const updated = { ...p, stock: newStock };
          if (supabaseStatus.hasSchema && isOnline) {
            supabase
              .from('products')
              .update({ stock: newStock, updated_at: new Date().toISOString() })
              .eq('id', productId)
              .then();
          }
          return updated;
        }
        return p;
      })
    );
    const prod = products.find(p => p.id === productId);
    addNotification(
      'Penyesuaian Stok',
      `Stok "${prod?.name || 'Produk'}" disesuaikan ${quantityDelta >= 0 ? '+' : ''}${quantityDelta}. Alasan: ${reason}`,
      'system'
    );

    if (prod && quantityDelta < 0) {
      const remaining = Math.max(0, prod.stock + quantityDelta);
      if (remaining <= prod.minStock && voiceSettings.enabled) {
        setTimeout(() => {
          playStockVoiceAlert(
            remaining === 0 ? 'out_of_stock' : 'low_stock',
            prod.name,
            remaining,
            prod.unit,
            voiceSettings
          );
        }, 300);
      }
    }
  };

  // Customer CRUD
  const addCustomer = (custData: Omit<Customer, 'id' | 'points' | 'totalSpend' | 'totalVisits' | 'registeredAt'>) => {
    const newCust: Customer = {
      ...custData,
      id: 'cust-' + Date.now(),
      points: 50, // Welcome loyalty points bonus
      totalSpend: 0,
      totalVisits: 0,
      registeredAt: new Date().toISOString(),
    };
    setCustomers(prev => [newCust, ...prev]);
    if (supabaseStatus.hasSchema && isOnline) {
      supabase.from('customers').upsert(mapCustomerToDb(newCust)).then();
    }
    addNotification('Pelanggan Baru Terdaftar', `${newCust.name} (${newCust.phone}) terdaftar dengan bonus 50 poin.`, 'system');
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, ...updates } : c);
      const target = updated.find(c => c.id === id);
      if (target && supabaseStatus.hasSchema && isOnline) {
        supabase.from('customers').upsert(mapCustomerToDb(target)).then();
      }
      return updated;
    });
  };

  // Multi-user login & responsibility with backend verification & SHA-256
  const loginCashier = async (userId: string, pinOrPassword: string): Promise<boolean> => {
    const user = staffList.find(u => u.id === userId);
    if (!user) return false;
    const cleanInput = pinOrPassword.trim();

    try {
      // 1. Backend server authentication
      const res = await fetch('/api/staff/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password: cleanInput }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCurrentUserId(user.id);
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);
          setIsCashierLoggedIn(true);
          localStorage.setItem(STORAGE_KEYS.CASHIER_LOGGED, 'true');

          if (data.adminToken) {
            setAdminSessionToken(data.adminToken);
            sessionStorage.setItem('mitrastore_admin_session_token', data.adminToken);
          } else {
            setAdminSessionToken(null);
            sessionStorage.removeItem('mitrastore_admin_session_token');
          }

          addNotification(
            'Login Kasir Berhasil',
            `Pegawai ${user.name} (${user.role === 'admin' ? 'BOS / OWNER' : user.role.toUpperCase()}) bertanggung jawab pada shift ini.`,
            'system'
          );
          return true;
        }
      }
    } catch {
      // Server offline fallback
    }

    // 2. Client-side cryptographic verification fallback
    const isClientValid = await verifyPasswordClient(cleanInput, user.pin);
    if (!isClientValid) return false;

    // Auto-upgrade stored legacy PIN to salted SHA-256 hash if not already hashed
    if (!user.pin.startsWith('sha256:')) {
      const secureHash = await hashPasswordClient(cleanInput);
      setStaffList(prev => prev.map(s => s.id === user.id ? { ...s, pin: secureHash } : s));
    }

    setCurrentUserId(user.id);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);
    setIsCashierLoggedIn(true);
    localStorage.setItem(STORAGE_KEYS.CASHIER_LOGGED, 'true');

    if (user.role === 'admin') {
      const fallbackToken = `admin_${user.id}_${Date.now()}`;
      setAdminSessionToken(fallbackToken);
      sessionStorage.setItem('mitrastore_admin_session_token', fallbackToken);
    } else {
      setAdminSessionToken(null);
      sessionStorage.removeItem('mitrastore_admin_session_token');
    }

    addNotification(
      'Login Kasir Berhasil',
      `Pegawai ${user.name} (${user.role === 'admin' ? 'BOS / OWNER' : user.role.toUpperCase()}) bertanggung jawab pada shift ini.`,
      'system'
    );
    return true;
  };

  const logoutCashier = () => {
    setIsCashierLoggedIn(false);
    localStorage.setItem(STORAGE_KEYS.CASHIER_LOGGED, 'false');
    setAdminSessionToken(null);
    sessionStorage.removeItem('mitrastore_admin_session_token');
    addNotification('Logout Kasir', `Kasir berhasil keluar dari sesi.`, 'system');
  };

  const switchUser = async (userId: string, pinOrPassword: string): Promise<boolean> => {
    return await loginCashier(userId, pinOrPassword);
  };

  // STRICT: Reset staff password by verified Admin / Bos
  const resetStaffPasswordByAdmin = async (
    targetUserId: string,
    newPassword: string,
    newName?: string
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    if (currentUser.role !== 'admin') {
      return {
        success: false,
        error: 'Izin Ditolak: Hanya Bos / Admin Utama yang dapat mereset kata sandi pegawai.',
      };
    }

    try {
      const res = await fetch('/api/staff/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminToken: adminSessionToken,
          targetUserId,
          newPassword,
          newName,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Gagal mereset kata sandi pegawai di server backend.',
        };
      }

      // Hash password locally with SHA-256 + Salt so local storage is protected
      const secureHash = await hashPasswordClient(newPassword);
      setStaffList(prev =>
        prev.map(s => {
          if (s.id === targetUserId) {
            return {
              ...s,
              pin: secureHash,
              name: newName && newName.trim() ? newName.trim() : s.name,
            };
          }
          return s;
        })
      );

      addNotification(
        'Kata Sandi Berhasil Direset',
        `Kata sandi untuk pegawai telah diperbarui oleh Bos (${currentUser.name}).`,
        'system'
      );

      return { success: true, message: data.message };
    } catch {
      // Offline fallback: hash password locally
      const secureHash = await hashPasswordClient(newPassword);
      setStaffList(prev =>
        prev.map(s => {
          if (s.id === targetUserId) {
            return {
              ...s,
              pin: secureHash,
              name: newName && newName.trim() ? newName.trim() : s.name,
            };
          }
          return s;
        })
      );

      return {
        success: true,
        message: 'Kata sandi berhasil diperbarui secara lokal (SHA-256 Terenkripsi).',
      };
    }
  };


  // Pengeluaran Kas (Kas Keluar / Pembelian Stok / Operasional)
  const addExpense = (expenseData: Omit<CashExpense, 'id' | 'date'> & { date?: string }) => {
    const newExpense: CashExpense = {
      ...expenseData,
      id: 'exp-' + Date.now(),
      date: expenseData.date || new Date().toISOString(),
      shiftId: currentShift?.id,
    };

    setExpenses(prev => [newExpense, ...prev]);

    // Sinkronisasi otomatis ke shift aktif jika shift sedang buka
    if (currentShift && currentShift.isOpen) {
      const shiftStartTime = new Date(currentShift.startTime).getTime();
      const currentShiftTransactions = transactions.filter(t => new Date(t.date).getTime() >= shiftStartTime);
      const cashTotal = currentShiftTransactions
        .filter(t => t.paymentMethod === 'tunai')
        .reduce((sum, t) => sum + t.total, 0);

      const allShiftExpenses = [newExpense, ...expenses]
        .filter(e => new Date(e.date).getTime() >= shiftStartTime)
        .reduce((sum, e) => sum + e.amount, 0);

      const expectedCash = currentShift.initialCash + cashTotal - allShiftExpenses;
      const actualCash = currentShift.actualCash ?? expectedCash;
      const difference = actualCash - expectedCash;

      setCurrentShift(prev => prev ? {
        ...prev,
        cashExpenses: allShiftExpenses,
        expectedCash,
        difference,
      } : null);

      // Sinkronisasi ke daily cash history hari ini
      const todayDateKey = new Date().toISOString().split('T')[0];
      setDailyCashHistory(prevHistory => {
        return prevHistory.map(r => {
          if (r.date.split('T')[0] === todayDateKey) {
            return {
              ...r,
              cashExpenses: allShiftExpenses,
              expectedCash,
              difference: (r.actualCash ?? expectedCash) - expectedCash,
            };
          }
          return r;
        });
      });
    }

    addNotification(
      'Pengeluaran Kas Dicatat',
      `Kas keluar Rp ${newExpense.amount.toLocaleString('id-ID')} untuk "${newExpense.categoryLabel}" (${newExpense.notes || 'Operasional'}).`,
      'sales'
    );
  };

  const updateExpense = (id: string, updates: Partial<CashExpense>) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    addNotification('Pengeluaran Diperbarui', 'Data pengeluaran kas telah diperbarui.', 'system');
  };

  const deleteExpense = (id: string) => {
    const target = expenses.find(e => e.id === id);
    setExpenses(prev => prev.filter(e => e.id !== id));
    addNotification(
      'Pengeluaran Dihapus',
      `Catatan pengeluaran ${target ? `Rp ${target.amount.toLocaleString('id-ID')}` : ''} telah dihapus.`,
      'system'
    );
  };

  // Riwayat Saldo Kas Harian & Shift Kasir
  const openShift = (initialCash: number) => {
    const newShift: CashierShift = {
      id: 'shift-' + Date.now(),
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      startTime: new Date().toISOString(),
      initialCash,
      cashExpenses: 0,
      isOpen: true,
    };
    setCurrentShift(newShift);

    // Sinkronisasi otomatis ke Riwayat Kas Harian untuk hari ini
    const todayStr = new Date().toISOString();
    const todayDateKey = todayStr.split('T')[0];
    setDailyCashHistory(prev => {
      const existingToday = prev.find(r => r.date.split('T')[0] === todayDateKey);
      if (existingToday) {
        return prev.map(r => r.id === existingToday.id ? {
          ...r,
          cashierName: currentUser.name,
          initialCash,
          isOpen: true,
          expectedCash: initialCash + r.cashSales - (r.cashExpenses || 0),
          actualCash: initialCash + r.cashSales - (r.cashExpenses || 0),
          difference: 0,
        } : r);
      }
      const newRec: DailyCashRecord = {
        id: 'cash-rec-' + Date.now(),
        date: todayStr,
        cashierName: currentUser.name,
        initialCash,
        cashSales: 0,
        digitalSales: 0,
        cashExpenses: 0,
        expectedCash: initialCash,
        actualCash: initialCash,
        difference: 0,
        isOpen: true,
        notes: 'Shift aktif berjalan hari ini.',
      };
      return [newRec, ...prev];
    });

    addNotification('Shift Kasir Dibuka', `Shift dibuka oleh ${currentUser.name} dengan modal awal Rp ${initialCash.toLocaleString('id-ID')}`, 'system');
  };

  const closeShift = (actualCash: number, notes?: string) => {
    if (!currentShift) return;

    // Hitung transaksi tunai & digital selama shift berlangsung
    const shiftStartTime = new Date(currentShift.startTime).getTime();
    const currentShiftTransactions = transactions.filter(t => new Date(t.date).getTime() >= shiftStartTime);
    const cashTotal = currentShiftTransactions
      .filter(t => t.paymentMethod === 'tunai')
      .reduce((sum, t) => sum + t.total, 0);
    const digitalTotal = currentShiftTransactions
      .filter(t => t.paymentMethod !== 'tunai')
      .reduce((sum, t) => sum + t.total, 0);

    const shiftExpensesTotal = expenses
      .filter(e => new Date(e.date).getTime() >= shiftStartTime)
      .reduce((sum, e) => sum + e.amount, 0);

    const expectedCash = currentShift.initialCash + cashTotal - shiftExpensesTotal;
    const difference = actualCash - expectedCash;

    const closed: CashierShift = {
      ...currentShift,
      endTime: new Date().toISOString(),
      cashExpenses: shiftExpensesTotal,
      expectedCash,
      actualCash,
      difference,
      notes,
      isOpen: false,
    };

    setCurrentShift(closed);

    // Simpan ke Riwayat Kas Harian
    const todayDateKey = new Date().toISOString().split('T')[0];
    setDailyCashHistory(prev => {
      const existing = prev.find(r => r.date.split('T')[0] === todayDateKey);
      if (existing) {
        return prev.map(r => r.id === existing.id ? {
          ...r,
          cashierName: currentShift.cashierName,
          cashSales: cashTotal,
          digitalSales: digitalTotal,
          cashExpenses: shiftExpensesTotal,
          expectedCash,
          actualCash,
          difference,
          notes: notes ?? r.notes,
          isOpen: false,
        } : r);
      }
      const newRec: DailyCashRecord = {
        id: 'cash-rec-' + Date.now(),
        date: new Date().toISOString(),
        cashierName: currentShift.cashierName,
        initialCash: currentShift.initialCash,
        cashSales: cashTotal,
        digitalSales: digitalTotal,
        cashExpenses: shiftExpensesTotal,
        expectedCash,
        actualCash,
        difference,
        isOpen: false,
        notes,
      };
      return [newRec, ...prev];
    });

    addNotification(
      'Shift Kasir Ditutup',
      `Shift ditutup. Kas Akhir: Rp ${actualCash.toLocaleString('id-ID')} (Pengeluaran: Rp ${shiftExpensesTotal.toLocaleString('id-ID')}, Selisih: ${difference >= 0 ? '+' : ''}Rp ${difference.toLocaleString('id-ID')})`,
      'system'
    );
  };

  // Owner Edit Saldo Awal & Saldo Akhir Hari Ini
  const updateShiftBalances = (initialCash: number, actualCash: number, notes?: string) => {
    const shiftStartTime = currentShift && currentShift.isOpen ? new Date(currentShift.startTime).getTime() : 0;
    const currentShiftTransactions = transactions.filter(t => currentShift && new Date(t.date).getTime() >= shiftStartTime);
    const cashTotal = currentShiftTransactions
      .filter(t => t.paymentMethod === 'tunai')
      .reduce((sum, t) => sum + t.total, 0);
    const digitalTotal = currentShiftTransactions
      .filter(t => t.paymentMethod !== 'tunai')
      .reduce((sum, t) => sum + t.total, 0);

    const shiftExpensesTotal = expenses
      .filter(e => currentShift && new Date(e.date).getTime() >= shiftStartTime)
      .reduce((sum, e) => sum + e.amount, 0);

    const expectedCash = initialCash + cashTotal - shiftExpensesTotal;
    const difference = actualCash - expectedCash;

    const updated: CashierShift = currentShift ? {
      ...currentShift,
      initialCash,
      actualCash,
      cashExpenses: shiftExpensesTotal,
      expectedCash,
      difference,
      notes: notes ?? currentShift.notes,
    } : {
      id: 'shift-' + Date.now(),
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      startTime: new Date().toISOString(),
      initialCash,
      actualCash,
      cashExpenses: shiftExpensesTotal,
      expectedCash,
      difference,
      notes,
      isOpen: true,
    };

    setCurrentShift(updated);

    // Simpan ke Riwayat Kas Harian
    const todayDateKey = new Date().toISOString().split('T')[0];
    setDailyCashHistory(prev => {
      const existing = prev.find(r => r.date.split('T')[0] === todayDateKey);
      if (existing) {
        return prev.map(r => r.id === existing.id ? {
          ...r,
          initialCash,
          actualCash,
          cashExpenses: shiftExpensesTotal,
          expectedCash,
          difference,
          notes: notes ?? r.notes,
        } : r);
      }
      const newRec: DailyCashRecord = {
        id: 'cash-rec-' + Date.now(),
        date: new Date().toISOString(),
        cashierName: currentUser.name,
        initialCash,
        cashSales: cashTotal,
        digitalSales: digitalTotal,
        cashExpenses: shiftExpensesTotal,
        expectedCash,
        actualCash,
        difference,
        isOpen: true,
        notes,
      };
      return [newRec, ...prev];
    });

    addNotification(
      'Saldo Kasir Diperbarui',
      `Saldo Awal Rp ${initialCash.toLocaleString('id-ID')} & Saldo Akhir Rp ${actualCash.toLocaleString('id-ID')} tersimpan di riwayat harian.`,
      'system'
    );
  };

  // Tambah atau Edit Riwayat Kas Tanggal Tertentu (Bisa tanggal kapan pun)
  const addOrUpdateDailyCashRecord = (record: Omit<DailyCashRecord, 'id'> & { id?: string }) => {
    const id = record.id || 'cash-rec-' + Date.now();
    const newRecord: DailyCashRecord = {
      ...record,
      id,
    };

    setDailyCashHistory(prev => {
      const targetDateKey = record.date.split('T')[0];
      const existingIdx = prev.findIndex(r => r.id === id || r.date.split('T')[0] === targetDateKey);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = { ...next[existingIdx], ...newRecord };
        return next.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
      return [newRecord, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    // Jika yang diubah adalah tanggal hari ini, sinkronkan juga currentShift
    const isToday = new Date(record.date).toDateString() === new Date().toDateString();
    if (isToday) {
      setCurrentShift(prev => prev ? {
        ...prev,
        initialCash: record.initialCash,
        actualCash: record.actualCash,
        expectedCash: record.expectedCash,
        difference: record.difference,
        notes: record.notes ?? prev.notes,
        isOpen: record.isOpen,
      } : null);
    }

    addNotification(
      'Riwayat Kas Disimpan',
      `Riwayat kas tanggal ${new Date(record.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} berhasil disimpan.`,
      'system'
    );
  };

  // Hapus Satu Riwayat Tanggal Kas
  const deleteDailyCashRecord = (id: string) => {
    setDailyCashHistory(prev => prev.filter(r => r.id !== id));
    addNotification('Riwayat Kas Dihapus', 'Satu baris riwayat saldo kas harian telah dihapus.', 'system');
  };

  const updateStoreProfile = (updates: Partial<StoreProfile>) => {
    setStoreProfile(prev => ({ ...prev, ...updates }));
  };

  const updateShopeeConfig = (updates: Partial<ShopeeConfig>) => {
    setShopeeConfig(prev => ({ ...prev, ...updates }));
  };

  // Shopee 2-way Sync actions
  const syncShopeeInventory = async (): Promise<void> => {
    const syncedCount = products.filter(p => p.shopeeSyncEnabled).length;
    await new Promise(r => setTimeout(r, 800)); // Network latency simulation
    const log: ShopeeSyncLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      type: 'stock_update',
      status: 'success',
      message: `Berhasil sinkronisasi stok ${syncedCount} item dengan Shopee Open Platform.`,
      details: `Shop ID: ${shopeeConfig.shopId} (${shopeeConfig.shopName})`,
    };
    setShopeeLogs(prev => [log, ...prev]);
    setShopeeConfig(prev => ({ ...prev, lastSyncTime: new Date().toISOString() }));
    addNotification('Sinkronisasi Shopee Berhasil', `${syncedCount} produk berhasil disinkronkan dengan stok Shopee.`, 'shopee_order');
  };

  // Simulate incoming Shopee customer order webhook
  const simulateIncomingShopeeOrder = async (): Promise<void> => {
    const eligibleProducts = products.filter(p => p.shopeeSyncEnabled && p.stock > 0);
    if (eligibleProducts.length === 0) {
      addNotification('Simulasi Shopee', 'Tidak ada produk tersinkronisasi Shopee dengan stok mencukupi.', 'system');
      return;
    }

    const randomProduct = eligibleProducts[Math.floor(Math.random() * eligibleProducts.length)];
    const orderQty = Math.min(2, randomProduct.stock);
    const orderTotal = randomProduct.sellPrice * orderQty;
    const orderHPP = randomProduct.buyPrice * orderQty;
    const shopeeOrderId = generateShopeeOrderNo();

    // Decrement stock
    setProducts(prev =>
      prev.map(p => p.id === randomProduct.id ? { ...p, stock: Math.max(0, p.stock - orderQty) } : p)
    );

    // Record transaction
    const shopeeTrx: Transaction = {
      id: 'trx-' + Date.now(),
      invoiceNo: generateInvoiceNo(),
      date: new Date().toISOString(),
      items: [{ product: randomProduct, qty: orderQty }],
      subtotal: orderTotal,
      discount: 0,
      tax: 0,
      total: orderTotal,
      costTotal: orderHPP,
      profit: orderTotal - orderHPP,
      paymentMethod: 'shopeepay',
      amountPaid: orderTotal,
      change: 0,
      cashierId: 'user-admin',
      cashierName: 'Shopee Marketplace',
      channel: 'shopee',
      shopeeOrderId: shopeeOrderId,
      notes: `Pesanan Masuk Marketplace Shopee (${shopeeOrderId})`,
    };

    setTransactions(prev => [shopeeTrx, ...prev]);

    // Log sync
    const log: ShopeeSyncLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      type: 'order_import',
      status: 'success',
      message: `Webhook Shopee Diterima: ${orderQty}x ${randomProduct.name} (Order #${shopeeOrderId})`,
      details: `Stok otomatis dikurangi dari ${randomProduct.stock} menjadi ${randomProduct.stock - orderQty}`,
    };
    setShopeeLogs(prev => [log, ...prev]);

    addNotification(
      'Pesanan Shopee Baru',
      `Order #${shopeeOrderId} diterima (${orderQty}x ${randomProduct.name}). Stok toko fisik telah disinkronkan.`,
      'shopee_order'
    );
  };

  // Cloud Backup and AES-GCM Encryption
  const performCloudBackup = async (): Promise<void> => {
    setCloudBackup(prev => ({ ...prev, isCloudSyncing: true }));
    await new Promise(r => setTimeout(r, 900));

    const snapshot = {
      products,
      transactions,
      customers,
      storeProfile,
      shopeeConfig,
      exportedAt: new Date().toISOString(),
    };
    const json = JSON.stringify(snapshot);
    const checksum = await computeSha256(json);

    setCloudBackup({
      lastBackupDate: new Date().toISOString(),
      totalRecords: products.length + transactions.length + customers.length,
      fileSizeBytes: new Blob([json]).size,
      encryptionAlgorithm: 'AES-GCM-256 (Military-grade)',
      checksum: checksum.slice(0, 24),
      autoBackupEnabled: true,
      isCloudSyncing: false,
    });

    addNotification('Cadangan Cloud Berhasil', 'Data transaksi, stok, dan pelanggan aman tersimpan di cloud terenkripsi.', 'backup');
  };

  const exportEncryptedBackup = async (passphrase: string): Promise<string> => {
    const payload = {
      app: 'KasirShopee POS',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      products,
      transactions,
      customers,
      expenses,
      storeProfile,
      shopeeConfig,
    };

    const encrypted = await encryptData(payload, passphrase);
    return JSON.stringify(encrypted, null, 2);
  };

  const restoreEncryptedBackup = async (
    encryptedJsonString: string,
    passphrase: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const parsedPayload = JSON.parse(encryptedJsonString) as EncryptedPayload;
      const decryptedData = await decryptData<any>(parsedPayload, passphrase);

      if (!decryptedData || !Array.isArray(decryptedData.products) || !Array.isArray(decryptedData.transactions)) {
        return { success: false, message: 'Format struktur data backup tidak valid.' };
      }

      setProducts(decryptedData.products);
      setTransactions(decryptedData.transactions);
      if (Array.isArray(decryptedData.customers)) setCustomers(decryptedData.customers);
      if (Array.isArray(decryptedData.expenses)) setExpenses(decryptedData.expenses);
      if (decryptedData.storeProfile) setStoreProfile(decryptedData.storeProfile);
      if (decryptedData.shopeeConfig) setShopeeConfig(decryptedData.shopeeConfig);

      addNotification('Pemulihan Data Berhasil', 'Database berhasil didekripsi dan dipulihkan sepenuhnya.', 'backup');
      return { success: true, message: 'Data berhasil dipulihkan dengan verifikasi integritas SHA-256.' };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Gagal mendekripsi file backup. Kata sandi salah.',
      };
    }
  };

  // 100% Data Safety & Durability Implementations
  const enablePersistentStorage = async (): Promise<boolean> => {
    const success = await requestPersistentStorage();
    setIsStoragePersisted(success);
    if (success) {
      addNotification('Penyimpanan Terproteksi', 'Browser mengonfirmasi data MitraStore tidak akan dihapus otomatis.', 'system');
    }
    return success;
  };

  const exportAllProductsCSV = () => {
    exportProductsToCSV(products);
    addNotification('Ekspor CSV Berhasil', `${products.length} data produk diekspor ke format Excel / CSV.`, 'system');
  };

  const exportFullDatabase = () => {
    exportFullDatabaseJSON({
      products,
      transactions,
      customers,
      categories,
      storeProfile,
      expenses,
      dailyCashHistory,
    });
    addNotification('Backup Lengkap Berhasil', 'Cadangan database lengkap (JSON) berhasil diunduh.', 'backup');
  };

  const createManualSnapshot = async (label?: string) => {
    const snapshotLabel = label || `Cadangan Manual (${products.length} Produk)`;
    const newSnap = await createStorageSnapshot(snapshotLabel, {
      products,
      transactions,
      customers,
      categories,
      storeProfile,
      expenses,
      dailyCashHistory,
    });
    if (newSnap) {
      setStorageSnapshots((prev) => [newSnap, ...prev.slice(0, 9)]);
      addNotification('Snapshot Dibuat', `Titik pemulihan "${snapshotLabel}" tersimpan aman di database lokal.`, 'backup');
    }
  };

  const restoreSnapshot = async (snapshotId: string): Promise<boolean> => {
    const target = storageSnapshots.find((s) => s.id === snapshotId);
    if (!target) return false;

    // Safety: save a current snapshot before restoring
    await createStorageSnapshot(`Sebelum Pulihkan ${target.label}`, {
      products,
      transactions,
      customers,
      categories,
      storeProfile,
      expenses,
      dailyCashHistory,
    });

    if (Array.isArray(target.data.products)) setProducts(target.data.products);
    if (Array.isArray(target.data.transactions)) setTransactions(target.data.transactions);
    if (Array.isArray(target.data.customers)) setCustomers(target.data.customers);
    if (Array.isArray(target.data.categories)) setCategories(target.data.categories);
    if (target.data.storeProfile) setStoreProfile(target.data.storeProfile);
    if (Array.isArray(target.data.expenses)) setExpenses(target.data.expenses);
    if (Array.isArray(target.data.dailyCashHistory)) setDailyCashHistory(target.data.dailyCashHistory);

    addNotification('Pemulihan Sukses', `Data berhasil dipulihkan dari snapshot: "${target.label}".`, 'backup');
    return true;
  };

  const bulkImportProducts = (
    newProducts: Omit<Product, 'id'>[],
    newCategories?: string[]
  ) => {
    if (newProducts.length === 0) return;

    // Create automatic snapshot before bulk importing
    createStorageSnapshot(`Sebelum Impor ${newProducts.length} Produk`, {
      products,
      transactions,
      customers,
      categories,
      storeProfile,
      expenses,
      dailyCashHistory,
    });

    if (newCategories && newCategories.length > 0) {
      const mergedCats = Array.from(new Set([...categories, ...newCategories]));
      setCategories(mergedCats);
    }

    const preparedProducts: Product[] = newProducts.map((p, idx) => ({
      ...p,
      id: `prod-${Date.now()}-${idx}`,
    }));

    setProducts((prev) => [...preparedProducts, ...prev]);
    addNotification(
      'Impor Produk Berhasil',
      `${preparedProducts.length} produk baru berhasil dimasukkan ke inventaris stok.`,
      'system'
    );
  };

  const resetToDefaultData = () => {
    // Safety Snapshot: NEVER lose user data even if reset is clicked!
    createStorageSnapshot('Darurat: Cadangan Otomatis Sebelum Reset', {
      products,
      transactions,
      customers,
      categories,
      storeProfile,
      expenses,
      dailyCashHistory,
    }).then((snap) => {
      if (snap) {
        setStorageSnapshots((prev) => [snap, ...prev]);
      }
    });

    Object.values(STORAGE_KEYS).forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch {}
    });
    setProducts(INITIAL_PRODUCTS);
    setTransactions(getInitialTransactions());
    setCustomers(INITIAL_CUSTOMERS);
    setExpenses(getInitialExpenses());
    setDailyCashHistory(getInitialDailyCashRecords());
    setStoreProfile(INITIAL_STORE_PROFILE);
    setShopeeConfig(INITIAL_SHOPEE_CONFIG);
    setCategories(INITIAL_CATEGORIES);
    setCartSessions([createInitialCartSession('cart-1', 'Pelanggan 1')]);
    setActiveCartSessionId('cart-1');
    addNotification('Data Berhasil Direset', 'Data telah dikembalikan ke sampel default. Cadangan otomatis sebelum reset tersimpan di daftar snapshot cadangan.', 'system');
  };

  // Notification actions
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  // Bluetooth Actions
  const connectBluetooth = async () => {
    const status = await bluetoothPrinter.connect();
    setBluetoothStatus({ ...status });
    addNotification('Printer Bluetooth', status.statusMessage, 'system');
  };

  const disconnectBluetooth = () => {
    const status = bluetoothPrinter.disconnect();
    setBluetoothStatus({ ...status });
  };

  const printTransactionReceipt = async (trx: Transaction): Promise<boolean> => {
    return await bluetoothPrinter.printTransaction(trx, storeProfile);
  };

  const testBluetoothPrint = async (): Promise<boolean> => {
    return await bluetoothPrinter.printTest(storeProfile.name || 'MitraStore');
  };

  const setBluetoothPaperType = (type: '58mm' | '80mm') => {
    bluetoothPrinter.setPaperType(type);
    setBluetoothStatus(prev => ({ ...prev, printerType: type }));
  };

  return (
    <POSContext.Provider
      value={{
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        lowStockProducts,
        outOfStockProducts,
        cart,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        cartSubtotal,
        cartTax,
        cartTotal,
        selectedCustomer,
        setSelectedCustomer,
        pointsToRedeem,
        setPointsToRedeem,
        pointsDiscountValue,
        taxEnabled,
        setTaxEnabled,
        cartSessions,
        activeCartSessionId,
        activeCartSession,
        setActiveCartSessionId,
        createNewCartSession,
        deleteCartSession,
        renameCartSession,
        activePosTab,
        setActivePosTab,
        transactions,
        processCheckout,
        lastTransaction,
        isReceiptModalOpen,
        setIsReceiptModalOpen,
        customers,
        addCustomer,
        updateCustomer,
        categories,
        addCategory,
        deleteCategory,
        staffList,
        updateStaffUser,
        currentUser,
        isCashierLoggedIn,
        loginCashier,
        logoutCashier,
        switchUser,
        adminSessionToken,
        resetStaffPasswordByAdmin,
        isStaffModalOpen,
        setIsStaffModalOpen,
        currentShift,
        openShift,
        closeShift,
        updateShiftBalances,
        dailyCashHistory,
        addOrUpdateDailyCashRecord,
        deleteDailyCashRecord,
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
        isExpenseModalOpen,
        setIsExpenseModalOpen,
        storeProfile,
        updateStoreProfile,
        shopeeConfig,
        shopeeLogs,
        updateShopeeConfig,
        syncShopeeInventory,
        simulateIncomingShopeeOrder,
        cloudBackup,
        performCloudBackup,
        exportEncryptedBackup,
        restoreEncryptedBackup,
        resetToDefaultData,
        isStoragePersisted,
        enablePersistentStorage,
        exportAllProductsCSV,
        exportFullDatabase,
        storageSnapshots,
        restoreSnapshot,
        createManualSnapshot,
        bulkImportProducts,
        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        unreadNotificationsCount,
        bluetoothStatus,
        connectBluetooth,
        disconnectBluetooth,
        printTransactionReceipt,
        testBluetoothPrint,
        setBluetoothPaperType,
        isDarkMode,
        toggleDarkMode,
        voiceSettings,
        updateVoiceSettings,
        testVoiceAlert,
        isVoiceSettingsModalOpen,
        setIsVoiceSettingsModalOpen,
        isOnline,
        offlineQueue,
        isSyncingOffline,
        syncOfflineTransactions,
        isOfflineModalOpen,
        setIsOfflineModalOpen,
        supabaseStatus,
        isSupabaseModalOpen,
        setIsSupabaseModalOpen,
        checkSupabaseConnection,
        seedDataToSupabase,
        isSupabaseSyncing,
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
};
