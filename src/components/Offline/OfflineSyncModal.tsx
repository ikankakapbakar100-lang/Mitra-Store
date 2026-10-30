/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  HardDrive, 
  CheckCircle2, 
  Download, 
  X, 
  ShieldCheck, 
  Clock, 
  AlertTriangle 
} from 'lucide-react';
import { formatRupiah } from '../../utils/format';

interface OfflineSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfflineSyncModal: React.FC<OfflineSyncModalProps> = ({ isOpen, onClose }) => {
  const { 
    isOnline, 
    offlineQueue, 
    isSyncingOffline, 
    syncOfflineTransactions 
  } = usePOS();

  const { canInstall, isInstalled, installApp } = usePWAInstall();
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleManualSync = async () => {
    setSyncResult(null);
    const res = await syncOfflineTransactions();
    setSyncResult({
      success: res.success,
      message: res.message || (res.success ? 'Sinkronisasi berhasil!' : 'Gagal menyinkronkan data.'),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-[#FCE4E8] max-w-lg w-full p-5 sm:p-6 transition-all duration-200 text-black">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#FCE4E8]">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs ${
              isOnline ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
            }`}>
              {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base text-black">
                  Status Jaringan &amp; Penyimpanan Offline
                </h3>
              </div>
              <p className="text-[11px] text-stone-600 font-medium">
                Penyimpanan lokal (IndexedDB + Service Worker)
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

        {/* Content */}
        <div className="py-4 space-y-4">
          
          {/* Status Box */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
            isOnline 
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' 
              : 'bg-amber-50/90 border-amber-200 text-amber-950'
          }`}>
            <div className="flex items-center gap-3">
              <span className="relative flex h-3.5 w-3.5">
                {isOnline ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
                )}
              </span>
              <div>
                <h4 className="font-extrabold text-xs">
                  {isOnline ? 'Terhubung ke Internet (Online)' : 'Mode Offline Aktif (Tanpa Internet)'}
                </h4>
                <p className="text-[11px] text-stone-600 font-medium mt-0.5">
                  {isOnline 
                    ? 'Aplikasi berjalan lancar dan data tersinkronisasi otomatis.'
                    : 'Jangan khawatir! Kasir tetap dapat bertransaksi. Data disimpan aman di perangkat.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncingOffline || !isOnline}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-stone-200 hover:bg-stone-50 disabled:opacity-50 transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer"
              title="Cek & Sinkronkan"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingOffline ? 'animate-spin' : ''}`} />
              <span>{isSyncingOffline ? 'Sinkron...' : 'Cek Sync'}</span>
            </button>
          </div>

          {/* Sync Result Banner if any */}
          {syncResult && (
            <div className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
              syncResult.success 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-[#800020]'
            }`}>
              {syncResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-[#800020] shrink-0" />
              )}
              <span>{syncResult.message}</span>
            </div>
          )}

          {/* Offline Queue Information */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-black px-1">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#800020]" />
                Antrean Transaksi Tersimpan Lokal:
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                offlineQueue.length > 0 
                  ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                  : 'bg-emerald-100 text-emerald-900'
              }`}>
                {offlineQueue.length} Transaksi
              </span>
            </div>

            {offlineQueue.length === 0 ? (
              <div className="p-4 rounded-2xl bg-[#FFF5F7] border border-[#FCE4E8] text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-black">Semua Data Sudah Sinkron</p>
                <p className="text-[11px] text-stone-500">
                  Tidak ada transaksi yang tertunda di antrean offline.
                </p>
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                {offlineQueue.map((trx) => (
                  <div 
                    key={trx.id}
                    className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-mono font-bold text-black">{trx.invoiceNo}</div>
                      <div className="text-[10px] text-stone-500">
                        {new Date(trx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} · Kasir: {trx.cashierName} · {trx.paymentMethod.toUpperCase()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-extrabold text-[#800020]">{formatRupiah(trx.total)}</div>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 font-bold">
                        Menunggu Sync
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Storage & PWA Highlights */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs text-stone-700">
            <div className="flex items-center gap-2 font-bold text-black">
              <HardDrive className="w-4 h-4 text-[#800020]" />
              <span>Teknologi Offline POS MitraStore:</span>
            </div>
            <ul className="text-[11px] space-y-1 pl-4 list-disc text-stone-600">
              <li><strong>Service Worker Cache:</strong> Seluruh aset HTML, CSS, JavaScript, dan katalog produk di-cache di browser. Aplikasi tetap terbuka meski tanpa internet.</li>
              <li><strong>Dual-Layer Storage:</strong> Transaksi tersimpan ke <em>LocalStorage</em> dan <em>IndexedDB</em> (kuota besar &amp; tidak akan hilang saat browser ditutup).</li>
              <li><strong>Auto-Reconnection Sync:</strong> Saat internet terhubung kembali, sistem secara otomatis menyinkronkan seluruh transaksi yang tertunda.</li>
            </ul>
          </div>

          {/* In-App Install Prompt if available */}
          {canInstall && !isInstalled && (
            <div className="p-3 rounded-2xl bg-[#FFF0F3] border border-[#F8CCD4] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-black">
                <Download className="w-4 h-4 text-[#800020] shrink-0" />
                <span className="font-semibold">Pasang MitraStore sebagai Aplikasi di Perangkat ini</span>
              </div>
              <button
                type="button"
                onClick={installApp}
                className="px-3 py-1.5 rounded-xl bg-[#800020] text-white text-xs font-bold hover:bg-[#660019] transition-colors cursor-pointer shrink-0 shadow-2xs"
              >
                Pasang App
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="pt-2 flex items-center justify-between border-t border-[#FCE4E8]">
          <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Penyimpanan Lokal Aktif &amp; Terproteksi</span>
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
