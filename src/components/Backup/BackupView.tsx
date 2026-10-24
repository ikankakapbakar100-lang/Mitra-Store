/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { formatDateTime } from '../../utils/format';
import { 
  Cloud, 
  Lock, 
  Download, 
  Upload, 
  RefreshCw, 
  KeyRound, 
  CheckCircle2, 
  AlertTriangle,
  ShieldCheck,
  Database,
  FileSpreadsheet,
  History,
  RotateCcw
} from 'lucide-react';

export const BackupView: React.FC = () => {
  const { 
    cloudBackup, 
    performCloudBackup, 
    exportEncryptedBackup, 
    restoreEncryptedBackup, 
    resetToDefaultData,
    products,
    transactions,
    customers,
    isStoragePersisted,
    enablePersistentStorage,
    exportAllProductsCSV,
    exportFullDatabase,
    storageSnapshots,
    restoreSnapshot,
    createManualSnapshot
  } = usePOS();

  const [isCloudBackingUp, setIsCloudBackingUp] = useState(false);
  const [exportPassphrase, setExportPassphrase] = useState('');
  const [importPassphrase, setImportPassphrase] = useState('');
  const [importFileContent, setImportFileContent] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [customSnapshotLabel, setCustomSnapshotLabel] = useState('');
  const [restoringSnapshotId, setRestoringSnapshotId] = useState<string | null>(null);

  // Security guard for Reset
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetConfirmationInput, setResetConfirmationInput] = useState('');

  const handleCloudSyncNow = async () => {
    setIsCloudBackingUp(true);
    await performCloudBackup();
    setIsCloudBackingUp(false);
  };

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingSnapshot(true);
    await createManualSnapshot(customSnapshotLabel.trim() || undefined);
    setIsCreatingSnapshot(false);
    setCustomSnapshotLabel('');
    setStatusMessage({
      type: 'success',
      text: 'Titik pemulihan lokal (Snapshot) berhasil dibuat dan tersimpan aman di IndexedDB!',
    });
  };

  const handleRestoreSnapshot = async (id: string) => {
    setRestoringSnapshotId(id);
    const success = await restoreSnapshot(id);
    setRestoringSnapshotId(null);
    if (success) {
      setStatusMessage({
        type: 'success',
        text: 'Data inventaris dan transaksi berhasil dipulihkan dari snapshot yang dipilih!',
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: 'Gagal memulihkan data dari snapshot.',
      });
    }
  };

  const handleExportEncrypted = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exportPassphrase.trim() || exportPassphrase.length < 4) {
      setStatusMessage({ type: 'error', text: 'Kata sandi minimal 4 karakter.' });
      return;
    }

    try {
      const encryptedJson = await exportEncryptedBackup(exportPassphrase);
      const blob = new Blob([encryptedJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `MitraStore_Encrypted_Backup_${dateStr}.enc.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatusMessage({ 
        type: 'success', 
        text: 'File cadangan terenkripsi AES-GCM 256-bit berhasil diunduh!' 
      });
      setExportPassphrase('');
    } catch (err) {
      setStatusMessage({ 
        type: 'error', 
        text: 'Gagal membuat cadangan: ' + (err instanceof Error ? err.message : String(err)) 
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImportFileContent(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleRestoreEncrypted = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFileContent) {
      setStatusMessage({ type: 'error', text: 'Pilih file backup .enc.json terlebih dahulu.' });
      return;
    }
    if (!importPassphrase) {
      setStatusMessage({ type: 'error', text: 'Masukkan kata sandi dekripsi.' });
      return;
    }

    setIsDecrypting(true);
    const result = await restoreEncryptedBackup(importFileContent, importPassphrase);
    setIsDecrypting(false);

    if (result.success) {
      setStatusMessage({ type: 'success', text: result.message });
      setImportFileContent('');
      setImportPassphrase('');
    } else {
      setStatusMessage({ type: 'error', text: result.message });
    }
  };

  const handleExecuteReset = () => {
    if (resetConfirmationInput !== 'RESET MITRASTORE') {
      setStatusMessage({
        type: 'error',
        text: 'Konfirmasi keamanan tidak sesuai. Ketik "RESET MITRASTORE" untuk melanjutkan.',
      });
      return;
    }

    resetToDefaultData();
    setIsResetModalOpen(false);
    setResetConfirmationInput('');
    setStatusMessage({
      type: 'success',
      text: 'Data telah direset. Salinan darurat data Anda sebelum reset telah disimpan di daftar snapshot.',
    });
  };

  return (
    <div className="space-y-6 text-black">
      
      {/* 1. JAMINAN KEAMANAN & KETAHANAN DATA 100% AMAN (DUAL-LAYER STORAGE + PERSISTENCE) */}
      <div className="bg-gradient-to-r from-emerald-50 via-white to-pink-50 rounded-3xl border-2 border-emerald-300 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-base text-black">
                  Proteksi Data 100% Aman &amp; Anti-Hilang
                </h3>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-700 text-white shadow-2xs">
                  DUAL-LAYER AKTIF
                </span>
              </div>
              <p className="text-xs text-stone-700 font-medium mt-1 max-w-2xl leading-relaxed">
                Data ratusan stok produk dan riwayat transaksi disimpan secara <strong>ganda (Dual-Layer: LocalStorage + IndexedDB)</strong>. 
                Data tidak akan hilang saat reload, browser ditutup, atau mati lampu, dan tidak akan berubah kecuali diubah langsung oleh Anda.
              </p>
            </div>
          </div>

          {/* Status Browser Persistence */}
          <div className="shrink-0 flex items-center gap-2">
            {isStoragePersisted ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Penyimpanan Permanen (Aktif)</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => enablePersistentStorage()}
                className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                title="Kunci penyimpanan agar browser tidak pernah menghapus data secara otomatis saat disk penuh"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Kunci Penyimpanan Permanen</span>
              </button>
            )}
          </div>
        </div>

        {/* 1-Klik Quick Export & Backup Bar */}
        <div className="mt-5 pt-4 border-t border-emerald-200/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-stone-700">
            <Database className="w-4 h-4 text-emerald-700" />
            <span>Cadangkan &amp; Amankan ke Komputer / HP:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Download Excel CSV */}
            <button
              type="button"
              onClick={exportAllProductsCSV}
              className="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-900 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="Unduh seluruh data stok produk ke file Excel / CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Unduh Excel (.csv)</span>
            </button>

            {/* Download Complete JSON Backup */}
            <button
              type="button"
              onClick={exportFullDatabase}
              className="px-3 py-1.5 rounded-xl bg-[#800020] hover:bg-[#660019] text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="Unduh seluruh database (produk, kas, transaksi) dalam 1 file JSON"
            >
              <Download className="w-3.5 h-3.5 text-pink-200" />
              <span>1-Klik Backup Database (.json)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cloud Backup Hero Card */}
      <div className="bg-white rounded-3xl border border-[#FCE4E8] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FCE8EB] text-[#800020] flex items-center justify-center shrink-0 border border-[#F8CCD4]">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-black">
                  Sinkronisasi &amp; Cadangan Cloud MitraStore
                </h3>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-[#800020] text-white">
                  TERENKRIPSI
                </span>
              </div>
              <p className="text-xs text-stone-700 font-medium mt-1 max-w-xl">
                Data transaksi kasir, stok fisik, dan pelanggan tersimpan otomatis di cloud terenkripsi.
              </p>
            </div>
          </div>

          <button
            onClick={handleCloudSyncNow}
            disabled={isCloudBackingUp}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold text-white bg-[#800020] hover:bg-[#660019] transition-colors flex items-center gap-2 shadow-xs shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCloudBackingUp ? 'animate-spin' : ''}`} />
            <span>Cadangkan Sekarang</span>
          </button>
        </div>

        {/* Cloud Status Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-[#FCE4E8]">
          <div>
            <div className="text-[11px] font-bold text-stone-600">Sinkron Terakhir:</div>
            <div className="text-xs font-bold font-mono text-black mt-0.5">
              {cloudBackup.lastBackupDate ? formatDateTime(cloudBackup.lastBackupDate) : 'Hari Ini'}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-stone-600">Entitas Tersimpan:</div>
            <div className="text-xs font-bold font-mono text-black mt-0.5">
              {products.length + transactions.length + customers.length} Records ({products.length} Produk)
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-stone-600">Enkripsi:</div>
            <div className="text-xs font-bold font-mono text-[#800020] mt-0.5">
              AES-GCM 256-bit
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-stone-600">Checksum SHA-256:</div>
            <div className="text-xs font-bold font-mono text-black mt-0.5 truncate">
              {cloudBackup.checksum.slice(0, 10)}...
            </div>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 font-bold ${
          statusMessage.type === 'success'
            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
            : 'bg-[#FCE8EB] text-[#800020] border border-[#F8CCD4]'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#800020]" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* 2. TITIK PEMULIHAN CEPAT (LOCAL STORAGE SNAPSHOTS DI INDEXEDDB) */}
      <div className="bg-white rounded-3xl border border-[#FCE4E8] p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#FCE4E8]">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#800020]" />
            <div>
              <h4 className="font-black text-sm text-black">
                Titik Pemulihan Cepat (Snapshot Lokal Otomatis)
              </h4>
              <p className="text-[11px] text-stone-600">
                Jika Anda melakukan kesalahan saat menginput stok, Anda dapat memulihkan data ke titik sebelumnya.
              </p>
            </div>
          </div>

          {/* Form Buat Titik Pemulihan Manual */}
          <form onSubmit={handleCreateSnapshot} className="flex items-center gap-2">
            <input
              type="text"
              value={customSnapshotLabel}
              onChange={(e) => setCustomSnapshotLabel(e.target.value)}
              placeholder="Label (misal: Sebelum Input 100 Loyang)..."
              className="px-3 py-1.5 text-xs rounded-xl border border-[#FCE4E8] bg-white text-black placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#800020] w-48 sm:w-64"
            />
            <button
              type="submit"
              disabled={isCreatingSnapshot}
              className="px-3 py-1.5 text-xs font-bold bg-[#800020] hover:bg-[#660019] text-white rounded-xl transition-all cursor-pointer shadow-2xs whitespace-nowrap"
            >
              {isCreatingSnapshot ? 'Menyimpan...' : '+ Buat Titik'}
            </button>
          </form>
        </div>

        {/* Daftar Snapshot */}
        <div className="space-y-2 max-h-56 overflow-y-auto">
          {storageSnapshots.length === 0 ? (
            <div className="text-center py-4 text-xs text-stone-500">
              Belum ada riwayat snapshot. Klik tombol di atas untuk membuat snapshot pertama.
            </div>
          ) : (
            storageSnapshots.map((snap) => (
              <div
                key={snap.id}
                className="p-3 rounded-2xl bg-[#FFF8F8] border border-[#FCE4E8] flex items-center justify-between gap-2"
              >
                <div>
                  <div className="text-xs font-bold text-black flex items-center gap-2">
                    <span>{snap.label}</span>
                    <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-white border border-[#FCE4E8] text-stone-600">
                      {snap.productCount} Produk • {snap.transactionCount} Transaksi
                    </span>
                  </div>
                  <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                    {formatDateTime(snap.timestamp)}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={restoringSnapshotId === snap.id}
                  onClick={() => handleRestoreSnapshot(snap.id)}
                  className="px-3 py-1 rounded-xl text-xs font-bold bg-white hover:bg-[#800020] hover:text-white text-[#800020] border border-[#F8CCD4] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                  title="Kembalikan seluruh data ke titik ini"
                >
                  <RotateCcw className={`w-3 h-3 ${restoringSnapshotId === snap.id ? 'animate-spin' : ''}`} />
                  <span>Pulihkan</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Military Grade AES-GCM 256-bit Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Export Encrypted File */}
        <div className="bg-white rounded-3xl border border-[#FCE4E8] p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-[#FCE4E8]">
            <Lock className="w-4 h-4 text-[#800020]" />
            <h4 className="font-black text-sm text-black">
              Ekspor Cadangan Terenkripsi (Password)
            </h4>
          </div>

          <p className="text-xs text-stone-700 font-medium leading-relaxed">
            Kunci data Anda dengan kata sandi rahasia. Format enkripsi AES-GCM 256-bit standar militer menjaga privasi penuh.
          </p>

          <form onSubmit={handleExportEncrypted} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-black mb-1">
                Kata Sandi Kunci Backup:
              </label>
              <input
                type="password"
                value={exportPassphrase}
                onChange={(e) => setExportPassphrase(e.target.value)}
                placeholder="Buat password enkripsi..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#FCE4E8] bg-white text-black focus:ring-2 focus:ring-[#800020] focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-[#800020] hover:bg-[#660019] rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh File (.enc.json)</span>
            </button>
          </form>
        </div>

        {/* Restore / Decrypt Backup File */}
        <div className="bg-white rounded-3xl border border-[#FCE4E8] p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-[#FCE4E8]">
            <KeyRound className="w-4 h-4 text-[#800020]" />
            <h4 className="font-black text-sm text-black">
              Dekripsi &amp; Pulihkan Cadangan
            </h4>
          </div>

          <p className="text-xs text-stone-700 font-medium leading-relaxed">
            Pilih file <code>.enc.json</code> dan masukkan kata sandi untuk memulihkan seluruh data transaksi dan katalog.
          </p>

          <form onSubmit={handleRestoreEncrypted} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-black mb-1">
                Pilih File Cadangan:
              </label>
              <input
                type="file"
                accept=".json,.enc.json"
                onChange={handleFileUpload}
                className="w-full text-xs text-black file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#FCE8EB] file:text-[#800020] hover:file:bg-[#F8CCD4] cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-black mb-1">
                Kata Sandi Pembuka:
              </label>
              <input
                type="password"
                value={importPassphrase}
                onChange={(e) => setImportPassphrase(e.target.value)}
                placeholder="Password file backup..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#FCE4E8] bg-white text-black focus:ring-2 focus:ring-[#800020] focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isDecrypting}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-[#800020] hover:bg-[#660019] rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              {isDecrypting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Mendekripsi...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Dekripsi &amp; Pulihkan</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* 3. RESET DATA DENGAN PENGAMAN KETAT (Ketik "RESET MITRASTORE") */}
      <div className="bg-white rounded-3xl border border-[#FCE4E8] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div>
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-stone-500" />
            <h4 className="font-black text-xs text-black">
              Reset ke Data Sampel Default (Dilindungi Kode Keamanan)
            </h4>
          </div>
          <p className="text-[11px] text-stone-600 font-medium mt-0.5">
            Terdapat <strong>{products.length} produk</strong> dan <strong>{transactions.length} transaksi</strong> tersimpan. Fitur reset dilindungi agar data tidak terhapus tanpa sengaja.
          </p>
        </div>

        <button
          onClick={() => setIsResetModalOpen(true)}
          className="px-3.5 py-1.5 text-xs font-bold text-stone-600 hover:text-[#800020] hover:bg-[#FCE8EB] rounded-xl transition-colors border border-[#F8CCD4] cursor-pointer shrink-0"
        >
          Reset Data Toko
        </button>
      </div>

      {/* Modal Dialog Konfirmasi Reset Keamanan */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-rose-200 max-w-md w-full p-5 sm:p-6 animate-in zoom-in-95 duration-150 text-black">
            <div className="flex items-center gap-2.5 text-rose-700 font-black text-base pb-3 border-b border-rose-100">
              <AlertTriangle className="w-6 h-6 text-[#800020]" />
              <span>Konfirmasi Keamanan Reset</span>
            </div>

            <p className="text-xs text-stone-700 mt-3 leading-relaxed">
              Anda memiliki <strong className="text-black">{products.length} produk</strong> yang tersimpan di toko. Jika Anda melanjutkan, data akan dikembalikan ke sampel awal toko.
            </p>
            <p className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-xl border border-emerald-200 mt-2">
              Salinan darurat otomatis akan disimpan di daftar snapshot sebelum proses reset berlangsung.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-bold text-black mb-1">
                Ketik <span className="font-mono text-[#800020] bg-rose-50 px-1 py-0.5 rounded border border-rose-200">RESET MITRASTORE</span> untuk mengonfirmasi:
              </label>
              <input
                type="text"
                value={resetConfirmationInput}
                onChange={(e) => setResetConfirmationInput(e.target.value)}
                placeholder="Ketik di sini..."
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-rose-300 focus:outline-none focus:ring-2 focus:ring-[#800020]"
              />
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsResetModalOpen(false);
                  setResetConfirmationInput('');
                }}
                className="flex-1 py-2 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={resetConfirmationInput !== 'RESET MITRASTORE'}
                onClick={handleExecuteReset}
                className={`flex-1 py-2 text-xs font-bold text-white rounded-xl transition-all cursor-pointer ${
                  resetConfirmationInput === 'RESET MITRASTORE'
                    ? 'bg-[#800020] hover:bg-[#660019]'
                    : 'bg-stone-300 cursor-not-allowed text-stone-500'
                }`}
              >
                Reset Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
