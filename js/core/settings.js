import { SETTINGS_KEY } from '../config.js';

const DEFAULTS = { colorblind: false, grey: false };
let cache = null;

export function getSettings() {
  if (!cache) {
    try { cache = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)) }; }
    catch { cache = { ...DEFAULTS }; }
  }
  return cache;
}

export function setSetting(key, value) {
  cache = { ...getSettings(), [key]: value };
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(cache)); } catch {}
  applySettings();
}

export function applySettings() {
  document.documentElement.dataset.cb = getSettings().colorblind ? '1' : '0';
}
