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
  Info,
  ShieldCheck,
  Database,
  FileSpreadsheet,
  History,
  RotateCcw,
  Sparkles,
  HelpCircle
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

  // Modal Konfirmasi Reset Toko
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetConfirmationInput, setResetConfirmationInput] = useState('');

  const handleCloudSyncNow = async () => {
    setIsCloudBackingUp(true);
    await performCloudBackup();
    setIsCloudBackingUp(false);
    setStatusMessage({
      type: 'success',
      text: 'Semua data transaksi dan ratusan stok produk berhasil dicadangkan dan disinkronkan.',
    });
  };

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingSnapshot(true);
    await createManualSnapshot(customSnapshotLabel.trim() || undefined);
    setIsCreatingSnapshot(false);
    setCustomSnapshotLabel('');
    setStatusMessage({
      type: 'success',
      text: 'Titik simpan data berhasil dibuat. Anda bisa kembali ke titik ini kapan saja jika ada salah input.',
    });
  };

  const handleRestoreSnapshot = async (id: string) => {
    setRestoringSnapshotId(id);
    const success = await restoreSnapshot(id);
    setRestoringSnapshotId(null);
    if (success) {
      setStatusMessage({
        type: 'success',
        text: 'Data inventaris dan transaksi toko berhasil dipulihkan dari titik simpan yang Anda pilih.',
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: 'Gagal memulihkan data dari titik simpan.',
      });
    }
  };

  const handleExportEncrypted = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exportPassphrase.trim() || exportPassphrase.length < 4) {
      setStatusMessage({ type: 'error', text: 'Kata sandi minimal 4 karakter agar aman.' });
      return;
    }

    try {
      const encryptedJson = await exportEncryptedBackup(exportPassphrase);
      const blob = new Blob([encryptedJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `MitraStore_Cadangan_Toko_${dateStr}.enc.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatusMessage({ 
        type: 'success', 
        text: 'File cadangan toko yang terkunci kata sandi berhasil diunduh ke perangkat Anda.' 
      });
      setExportPassphrase('');
    } catch (err) {
      setStatusMessage({ 
        type: 'error', 
        text: 'Gagal membuat file cadangan: ' + (err instanceof Error ? err.message : String(err)) 
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
      setStatusMessage({ type: 'error', text: 'Silakan pilih file cadangan (.enc.json) terlebih dahulu.' });
      return;
    }
    if (!importPassphrase) {
      setStatusMessage({ type: 'error', text: 'Masukkan kata sandi yang Anda buat saat menyimpan file cadangan ini.' });
      return;
    }

    setIsDecrypting(true);
    const result = await restoreEncryptedBackup(importFileContent, importPassphrase);
    setIsDecrypting(false);

    if (result.success) {
      setStatusMessage({ type: 'success', text: 'Sukses. Semua data produk dan transaksi berhasil dibuka dan dipulihkan.' });
      setImportFileContent('');
      setImportPassphrase('');
    } else {
      setStatusMessage({ type: 'error', text: 'Kata sandi salah atau isi file tidak cocok. Mohon periksa kembali.' });
    }
  };

  const handleExecuteReset = () => {
    if (resetConfirmationInput !== 'RESET MITRASTORE') {
      setStatusMessage({
        type: 'error',
        text: 'Konfirmasi tidak sesuai. Ketik "RESET MITRASTORE" persis sama untuk melanjutkan.',
      });
      return;
    }

    resetToDefaultData();
    setIsResetModalOpen(false);
    setResetConfirmationInput('');
    setStatusMessage({
      type: 'success',
      text: 'Data telah diatur ulang ke sampel awal. Salinan cadangan sebelum reset telah kami simpan di daftar titik simpan.',
    });
  };

  return (
    <div className="space-y-6 text-black">
      
      {/* 1. STATUS KEAMANAN DATA TOKO (BAHASA SEDERHANA & JELAS) */}
      <div className="bg-gradient-to-r from-emerald-50 via-white to-pink-50 rounded-3xl border-2 border-emerald-300 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-base text-black">
                  Keamanan Data Toko 100% Terlindungi
                </h3>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-700 text-white shadow-2xs">
                  PENYIMPANAN AMAN AKTIF
                </span>
              </div>
              <p className="text-xs text-stone-700 font-medium mt-1 max-w-2xl leading-relaxed">
                Data <strong>{products.length} produk cetakan/loyang</strong> dan <strong>{transactions.length} riwayat transaksi</strong> tersimpan secara ganda di memori perangkat Anda. 
                Data tidak akan hilang saat aplikasi ditutup, internet mati, atau mati lampu, dan tidak akan berubah kecuali diubah langsung oleh Anda.
              </p>
            </div>
          </div>

          {/* Status Kunci Penyimpanan */}
          <div className="shrink-0 flex items-center gap-2">
            {isStoragePersisted ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Penyimpanan Terkunci Permanen</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => enablePersistentStorage()}
                className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                title="Kunci penyimpanan agar data tidak pernah terhapus otomatis oleh browser"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Kunci Memori Permanen</span>
              </button>
            )}
          </div>
        </div>

        {/* Tombol Cepat Simpan ke Komputer / HP */}
        <div className="mt-5 pt-4 border-t border-emerald-200/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-stone-700">
            <Database className="w-4 h-4 text-emerald-700" />
            <span>Simpan Salinan Cadangan ke Komputer / HP:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Download Excel CSV */}
            <button
              type="button"
              onClick={exportAllProductsCSV}
              className="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-900 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="Unduh seluruh daftar produk dan sisa stok ke file Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Unduh Daftar Stok ke Excel</span>
            </button>

            {/* Download Complete Backup JSON */}
            <button
              type="button"
              onClick={exportFullDatabase}
              className="px-3 py-1.5 rounded-xl bg-[#800020] hover:bg-[#660019] text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="Unduh seluruh isi data toko (stok, kas, riwayat) dalam 1 file"
            >
              <Download className="w-3.5 h-3.5 text-pink-200" />
              <span>Simpan File Cadangan Toko</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. CADANGAN CLOUD OTOMATIS (BAHASA SEDERHANA) */}
      <div className="bg-white rounded-3xl border border-[#FCE4E8] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FCE8EB] text-[#800020] flex items-center justify-center shrink-0 border border-[#F8CCD4]">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-black">
                  Pencadangan Data Toko
                </h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  OTOMATIS
                </span>
              </div>
              <p className="text-xs text-stone-700 font-medium mt-1 max-w-xl">
                Setiap kali kasir selesai melayani transaksi atau Anda mengubah stok, salinan cadangan langsung diperbarui secara otomatis.
              </p>
            </div>
          </div>

          <button
            onClick={handleCloudSyncNow}
            disabled={isCloudBackingUp}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold text-white bg-[#800020] hover:bg-[#660019] transition-colors flex items-center gap-2 shadow-xs shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCloudBackingUp ? 'animate-spin' : ''}`} />
            <span>{isCloudBackingUp ? 'Sedang Menyimpan...' : 'Cadangkan Data Sekarang'}</span>
          </button>
        </div>

        {/* Ringkasan Status Cadangan (Bahasa Ramah Pengguna) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-[#FCE4E8]">
          <div>
            <div className="text-[11px] font-bold text-stone-600">Terakhir Dicadangkan:</div>
            <div className="text-xs font-bold text-black mt-0.5">
              {cloudBackup.lastBackupDate ? formatDateTime(cloudBackup.lastBackupDate) : 'Hari Ini'}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-stone-600">Jumlah Data Tersimpan:</div>
            <div className="text-xs font-bold text-black mt-0.5">
              {products.length} Produk &bull; {transactions.length} Transaksi
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-stone-600">Status Keamanan:</div>
            <div className="text-xs font-bold text-emerald-800 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sangat Aman &amp; Terlindungi</span>
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-stone-600">Kondisi File:</div>
            <div className="text-xs font-bold text-stone-900 mt-0.5">
              Utuh 100% (Bebas Rusak)
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
            <Info className="w-4 h-4 shrink-0 text-[#800020]" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* 3. TITIK PEMULIHAN CEPAT (SNAPSHOT SEBELUM INPUT STOK RATUSAN PRODUK) */}
      <div className="bg-white rounded-3xl border border-[#FCE4E8] p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#FCE4E8]">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FFF0F3] text-[#800020] flex items-center justify-center shrink-0 mt-0.5">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-black text-sm text-black flex items-center gap-2">
                <span>Titik Simpan Cepat (Snapshot Data)</span>
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-[#FCE8EB] text-[#800020]">
                  Sangat Disarankan
                </span>
              </h4>
              <p className="text-[11px] text-stone-600 leading-relaxed mt-0.5">
                Buat titik simpan <strong>sebelum Anda menginput ratusan stok baru</strong>. Jika di kemudian hari ada salah ketik jumlah stok, Anda bisa mengembalikan data ke titik ini dalam 1 klik.
              </p>
            </div>
          </div>

          {/* Form Buat Titik Simpan Baru */}
          <form onSubmit={handleCreateSnapshot} className="flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={customSnapshotLabel}
              onChange={(e) => setCustomSnapshotLabel(e.target.value)}
              placeholder="Catatan (misal: Sebelum Input 150 Loyang)..."
              className="px-3 py-1.5 text-xs rounded-xl border border-[#FCE4E8] bg-white text-black placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#800020] w-48 sm:w-60"
            />
            <button
              type="submit"
              disabled={isCreatingSnapshot}
              className="px-3.5 py-1.5 text-xs font-bold bg-[#800020] hover:bg-[#660019] text-white rounded-xl transition-all cursor-pointer shadow-2xs whitespace-nowrap"
            >
              {isCreatingSnapshot ? 'Menyimpan...' : '+ Buat Titik'}
            </button>
          </form>
        </div>

        {/* Daftar Titik Simpan Yang Ada */}
        <div className="space-y-2 max-h-56 overflow-y-auto">
          {storageSnapshots.length === 0 ? (
            <div className="text-center py-4 text-xs text-stone-500">
              Belum ada riwayat titik simpan. Ketik catatan di atas lalu klik &quot;+ Buat Titik&quot; untuk membuat titik simpan pertama.
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
                      {snap.productCount} Produk &bull; {snap.transactionCount} Transaksi
                    </span>
                  </div>
                  <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                    Tersimpan pada: {formatDateTime(snap.timestamp)}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={restoringSnapshotId === snap.id}
                  onClick={() => handleRestoreSnapshot(snap.id)}
                  className="px-3 py-1 rounded-xl text-xs font-bold bg-white hover:bg-[#800020] hover:text-white text-[#800020] border border-[#F8CCD4] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                  title="Kembalikan data produk dan transaksi ke titik ini"
                >
                  <RotateCcw className={`w-3 h-3 ${restoringSnapshotId === snap.id ? 'animate-spin' : ''}`} />
                  <span>Kembalikan Data Ini</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. SIMPAN & BUKA FILE CADANGAN DENGAN KATA SANDI (BAHASA MUDAH & INTUITIF) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Simpan File Cadangan Berpassword */}
        <div className="bg-white rounded-3xl border border-[#FCE4E8] p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-[#FCE4E8]">
            <Lock className="w-4 h-4 text-[#800020]" />
            <h4 className="font-black text-sm text-black">
              1. Simpan Cadangan Toko Berkata Sandi
            </h4>
          </div>

          <p className="text-xs text-stone-700 font-medium leading-relaxed">
            Buat kata sandi sederhana yang mudah Anda ingat, lalu unduh file cadangan. File ini sangat aman disimpan di WhatsApp, Google Drive, atau flashdisk toko.
          </p>

          <form onSubmit={handleExportEncrypted} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-black mb-1">
                Buat Kata Sandi Pengunci:
              </label>
              <input
                type="password"
                value={exportPassphrase}
                onChange={(e) => setExportPassphrase(e.target.value)}
                placeholder="Ketik password untuk mengunci file..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#FCE4E8] bg-white text-black focus:ring-2 focus:ring-[#800020] focus:outline-none"
                required
              />
              <span className="text-[10px] text-stone-500 mt-1 block">
                Ingat sandi ini untuk membuka kembali file cadangan di kemudian hari.
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-[#800020] hover:bg-[#660019] rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh File Cadangan Toko</span>
            </button>
          </form>
        </div>

        {/* Buka & Pulihkan File Cadangan */}
        <div className="bg-white rounded-3xl border border-[#FCE4E8] p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-[#FCE4E8]">
            <KeyRound className="w-4 h-4 text-[#800020]" />
            <h4 className="font-black text-sm text-black">
              2. Buka &amp; Kembalikan Data dari File Cadangan
            </h4>
          </div>

          <p className="text-xs text-stone-700 font-medium leading-relaxed">
            Jika Anda berganti laptop/HP atau ingin memulihkan data lama, pilih file cadangan yang pernah Anda unduh lalu masukkan kata sandi pembukanya.
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
                placeholder="Masukkan kata sandi pembuka file..."
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
                  <span>Membuka &amp; Memulihkan Data...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Buka &amp; Pulihkan Data Toko</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* 5. ATUR ULANG DATA TOKO (DENGAN PENGAMAN KETAT) */}
      <div className="bg-white rounded-3xl border border-[#FCE4E8] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div>
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-stone-500" />
            <h4 className="font-black text-xs text-black">
              Atur Ulang ke Data Toko Default (Dilindungi Kode Keamanan)
            </h4>
          </div>
          <p className="text-[11px] text-stone-600 font-medium mt-0.5">
            Terdapat <strong>{products.length} produk</strong> dan <strong>{transactions.length} transaksi</strong> tersimpan. Fitur ini sengaja dikunci agar data tidak terhapus tanpa sengaja.
          </p>
        </div>

        <button
          onClick={() => setIsResetModalOpen(true)}
          className="px-3.5 py-1.5 text-xs font-bold text-stone-600 hover:text-[#800020] hover:bg-[#FCE8EB] rounded-xl transition-colors border border-[#F8CCD4] cursor-pointer shrink-0"
        >
          Atur Ulang Data
        </button>
      </div>

      {/* Modal Dialog Konfirmasi Keamanan Reset */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-rose-200 max-w-md w-full p-5 sm:p-6 animate-in zoom-in-95 duration-150 text-black">
            <div className="flex items-center gap-2.5 text-[#800020] font-black text-base pb-3 border-b border-rose-100">
              <Info className="w-6 h-6 text-[#800020]" />
              <span>Konfirmasi Keamanan Atur Ulang</span>
            </div>

            <p className="text-xs text-stone-700 mt-3 leading-relaxed">
              Anda memiliki <strong className="text-black">{products.length} produk</strong> yang tersimpan di toko. Jika Anda melanjutkan, data akan diatur ulang ke sampel awal toko.
            </p>
            <p className="text-[11px] text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 mt-2 font-medium">
              Salinan darurat data Anda sebelum reset akan otomatis disimpan di daftar titik simpan.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-bold text-black mb-1">
                Ketik <span className="font-mono text-[#800020] bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">RESET MITRASTORE</span> untuk melanjutkan:
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
                Atur Ulang Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
