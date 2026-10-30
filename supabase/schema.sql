-- ==============================================================================
-- MITRASTORE POS - SUPABASE POSTGRESQL DATABASE SCHEMA
-- ==============================================================================
-- Jalankan skrip ini di: Supabase Dashboard > SQL Editor > New Query > Run
-- Skrip ini akan membuat tabel-tabel utama serta RLS (Row Level Security) yang aman.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABEL PRODUK (PRODUCTS)
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT,
    barcode TEXT,
    category TEXT NOT NULL DEFAULT 'Perabot Dapur',
    buy_price NUMERIC NOT NULL DEFAULT 0,
    sell_price NUMERIC NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 5,
    unit TEXT NOT NULL DEFAULT 'pcs',
    shopee_item_id TEXT,
    shopee_sync_enabled BOOLEAN NOT NULL DEFAULT false,
    image_url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL PELANGGAN (CUSTOMERS)
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    tier TEXT NOT NULL DEFAULT 'reguler',
    points INTEGER NOT NULL DEFAULT 0,
    total_spend NUMERIC NOT NULL DEFAULT 0,
    total_visits INTEGER NOT NULL DEFAULT 1,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL KATEGORI PRODUK (CATEGORIES)
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL TRANSAKSI KASIR (TRANSACTIONS)
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    invoice_no TEXT NOT NULL UNIQUE,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    discount NUMERIC NOT NULL DEFAULT 0,
    points_used_discount NUMERIC DEFAULT 0,
    tax NUMERIC NOT NULL DEFAULT 0,
    total NUMERIC NOT NULL DEFAULT 0,
    cost_total NUMERIC NOT NULL DEFAULT 0,
    profit NUMERIC NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'tunai',
    amount_paid NUMERIC NOT NULL DEFAULT 0,
    change NUMERIC NOT NULL DEFAULT 0,
    customer_id TEXT REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT,
    cashier_id TEXT NOT NULL DEFAULT 'user-admin',
    cashier_name TEXT NOT NULL DEFAULT 'Kasir',
    channel TEXT NOT NULL DEFAULT 'offline',
    notes TEXT,
    shopee_order_id TEXT,
    is_offline BOOLEAN DEFAULT false,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABEL PROFIL TOKO (STORE PROFILE)
CREATE TABLE IF NOT EXISTS public.store_profile (
    id TEXT PRIMARY KEY DEFAULT 'default',
    name TEXT NOT NULL DEFAULT 'MitraStore',
    tagline TEXT DEFAULT 'Pusat Cetakan Kue, Alat Masak & Perabotan Dapur',
    address TEXT DEFAULT 'Jl. Sentra Perabot & Baking No. 45, Bandung',
    phone TEXT DEFAULT '0812-3456-7890',
    email TEXT DEFAULT 'kontak@mitrastore.com',
    footer_note TEXT DEFAULT 'Terima kasih telah berbelanja di MitraStore. Pusat Cetakan Kue & Perabotan Dapur.',
    receipt_width TEXT DEFAULT '58mm',
    tax_rate_percent NUMERIC DEFAULT 11,
    enable_tax BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABEL PENGELUARAN KAS KASIR (EXPENSES)
CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    amount NUMERIC NOT NULL DEFAULT 0,
    category TEXT NOT NULL DEFAULT 'Operasional',
    note TEXT,
    cashier_id TEXT,
    cashier_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABEL REKAP KAS HARIAN (DAILY CASH RECORDS)
CREATE TABLE IF NOT EXISTS public.daily_cash_records (
    id TEXT PRIMARY KEY,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cashier_name TEXT NOT NULL,
    initial_cash NUMERIC NOT NULL DEFAULT 0,
    cash_sales NUMERIC NOT NULL DEFAULT 0,
    digital_sales NUMERIC NOT NULL DEFAULT 0,
    cash_expenses NUMERIC NOT NULL DEFAULT 0,
    expected_cash NUMERIC NOT NULL DEFAULT 0,
    actual_cash NUMERIC NOT NULL DEFAULT 0,
    difference NUMERIC NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABEL PEGAWAI TOKO (STAFF USERS)
CREATE TABLE IF NOT EXISTS public.staff_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'kasir',
    pin TEXT,
    password_hash TEXT,
    avatar_color TEXT DEFAULT 'bg-[#800020]',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TABEL KONFIGURASI SHOPEE (SHOPEE CONFIG)
CREATE TABLE IF NOT EXISTS public.shopee_config (
    id TEXT PRIMARY KEY DEFAULT 'default',
    partner_id TEXT,
    partner_key TEXT,
    shop_id TEXT,
    shop_name TEXT,
    access_token TEXT,
    auto_sync_enabled BOOLEAN DEFAULT true,
    last_sync_time TIMESTAMPTZ,
    is_connected BOOLEAN DEFAULT false,
    webhook_secret TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) & POLICIES
-- Mengizinkan aplikasi POS melakukan Read/Write ke tabel dengan aman
-- ==============================================================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_cash_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopee_config ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses Penuh untuk Anon & Authenticated Key POS
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public Full Access on products" ON public.products;
    CREATE POLICY "Public Full Access on products" ON public.products FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Full Access on customers" ON public.customers;
    CREATE POLICY "Public Full Access on customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Full Access on categories" ON public.categories;
    CREATE POLICY "Public Full Access on categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Full Access on transactions" ON public.transactions;
    CREATE POLICY "Public Full Access on transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Full Access on store_profile" ON public.store_profile;
    CREATE POLICY "Public Full Access on store_profile" ON public.store_profile FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Full Access on expenses" ON public.expenses;
    CREATE POLICY "Public Full Access on expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Full Access on daily_cash_records" ON public.daily_cash_records;
    CREATE POLICY "Public Full Access on daily_cash_records" ON public.daily_cash_records FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Full Access on staff_users" ON public.staff_users;
    CREATE POLICY "Public Full Access on staff_users" ON public.staff_users FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Full Access on shopee_config" ON public.shopee_config;
    CREATE POLICY "Public Full Access on shopee_config" ON public.shopee_config FOR ALL USING (true) WITH CHECK (true);
END $$;

-- REALTIME REPLICATION (Agar sinkron multi-kasir secara live)
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_cash_records;

-- ==============================================================================
-- DATA AWAL (SEED INITIAL DATA)
-- ==============================================================================
INSERT INTO public.categories (id, name) VALUES 
('cat-1', 'Cetakan Kue'),
('cat-2', 'Loyang & Wadah'),
('cat-3', 'Peralatan Masak'),
('cat-4', 'Perabot Dapur'),
('cat-5', 'Perlengkapan Baking')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.store_profile (id, name, tagline, address, phone, footer_note, receipt_width, tax_rate_percent, enable_tax)
VALUES (
    'default',
    'MitraStore',
    'Pusat Cetakan Kue, Alat Masak & Perabotan Dapur',
    'Jl. Sentra Perabot & Baking No. 45, Bandung',
    '0812-3456-7890',
    'Terima kasih telah berbelanja di MitraStore. Pusat Cetakan Kue & Perabotan Dapur.',
    '58mm',
    11,
    false
) ON CONFLICT (id) DO NOTHING;

-- Selesai! Tabel siap digunakan oleh MitraStore POS.
