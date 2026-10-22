/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { usePOS } from '../../context/POSContext';
import { Product } from '../../types/pos';
import { 
  Camera, 
  X, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2,
  HelpCircle,
  Upload,
  Search,
  Sparkles
} from 'lucide-react';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDetectedProduct?: (product: Product) => void;
  onCapturePhoto?: (photoDataUrl: string) => void;
  mode?: 'scan' | 'photo';
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onDetectedProduct,
  onCapturePhoto,
  mode = 'scan',
}) => {
  const { products } = usePOS();
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionState, setPermissionState] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [detectedItem, setDetectedItem] = useState<Product | null>(null);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [manualQuery, setManualQuery] = useState<string>('');
  const [retryCount, setRetryCount] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setPermissionState('idle');
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async () => {
    stopCamera();
    setPermissionState('requesting');
    setErrorMessage('');
    setDetectedItem(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionState('denied');
      setErrorMessage('Browser ini tidak mendukung MediaDevices API untuk kamera.');
      return;
    }

    // Try checking permission status if Permissions API is available
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'camera' as any });
        if (permissionStatus.state === 'denied') {
          setErrorMessage('Izin kamera diblokir pada setelan browser Anda. Silakan klik ikon gembok 🔒 di address bar untuk mengizinkan, lalu tekan Tanyakan Izin Lagi.');
          setShowGuide(true);
        }
      } catch {
        // Permissions query for camera is not supported on all browsers, continue
      }
    }

    try {
      // First attempt: try ideal constraints
      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (firstErr: any) {
        // Fallback attempt: basic video constraint without specific resolution/facing mode
        if (firstErr.name !== 'NotAllowedError' && firstErr.name !== 'PermissionDeniedError') {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } else {
          throw firstErr;
        }
      }

      setStream(mediaStream);
      setPermissionState('granted');
      setShowGuide(false);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      setPermissionState('denied');
      setRetryCount((prev) => prev + 1);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Akses kamera ditolak oleh browser atau diblokir pada perangkat ini.');
        setShowGuide(true);
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('Perangkat webcam/kamera tidak ditemukan.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setErrorMessage('Kamera sedang digunakan oleh aplikasi lain (Zoom, Meet, dll).');
      } else if (err.name === 'OverconstrainedError') {
        setErrorMessage('Resolusi kamera perangkat tidak mendukung.');
      } else {
        setErrorMessage('Gagal membuka kamera: ' + (err.message || 'Izin belum diberikan.'));
      }
    }
  };

  // Capture snapshot for product image
  const handleSnapPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    if (onCapturePhoto) {
      onCapturePhoto(dataUrl);
    }
  };

  // File Upload Fallback (e.g. from gallery or native camera app)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (mode === 'photo' && onCapturePhoto) {
        onCapturePhoto(dataUrl);
      } else {
        // In scan mode, match a random product or first product for testing
        const sample = products[0];
        if (sample) handleTriggerBarcodeMatch(sample);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle barcode match
  const handleTriggerBarcodeMatch = (product: Product) => {
    setDetectedItem(product);

    // Audio chime simulation
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {}

    setTimeout(() => {
      if (onDetectedProduct) {
        onDetectedProduct(product);
      }
      onClose();
    }, 800);
  };

  const filteredDemoProducts = manualQuery.trim()
    ? products.filter(p => 
        p.name.toLowerCase().includes(manualQuery.toLowerCase()) || 
        p.barcode.includes(manualQuery)
      )
    : products.slice(0, 4);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-[#FCE4E8] max-w-lg w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 text-black">
        
        {/* Header */}
        <div className="p-4 px-6 border-b border-[#FCE4E8] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-2xl bg-[#FCE8EB] text-[#800020] flex items-center justify-center border border-[#F8CCD4]">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-black">
                {mode === 'photo' ? 'Ambil Foto Produk' : 'Kamera Barcode Scanner'}
              </h3>
              <p className="text-[11px] text-stone-600 font-medium">
                Arahkan lensa ke barcode atau cetakan kue
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

        {/* Viewfinder / Kamera Area */}
        <div className="relative bg-slate-950 h-72 sm:h-80 flex items-center justify-center overflow-hidden">
          
          {/* State: Meminta Izin */}
          {permissionState === 'requesting' && (
            <div className="text-center p-6 space-y-3 text-white max-w-xs">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin text-[#800020]" />
              <p className="text-xs font-bold text-slate-100">
                Meminta Akses Kamera...
              </p>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Silakan klik tombol <strong>"Izinkan" (Allow)</strong> jika muncul jendela perizinan di browser Anda.
              </p>
            </div>
          )}

          {/* State: Akses Ditolak (Dengan Panduan Jelas & Tombol Tanyakan Lagi) */}
          {permissionState === 'denied' && (
            <div className="text-center p-5 space-y-3 text-white max-w-sm overflow-y-auto max-h-72 scrollbar-none">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/30">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">
                  Akses Kamera Ditolak / Belum Diizinkan
                </h4>
                <p className="text-[11px] text-slate-300 mt-1">
                  {errorMessage}
                </p>
              </div>

              {/* Panduan Membuka Izin di Browser */}
              <div className="bg-white/10 rounded-2xl p-3 text-left text-[11px] space-y-1.5 border border-white/10">
                <div className="font-bold text-pink-300 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Cara Mengizinkan Akses Kamera:</span>
                </div>
                <ol className="list-decimal pl-4 space-y-1 text-slate-200 text-[10px]">
                  <li>Klik ikon <strong>Gembok 🔒</strong> atau <strong>Kamera 🎥</strong> di address bar (sebelah kiri link website).</li>
                  <li>Ubah izin <strong>Kamera</strong> menjadi <strong>"Izinkan" (Allow)</strong>.</li>
                  <li>Setelah itu, klik tombol <strong>"Tanyakan Izin Lagi"</strong> di bawah.</li>
                </ol>
              </div>

              {/* Action Buttons: Tanyakan Izin Lagi & Alternatif Unggah File */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={startCamera}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-bold bg-[#800020] hover:bg-[#660019] text-white rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Tanyakan Izin Lagi</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold bg-white/20 hover:bg-white/30 text-white rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Pilih Foto dari File</span>
                </button>
              </div>
            </div>
          )}

          {/* Hidden File Input for Native File/Camera Fallback */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* Live Video Viewfinder */}
          <video
            ref={videoRef}
            className={`w-full h-full object-cover ${permissionState === 'granted' ? 'block' : 'hidden'}`}
            playsInline
            muted
          />

          {/* Viewfinder Laser Overlay */}
          {permissionState === 'granted' && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-60 h-44 border-2 border-dashed border-[#800020] rounded-2xl relative shadow-lg flex items-center justify-center">
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-[#800020] rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-[#800020] rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-[#800020] rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-[#800020] rounded-br-lg" />

                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#800020] to-transparent shadow-[0_0_8px_#800020] animate-pulse" />
              </div>

              <div className="absolute bottom-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-xs text-[11px] text-white font-medium flex items-center gap-1.5 border border-white/10">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Kamera Aktif · Arahkan ke Barcode</span>
              </div>
            </div>
          )}

          {/* Success scan badge notification */}
          {detectedItem && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-2 shadow-lg animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-white">{detectedItem.name}</h4>
              <p className="text-xs text-emerald-300 font-mono mt-0.5">
                Barcode: {detectedItem.barcode} · Masuk Keranjang
              </p>
            </div>
          )}
        </div>

        {/* Footer Area: Photo capture button OR Quick Test barcode simulation */}
        <div className="p-4 bg-white border-t border-[#FCE4E8] space-y-2.5">
          {mode === 'photo' ? (
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 text-xs font-bold rounded-xl border border-[#FCE4E8] bg-[#FCE8EB] text-black hover:bg-[#F8CCD4] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSnapPhoto}
                disabled={permissionState !== 'granted'}
                className="flex-1 py-2 text-xs font-bold bg-[#800020] text-white rounded-xl hover:bg-[#660019] disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Jepret Foto</span>
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between text-[11px] text-stone-700 mb-2 font-medium">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#800020]" />
                  <span>Uji scan cepat produk (tetap bisa digunakan tanpa kamera):</span>
                </span>
                {retryCount > 0 && (
                  <button
                    onClick={startCamera}
                    className="text-[10px] text-[#800020] font-bold hover:underline cursor-pointer"
                  >
                    Tanyakan Izin Lagi ({retryCount})
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {filteredDemoProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleTriggerBarcodeMatch(p)}
                    className="p-2 rounded-xl text-left border border-[#FCE4E8] bg-[#FFF5F7] hover:border-[#800020] hover:bg-[#FCE8EB] transition-all flex items-center gap-2 group cursor-pointer"
                  >
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-lg object-cover shrink-0 border border-[#F8CCD4]"
                    />
                    <div className="truncate flex-1">
                      <div className="text-[11px] font-bold text-black truncate group-hover:text-[#800020]">
                        {p.name}
                      </div>
                      <div className="text-[9px] font-mono text-stone-600">
                        {p.barcode}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
