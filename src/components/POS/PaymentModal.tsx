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
  Info,
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

      ctx.fillStyle = selectedMethod === 'shopeepay' ? '#800020' : '#000000';

      const drawFinder = (startX: number, startY: number) => {
        ctx.fillRect(startX * cellSize, startY * cellSize, 7 * cellSize, 7 * cellSize);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect((startX + 1) * cellSize, (startY + 1) * cellSize, 5 * cellSize, 5 * cellSize);
        ctx.fillStyle = selectedMethod === 'shopeepay' ? '#800020' : '#000000';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-[#FCE4E8] max-w-xl w-full p-5 sm:p-6 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto text-black">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#FCE4E8]">
          <div>
            <h3 className="font-black text-base text-black">
              Metode Pembayaran
            </h3>
            <p className="text-xs text-stone-600">
              Pilih pembayaran digital atau tunai
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full text-stone-500 hover:text-black hover:bg-[#FCE8EB] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bill Total Banner in Maroon */}
        <div className="mt-4 p-4 rounded-2xl bg-[#800020] text-white flex items-center justify-between shadow-md shadow-rose-950/20">
          <div>
            <span className="text-[10px] text-pink-200 uppercase tracking-wider font-black">
              Total Tagihan
            </span>
            {selectedCustomer && (
              <div className="text-xs text-white font-bold">
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
          <label className="block text-xs font-bold text-black mb-2">
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
                  className={`p-2.5 rounded-2xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#800020] bg-[#FCE8EB] text-[#800020] ring-2 ring-[#800020]/20 shadow-2xs font-bold'
                      : 'border-[#FCE4E8] bg-white text-black hover:border-[#F8CCD4] hover:bg-[#FFF5F7]'
                  }`}
                >
                  <div className="font-extrabold truncate">{m.label}</div>
                  <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                    {m.id === 'tunai' ? 'Kembalian' : 'Instan'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Method Specific View */}
        <div className="mt-4 p-4 rounded-2xl border border-[#FCE4E8] bg-[#FFF5F7]">
          
          {/* QRIS / ShopeePay View */}
          {(selectedMethod === 'qris' || selectedMethod === 'shopeepay') && (
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
              <div className="p-3 bg-white rounded-2xl shadow-2xs border border-[#FCE4E8] shrink-0">
                <canvas ref={qrCanvasRef} className="w-36 h-36 mx-auto block" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-extrabold rounded-lg bg-[#FCE8EB] text-[#800020] border border-[#F8CCD4]">
                  {selectedMethod === 'shopeepay' ? 'ShopeePay Merchant QR' : 'QRIS Standar Nasional'}
                </div>
                <h4 className="text-sm font-black text-black">
                  Pindai {formatRupiah(cartTotal)}
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed font-medium">
                  Buka aplikasi Shopee, BCA, Gojek, OVO, atau mobile banking apa saja. Arahkan kamera ke QR di layar.
                </p>
                <div className="text-[11px] text-emerald-700 font-bold">
                  Verifikasi pembayaran otomatis real-time.
                </div>
              </div>
            </div>
          )}

          {/* Cash Tunai View */}
          {selectedMethod === 'tunai' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Uang Tunai Diterima:
                </label>
                <input
                  type="text"
                  value={cashAmountInput}
                  onChange={(e) => setCashAmountInput(e.target.value)}
                  className="w-full px-3 py-2 text-base font-black font-mono rounded-xl border border-[#FCE4E8] bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#800020]"
                  placeholder="0"
                />
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickCash(cartTotal)}
                  className="px-2.5 py-1 text-xs font-extrabold rounded-xl bg-[#FCE8EB] text-[#800020] hover:bg-[#F8CCD4] border border-[#F8CCD4] cursor-pointer"
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
                      className="px-2.5 py-1 text-xs font-bold font-mono rounded-xl bg-white border border-[#FCE4E8] text-black hover:bg-[#FCE8EB] hover:text-[#800020] cursor-pointer transition-colors"
                    >
                      {formatRupiah(amount)}
                    </button>
                  ))}
              </div>

              {/* Change calculation */}
              <div className={`p-3 rounded-xl text-xs flex justify-between items-center ${
                isCashInsufficient
                  ? 'bg-rose-100 text-[#800020] border border-rose-300 font-bold'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold'
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
            <div className="space-y-1.5 text-xs text-stone-700">
              <div className="font-extrabold text-black">
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
            className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#FCE4E8] bg-white text-black focus:outline-none focus:ring-1 focus:ring-[#800020]"
          />
        </div>

        {errorMessage && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[#800020] text-xs font-bold flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Confirm Action Button */}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-2xl cursor-pointer transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isProcessing || isCashInsufficient}
            onClick={handleConfirmPayment}
            className={`flex-1 py-2.5 text-xs font-bold text-white rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 ${
              isProcessing || isCashInsufficient
                ? 'bg-stone-300 cursor-not-allowed text-stone-500'
                : 'bg-[#800020] hover:bg-[#660019] active:scale-[0.99] cursor-pointer'
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
