/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { formatDateTime } from '../../utils/format';
import { 
  RefreshCw, 
  Key, 
  CheckCircle2, 
  Zap, 
  Layers, 
  Clock,
  ShoppingBag
} from 'lucide-react';

export const ShopeeSyncView: React.FC = () => {
  const { 
    shopeeConfig, 
    updateShopeeConfig, 
    shopeeLogs, 
    syncShopeeInventory, 
    simulateIncomingShopeeOrder, 
    products 
  } = usePOS();

  const [isSyncing, setIsSyncing] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [partnerIdInput, setPartnerIdInput] = useState(shopeeConfig.partnerId);
  const [shopIdInput, setShopIdInput] = useState(shopeeConfig.shopId);
  const [shopNameInput, setShopNameInput] = useState(shopeeConfig.shopName);
  const [partnerKeyInput, setPartnerKeyInput] = useState(shopeeConfig.partnerKey);
  const [accessTokenInput, setAccessTokenInput] = useState(shopeeConfig.accessToken);
  const [showSuccessSave, setShowSuccessSave] = useState(false);

  const syncedProducts = products.filter(p => p.shopeeSyncEnabled);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateShopeeConfig({
      partnerId: partnerIdInput,
      shopId: shopIdInput,
      shopName: shopNameInput,
      partnerKey: partnerKeyInput,
      accessToken: accessTokenInput,
      isConnected: true,
    });
    setShowSuccessSave(true);
    setTimeout(() => setShowSuccessSave(false), 3000);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    await syncShopeeInventory();
    setIsSyncing(false);
  };

  const handleSimulateOrder = async () => {
    setIsSimulating(true);
    await simulateIncomingShopeeOrder();
    setIsSimulating(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner in Minimalist Pink & White */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-pink-100 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-950/50 text-[#F43F5E] flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold tracking-wider uppercase text-[#F43F5E]">
                Shopee Open Platform v2.0
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Sinkronisasi Stok MitraStore &amp; Shopee
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Stok fisik otomatis sinkron saat ada transaksi kasir atau pesanan online di Shopee.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-[#F43F5E] text-white hover:bg-[#E11D48] transition-all flex items-center gap-2 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sinkronkan Sekarang</span>
          </button>
          <button
            onClick={handleSimulateOrder}
            disabled={isSimulating}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-pink-50 dark:bg-zinc-800 border border-pink-200 dark:border-zinc-700 text-[#F43F5E] hover:bg-pink-100 transition-all flex items-center gap-2"
            title="Simulasikan pesanan masuk dari Shopee"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Simulasi Order Shopee</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* API Credentials Configuration */}
        <div className="lg:col-span-5 bg-white dark:bg-zinc-900 rounded-3xl border border-pink-100 dark:border-zinc-800 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-pink-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-[#F43F5E]" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Kredensial API Shopee
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
              TERHUBUNG
            </span>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                Nama Toko Shopee:
              </label>
              <input
                type="text"
                value={shopNameInput}
                onChange={(e) => setShopNameInput(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-pink-100 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#F43F5E]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                  Partner ID:
                </label>
                <input
                  type="text"
                  value={partnerIdInput}
                  onChange={(e) => setPartnerIdInput(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-pink-100 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                  Shop ID:
                </label>
                <input
                  type="text"
                  value={shopIdInput}
                  onChange={(e) => setShopIdInput(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-pink-100 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono text-slate-900 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                Partner Key:
              </label>
              <input
                type="password"
                value={partnerKeyInput}
                onChange={(e) => setPartnerKeyInput(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-pink-100 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono text-slate-900 dark:text-white"
                required
              />
            </div>

            {/* 2-Way Auto Sync Switch */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-pink-50/60 dark:bg-zinc-800 border border-pink-100 dark:border-zinc-700">
              <div>
                <div className="text-xs font-bold text-[#F43F5E]">
                  Sinkronisasi Otomatis 2-Arah
                </div>
                <div className="text-[10px] text-slate-500">
                  Update stok kasir &amp; Shopee secara real-time
                </div>
              </div>
              <input
                type="checkbox"
                checked={shopeeConfig.autoSyncEnabled}
                onChange={(e) => updateShopeeConfig({ autoSyncEnabled: e.target.checked })}
                className="rounded accent-[#F43F5E] w-4 h-4 cursor-pointer"
              />
            </div>

            {showSuccessSave && (
              <div className="p-2 text-xs rounded-xl bg-emerald-50 text-emerald-700 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Kredensial Shopee berhasil disimpan!</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-3 text-xs font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-[#F43F5E] dark:hover:bg-[#F43F5E] dark:hover:text-white rounded-2xl transition-colors shadow-xs"
            >
              Simpan Kredensial
            </button>
          </form>
        </div>

        {/* Sync Logs & Mapped SKU List */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-pink-100 dark:border-zinc-800 p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#F43F5E]" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Produk Terhubung Shopee ({syncedProducts.length})
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {shopeeConfig.lastSyncTime ? formatDateTime(shopeeConfig.lastSyncTime) : 'Baru saja'}
              </span>
            </div>

            <div className="divide-y divide-pink-50 dark:divide-zinc-800 max-h-52 overflow-y-auto">
              {syncedProducts.map((p) => (
                <div key={p.id} className="py-2.5 first:pt-0 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={p.imageUrl || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80'}
                      alt={p.name}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-lg object-cover border border-pink-100"
                    />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {p.sku}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold font-mono text-slate-900 dark:text-white">
                      {p.stock} {p.unit}
                    </div>
                    <div className="text-[10px] text-emerald-600 font-bold">
                      Sinkron
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sync Activity Logs */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-pink-100 dark:border-zinc-800 p-5 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#F43F5E]" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Log Riwayat Sinkronisasi
              </h3>
            </div>

            <div className="divide-y divide-pink-50 dark:divide-zinc-800 max-h-60 overflow-y-auto">
              {shopeeLogs.map((log) => (
                <div key={log.id} className="py-2.5 first:pt-0 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-zinc-200">
                      {log.message}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {formatDateTime(log.timestamp).split(',')[1]}
                    </span>
                  </div>
                  {log.details && (
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      {log.details}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
