/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VoiceAlertSettings, PresetNotificationSound } from '../types/pos';

export const DEFAULT_VOICE_SETTINGS: VoiceAlertSettings = {
  enabled: true,
  soundSource: 'preset',
  presetSound: 'speech_id',
  customAudioTarget: 'both',
  lowStockTemplate: 'Perhatian, stok {produk} menipis, tersisa {stok} {satuan}. Mohon segera tambah stok.',
  outOfStockTemplate: 'Peringatan toko, stok {produk} telah habis. Jangan lupa beli stok baru.',
  speechRate: 1.0,
  speechPitch: 1.0,
  speechVolume: 1.0,
  autoSpeakOnCheckout: true,
};

// Web Audio API Synthesizer untuk bel/chime toko yang jernih tanpa dependensi file eksternal
class StoreAudioSynth {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // 1. Nada Chime Kasir Klasik (Dua nada manis: C5 -> G5)
  playChime() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.25, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    playTone(523.25, now, 0.4); // C5
    playTone(783.99, now + 0.15, 0.6); // G5
  }

  // 2. Nada Lonceng Toko Modern Ting-Ting
  playBell() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now); // A5
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.7);
  }

  // 3. Nada Sirene Peringatan Lembut (Alert Beep)
  playAlert() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const playBeep = (start: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(659.25, start); // E5

      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.18);
    };

    playBeep(now);
    playBeep(now + 0.22);
    playBeep(now + 0.44);
  }

  // 4. Nada Radar Kasir (Pulse Sweep)
  playRadarPulse() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now); // A4
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.25); // A5

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.45);
  }
}

export const storeAudio = new StoreAudioSynth();

/**
 * Mainkan satu nada preset yang dipilih (untuk tes langsung)
 */
export const playSinglePresetSound = (sound: PresetNotificationSound) => {
  switch (sound) {
    case 'chime_classic':
      storeAudio.playChime();
      break;
    case 'store_bell':
      storeAudio.playBell();
      break;
    case 'soft_alert':
      storeAudio.playAlert();
      break;
    case 'radar_pulse':
      storeAudio.playRadarPulse();
      break;
    case 'speech_id':
      storeAudio.playChime();
      break;
    default:
      storeAudio.playChime();
  }
};

/**
 * Memainkan notifikasi suara (Preset yang tersedia ATAU File pribadi)
 */
export const playStockVoiceAlert = (
  type: 'low_stock' | 'out_of_stock',
  productName: string,
  stockQty: number,
  unit: string,
  settings: VoiceAlertSettings
) => {
  if (!settings.enabled) return;

  // =========================================================================
  // PILIHAN 2: SUARA DARI FILE PRIBADI (JIKA DIPILIH OLEH PENGGUNA)
  // =========================================================================
  if (settings.soundSource === 'custom_file' && settings.customAudioDataUrl) {
    const shouldPlayCustom =
      !settings.customAudioTarget ||
      settings.customAudioTarget === 'both' ||
      (settings.customAudioTarget === 'low_only' && type === 'low_stock') ||
      (settings.customAudioTarget === 'out_only' && type === 'out_of_stock');

    if (shouldPlayCustom) {
      try {
        const audio = new Audio(settings.customAudioDataUrl);
        audio.volume = settings.speechVolume || 1.0;
        audio.play().catch(() => {});
        return;
      } catch {
        // Jika audio gagal, fallback ke preset di bawah
      }
    }
  }

  // =========================================================================
  // PILIHAN 1: SUARA NOTIFIKASI YANG TERSEDIA DI SISTEM
  // =========================================================================
  const preset = settings.presetSound || (settings.voiceStyle === 'chime_bell' ? 'chime_classic' : 'speech_id');

  if (preset === 'chime_classic') {
    storeAudio.playChime();
    return;
  }

  if (preset === 'store_bell') {
    storeAudio.playBell();
    return;
  }

  if (preset === 'soft_alert') {
    storeAudio.playAlert();
    return;
  }

  if (preset === 'radar_pulse') {
    storeAudio.playRadarPulse();
    return;
  }

  // Preset 'speech_id' (Suara Bicara Bahasa Indonesia)
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      storeAudio.playChime();

      setTimeout(() => {
        window.speechSynthesis.cancel();

        const template = type === 'out_of_stock' ? settings.outOfStockTemplate : settings.lowStockTemplate;
        const textToSpeak = template
          .replace(/{produk}/gi, productName)
          .replace(/{stok}/gi, String(stockQty))
          .replace(/{satuan}/gi, unit || 'buah');

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'id-ID';
        utterance.rate = settings.speechRate || 1.0;
        utterance.pitch = settings.speechPitch || 1.0;
        utterance.volume = settings.speechVolume || 1.0;

        const voices = window.speechSynthesis.getVoices();
        const indonesianVoice = voices.find(
          (v) => v.lang.includes('id') || v.lang.includes('ID') || v.name.toLowerCase().includes('indonesia')
        );
        if (indonesianVoice) {
          utterance.voice = indonesianVoice;
        }

        window.speechSynthesis.speak(utterance);
      }, 350);
    } catch {
      storeAudio.playChime();
    }
  } else {
    storeAudio.playChime();
  }
};
