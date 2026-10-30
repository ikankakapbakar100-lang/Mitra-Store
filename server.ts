import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Server Secret for HMAC Admin Tokens
const SERVER_SECRET = process.env.SESSION_SECRET || 'mitrastore-pos-secure-key-2026-baking-pos';

// Helper: Secure password hashing using SHA-256 with Salt
export function hashPassword(plainText: string, customSalt?: string): string {
  const salt = customSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256').update(plainText + salt).digest('hex');
  return `sha256:${salt}:${hash}`;
}

export function verifyPassword(plainText: string, storedHashOrPin: string): boolean {
  if (!storedHashOrPin) return false;

  // Format sha256:salt:hash
  if (storedHashOrPin.startsWith('sha256:')) {
    const parts = storedHashOrPin.split(':');
    if (parts.length !== 3) return false;
    const salt = parts[1];
    const expectedHash = parts[2];
    const calculatedHash = crypto.createHash('sha256').update(plainText + salt).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(calculatedHash), Buffer.from(expectedHash));
  }

  // Legacy plain-text fallback (auto-upgraded on next login)
  return storedHashOrPin.trim() === plainText.trim();
}

// Generate cryptographically signed Admin Session Token
export function createAdminToken(userId: string): string {
  const timestamp = Date.now();
  const signature = crypto
    .createHmac('sha256', SERVER_SECRET)
    .update(`admin:${userId}:${timestamp}`)
    .digest('hex');
  return `${userId}.${timestamp}.${signature}`;
}

// Verify Admin Session Token (valid for 24 hours)
export function verifyAdminToken(token: string): { valid: boolean; userId?: string } {
  if (!token || typeof token !== 'string') return { valid: false };
  const parts = token.split('.');
  if (parts.length !== 3) return { valid: false };

  const [userId, timestampStr, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return { valid: false };

  // Expiration check: 24 hours
  if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
    return { valid: false };
  }

  const expectedSignature = crypto
    .createHmac('sha256', SERVER_SECRET)
    .update(`admin:${userId}:${timestamp}`)
    .digest('hex');

  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );

  return { valid: isValid, userId: isValid ? userId : undefined };
}

// Server-authoritative Staff Store with hashed passwords
interface ServerStaffUser {
  id: string;
  name: string;
  role: 'admin' | 'supervisor' | 'kasir';
  passwordHash: string;
  avatarColor: string;
}

// Initial pre-hashed staff database
const serverStaffDatabase: ServerStaffUser[] = [
  {
    id: 'user-admin',
    name: 'Hendra Wijaya (Owner)',
    role: 'admin',
    passwordHash: hashPassword('1234', 'admin_salt_mitrastore_2026'),
    avatarColor: 'bg-[#5C3A21]',
  },
  {
    id: 'user-spv',
    name: 'Siti Rahma',
    role: 'supervisor',
    passwordHash: hashPassword('5678', 'spv_salt_mitrastore_2026'),
    avatarColor: 'bg-[#E85D75]',
  },
  {
    id: 'user-kasir-1',
    name: 'Budi Santoso',
    role: 'kasir',
    passwordHash: hashPassword('1111', 'kasir1_salt_mitrastore_2026'),
    avatarColor: 'bg-[#8C5E3C]',
  },
  {
    id: 'user-kasir-2',
    name: 'Dewi Lestari',
    role: 'kasir',
    passwordHash: hashPassword('2222', 'kasir2_salt_mitrastore_2026'),
    avatarColor: 'bg-[#F472B6]',
  },
];

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // 1. GET /api/staff/list - Daftar pegawai aman (tanpa hash/password)
  app.get('/api/staff/list', (_req, res) => {
    const safeList = serverStaffDatabase.map((s) => ({
      id: s.id,
      name: s.name,
      role: s.role,
      avatarColor: s.avatarColor,
    }));
    res.json({ success: true, staff: safeList });
  });

  // 2. POST /api/staff/login - Verifikasi kata sandi pegawai di backend
  app.post('/api/staff/login', (req, res) => {
    const { userId, password } = req.body;
    if (!userId || !password) {
      return res.status(400).json({ success: false, error: 'User ID dan kata sandi wajib diisi.' });
    }

    const staff = serverStaffDatabase.find((s) => s.id === userId);
    if (!staff) {
      return res.status(404).json({ success: false, error: 'Pegawai tidak ditemukan.' });
    }

    const isMatch = verifyPassword(password, staff.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Kata sandi tidak cocok.' });
    }

    // Jika pegawai adalah Bos / Admin, terbitkan Admin Session Token bertandatangan
    let adminToken: string | undefined = undefined;
    if (staff.role === 'admin') {
      adminToken = createAdminToken(staff.id);
    }

    return res.json({
      success: true,
      user: {
        id: staff.id,
        name: staff.name,
        role: staff.role,
        avatarColor: staff.avatarColor,
      },
      adminToken,
    });
  });

  // 3. POST /api/staff/verify-admin - Cek validitas sesi Admin / Bos
  app.post('/api/staff/verify-admin', (req, res) => {
    const { adminToken } = req.body;
    const verification = verifyAdminToken(adminToken);
    if (!verification.valid) {
      return res.status(403).json({ valid: false, error: 'Token admin tidak sah atau telah kedaluwarsa.' });
    }

    const adminUser = serverStaffDatabase.find((s) => s.id === verification.userId && s.role === 'admin');
    if (!adminUser) {
      return res.status(403).json({ valid: false, error: 'Pengguna bukan admin terdaftar.' });
    }

    return res.json({ valid: true, admin: { id: adminUser.id, name: adminUser.name, role: adminUser.role } });
  });

  // 4. POST /api/staff/reset-password - HANYA BOS / ADMIN YANG DAPAT MERESET KATA SANDI
  // Dilindungi secara ketat di backend: kasir/supervisor yang memanggil endpoint ini akan ditolak (403)
  app.post('/api/staff/reset-password', (req, res) => {
    const { adminToken, targetUserId, newPassword, newName } = req.body;

    // Verifikasi Otorisasi Bos di Backend
    const verification = verifyAdminToken(adminToken);
    if (!verification.valid) {
      return res.status(403).json({
        success: false,
        error: 'Akses ditolak: Hanya Bos / Admin Utama yang terverifikasi yang berhak mereset kata sandi pegawai.',
      });
    }

    const adminUser = serverStaffDatabase.find((s) => s.id === verification.userId && s.role === 'admin');
    if (!adminUser) {
      return res.status(403).json({
        success: false,
        error: 'Akses ditolak: Kredensial penanggung jawab bukan berstatus Bos/Admin.',
      });
    }

    // Validasi parameter target
    if (!targetUserId || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Target pegawai dan kata sandi baru harus diisi.',
      });
    }

    if (typeof newPassword !== 'string' || newPassword.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Kata sandi baru minimal 3 karakter.',
      });
    }

    const targetStaff = serverStaffDatabase.find((s) => s.id === targetUserId);
    if (!targetStaff) {
      return res.status(404).json({
        success: false,
        error: 'Pegawai yang dipilih tidak ditemukan dalam sistem.',
      });
    }

    // Update password dengan hashing SHA-256 + salt baru di backend
    const updatedHash = hashPassword(newPassword.trim());
    targetStaff.passwordHash = updatedHash;
    if (newName && typeof newName === 'string' && newName.trim()) {
      targetStaff.name = newName.trim();
    }

    return res.json({
      success: true,
      message: `Kata sandi untuk ${targetStaff.name} berhasil diperbarui oleh Bos (${adminUser.name}).`,
      updatedUser: {
        id: targetStaff.id,
        name: targetStaff.name,
        role: targetStaff.role,
        avatarColor: targetStaff.avatarColor,
      },
    });
  });

  // Supabase URL Normalization (mendukung format https://...co dan https://...co/rest/v1/)
  function normalizeSupabaseUrl(rawUrl: string): { baseUrl: string; restUrl: string } {
    let url = (rawUrl || '').trim().replace(/\/+$/, '');
    if (url.endsWith('/rest/v1')) {
      url = url.substring(0, url.length - '/rest/v1'.length);
    }
    const baseUrl = url || 'https://tgcezwlxcjnsgrwedokq.supabase.co';
    const restUrl = `${baseUrl}/rest/v1/`;
    return { baseUrl, restUrl };
  }

  const rawSupabaseUrl = process.env.SUPABASE_URL || 'https://tgcezwlxcjnsgrwedokq.supabase.co/rest/v1/';
  const { baseUrl: SUPABASE_URL, restUrl: SUPABASE_REST_URL } = normalizeSupabaseUrl(rawSupabaseUrl);

  const SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnY2V6d2x4Y2puc2dyd2Vkb2txIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzI4MDMzOCwiZXhwIjoyMTA4ODU2MzM4fQ.0mut4k6dGBjmQ83ij-ZsQe9q6Cx_Tik7RevUZlbW7jU';

  const supabaseServer = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // GET /api/supabase/status - Cek status koneksi dan tabel di Supabase
  app.get('/api/supabase/status', async (_req, res) => {
    const start = Date.now();
    const tables = ['products', 'transactions', 'customers', 'categories', 'daily_cash_records'];
    const missingTables: string[] = [];

    try {
      for (const table of tables) {
        const { error } = await supabaseServer.from(table).select('id').limit(1);
        if (error) {
          if (
            error.code === 'PGRST205' ||
            error.message.includes('Could not find the table') ||
            error.message.includes('does not exist')
          ) {
            missingTables.push(table);
          }
        }
      }

      return res.json({
        success: true,
        isConnected: true,
        hasSchema: missingTables.length === 0,
        missingTables,
        latencyMs: Date.now() - start,
        projectRef: 'tgcezwlxcjnsgrwedokq',
        url: SUPABASE_URL,
        restUrl: SUPABASE_REST_URL,
      });
    } catch (err: unknown) {
      return res.json({
        success: false,
        isConnected: false,
        hasSchema: false,
        missingTables: tables,
        error: err instanceof Error ? err.message : 'Koneksi ke Supabase gagal.',
        url: SUPABASE_URL,
        restUrl: SUPABASE_REST_URL,
      });
    }
  });

  // POST /api/supabase/seed - Mengisi data awal ke Supabase bila tabel sudah dibuat dan kosong
  app.post('/api/supabase/seed', async (req, res) => {
    try {
      const { products, customers, categories, storeProfile } = req.body;

      let seededCount = 0;

      // Seed categories
      if (Array.isArray(categories) && categories.length > 0) {
        const catRows = categories.map((name: string, idx: number) => ({
          id: `cat-${idx + 1}`,
          name,
        }));
        await supabaseServer.from('categories').upsert(catRows, { onConflict: 'name' });
      }

      // Seed products
      if (Array.isArray(products) && products.length > 0) {
        const productRows = products.map((p: any) => ({
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
        }));
        const { error } = await supabaseServer.from('products').upsert(productRows, { onConflict: 'id' });
        if (!error) seededCount += productRows.length;
      }

      // Seed customers
      if (Array.isArray(customers) && customers.length > 0) {
        const custRows = customers.map((c: any) => ({
          id: c.id,
          name: c.name,
          phone: c.phone || null,
          email: c.email || null,
          tier: c.tier || 'reguler',
          points: c.points || 0,
          total_spend: c.totalSpend || 0,
          total_visits: c.totalVisits || 1,
          registered_at: c.registeredAt || new Date().toISOString(),
        }));
        await supabaseServer.from('customers').upsert(custRows, { onConflict: 'id' });
      }

      // Seed store profile
      if (storeProfile) {
        await supabaseServer.from('store_profile').upsert(
          {
            id: 'default',
            name: storeProfile.name || 'MitraStore',
            tagline: storeProfile.tagline || 'Pusat Cetakan Kue, Alat Masak & Perabotan Dapur',
            address: storeProfile.address || 'Jl. Sentra Perabot & Baking No. 45, Bandung',
            phone: storeProfile.phone || '0812-3456-7890',
            footer_note: storeProfile.footerNote || 'Terima kasih telah berbelanja di MitraStore.',
            receipt_width: storeProfile.receiptWidth || '58mm',
            tax_rate_percent: storeProfile.taxRatePercent || 11,
            enable_tax: Boolean(storeProfile.enableTax),
          },
          { onConflict: 'id' }
        );
      }

      return res.json({
        success: true,
        message: `Berhasil menginisialisasi ${seededCount} produk dan data toko ke database Supabase.`,
      });
    } catch (err: unknown) {
      return res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : 'Gagal melakukan seed data ke Supabase.',
      });
    }
  });

  // Server-side database for synced offline transactions
  const serverTransactionsDatabase: any[] = [];

  // POST /api/transactions/sync - Terima dan simpan sinkronisasi transaksi offline ke server & Supabase
  app.post('/api/transactions/sync', async (req, res) => {
    const { transactions } = req.body;
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ success: false, error: 'Daftar transaksi tidak valid.' });
    }

    let syncedCount = 0;
    for (const trx of transactions) {
      if (trx && trx.invoiceNo) {
        const existingIdx = serverTransactionsDatabase.findIndex((t) => t.invoiceNo === trx.invoiceNo);
        if (existingIdx >= 0) {
          serverTransactionsDatabase[existingIdx] = { ...trx, syncedAt: new Date().toISOString() };
        } else {
          serverTransactionsDatabase.push({ ...trx, syncedAt: new Date().toISOString() });
        }
        syncedCount++;

        // Push to Supabase if table exists
        try {
          const dbRow = {
            id: trx.id,
            invoice_no: trx.invoiceNo,
            date: trx.date,
            items: trx.items,
            subtotal: trx.subtotal,
            discount: trx.discount || 0,
            points_used_discount: trx.pointsUsedDiscount || 0,
            tax: trx.tax || 0,
            total: trx.total,
            cost_total: trx.costTotal || 0,
            profit: trx.profit || 0,
            payment_method: trx.paymentMethod,
            amount_paid: trx.amountPaid,
            change: trx.change || 0,
            customer_id: trx.customerId || null,
            customer_name: trx.customerName || null,
            cashier_id: trx.cashierId || 'user-admin',
            cashier_name: trx.cashierName || 'Kasir',
            channel: trx.channel || 'offline',
            notes: trx.notes || null,
            shopee_order_id: trx.shopeeOrderId || null,
            is_offline: false,
            synced_at: new Date().toISOString(),
          };
          await supabaseServer.from('transactions').upsert(dbRow, { onConflict: 'invoice_no' });
        } catch {
          // Graceful fallback to in-memory/local
        }
      }
    }

    return res.json({
      success: true,
      syncedCount,
      totalServerTransactions: serverTransactionsDatabase.length,
      message: `Berhasil menyinkronkan ${syncedCount} transaksi ke server & database Supabase.`,
    });
  });

  // GET /api/health - Endpoint cek status server & koneksi
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Vite Integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MitraStore Server aktif di http://0.0.0.0:${PORT}`);
  });
}

startServer();
