/**
 * Native capabilities utility layer.
 * Wraps Capacitor plugins so the rest of the app can call simple functions
 * without worrying about whether we're running in a browser or on a device.
 */

import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Network } from '@capacitor/network';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { Keyboard } from '@capacitor/keyboard';
import { StatusBar, Style as StatusBarStyle } from '@capacitor/status-bar';

// ─── Platform detection ───────────────────────────────────
export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'

// ─── Share ────────────────────────────────────────────────
export async function nativeShare(opts: { title?: string; text?: string; url?: string }) {
  if (isNative) {
    await Share.share(opts);
  } else if (navigator.share) {
    await navigator.share(opts);
  } else {
    // fallback: copy to clipboard
    await navigator.clipboard.writeText(opts.url || opts.text || '');
  }
}

// ─── Haptics ──────────────────────────────────────────────
export async function hapticLight() {
  if (isNative) await Haptics.impact({ style: ImpactStyle.Light });
}
export async function hapticMedium() {
  if (isNative) await Haptics.impact({ style: ImpactStyle.Medium });
}
export async function hapticHeavy() {
  if (isNative) await Haptics.impact({ style: ImpactStyle.Heavy });
}

// ─── Network ──────────────────────────────────────────────
export async function getNetworkStatus() {
  return Network.getStatus();
}
export function onNetworkChange(cb: (connected: boolean) => void) {
  return Network.addListener('networkStatusChange', (status) => {
    cb(status.connected);
  });
}

// ─── In-App Browser (opens links inside the app) ─────────
export async function openInAppBrowser(url: string) {
  if (isNative) {
    await Browser.open({ url, presentationStyle: 'popover' });
  } else {
    window.open(url, '_blank', 'noopener');
  }
}

// ─── Back button (Android hardware) ──────────────────────
export function onBackButton(cb: () => void) {
  if (isNative) {
    return App.addListener('backButton', cb);
  }
  return { remove: () => {} };
}

// ─── Status Bar ───────────────────────────────────────────
export async function setStatusBarDark() {
  if (isNative) await StatusBar.setStyle({ style: StatusBarStyle.Dark });
}
export async function setStatusBarLight() {
  if (isNative) await StatusBar.setStyle({ style: StatusBarStyle.Light });
}

// ─── Keyboard ─────────────────────────────────────────────
export function onKeyboardShow(cb: (height: number) => void) {
  if (isNative) {
    return Keyboard.addListener('keyboardWillShow', (info) => cb(info.keyboardHeight));
  }
  return { remove: () => {} };
}
export function onKeyboardHide(cb: () => void) {
  if (isNative) {
    return Keyboard.addListener('keyboardWillHide', cb);
  }
  return { remove: () => {} };
}
