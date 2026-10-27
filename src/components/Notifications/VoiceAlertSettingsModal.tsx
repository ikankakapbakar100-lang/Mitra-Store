/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { usePOS } from '../../context/POSContext';
import { DEFAULT_VOICE_SETTINGS, playSinglePresetSound } from '../../utils/voiceAlert';
import { PresetNotificationSound } from '../../types/pos';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  RotateCcw, 
  X, 
  Bell, 
  Sliders, 
  MessageSquare, 
  CheckCircle2,
  FolderOpen,
  FileAudio,
  Trash2,
  Upload,
  Music,
  Radio,
  Sparkles
} from 'lucide-react';

interface VoiceAlertSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceAlertSettingsModal: React.FC<VoiceAlertSettingsModalProps> = ({ isOpen, onClose }) => {
  const { voiceSettings, updateVoiceSettings, testVoiceAlert } = usePOS();

  const [isPlayingTest, setIsPlayingTest] = useState<'low' | 'out' | 'custom' | string | null>(null);
  const [showFilePermissionModal, setShowFilePermissionModal] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const audioFileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const currentSoundSource = voiceSettings.soundSource || 'preset';
  const currentPreset = voiceSettings.presetSound || 'speech_id';

  // Tes Suara Notifikasi Keseluruhan
  const handleTest = (type: 'low_stock' | 'out_of_stock') => {
    setIsPlayingTest(type === 'low_stock' ? 'low' : 'out');
    testVoiceAlert(type);
    setTimeout(() => {
      setIsPlayingTest(null);
    }, 3500);
  };

  // Tes satu suara preset yang tersedia
  const handlePreviewPresetSound = (sound: PresetNotificationSound) => {
    setIsPlayingTest('preset-' + sound);
    playSinglePresetSound(sound);
    setTimeout(() => {
      setIsPlayingTest(null);
    }, 1500);
  };

  // Tes pemutaran file pribadi
  const handlePlayCustomAudio = () => {
    if (!voiceSettings.customAudioDataUrl) return;
    setIsPlayingTest('custom');
    try {
      const audio = new Audio(voiceSettings.customAudioDataUrl);
      audio.volume = voiceSettings.speechVolume || 1.0;
      audio.play().catch(() => {});
      audio.onended = () => setIsPlayingTest(null);
    } catch {
      setIsPlayingTest(null);
    }
  };

  // Sisipkan tag ke input template TTS
  const insertTagToTemplate = (field: 'lowStockTemplate' | 'outOfStockTemplate', tag: string) => {
    const currentVal = voiceSettings[field];
    updateVoiceSettings({
      [field]: currentVal + ' ' + tag,
    });
  };

  // 1. Izin Akses Berkas Pribadi (Wajib Ditanyakan Terlebih Dahulu)
  const handleRequestFileAccess = () => {
    setShowFilePermissionModal(true);
  };

  const proceedOpenFilePicker = () => {
    setShowFilePermissionModal(false);
    if (audioFileInputRef.current) {
      audioFileInputRef.current.value = '';
      audioFileInputRef.current.click();
    }
  };

  const handleAudioFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('Ukuran berkas audio maksimal 15MB agar aplikasi kasir tetap ringan dan cepat.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      updateVoiceSettings({
        soundSource: 'custom_file',
        customAudioDataUrl: dataUrl,
        customAudioFileName: file.name,
        customAudioTarget: voiceSettings.customAudioTarget || 'both',
      });
      setSuccessToast(`Berkas suara pribadi "${file.name}" berhasil dipasang.`);
      setTimeout(() => setSuccessToast(null), 3500);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomAudio = () => {
    updateVoiceSettings({
      soundSource: 'preset',
      customAudioDataUrl: undefined,
      customAudioFileName: undefined,
    });
    setSuccessToast('File audio kustom dihapus. Menggunakan suara notifikasi bawaan.');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Quick Preset Templates untuk Suara Bicara TTS
  const applyPreset = (preset: 'friendly' | 'firm' | 'concise') => {
    if (preset === 'friendly') {
      updateVoiceSettings({
        lowStockTemplate: 'Halo, perhatian ya. Stok produk {produk} hampir habis, tersisa {stok} {satuan}. Yuk segera restock.',
        outOfStockTemplate: 'Peringatan toko, stok produk {produk} sudah habis total. Mohon segera dicatat untuk kulakan ya.',
        speechRate: 1.0,
        speechPitch: 1.05,
      });
    } else if (preset === 'firm') {
      updateVoiceSettings({
        lowStockTemplate: 'Pemberitahuan penting. Stok {produk} menipis, sisa {stok} {satuan}. Segera beli stok tambahan.',
        outOfStockTemplate: 'Perhatian darurat. Stok barang {produk} telah kosong. Jangan layani penjualan produk ini.',
        speechRate: 1.05,
        speechPitch: 0.95,
      });
    } else if (preset === 'concise') {
      updateVoiceSettings({
        lowStockTemplate: 'Stok {produk} menipis, sisa {stok} {satuan}.',
        outOfStockTemplate: 'Stok {produk} habis.',
        speechRate: 1.15,
        speechPitch: 1.0,
      });
    }
  };

  const availablePresetSounds: {
    id: PresetNotificationSound;
    name: string;
    desc: string;
    isSpeech?: boolean;
  }[] = [
    {
      id: 'speech_id',
      name: 'Suara Bicara Bahasa Indonesia (TTS)',
      desc: 'Menyebut nama produk & jumlah stok secara lisan lewat suara komputer',
      isSpeech: true,
    },
    {
      id: 'chime_classic',
      name: 'Bel Kasir Klasik (Dua Nada)',
      desc: 'Nada bel kasir manis (C5 - G5) yang ramah dan menenangkan',
    },
    {
      id: 'store_bell',
      name: 'Lonceng Toko Modern Ting-Ting',
      desc: 'Nada lonceng pintu toko jernih berfrekuensi tinggi',
    },
    {
      id: 'soft_alert',
      name: 'Sirene Peringatan Lembut',
      desc: 'Nada beep tiga ketukan untuk perhatian cepat',
    },
    {
      id: 'radar_pulse',
      name: 'Radar Kasir POS (Pulse Sweep)',
      desc: 'Nada denyut sweep modern khas kasir modern',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      
      {/* Hidden File Input for Private Audio Files */}
      <input
        ref={audioFileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.webm"
        className="hidden"
        onChange={handleAudioFileSelected}
      />

      <div className="bg-white rounded-3xl shadow-2xl border border-[#FCE4E8] max-w-xl w-full my-auto overflow-hidden animate-in zoom-in-95 duration-150 text-black flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-5 py-4 bg-[#FFF5F7] border-b border-[#FCE4E8] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#800020] text-white flex items-center justify-center shadow-md">
              <Volume2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base text-black">
                  Pengaturan Suara Notifikasi Stok
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#800020] text-white">
                  KUSTOM OWNER
                </span>
              </div>
              <p className="text-[11px] text-stone-600 font-medium">
                Pilih suara yang tersedia di sistem atau impor suara dari file pribadi Anda
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-500 hover:text-black hover:bg-[#FCE8EB] transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          
          {/* Master Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FFF8F8] border border-[#FCE4E8]">
            <div className="flex items-center gap-3">
              {voiceSettings.enabled ? (
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Volume2 className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-500 flex items-center justify-center">
                  <VolumeX className="w-4 h-4" />
                </div>
              )}
              <div>
                <div className="font-black text-black">Status Notifikasi Suara</div>
                <div className="text-[11px] text-stone-600">
                  {voiceSettings.enabled
                    ? 'Aktif — Sistem akan bersuara saat ada stok yang menipis atau habis'
                    : 'Nonaktif — Tidak ada suara yang berbunyi'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => updateVoiceSettings({ enabled: !voiceSettings.enabled })}
              className={`w-12 h-6.5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                voiceSettings.enabled ? 'bg-[#800020]' : 'bg-stone-300'
              }`}
            >
              <div
                className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform ${
                  voiceSettings.enabled ? 'translate-x-5.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Test Buttons Row */}
          <div className="space-y-1.5">
            <label className="font-bold text-black flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-[#800020]" />
                Uji Coba Suara Sekarang (Live Preview)
              </span>
              <span className="text-[10px] text-stone-500 font-normal">Dengarkan nada yang aktif</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTest('low_stock')}
                disabled={!voiceSettings.enabled || isPlayingTest !== null}
                className="py-2.5 px-3 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
              >
                <Bell className={`w-3.5 h-3.5 text-amber-700 ${isPlayingTest === 'low' ? 'animate-bounce' : ''}`} />
                <span>{isPlayingTest === 'low' ? 'Sedang Bersuara...' : 'Uji Stok Menipis'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleTest('out_of_stock')}
                disabled={!voiceSettings.enabled || isPlayingTest !== null}
                className="py-2.5 px-3 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-950 font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
              >
                <Volume2 className={`w-3.5 h-3.5 text-[#800020] ${isPlayingTest === 'out' ? 'animate-pulse' : ''}`} />
                <span>{isPlayingTest === 'out' ? 'Sedang Bersuara...' : 'Uji Stok Habis'}</span>
              </button>
            </div>
          </div>

          {/* DUA PILIHAN UTAMA: 1. SUARA TERSEDIA vs 2. SUARA DARI FILE PRIBADI */}
          <div className="space-y-2.5">
            <label className="font-bold text-black flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#800020]" />
              Pilih Sumber Suara Notifikasi:
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Pilihan 1: Suara Notifikasi yang Tersedia */}
              <button
                type="button"
                onClick={() => updateVoiceSettings({ soundSource: 'preset' })}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  currentSoundSource === 'preset'
                    ? 'border-[#800020] bg-[#FFF5F7] ring-2 ring-[#800020]/20 shadow-xs'
                    : 'border-[#FCE4E8] bg-white hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-black text-xs flex items-center gap-1.5">
                    <Music className="w-4 h-4 text-[#800020]" />
                    <span>1. Suara yang Tersedia</span>
                  </span>
                  {currentSoundSource === 'preset' && (
                    <span className="text-[9px] font-bold px-2 py-0.2 rounded-full bg-[#800020] text-white">
                      Aktif
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-600 leading-tight">
                  Pilih dari koleksi nada kasir, lonceng toko, atau suara bicara bahasa Indonesia bawaan.
                </p>
              </button>

              {/* Pilihan 2: Suara dari File Pribadi */}
              <button
                type="button"
                onClick={() => updateVoiceSettings({ soundSource: 'custom_file' })}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  currentSoundSource === 'custom_file'
                    ? 'border-[#800020] bg-[#FFF5F7] ring-2 ring-[#800020]/20 shadow-xs'
                    : 'border-[#FCE4E8] bg-white hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-black text-xs flex items-center gap-1.5">
                    <FolderOpen className="w-4 h-4 text-[#800020]" />
                    <span>2. Suara dari File Pribadi</span>
                  </span>
                  {currentSoundSource === 'custom_file' && (
                    <span className="text-[9px] font-bold px-2 py-0.2 rounded-full bg-[#800020] text-white">
                      Aktif
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-600 leading-tight">
                  Impor berkas suara/lagu (.mp3, .wav, .m4a) dari memori HP atau laptop Anda.
                </p>
              </button>
            </div>
          </div>

          {/* =================================================================
              KONTEN PILIHAN 1: DAFTAR SUARA NOTIFIKASI YANG TERSEDIA
              ================================================================= */}
          {currentSoundSource === 'preset' && (
            <div className="space-y-3 p-4 rounded-2xl bg-[#FFF8F8] border border-[#FCE4E8]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-black text-xs">
                  Pilih Nada Notifikasi Tersedia:
                </span>
                <span className="text-[10px] text-stone-500">
                  Klik untuk memilih &amp; dengarkan
                </span>
              </div>

              <div className="space-y-2">
                {availablePresetSounds.map((snd) => {
                  const isSelected = currentPreset === snd.id;

                  return (
                    <div
                      key={snd.id}
                      onClick={() => updateVoiceSettings({ presetSound: snd.id })}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                        isSelected
                          ? 'border-[#800020] bg-white ring-1 ring-[#800020] shadow-2xs'
                          : 'border-[#FCE4E8] bg-white/70 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-[#800020] bg-[#800020]' : 'border-stone-300'
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div className="truncate">
                          <div className={`text-xs truncate ${isSelected ? 'font-black text-black' : 'font-bold text-stone-800'}`}>
                            {snd.name}
                          </div>
                          <div className="text-[10px] text-stone-500 truncate">
                            {snd.desc}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateVoiceSettings({ presetSound: snd.id });
                          if (snd.isSpeech) {
                            handleTest('low_stock');
                          } else {
                            handlePreviewPresetSound(snd.id);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#FCE8EB] hover:bg-[#F8CCD4] text-[#800020] font-bold text-[11px] flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
                        title={`Dengarkan contoh ${snd.name}`}
                      >
                        <Play className="w-3 h-3 text-[#800020]" />
                        <span>Putar</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Jika Memilih Suara Bicara TTS: Tampilkan Editor Kalimat Suara */}
              {currentPreset === 'speech_id' && (
                <div className="space-y-4 pt-3 border-t border-[#FCE4E8] mt-3">
                  <div className="flex items-center justify-between pb-1 border-b border-[#FCE4E8]">
                    <label className="font-bold text-black flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-[#800020]" />
                      Custom Kalimat Suara Bahasa Indonesia:
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-stone-500 font-medium">Contoh:</span>
                      <button
                        type="button"
                        onClick={() => applyPreset('friendly')}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-[#FCE8EB] hover:bg-[#F8CCD4] text-[#800020] font-bold cursor-pointer"
                      >
                        Ramah
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset('firm')}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-[#FCE8EB] hover:bg-[#F8CCD4] text-[#800020] font-bold cursor-pointer"
                      >
                        Tegas
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset('concise')}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-[#FCE8EB] hover:bg-[#F8CCD4] text-[#800020] font-bold cursor-pointer"
                      >
                        Singkat
                      </button>
                    </div>
                  </div>

                  {/* Template Stok Menipis */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-800">Kalimat Suara Saat Stok Menipis:</span>
                      <div className="flex items-center gap-1 text-[10px]">
                        <span className="text-stone-500">Sisipkan:</span>
                        <button
                          type="button"
                          onClick={() => insertTagToTemplate('lowStockTemplate', '{produk}')}
                          className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-mono font-bold hover:bg-amber-200 cursor-pointer"
                        >
                          +{'{produk}'}
                        </button>
                        <button
                          type="button"
                          onClick={() => insertTagToTemplate('lowStockTemplate', '{stok}')}
                          className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-mono font-bold hover:bg-amber-200 cursor-pointer"
                        >
                          +{'{stok}'}
                        </button>
                        <button
                          type="button"
                          onClick={() => insertTagToTemplate('lowStockTemplate', '{satuan}')}
                          className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-mono font-bold hover:bg-amber-200 cursor-pointer"
                        >
                          +{'{satuan}'}
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      value={voiceSettings.lowStockTemplate}
                      onChange={(e) => updateVoiceSettings({ lowStockTemplate: e.target.value })}
                      placeholder="Ketik kalimat peringatan stok menipis..."
                      className="w-full p-2.5 text-xs rounded-xl border border-[#FCE4E8] bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#800020]"
                    />
                  </div>

                  {/* Template Stok Habis */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-800">Kalimat Suara Saat Stok Habis:</span>
                      <div className="flex items-center gap-1 text-[10px]">
                        <span className="text-stone-500">Sisipkan:</span>
                        <button
                          type="button"
                          onClick={() => insertTagToTemplate('outOfStockTemplate', '{produk}')}
                          className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-900 font-mono font-bold hover:bg-rose-200 cursor-pointer"
                        >
                          +{'{produk}'}
                        </button>
                        <button
                          type="button"
                          onClick={() => insertTagToTemplate('outOfStockTemplate', '{satuan}')}
                          className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-900 font-mono font-bold hover:bg-rose-200 cursor-pointer"
                        >
                          +{'{satuan}'}
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      value={voiceSettings.outOfStockTemplate}
                      onChange={(e) => updateVoiceSettings({ outOfStockTemplate: e.target.value })}
                      placeholder="Ketik kalimat peringatan stok habis..."
                      className="w-full p-2.5 text-xs rounded-xl border border-[#FCE4E8] bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#800020]"
                    />
                  </div>

                  {/* Kontrol Kecepatan Bicara */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-stone-700">Kecepatan Bicara:</span>
                      <span className="font-mono text-black font-bold">{voiceSettings.speechRate}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.75"
                      max="1.5"
                      step="0.05"
                      value={voiceSettings.speechRate}
                      onChange={(e) => updateVoiceSettings({ speechRate: parseFloat(e.target.value) })}
                      className="w-full accent-[#800020] cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-stone-400 mt-0.5">
                      <span>Santai (0.75x)</span>
                      <span>Normal (1.0x)</span>
                      <span>Cepat (1.5x)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =================================================================
              KONTEN PILIHAN 2: SUARA DARI FILE PRIBADI (+ IZIN AKSES BERKAS)
              ================================================================= */}
          {currentSoundSource === 'custom_file' && (
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-700 text-white flex items-center justify-center font-bold">
                    <FolderOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-xs text-amber-950">
                      Suara dari File Audio Pribadi
                    </h4>
                    <p className="text-[10px] text-amber-800">
                      Gunakan file audio / rekaman lagu favorit Anda sebagai nada notifikasi stok
                    </p>
                  </div>
                </div>

                {voiceSettings.customAudioDataUrl && (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                    File Terpasang
                  </span>
                )}
              </div>

              {/* Status File Terpasang */}
              {voiceSettings.customAudioDataUrl ? (
                <div className="p-3 bg-white rounded-xl border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileAudio className="w-6 h-6 text-amber-800 shrink-0" />
                    <div className="truncate">
                      <div className="text-xs font-bold text-black truncate">
                        {voiceSettings.customAudioFileName || 'Berkas Suara Pribadi Toko'}
                      </div>
                      <div className="text-[10px] text-emerald-800 font-medium">
                        ✓ Siap diputar otomatis saat stok barang berubah
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handlePlayCustomAudio}
                      disabled={isPlayingTest === 'custom'}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Play className="w-3 h-3" />
                      <span>{isPlayingTest === 'custom' ? 'Memutar...' : 'Putar File'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRequestFileAccess}
                      className="px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white hover:bg-amber-100 text-amber-950 text-xs font-bold transition-colors cursor-pointer"
                      title="Ganti dengan file lain"
                    >
                      Ganti File
                    </button>

                    <button
                      type="button"
                      onClick={handleRemoveCustomAudio}
                      className="p-1.5 rounded-lg text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                      title="Hapus berkas audio ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-white rounded-xl border border-dashed border-amber-300 text-center space-y-2">
                  <FileAudio className="w-8 h-8 text-amber-700 mx-auto opacity-70" />
                  <div className="text-xs font-bold text-amber-950">
                    Belum ada berkas suara pribadi yang dipilih
                  </div>
                  <p className="text-[11px] text-stone-600 max-w-sm mx-auto">
                    Format didukung: <strong>.mp3, .wav, .m4a, .aac, .ogg</strong> (maks. 15MB).
                  </p>

                  <button
                    type="button"
                    onClick={handleRequestFileAccess}
                    className="px-4 py-2 rounded-xl bg-[#800020] hover:bg-[#660019] text-white text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer mt-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih File Suara dari HP / Komputer</span>
                  </button>
                </div>
              )}

              {/* Target Nada: Kapan File Pribadi Ini Berbunyi */}
              {voiceSettings.customAudioDataUrl && (
                <div className="pt-2 border-t border-amber-200">
                  <label className="text-[11px] font-bold text-amber-950 block mb-1.5">
                    Bunyikan File Suara Pribadi Ini Pada Kondisi:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'both', label: 'Stok Menipis & Stok Habis' },
                      { id: 'low_only', label: 'Khusus Stok Menipis' },
                      { id: 'out_only', label: 'Khusus Stok Habis' },
                    ].map((tgt) => (
                      <button
                        key={tgt.id}
                        type="button"
                        onClick={() => updateVoiceSettings({ customAudioTarget: tgt.id as any })}
                        className={`px-3 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                          (voiceSettings.customAudioTarget || 'both') === tgt.id
                            ? 'bg-[#800020] text-white shadow-2xs'
                            : 'bg-white border border-amber-200 text-amber-950 hover:bg-amber-100'
                        }`}
                      >
                        {tgt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {successToast && (
                <div className="p-2.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{successToast}</span>
                </div>
              )}
            </div>
          )}

          {/* Kontrol Volume Suara Notifikasi */}
          <div className="p-3.5 rounded-2xl bg-[#FFF8F8] border border-[#FCE4E8]">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-stone-700">Volume Suara Notifikasi:</span>
              <span className="font-mono text-black font-bold">{Math.round(voiceSettings.speechVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={voiceSettings.speechVolume}
              onChange={(e) => updateVoiceSettings({ speechVolume: parseFloat(e.target.value) })}
              className="w-full accent-[#800020] cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-stone-400 mt-0.5">
              <span>Pelan (10%)</span>
              <span>Sedang (50%)</span>
              <span>Maksimal (100%)</span>
            </div>
          </div>

          {/* Opsi Auto Speak on Checkout */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-[#FCE4E8]">
            <input
              type="checkbox"
              id="autoCheckoutVoice"
              checked={voiceSettings.autoSpeakOnCheckout}
              onChange={(e) => updateVoiceSettings({ autoSpeakOnCheckout: e.target.checked })}
              className="w-4 h-4 rounded text-[#800020] accent-[#800020] cursor-pointer"
            />
            <label htmlFor="autoCheckoutVoice" className="text-xs text-stone-800 font-medium cursor-pointer">
              <strong>Bunyikan otomatis saat kasir memproses pembayaran</strong> jika ada produk dalam transaksi yang stoknya menipis atau habis.
            </label>
          </div>

          {/* Footer Modal */}
          <div className="pt-2 flex items-center justify-between border-t border-[#FCE4E8]">
            <button
              type="button"
              onClick={() => updateVoiceSettings(DEFAULT_VOICE_SETTINGS)}
              className="text-[11px] font-bold text-stone-600 hover:text-[#800020] flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Kembalikan ke Suara Bawaan</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#800020] hover:bg-[#660019] text-white font-bold transition-all shadow-xs cursor-pointer"
            >
              Simpan &amp; Tutup
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          MODAL KONFIRMASI IZIN AKSES FILE PRIBADI (Wajib Ditanyakan Terlebih Dahulu)
          ===================================================================== */}
      {showFilePermissionModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-amber-200 max-w-sm w-full p-5 sm:p-6 animate-in zoom-in-95 duration-150 text-black">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 mx-auto flex items-center justify-center border border-amber-300 mb-3">
              <FolderOpen className="w-6 h-6 text-amber-800" />
            </div>

            <div className="text-center space-y-1.5">
              <h4 className="font-black text-sm text-black">
                Konfirmasi Izin Akses Berkas Pribadi
              </h4>
              <p className="text-xs text-stone-700 leading-relaxed">
                Aplikasi MitraStore meminta izin untuk membuka pengelola berkas / memori perangkat Anda guna memilih file suara (.mp3, .wav, .m4a, .ogg) sebagai nada notifikasi stok toko.
              </p>
            </div>

            <div className="mt-3.5 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-medium">
              📁 Berkas audio pilihan Anda hanya akan dibaca secara lokal di perangkat ini dan tidak dikirim ke server luar.
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setShowFilePermissionModal(false)}
                className="flex-1 py-2 px-3 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={proceedOpenFilePicker}
                className="flex-1 py-2 px-3 text-xs font-bold text-white bg-[#800020] hover:bg-[#660019] rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Izinkan &amp; Pilih Berkas</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
