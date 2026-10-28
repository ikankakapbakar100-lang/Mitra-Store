/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { 
  Bluetooth, 
  X, 
  CheckCircle2, 
  Printer, 
  RefreshCw, 
  FileText, 
  HelpCircle,
  Unplug
} from 'lucide-react';

interface BluetoothPrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BluetoothPrinterModal: React.FC<BluetoothPrinterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { 
    bluetoothStatus, 
    connectBluetooth, 
    disconnectBluetooth, 
    testBluetoothPrint,
    setBluetoothPaperType
  } = usePOS();

  const [isConnecting, setIsConnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnect = async () => {
    setIsConnecting(true);
    setTestResult(null);
    try {
      await connectBluetooth();
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTestPrint = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const ok = await testBluetoothPrint();
      if (ok) {
        setTestResult('Uji coba cetak struk berhasil dikirim ke printer.');
      } else {
        setTestResult('Gagal mencetak. Pastikan printer menyala dan terkoneksi.');
      }
    } catch {
      setTestResult('Terjadi kendala saat mencetak uji coba.');
    } finally {
      setIsTesting(false);
      setTimeout(() => setTestResult(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 text-black">
      <div className="bg-white rounded-3xl shadow-2xl border border-[#FCE4E8] max-w-md w-full p-5 sm:p-6 animate-in zoom-in-95 duration-150 space-y-4">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-[#FCE4E8]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FCE8EB] text-[#800020] flex items-center justify-center shrink-0">
              <Bluetooth className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-black">
                Printer Bluetooth Kasir
              </h3>
              <p className="text-[11px] text-stone-500">
                Hubungkan printer thermal struk mini atau kasir
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-black hover:bg-[#FCE8EB] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Card */}
        <div className={`p-4 rounded-2xl border transition-all ${
          bluetoothStatus.isConnected
            ? 'bg-emerald-50/80 border-emerald-200'
            : 'bg-[#FFF8F8] border-[#FCE4E8]'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
                bluetoothStatus.isConnected
                  ? 'bg-emerald-600 text-white'
                  : 'bg-stone-200 text-stone-600'
              }`}>
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-black">
                    {bluetoothStatus.deviceName || 'Printer Belum Terhubung'}
                  </span>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    bluetoothStatus.isConnected ? 'bg-emerald-500' : 'bg-stone-400'
                  }`} />
                </div>
                <p className="text-[11px] text-stone-600 mt-0.5">
                  {bluetoothStatus.statusMessage}
                </p>
              </div>
            </div>

            {bluetoothStatus.isConnected && (
              <button
                type="button"
                onClick={disconnectBluetooth}
                className="p-1.5 rounded-xl text-stone-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Putuskan Bluetooth"
              >
                <Unplug className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Pilihan Ukuran Kertas Struk */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-black flex items-center justify-between">
            <span>Ukuran Kertas Thermal Struk</span>
            <span className="text-[10px] text-stone-500 font-normal">Pilih sesuai printer Anda</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setBluetoothPaperType('58mm')}
              className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                bluetoothStatus.printerType === '58mm'
                  ? 'bg-[#800020] text-white border-[#800020] shadow-xs'
                  : 'bg-white text-stone-700 border-[#FCE4E8] hover:bg-[#FFF5F7]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>58mm (Standar Mini)</span>
            </button>
            <button
              type="button"
              onClick={() => setBluetoothPaperType('80mm')}
              className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                bluetoothStatus.printerType === '80mm'
                  ? 'bg-[#800020] text-white border-[#800020] shadow-xs'
                  : 'bg-white text-stone-700 border-[#FCE4E8] hover:bg-[#FFF5F7]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>80mm (Lebar Desktop)</span>
            </button>
          </div>
        </div>

        {/* Feedback Pesan Uji Coba */}
        {testResult && (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{testResult}</span>
          </div>
        )}

        {/* Tombol Aksi Koneksi & Test Print */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            disabled={isConnecting}
            onClick={handleConnect}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold text-white transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer ${
              isConnecting
                ? 'bg-stone-400 cursor-not-allowed'
                : 'bg-[#800020] hover:bg-[#660019]'
            }`}
          >
            {isConnecting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Mencari Printer...</span>
              </>
            ) : (
              <>
                <Bluetooth className="w-3.5 h-3.5" />
                <span>{bluetoothStatus.isConnected ? 'Ganti Printer Bluetooth' : 'Hubungkan Bluetooth'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={isTesting}
            onClick={handleTestPrint}
            className="py-2.5 px-3 rounded-xl text-xs font-bold text-[#800020] bg-[#FCE8EB] hover:bg-[#F8CCD4] border border-[#F8CCD4] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
          >
            {isTesting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Mencetak...</span>
              </>
            ) : (
              <>
                <Printer className="w-3.5 h-3.5" />
                <span>Uji Coba Cetak Struk</span>
              </>
            )}
          </button>
        </div>

        {/* Panduan Ringkas Cara Menghubungkan */}
        <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-[11px] text-stone-600 space-y-1.5">
          <div className="font-bold text-black flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-[#800020]" />
            <span>Petunjuk Koneksi Printer Bluetooth Thermal:</span>
          </div>
          <ol className="list-decimal pl-4 space-y-0.5 text-[10px] leading-relaxed">
            <li>Nyalakan printer kasir thermal dan pastikan lampu indikator menyala.</li>
            <li>Pastikan Bluetooth di perangkat Anda (laptop/HP/tablet) sudah aktif.</li>
            <li>Klik tombol <strong>Hubungkan Bluetooth</strong>, lalu pilih nama printer (misal: RPP02, GOOJPRT, POS-58).</li>
            <li>Lakukan <strong>Uji Coba Cetak Struk</strong> untuk memastikan printer merespons.</li>
          </ol>
        </div>

        {/* Tutup Modal */}
        <div className="pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
