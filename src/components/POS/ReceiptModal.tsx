/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { usePOS } from '../../context/POSContext';
import { formatRupiah, formatDateTime, printReceiptOrReport } from '../../utils/format';
import { 
  Printer, 
  Bluetooth, 
  Share2, 
  CheckCircle2, 
  X, 
  Plus, 
  FileText 
} from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose }) => {
  const { 
    lastTransaction, 
    storeProfile, 
    bluetoothStatus, 
    printTransactionReceipt 
  } = usePOS();

  if (!isOpen || !lastTransaction) return null;

  const trx = lastTransaction;

  const handleBluetoothPrint = async () => {
    await printTransactionReceipt(trx);
  };

  const handlePrintWindow = () => {
    printReceiptOrReport('printable-receipt');
  };

  const handleShareWhatsApp = () => {
    let text = `*STRUK RESMI ${storeProfile.name.toUpperCase()}*\n`;
    text += `No Faktur: ${trx.invoiceNo}\n`;
    text += `Waktu: ${formatDateTime(trx.date)}\n`;
    text += `Kasir: ${trx.cashierName}\n`;
    text += `--------------------------------\n`;
    trx.items.forEach(i => {
      text += `${i.product.name} (x${i.qty}) = ${formatRupiah(i.qty * i.product.sellPrice)}\n`;
    });
    text += `--------------------------------\n`;
    text += `*TOTAL: ${formatRupiah(trx.total)}*\n`;
    text += `Metode: ${trx.paymentMethod.toUpperCase()}\n`;
    text += `Bayar: ${formatRupiah(trx.amountPaid)}\n`;
    text += `Kembalian: ${formatRupiah(trx.change)}\n`;
    text += `\n${storeProfile.footerNote}\nTerima kasih!`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-pink-100 dark:border-zinc-800 max-w-md w-full p-6 my-8 animate-in zoom-in-95 duration-150">
        
        {/* Header Action */}
        <div className="flex items-center justify-between pb-3 border-b border-pink-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <span>Transaksi Berhasil</span>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Realistic Thermal Receipt Paper Display */}
        <div className="mt-4 flex justify-center">
          <div 
            id="printable-receipt"
            className="w-full max-w-[320px] bg-white text-slate-900 p-5 rounded-t-xl font-mono text-[11px] shadow-sm border border-slate-200 select-all relative"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {/* Header info */}
            <div className="text-center space-y-0.5">
              <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900">{storeProfile.name}</h2>
              {storeProfile.tagline && <p className="text-[10px] text-slate-600">{storeProfile.tagline}</p>}
              {storeProfile.address && <p className="text-[10px] text-slate-600 leading-tight">{storeProfile.address}</p>}
              {storeProfile.phone && <p className="text-[10px] text-slate-600">Telp: {storeProfile.phone}</p>}
            </div>

            <div className="my-2 border-b border-dashed border-slate-300" />

            {/* Metadata */}
            <div className="space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>No Faktur:</span>
                <span className="font-semibold">{trx.invoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span>{formatDateTime(trx.date)}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>{trx.cashierName}</span>
              </div>
              {trx.customerName && (
                <div className="flex justify-between">
                  <span>Pelanggan:</span>
                  <span className="font-semibold">{trx.customerName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Saluran:</span>
                <span className="capitalize">{trx.channel === 'shopee' ? 'Shopee Marketplace' : 'Kasir Toko'}</span>
              </div>
            </div>

            <div className="my-2 border-b border-dashed border-slate-300" />

            {/* Items */}
            <div className="space-y-1.5 text-[10px]">
              {trx.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="font-medium text-slate-900 leading-tight">{item.product.name}</div>
                  <div className="flex justify-between text-slate-700">
                    <span>{item.qty} x {formatRupiah(item.product.sellPrice)}</span>
                    <span className="font-semibold">{formatRupiah(item.qty * item.product.sellPrice)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="my-2 border-b border-dashed border-slate-300" />

            {/* Calculations */}
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatRupiah(trx.subtotal)}</span>
              </div>
              {trx.pointsUsedDiscount && trx.pointsUsedDiscount > 0 && (
                <div className="flex justify-between text-[#F43F5E]">
                  <span>Diskon Poin:</span>
                  <span>-{formatRupiah(trx.pointsUsedDiscount)}</span>
                </div>
              )}
              {trx.tax > 0 && (
                <div className="flex justify-between">
                  <span>PPN (11%):</span>
                  <span>{formatRupiah(trx.tax)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-bold pt-1 border-t border-slate-300 text-slate-900">
                <span>TOTAL:</span>
                <span className="text-[#F43F5E]">{formatRupiah(trx.total)}</span>
              </div>
              <div className="flex justify-between">
                <span>Bayar ({trx.paymentMethod.toUpperCase()}):</span>
                <span>{formatRupiah(trx.amountPaid)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Kembalian:</span>
                <span>{formatRupiah(trx.change)}</span>
              </div>
            </div>

            <div className="my-2 border-b border-dashed border-slate-300" />

            {/* Barcode & Footer */}
            <div className="text-center space-y-1 pt-1">
              <div className="font-mono tracking-widest text-[9px] text-slate-500">
                ||||| | |||| ||| ||||||| ||| ||||
              </div>
              <p className="text-[9px] text-slate-600 leading-tight">{storeProfile.footerNote}</p>
              <div className="text-[10px] font-bold mt-1 text-slate-900">*** LUNAS ***</div>
            </div>

            {/* Perforated paper jagged cut effect */}
            <div className="absolute -bottom-2 left-0 right-0 h-2 flex overflow-hidden">
              {Array.from({ length: 24 }).map((_, i) => (
                <div 
                  key={i} 
                  className="w-3 h-3 bg-white dark:bg-zinc-900 rotate-45 transform origin-top -mt-1"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons in Minimalist Pink & White */}
        <div className="mt-6 space-y-2">
          {/* Bluetooth Thermal Print */}
          <button
            onClick={handleBluetoothPrint}
            className="w-full py-2.5 px-4 rounded-2xl text-xs font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-[#F43F5E] dark:hover:bg-[#F43F5E] dark:hover:text-white transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <Bluetooth className="w-4 h-4 text-pink-400" />
            <span>Cetak Bluetooth ({bluetoothStatus.deviceName || 'Thermal POS'})</span>
          </button>

          {/* Browser Print / PDF & WhatsApp */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handlePrintWindow}
              className="py-2 px-3 rounded-2xl text-xs font-semibold border border-pink-100 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 flex items-center justify-center gap-1.5 hover:bg-pink-50"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Cetak / PDF</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="py-2 px-3 rounded-2xl text-xs font-bold border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 flex items-center justify-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-2xl text-xs font-bold text-white bg-[#F43F5E] hover:bg-[#E11D48] transition-colors flex items-center justify-center gap-1.5 mt-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Transaksi Baru</span>
          </button>
        </div>
      </div>
    </div>
  );
};
