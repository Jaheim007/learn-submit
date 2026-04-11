import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Default to dark mode (matching hacktualiz.com)
if (!localStorage.getItem('theme') || localStorage.getItem('theme') === 'dark') {
  document.documentElement.classList.add('dark');
}

// --- PWA Service Worker Guard ---
// Prevent SW from interfering in iframe/preview contexts
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreviewHost =
  window.location.hostname.includes('id-preview--') ||
  window.location.hostname.includes('lovableproject.com');

if (isPreviewHost || isInIframe) {
  navigator.serviceWorker?.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
}

// --- Capacitor-ready: detect standalone/native mode ---
const isStandalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as any).standalone === true;

if (isStandalone) {
  document.documentElement.classList.add('standalone');
}

// Detect Capacitor native environment
if ((window as any).Capacitor?.isNativePlatform?.()) {
  document.documentElement.classList.add('capacitor-native');
}

// Prevent pull-to-refresh on mobile browsers (native-like)
document.body.style.overscrollBehavior = 'none';

// Viewport height fix for mobile browsers
const setVH = () => {
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
};
setVH();
window.addEventListener('resize', setVH);

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
