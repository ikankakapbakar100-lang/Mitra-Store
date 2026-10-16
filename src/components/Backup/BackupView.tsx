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
  ShieldCheck
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
    customers 
  } = usePOS();

  const [isCloudBackingUp, setIsCloudBackingUp] = useState(false);
  const [exportPassphrase, setExportPassphrase] = useState('');
  const [importPassphrase, setImportPassphrase] = useState('');
  const [importFileContent, setImportFileContent] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  const handleCloudSyncNow = async () => {
    setIsCloudBackingUp(true);
    await performCloudBackup();
    setIsCloudBackingUp(false);
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

  return (
    <div className="space-y-6">
      
      {/* Cloud Backup Hero Card in Minimalist Pink & White */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-pink-100 dark:border-zinc-800 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-950/50 text-[#F43F5E] flex items-center justify-center shrink-0">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Cadangan Cloud Otomatis MitraStore
                </h3>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-pink-100 text-[#BE185D] dark:bg-pink-950/60 dark:text-pink-300">
                  REAL-TIME
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-xl">
                Data transaksi kasir, stok fisik, dan pelanggan tersimpan otomatis di cloud terenkripsi.
              </p>
            </div>
          </div>

          <button
            onClick={handleCloudSyncNow}
            disabled={isCloudBackingUp}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold text-white bg-[#F43F5E] hover:bg-[#E11D48] transition-colors flex items-center gap-2 shadow-xs shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCloudBackingUp ? 'animate-spin' : ''}`} />
            <span>Cadangkan Sekarang</span>
          </button>
        </div>

        {/* Cloud Status Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-pink-50 dark:border-zinc-800">
          <div>
            <div className="text-[11px] text-slate-400">Sinkron Terakhir:</div>
            <div className="text-xs font-bold font-mono text-slate-900 dark:text-white mt-0.5">
              {cloudBackup.lastBackupDate ? formatDateTime(cloudBackup.lastBackupDate) : 'Hari Ini'}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Entitas Tersimpan:</div>
            <div className="text-xs font-bold font-mono text-slate-900 dark:text-white mt-0.5">
              {products.length + transactions.length + customers.length} Records
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Enkripsi:</div>
            <div className="text-xs font-bold font-mono text-[#F43F5E] mt-0.5">
              AES-GCM 256-bit
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Checksum SHA-256:</div>
            <div className="text-xs font-bold font-mono text-slate-500 mt-0.5 truncate">
              {cloudBackup.checksum.slice(0, 10)}...
            </div>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 font-medium ${
          statusMessage.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200'
            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Military Grade AES-GCM 256-bit Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Export Encrypted File */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-pink-100 dark:border-zinc-800 p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-pink-100 dark:border-zinc-800">
            <Lock className="w-4 h-4 text-[#F43F5E]" />
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Ekspor Cadangan Terenkripsi
            </h4>
          </div>

          <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
            Kunci data Anda dengan kata sandi rahasia. Format enkripsi AES-GCM 256-bit standar militer menjaga privasi penuh.
          </p>

          <form onSubmit={handleExportEncrypted} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                Kata Sandi Kunci Backup:
              </label>
              <input
                type="password"
                value={exportPassphrase}
                onChange={(e) => setExportPassphrase(e.target.value)}
                placeholder="Buat password enkripsi..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-pink-100 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#F43F5E]"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-[#F43F5E] dark:hover:bg-[#F43F5E] dark:hover:text-white rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Unduh File (.enc.json)</span>
            </button>
          </form>
        </div>

        {/* Restore / Decrypt Backup File */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-pink-100 dark:border-zinc-800 p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-pink-100 dark:border-zinc-800">
            <KeyRound className="w-4 h-4 text-[#F43F5E]" />
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Dekripsi &amp; Pulihkan Cadangan
            </h4>
          </div>

          <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
            Pilih file <code>.enc.json</code> dan masukkan kata sandi untuk memulihkan seluruh data transaksi dan katalog.
          </p>

          <form onSubmit={handleRestoreEncrypted} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                Pilih File Cadangan:
              </label>
              <input
                type="file"
                accept=".json,.enc.json"
                onChange={handleFileUpload}
                className="w-full text-xs text-slate-600 dark:text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-pink-50 file:text-[#F43F5E] hover:file:bg-pink-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                Kata Sandi Pembuka:
              </label>
              <input
                type="password"
                value={importPassphrase}
                onChange={(e) => setImportPassphrase(e.target.value)}
                placeholder="Password file backup..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-pink-100 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#F43F5E]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isDecrypting}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-[#F43F5E] hover:bg-[#E11D48] rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-xs"
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

      {/* Reset Data */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-pink-100 dark:border-zinc-800 p-5 flex items-center justify-between shadow-sm">
        <div>
          <h4 className="font-bold text-xs text-slate-900 dark:text-white">
            Reset ke Data Sampel Default
          </h4>
          <p className="text-[11px] text-slate-400">
            Kembalikan seluruh inventaris dan data transaksi ke pengaturan awal.
          </p>
        </div>
        {isConfirmingReset ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-rose-600">Yakin reset ke awal?</span>
            <button
              onClick={() => {
                setIsConfirmingReset(false);
                resetToDefaultData();
              }}
              className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              Ya, Reset Semua
            </button>
            <button
              onClick={() => setIsConfirmingReset(false)}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsConfirmingReset(true)}
            className="px-3.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors border border-rose-200 dark:border-rose-900 cursor-pointer"
          >
            Reset Data
          </button>
        )}
      </div>
    </div>
  );
};
