import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker for seamless offline operation & local caching
registerSW({
  immediate: true,
  onNeedRefresh() {
    // Bisa auto refresh atau trigger notifikasi
    console.log('[PWA] Versi terbaru MitraStore POS tersedia.');
  },
  onOfflineReady() {
    console.log('[PWA] Aplikasi MitraStore siap digunakan 100% secara offline.');
  },
});

createRoot(document.getElementById('root')!).render(<App />);
