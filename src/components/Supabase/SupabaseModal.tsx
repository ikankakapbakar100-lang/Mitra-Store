/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Copy, 
  Check, 
  ExternalLink, 
  X, 
  Cloud, 
  UploadCloud, 
  Server,
  Sparkles,
  Code,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose }) => {
  const { 
    supabaseStatus, 
    checkSupabaseConnection, 
    seedDataToSupabase, 
    isSupabaseSyncing,
    products,
    transactions,
    customers
  } = usePOS();

  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [seedResult, setSeedResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const projectUrl = 'https://tgcezwlxcjnsgrwedokq.supabase.co';
  const restApiUrl = 'https://tgcezwlxcjnsgrwedokq.supabase.co/rest/v1/';
  const sqlEditorUrl = 'https://supabase.com/dashboard/project/tgcezwlxcjnsgrwedokq/sql/new';
  const [showSqlCode, setShowSqlCode] = useState(false);

  const sqlScript = `-- ==============================================================================
-- MITRASTORE POS - SUPABASE POSTGRESQL DATABASE SCHEMA
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABEL PRODUK
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

-- 2. TABEL PELANGGAN
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

-- 3. TABEL KATEGORI
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL TRANSAKSI
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
    customer_id TEXT,
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

-- 5. TABEL PROFIL TOKO
CREATE TABLE IF NOT EXISTS public.store_profile (
    id TEXT PRIMARY KEY DEFAULT 'default',
    name TEXT NOT NULL DEFAULT 'MitraStore',
    tagline TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    footer_note TEXT,
    receipt_width TEXT DEFAULT '58mm',
    tax_rate_percent NUMERIC DEFAULT 11,
    enable_tax BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABEL PENGELUARAN KAS
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

-- 7. TABEL REKAP KAS HARIAN
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

-- 8. TABEL PEGAWAI TOKO
CREATE TABLE IF NOT EXISTS public.staff_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'kasir',
    pin TEXT,
    password_hash TEXT,
    avatar_color TEXT DEFAULT 'bg-[#800020]',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY & FULL ACCESS POLICIES
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_cash_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public Access products" ON public.products;
    CREATE POLICY "Public Access products" ON public.products FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Access customers" ON public.customers;
    CREATE POLICY "Public Access customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Access categories" ON public.categories;
    CREATE POLICY "Public Access categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Access transactions" ON public.transactions;
    CREATE POLICY "Public Access transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Access store_profile" ON public.store_profile;
    CREATE POLICY "Public Access store_profile" ON public.store_profile FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Access expenses" ON public.expenses;
    CREATE POLICY "Public Access expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Access daily_cash_records" ON public.daily_cash_records;
    CREATE POLICY "Public Access daily_cash_records" ON public.daily_cash_records FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Access staff_users" ON public.staff_users;
    CREATE POLICY "Public Access staff_users" ON public.staff_users FOR ALL USING (true) WITH CHECK (true);
END $$;
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSeed = async () => {
    setSeedResult(null);
    const res = await seedDataToSupabase();
    setSeedResult({
      success: res.success,
      message: res.message || (res.success ? 'Data berhasil diunggah ke Supabase!' : 'Gagal mengunggah data.'),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-[#FCE4E8] max-w-xl w-full p-5 sm:p-6 transition-all duration-200 text-black max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#FCE4E8] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#3ECF8E]/20 text-[#24b47e] border border-[#3ECF8E]/40 flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5 text-[#24b47e]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base text-black">
                  Koneksi Database Supabase
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#3ECF8E]/20 text-[#148356] font-extrabold border border-[#3ECF8E]/30">
                  Cloud DB
                </span>
              </div>
              <p className="text-[11px] text-stone-600 font-medium">
                Penyimpanan cloud terpusat untuk sinkronisasi multi-kasir
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full text-stone-500 hover:text-black hover:bg-[#FCE8EB] transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="py-4 space-y-4 overflow-y-auto pr-1 scrollbar-thin flex-1">
          
          {/* Status Box */}
          <div className="p-4 rounded-2xl border bg-stone-50 border-stone-200 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    supabaseStatus.isConnected ? 'bg-emerald-400' : 'bg-rose-400'
                  }`} />
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${
                    supabaseStatus.isConnected ? 'bg-emerald-500' : 'bg-rose-500'
                  }`} />
                </span>
                <span className="text-xs font-bold text-black">
                  {supabaseStatus.isConnected ? 'Terhubung ke Supabase (Aktif)' : 'Gagal Terhubung ke Supabase'}
                </span>
              </div>
              
              <button
                type="button"
                onClick={checkSupabaseConnection}
                disabled={isSupabaseSyncing}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-stone-200 bg-white hover:bg-stone-50 transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                title="Cek koneksi ulang"
              >
                <RefreshCw className={`w-3 h-3 ${isSupabaseSyncing ? 'animate-spin' : ''}`} />
                <span>{isSupabaseSyncing ? 'Memeriksa...' : 'Cek Ulang'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-xl bg-white border border-stone-200">
                <div className="text-stone-500 font-medium">Project Reference</div>
                <div className="font-mono font-bold text-black truncate">tgcezwlxcjnsgrwedokq</div>
              </div>
              <div className="p-2 rounded-xl bg-white border border-stone-200">
                <div className="text-stone-500 font-medium">Latensi Server</div>
                <div className="font-mono font-bold text-emerald-700">{supabaseStatus.latencyMs} ms</div>
              </div>
            </div>

            {/* REST API URL */}
            <div className="p-2.5 rounded-xl bg-white border border-stone-200 text-[11px] flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-stone-500 font-medium flex items-center gap-1">
                  <span>REST API URL:</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">v1 Aktif</span>
                </div>
                <div className="font-mono font-bold text-black truncate text-[11px] select-all">
                  {restApiUrl}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(restApiUrl);
                  setCopiedUrl(true);
                  setTimeout(() => setCopiedUrl(false), 2000);
                }}
                className="px-2 py-1 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-bold text-[10px] shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
                title="Salin REST API URL"
              >
                {copiedUrl ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedUrl ? 'Tersalin' : 'Salin URL'}</span>
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-stone-200 text-xs flex items-center justify-between">
              <span className="text-stone-600 font-medium">Status Tabel PostgreSQL:</span>
              {supabaseStatus.hasSchema ? (
                <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Semua Tabel Siap
                </span>
              ) : (
                <span className="text-amber-700 font-extrabold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Tabel Belum Dibuat
                </span>
              )}
            </div>
          </div>

          {/* Panduan SQL Editor & Pembuatan Tabel */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3 text-xs">
            <div className="flex items-start gap-2 text-amber-900 font-bold">
              <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-black text-black">Lokasi &amp; Cara Menggunakan SQL Editor Supabase</div>
                <p className="text-[11px] font-normal text-amber-800 mt-1 leading-relaxed">
                  Supabase telah terhubung ke project <strong className="font-mono text-black">tgcezwlxcjnsgrwedokq</strong>. Ikuti 3 langkah mudah ini untuk membuat tabel otomatis:
                </p>
              </div>
            </div>

            {/* 3 Langkah Mudah */}
            <div className="space-y-2 bg-white/80 p-3 rounded-xl border border-amber-200/60 text-[11px] text-stone-700">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#800020] text-white flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
                <div>
                  <strong>Buka SQL Editor Supabase:</strong> Klik tombol hijau/link di bawah atau buka menu ikon <code className="bg-stone-100 px-1 py-0.5 rounded text-black font-mono">&lt;_&gt; SQL Editor</code> di bilah kiri dashboard Supabase Anda.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#800020] text-white flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
                <div>
                  <strong>Salin &amp; Tempel Skrip:</strong> Klik tombol <strong className="text-[#800020]">"Salin Skrip SQL"</strong> di bawah, lalu tempel (<kbd className="px-1 py-0.5 bg-stone-100 border rounded text-[10px]">Ctrl+V</kbd> / <kbd className="px-1 py-0.5 bg-stone-100 border rounded text-[10px]">Cmd+V</kbd>) ke halaman SQL Editor Supabase.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#800020] text-white flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
                <div>
                  <strong>Jalankan Query:</strong> Klik tombol hijau <strong className="text-emerald-700">"Run"</strong> di pojok kanan bawah editor Supabase. Setelah selesai, kembali ke MitraStore lalu klik <strong>"Unggah Data Sekarang"</strong>.
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <a
                href={sqlEditorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka SQL Editor Supabase</span>
              </a>

              <button
                type="button"
                onClick={handleCopySql}
                className="px-3.5 py-2 rounded-xl bg-[#800020] text-white font-bold text-xs hover:bg-[#660019] transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Berhasil Disalin!' : 'Salin Skrip SQL'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSqlCode(!showSqlCode)}
                className="px-3 py-2 rounded-xl border border-amber-300 bg-white hover:bg-amber-50 font-bold text-xs text-amber-900 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Code className="w-3.5 h-3.5 text-amber-700" />
                <span>{showSqlCode ? 'Tutup Kode' : 'Lihat Skrip SQL'}</span>
                {showSqlCode ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* Preview Kode SQL jika dibuka */}
            {showSqlCode && (
              <div className="mt-3 relative">
                <div className="flex items-center justify-between pb-1.5 px-2 text-[10px] text-stone-500 font-mono">
                  <span>supabase/schema.sql (PostgreSQL)</span>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="text-[#800020] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-2.5 h-2.5" />
                    <span>Salin Semua</span>
                  </button>
                </div>
                <pre className="max-h-56 overflow-y-auto text-[10px] font-mono bg-stone-900 text-stone-200 p-3 rounded-xl border border-stone-800 leading-relaxed scrollbar-thin select-all">
                  {sqlScript}
                </pre>
              </div>
            )}
          </div>

          {/* Seed result feedback */}
          {seedResult && (
            <div className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
              seedResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-[#800020]'
            }`}>
              {seedResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-[#800020] shrink-0" />}
              <span>{seedResult.message}</span>
            </div>
          )}

          {/* Sinkronisasi Data Produk ke Supabase */}
          <div className="p-3.5 rounded-2xl bg-[#FFF5F7] border border-[#FCE4E8] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-bold text-black">
                <UploadCloud className="w-4 h-4 text-[#800020]" />
                <span>Unggah &amp; Sinkronkan Data ke Supabase</span>
              </div>
              <span className="text-[11px] text-stone-500 font-medium">
                {products.length} Produk · {customers.length} Pelanggan · {transactions.length} Transaksi
              </span>
            </div>
            
            <p className="text-[11px] text-stone-600 leading-relaxed">
              Klik tombol di bawah setelah tabel SQL selesai dibuat di Supabase untuk mengunggah seluruh produk toko kue, loyang, dan data pelanggan langsung ke database cloud.
            </p>

            <button
              type="button"
              onClick={handleSeed}
              disabled={isSupabaseSyncing}
              className="w-full py-2.5 rounded-xl bg-[#800020] hover:bg-[#660019] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <UploadCloud className={`w-4 h-4 ${isSupabaseSyncing ? 'animate-bounce' : ''}`} />
              <span>{isSupabaseSyncing ? 'Mengunggah ke Supabase...' : 'Unggah Data Sekarang ke Supabase'}</span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#FCE4E8] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-stone-500 font-medium">
            <Server className="w-3.5 h-3.5 text-[#3ECF8E]" />
            <span>Supabase Cloud PostgreSQL</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-black bg-[#FCE8EB] hover:bg-[#F8CCD4] rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
