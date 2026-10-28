/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaction, StoreProfile } from '../types/pos';
import { formatRupiah, formatDateTime } from './format';

export interface BluetoothDeviceStatus {
  isConnected: boolean;
  deviceName: string | null;
  printerType: '58mm' | '80mm';
  statusMessage: string;
}

// Known thermal printer Bluetooth GATT Service UUIDs
const KNOWN_PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard POS Printer Service
  '0000ffe0-0000-1000-8000-00805f9b34fb', // Extremely common on 58mm/80mm mini BT printers (e.g. GOOJPRT, RPP02, Panda, MPT)
  '0000ff00-0000-1000-8000-00805f9b34fb', // Generic mini thermal printer service
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Microchip Transparent
  'e7810a71-73ae-499d-8c15-59b670f16bb6', // Common thermal service
  '0000af30-0000-1000-8000-00805f9b34fb', // Additional thermal UUID
];

export class BluetoothPrinterService {
  private device: any = null;
  private characteristic: any = null;
  public status: BluetoothDeviceStatus = {
    isConnected: false,
    deviceName: null,
    printerType: '58mm',
    statusMessage: 'Belum terhubung ke printer Bluetooth.',
  };

  // Check if Web Bluetooth is supported in current browser environment
  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  // Set printer paper width (58mm or 80mm)
  public setPaperType(type: '58mm' | '80mm') {
    this.status.printerType = type;
  }

  // Request & Connect Bluetooth Printer with auto service and characteristic discovery
  public async connect(): Promise<BluetoothDeviceStatus> {
    if (!this.isSupported()) {
      this.status = {
        isConnected: false,
        deviceName: null,
        printerType: this.status.printerType,
        statusMessage: 'Browser ini belum mendukung Web Bluetooth secara langsung. Anda tetap dapat mencetak via dialog cetak perangkat.',
      };
      return this.status;
    }

    try {
      // @ts-ignore - Web Bluetooth API
      this.device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: KNOWN_PRINTER_SERVICES,
      });

      if (!this.device) {
        throw new Error('Pemilihan perangkat dibatalkan.');
      }

      // Handle spontaneous disconnection
      this.device.addEventListener('gattserverdisconnected', () => {
        this.characteristic = null;
        this.status = {
          isConnected: false,
          deviceName: null,
          printerType: this.status.printerType,
          statusMessage: 'Koneksi printer Bluetooth terputus.',
        };
      });

      // Connect GATT Server
      if (this.device.gatt) {
        const server = await this.device.gatt.connect();
        
        // Discover characteristic for writing ESC/POS commands
        let foundChar: any = null;
        for (const serviceUuid of KNOWN_PRINTER_SERVICES) {
          try {
            const service = await server.getPrimaryService(serviceUuid);
            if (service) {
              const characteristics = await service.getCharacteristics();
              for (const c of characteristics) {
                if (c.properties.write || c.properties.writeWithoutResponse) {
                  foundChar = c;
                  break;
                }
              }
            }
          } catch {
            // Service not supported on this specific device, try next
          }
          if (foundChar) break;
        }

        this.characteristic = foundChar;
        const deviceName = this.device.name || 'Printer Thermal POS';

        this.status = {
          isConnected: true,
          deviceName,
          printerType: this.status.printerType,
          statusMessage: foundChar
            ? `Terhubung ke ${deviceName} (Karakteristik Siap Cetak)`
            : `Terhubung ke ${deviceName}`,
        };
      } else {
        this.status = {
          isConnected: true,
          deviceName: this.device.name || 'Printer Bluetooth',
          printerType: this.status.printerType,
          statusMessage: `Printer Bluetooth terpasang.`,
        };
      }

      return this.status;
    } catch (error: any) {
      console.warn('Bluetooth connection attempt:', error);
      const isCancelled = error.name === 'NotFoundError' || error.message?.includes('cancelled') || error.message?.includes('dibatalkan');
      
      this.status = {
        isConnected: false,
        deviceName: null,
        printerType: this.status.printerType,
        statusMessage: isCancelled 
          ? 'Pencarian printer dibatalkan.' 
          : `Gagal menghubungkan printer: ${error.message || 'Periksa Bluetooth perangkat.'}`,
      };
      return this.status;
    }
  }

  // Disconnect active Bluetooth connection
  public disconnect(): BluetoothDeviceStatus {
    try {
      if (this.device && this.device.gatt && this.device.gatt.connected) {
        this.device.gatt.disconnect();
      }
    } catch (e) {
      console.warn('Disconnect error:', e);
    }
    this.device = null;
    this.characteristic = null;
    this.status = {
      isConnected: false,
      deviceName: null,
      printerType: this.status.printerType,
      statusMessage: 'Printer Bluetooth terputus.',
    };
    return this.status;
  }

  // Helper to send byte chunks over BLE characteristic
  private async sendChunks(bytes: Uint8Array): Promise<void> {
    if (!this.characteristic) return;
    const chunkSize = 20; // Standard BLE MTU safe payload
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.slice(i, i + chunkSize);
      if (this.characteristic.properties.writeWithoutResponse) {
        await this.characteristic.writeValueWithoutResponse(chunk);
      } else {
        await this.characteristic.writeValue(chunk);
      }
      // Brief pause to prevent buffer overrun on budget thermal chips
      await new Promise(r => setTimeout(r, 15));
    }
  }

  /**
   * Format ESC/POS raw text representation for receipt printing
   */
  public generateReceiptRawText(trx: Transaction, store: StoreProfile): string {
    const lineWidth = this.status.printerType === '80mm' ? 42 : 32;
    const divider = '-'.repeat(lineWidth);
    const lines: string[] = [];

    // Header
    lines.push(store.name.toUpperCase());
    if (store.tagline) lines.push(store.tagline);
    if (store.address) lines.push(store.address);
    if (store.phone) lines.push(`Telp: ${store.phone}`);
    lines.push(divider);

    // Metadata
    lines.push(`No: ${trx.invoiceNo}`);
    lines.push(`Waktu: ${formatDateTime(trx.date)}`);
    lines.push(`Kasir: ${trx.cashierName}`);
    if (trx.customerName) lines.push(`Pelanggan: ${trx.customerName}`);
    lines.push(`Saluran: ${trx.channel === 'shopee' ? 'Shopee Online' : 'Kasir Toko'}`);
    lines.push(divider);

    // Items
    trx.items.forEach(item => {
      lines.push(`${item.product.name}`);
      const qtyPrice = `${item.qty} x ${formatRupiah(item.product.sellPrice)}`;
      const subtotal = formatRupiah(item.qty * item.product.sellPrice * (1 - (item.discountPercent || 0) / 100));
      const pad = Math.max(1, lineWidth - qtyPrice.length - subtotal.length);
      lines.push(qtyPrice + ' '.repeat(pad) + subtotal);
    });

    lines.push(divider);

    // Totals
    const addTotalLine = (label: string, value: string) => {
      const pad = Math.max(1, lineWidth - label.length - value.length);
      lines.push(label + ' '.repeat(pad) + value);
    };

    addTotalLine('Subtotal:', formatRupiah(trx.subtotal));
    if (trx.discount > 0) addTotalLine('Diskon:', `-${formatRupiah(trx.discount)}`);
    if (trx.pointsUsedDiscount && trx.pointsUsedDiscount > 0) {
      addTotalLine('Poin Digunakan:', `-${formatRupiah(trx.pointsUsedDiscount)}`);
    }
    if (trx.tax > 0) addTotalLine('PPN (11%):', formatRupiah(trx.tax));
    
    lines.push(divider);
    addTotalLine('TOTAL:', formatRupiah(trx.total));
    addTotalLine(`Bayar (${trx.paymentMethod.toUpperCase()}):`, formatRupiah(trx.amountPaid));
    addTotalLine('Kembalian:', formatRupiah(trx.change));
    lines.push(divider);

    // Footer
    lines.push(store.footerNote || 'Terima kasih atas kunjungan Anda');
    lines.push('Simpan struk ini sebagai bukti');
    lines.push('*** LUNAS ***\n\n\n');

    return lines.join('\n');
  }

  /**
   * Send print command to Bluetooth device or launch browser print dialog
   */
  public async printTransaction(trx: Transaction, store: StoreProfile): Promise<boolean> {
    const rawText = this.generateReceiptRawText(trx, store);
    console.log('[Bluetooth Thermal Print Job]:\n', rawText);

    // If BLE characteristic is available, write raw ESC/POS bytes directly
    if (this.characteristic) {
      try {
        const encoder = new TextEncoder();
        // ESC @ (Initialize printer)
        const initCmd = new Uint8Array([0x1B, 0x40]);
        await this.sendChunks(initCmd);

        // Body text
        const bodyBytes = encoder.encode(rawText);
        await this.sendChunks(bodyBytes);

        // Feed 3 lines & Paper cut (ESC d 3, GS V 66 0)
        const cutCmd = new Uint8Array([0x1B, 0x64, 0x03, 0x1D, 0x56, 0x42, 0x00]);
        await this.sendChunks(cutCmd);

        return true;
      } catch (err) {
        console.error('Error writing to Bluetooth characteristic:', err);
      }
    }

    // Direct Browser / System Print Fallback
    window.print();
    return true;
  }

  /**
   * Send a quick test print to verify the Bluetooth printer works properly
   */
  public async printTest(storeName: string): Promise<boolean> {
    const testText = `\n================================\n   ${storeName.toUpperCase()}\n    UJI COBA PRINTER BERHASIL\n================================\nTanggal : ${new Date().toLocaleDateString('id-ID')}\nStatus  : Bluetooth Terhubung\nKoneksi : OK (Siap Kasir POS)\n================================\n\n\n`;

    if (this.characteristic) {
      try {
        const encoder = new TextEncoder();
        const initCmd = new Uint8Array([0x1B, 0x40]);
        await this.sendChunks(initCmd);
        const bodyBytes = encoder.encode(testText);
        await this.sendChunks(bodyBytes);
        const cutCmd = new Uint8Array([0x1B, 0x64, 0x03]);
        await this.sendChunks(cutCmd);
        return true;
      } catch (err) {
        console.error('Bluetooth test print failed:', err);
      }
    }

    window.print();
    return true;
  }
}

export const bluetoothPrinter = new BluetoothPrinterService();
