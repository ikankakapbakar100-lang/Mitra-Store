/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { usePOS } from '../../context/POSContext';
import { PaymentMethod } from '../../types/pos';
import { formatRupiah } from '../../utils/format';
import { 
  X, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  QrCode,
  Banknote,
  Smartphone,
  CreditCard
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose }) => {
  const { cartTotal, processCheckout, selectedCustomer } = usePOS();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('qris');
  const [cashAmountInput, setCashAmountInput] = useState<string>(cartTotal.toString());
  const [notesInput, setNotesInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync inputs on open
  useEffect(() => {
    if (isOpen) {
      setCashAmountInput(cartTotal.toString());
      setErrorMessage('');
      setNotesInput('');
      setIsProcessing(false);
    }
  }, [isOpen, cartTotal]);

  // Draw simulated QRIS pattern on canvas
  useEffect(() => {
    if (selectedMethod === 'qris' || selectedMethod === 'shopeepay') {
      const canvas = qrCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const size = 180;
      canvas.width = size;
      canvas.height = size;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, size, size);

      const matrixSize = 25;
      const cellSize = size / matrixSize;

      ctx.fillStyle = selectedMethod === 'shopeepay' ? '#F43F5E' : '#0F172A';

      const drawFinder = (startX: number, startY: number) => {
        ctx.fillRect(startX * cellSize, startY * cellSize, 7 * cellSize, 7 * cellSize);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect((startX + 1) * cellSize, (startY + 1) * cellSize, 5 * cellSize, 5 * cellSize);
        ctx.fillStyle = selectedMethod === 'shopeepay' ? '#F43F5E' : '#0F172A';
        ctx.fillRect((startX + 2) * cellSize, (startY + 2) * cellSize, 3 * cellSize, 3 * cellSize);
      };

      drawFinder(1, 1);
      drawFinder(matrixSize - 8, 1);
      drawFinder(1, matrixSize - 8);

      let seed = cartTotal;
      for (let r = 0; r < matrixSize; r++) {
        for (let c = 0; c < matrixSize; c++) {
          if (
            (r <= 8 && c <= 8) ||
            (r <= 8 && c >= matrixSize - 8) ||
            (r >= matrixSize - 8 && c <= 8)
          ) {
            continue;
          }
          seed = (seed * 9301 + 49297) % 233280;
          if (seed / 233280 > 0.5) {
            ctx.fillRect(c * cellSize, r * cellSize, cellSize - 0.5, cellSize - 0.5);
          }
        }
      }
    }
  }, [selectedMethod, cartTotal]);

  if (!isOpen) return null;

  const parsedCash = parseInt(cashAmountInput.replace(/\D/g, ''), 10) || 0;
  const changeAmount = selectedMethod === 'tunai' ? Math.max(0, parsedCash - cartTotal) : 0;
  const isCashInsufficient = selectedMethod === 'tunai' && parsedCash < cartTotal;

  const handleQuickCash = (amount: number) => {
    setCashAmountInput(amount.toString());
  };

  const handleConfirmPayment = async () => {
    setErrorMessage('');
    const finalAmountPaid = selectedMethod === 'tunai' ? parsedCash : cartTotal;

    if (selectedMethod === 'tunai' && parsedCash < cartTotal) {
      setErrorMessage('Nominal tunai yang dimasukkan kurang dari total tagihan.');
      return;
    }

    setIsProcessing(true);
    const result = await processCheckout(selectedMethod, finalAmountPaid, notesInput);
    setIsProcessing(false);

    if (result.success) {
      onClose();
    } else {
      setErrorMessage(result.error || 'Terjadi kesalahan saat memproses transaksi.');
    }
  };

  const methodsList: { id: PaymentMethod; label: string; icon: string }[] = [
    { id: 'qris', label: 'QRIS', icon: 'qris' },
    { id: 'shopeepay', label: 'ShopeePay', icon: 'shopeepay' },
    { id: 'tunai', label: 'Uang Tunai', icon: 'tunai' },
    { id: 'gopay', label: 'GoPay', icon: 'gopay' },
    { id: 'ovo', label: 'OVO', icon: 'ovo' },
    { id: 'dana', label: 'DANA', icon: 'dana' },
    { id: 'kartu', label: 'Kartu EDC', icon: 'kartu' },
    { id: 'transfer', label: 'Transfer', icon: 'transfer' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-pink-100 dark:border-zinc-800 max-w-xl w-full p-6 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-pink-100 dark:border-zinc-800">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Metode Pembayaran
            </h3>
            <p className="text-xs text-slate-400">
              Pilih pembayaran digital atau tunai
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bill Total Banner in Pink & White */}
        <div className="mt-4 p-4 rounded-2xl bg-linear-to-r from-pink-500 via-[#F43F5E] to-[#EC4899] text-white flex items-center justify-between shadow-md shadow-pink-500/20">
          <div>
            <span className="text-[10px] text-pink-100 uppercase tracking-wider font-bold">
              Total Tagihan
            </span>
            {selectedCustomer && (
              <div className="text-xs text-white font-semibold">
                {selectedCustomer.name} ({selectedCustomer.tier})
              </div>
            )}
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {formatRupiah(cartTotal)}
          </div>
        </div>

        {/* Payment Channels Grid */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-2">
            Pilihan Metode:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {methodsList.map((m) => {
              const isSelected = selectedMethod === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedMethod(m.id);
                    setErrorMessage('');
                  }}
                  className={`p-2.5 rounded-2xl border text-xs font-semibold text-left transition-all ${
                    isSelected
                      ? 'border-[#F43F5E] bg-pink-50 dark:bg-pink-950/40 text-[#F43F5E] ring-2 ring-[#F43F5E]/20 shadow-xs'
                      : 'border-pink-100 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:border-pink-200'
                  }`}
                >
                  <div className="font-bold truncate">{m.label}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {m.id === 'tunai' ? 'Kembalian' : 'Instan'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Method Specific View */}
        <div className="mt-4 p-4 rounded-2xl border border-pink-100 dark:border-zinc-800 bg-pink-50/20 dark:bg-zinc-800/40">
          
          {/* QRIS / ShopeePay View */}
          {(selectedMethod === 'qris' || selectedMethod === 'shopeepay') && (
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
              <div className="p-3 bg-white rounded-2xl shadow-xs border border-pink-100 shrink-0">
                <canvas ref={qrCanvasRef} className="w-36 h-36 mx-auto block" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold rounded-lg bg-pink-100 text-[#F43F5E] dark:bg-pink-950/60">
                  {selectedMethod === 'shopeepay' ? 'ShopeePay Merchant QR' : 'QRIS Standar Nasional'}
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Pindai {formatRupiah(cartTotal)}
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                  Buka aplikasi Shopee, BCA, Gojek, OVO, atau mobile banking apa saja. Arahkan kamera ke QR di layar.
                </p>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Verifikasi pembayaran otomatis real-time.
                </div>
              </div>
            </div>
          )}

          {/* Cash Tunai View */}
          {selectedMethod === 'tunai' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                  Uang Tunai Diterima:
                </label>
                <input
                  type="text"
                  value={cashAmountInput}
                  onChange={(e) => setCashAmountInput(e.target.value)}
                  className="w-full px-3 py-2 text-base font-bold font-mono rounded-xl border border-pink-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#F43F5E]"
                  placeholder="0"
                />
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickCash(cartTotal)}
                  className="px-2.5 py-1 text-xs font-bold rounded-xl bg-pink-100 dark:bg-pink-950 text-[#F43F5E] hover:bg-pink-200"
                >
                  Uang Pas
                </button>
                {[20000, 50000, 100000, 200000, 500000]
                  .filter((amount) => amount >= cartTotal || amount === 50000 || amount === 100000)
                  .map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => handleQuickCash(amount)}
                      className="px-2.5 py-1 text-xs font-semibold font-mono rounded-xl bg-white dark:bg-zinc-800 border border-pink-100 dark:border-zinc-700 text-slate-800 dark:text-white hover:bg-pink-50"
                    >
                      {formatRupiah(amount)}
                    </button>
                  ))}
              </div>

              {/* Change calculation */}
              <div className={`p-3 rounded-xl text-xs flex justify-between items-center ${
                isCashInsufficient
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-bold'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold'
              }`}>
                <span>{isCashInsufficient ? 'Uang Kurang:' : 'Uang Kembalian:'}</span>
                <span className="text-sm font-mono font-black">
                  {isCashInsufficient
                    ? `Kurang ${formatRupiah(cartTotal - parsedCash)}`
                    : formatRupiah(changeAmount)}
                </span>
              </div>
            </div>
          )}

          {/* E-Wallets / Cards View */}
          {(selectedMethod === 'gopay' || selectedMethod === 'ovo' || selectedMethod === 'dana' || selectedMethod === 'kartu' || selectedMethod === 'transfer') && (
            <div className="space-y-1.5 text-xs text-slate-600 dark:text-zinc-400">
              <div className="font-bold text-slate-900 dark:text-white">
                Instruksi Pembayaran {selectedMethod.toUpperCase()}
              </div>
              <p>
                {selectedMethod === 'kartu'
                  ? 'Silakan gesek / tap kartu debit atau kredit pelanggan pada mesin EDC kasir.'
                  : selectedMethod === 'transfer'
                  ? 'Minta bukti transfer mobile banking pelanggan sesuai total tagihan.'
                  : `Kirimkan tagihan ke akun ${selectedMethod.toUpperCase()} pelanggan.`}
              </p>
            </div>
          )}
        </div>

        {/* Transaction Notes */}
        <div className="mt-3">
          <input
            type="text"
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
            placeholder="Catatan transaksi (opsional)..."
            className="w-full px-3 py-1.5 text-xs rounded-xl border border-pink-100 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#F43F5E]"
          />
        </div>

        {errorMessage && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Confirm Action Button */}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-xs font-semibold text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 rounded-2xl"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isProcessing || isCashInsufficient}
            onClick={handleConfirmPayment}
            className={`flex-1 py-2.5 text-xs font-bold text-white rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 ${
              isProcessing || isCashInsufficient
                ? 'bg-slate-300 dark:bg-zinc-800 cursor-not-allowed text-slate-500'
                : 'bg-[#F43F5E] hover:bg-[#E11D48] active:scale-[0.99] cursor-pointer'
            }`}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Konfirmasi Lunas</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
