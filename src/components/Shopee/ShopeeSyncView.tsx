/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { formatDateTime } from '../../utils/format';
import { 
  ShoppingBag, 
  RefreshCw, 
  Zap, 
  Key, 
  Layers, 
  Clock, 
  CheckCircle2 
} from 'lucide-react';

export const ShopeeSyncView: React.FC = () => {
  const { 
    shopeeConfig, 
    updateShopeeConfig, 
    syncShopeeInventory, 
    simulateIncomingShopeeOrder, 
    products, 
    shopeeLogs 
  } = usePOS();

  const [partnerIdInput, setPartnerIdInput] = useState(shopeeConfig.partnerId);
  const [partnerKeyInput, setPartnerKeyInput] = useState(shopeeConfig.partnerKey);
  const [shopIdInput, setShopIdInput] = useState(shopeeConfig.shopId);
  const [shopNameInput, setShopNameInput] = useState(shopeeConfig.shopName);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showSuccessSave, setShowSuccessSave] = useState(false);

  const syncedProducts = products.filter(p => p.shopeeItemId);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateShopeeConfig({
      partnerId: partnerIdInput,
      partnerKey: partnerKeyInput,
      shopId: shopIdInput,
      shopName: shopNameInput,
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
    <div className="space-y-6 text-black">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-[#FCE4E8] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#FCE8EB] text-[#800020] flex items-center justify-center shrink-0 border border-[#F8CCD4]">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span className="text-[11px] font-bold tracking-wider uppercase text-[#800020]">
                Shopee Open Platform v2.0
              </span>
            </div>
            <h2 className="text-lg font-black text-black">
              Sinkronisasi Stok MitraStore &amp; Shopee
            </h2>
            <p className="text-xs text-stone-700 font-medium">
              Stok fisik otomatis sinkron saat ada transaksi kasir atau pesanan online di Shopee.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-[#800020] text-white hover:bg-[#660019] transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sinkronkan Sekarang</span>
          </button>
          <button
            onClick={handleSimulateOrder}
            disabled={isSimulating}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-[#FCE8EB] border border-[#F8CCD4] text-[#800020] hover:bg-[#F8CCD4] transition-all flex items-center gap-2 cursor-pointer"
            title="Simulasikan pesanan masuk dari Shopee"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Simulasi Order Shopee</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* API Credentials Configuration */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#FCE4E8] p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#FCE4E8] pb-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-[#800020]" />
              <h3 className="font-black text-sm text-black">
                Kredensial API Shopee
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-800 font-bold bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
              TERHUBUNG
            </span>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-black mb-1">
                Nama Toko Shopee:
              </label>
              <input
                type="text"
                value={shopNameInput}
                onChange={(e) => setShopNameInput(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#FCE4E8] bg-white text-black focus:ring-2 focus:ring-[#800020] focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-black mb-1">
                  Partner ID:
                </label>
                <input
                  type="text"
                  value={partnerIdInput}
                  onChange={(e) => setPartnerIdInput(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#FCE4E8] bg-white font-mono text-black focus:ring-2 focus:ring-[#800020] focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-black mb-1">
                  Shop ID:
                </label>
                <input
                  type="text"
                  value={shopIdInput}
                  onChange={(e) => setShopIdInput(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#FCE4E8] bg-white font-mono text-black focus:ring-2 focus:ring-[#800020] focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-black mb-1">
                Partner Key:
              </label>
              <input
                type="password"
                value={partnerKeyInput}
                onChange={(e) => setPartnerKeyInput(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#FCE4E8] bg-white font-mono text-black focus:ring-2 focus:ring-[#800020] focus:outline-none"
                required
              />
            </div>

            {/* 2-Way Auto Sync Switch */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FFF5F7] border border-[#FCE4E8]">
              <div>
                <div className="text-xs font-bold text-[#800020]">
                  Sinkronisasi Otomatis 2-Arah
                </div>
                <div className="text-[10px] text-stone-700 font-medium">
                  Update stok kasir &amp; Shopee secara real-time
                </div>
              </div>
              <input
                type="checkbox"
                checked={shopeeConfig.autoSyncEnabled}
                onChange={(e) => updateShopeeConfig({ autoSyncEnabled: e.target.checked })}
                className="rounded accent-[#800020] w-4 h-4 cursor-pointer"
              />
            </div>

            {showSuccessSave && (
              <div className="p-2 text-xs rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Kredensial Shopee berhasil disimpan!</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-3 text-xs font-bold text-white bg-[#800020] hover:bg-[#660019] rounded-2xl transition-colors shadow-xs cursor-pointer"
            >
              Simpan Kredensial
            </button>
          </form>
        </div>

        {/* Sync Logs & Mapped SKU List */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-white rounded-3xl border border-[#FCE4E8] p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#800020]" />
                <h3 className="font-black text-sm text-black">
                  Produk Terhubung Shopee ({syncedProducts.length})
                </h3>
              </div>
              <span className="text-[11px] text-stone-700 font-mono font-medium">
                {shopeeConfig.lastSyncTime ? formatDateTime(shopeeConfig.lastSyncTime) : 'Baru saja'}
              </span>
            </div>

            <div className="divide-y divide-[#FCE4E8] max-h-52 overflow-y-auto">
              {syncedProducts.map((p) => (
                <div key={p.id} className="py-2.5 first:pt-0 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-lg object-cover border border-[#F8CCD4]"
                    />
                    <div>
                      <div className="font-bold text-black">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-stone-700 font-mono">
                        {p.sku}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold font-mono text-black">
                      {p.stock} {p.unit}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-bold">
                      Sinkron
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sync Activity Logs */}
          <div className="bg-white rounded-3xl border border-[#FCE4E8] p-5 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#800020]" />
              <h3 className="font-black text-sm text-black">
                Log Riwayat Sinkronisasi
              </h3>
            </div>

            <div className="divide-y divide-[#FCE4E8] max-h-60 overflow-y-auto">
              {shopeeLogs.map((log) => (
                <div key={log.id} className="py-2.5 first:pt-0 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-black">
                      {log.message}
                    </span>
                    <span className="text-[10px] font-mono text-stone-700">
                      {formatDateTime(log.timestamp).split(',')[1]}
                    </span>
                  </div>
                  {log.details && (
                    <p className="text-[11px] text-stone-700 font-medium">
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
