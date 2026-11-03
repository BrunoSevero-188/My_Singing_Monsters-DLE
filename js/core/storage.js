import { todayKey, yesterdayKey } from './daily.js';
import { STORAGE_KEY, SETTINGS_KEY } from '../config.js';

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}
function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

const emptyStats = () => ({
  wins: 0, streak: 0, maxStreak: 0, lastWin: null,
  oneShots: 0, totalGuesses: 0, tracked: 0, dist: {},
});

export function getState(modeId) {
  const s = load().days?.[modeId];
  if (!s || s.date !== todayKey()) return { date: todayKey(), guesses: [], won: false, hidden: [] };
  return { hidden: [], ...s };
}

export function saveState(modeId, state) {
  const data = load();
  data.days = data.days || {};
  data.days[modeId] = state;
  save(data);
}

export function registerWin(modeId, tries = 1) {
  const data = load();
  data.stats = data.stats || {};
  const st = { ...emptyStats(), ...(data.stats[modeId] || {}) };
  if (st.lastWin === todayKey()) return st;

  st.streak = st.lastWin === yesterdayKey() ? st.streak + 1 : 1;
  st.maxStreak = Math.max(st.maxStreak, st.streak);
  st.wins += 1;
  st.tracked += 1;
  st.totalGuesses += tries;
  if (tries === 1) st.oneShots += 1;
  const bucket = tries >= 10 ? '10+' : String(tries);
  st.dist[bucket] = (st.dist[bucket] || 0) + 1;
  st.lastWin = todayKey();

  data.stats[modeId] = st;
  save(data);
  return st;
}

export function getStats(modeId) {
  const st = { ...emptyStats(), ...(load().stats?.[modeId] || {}) };
  if (st.lastWin !== todayKey() && st.lastWin !== yesterdayKey()) st.streak = 0;
  st.average = st.tracked ? st.totalGuesses / st.tracked : 0;
  return st;
}

export function exportData() {
  return JSON.stringify({
    app: 'msmdle', version: 2,
    game: load(),
    settings: localStorage.getItem(SETTINGS_KEY),
  });
}

export function importData(text) {
  const d = JSON.parse(text);
  if (d?.app !== 'msmdle' || typeof d.game !== 'object') throw new Error('Arquivo inválido.');
  save(d.game);
  if (d.settings) localStorage.setItem(SETTINGS_KEY, d.settings);
}

export function clearAll() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SETTINGS_KEY);
}
