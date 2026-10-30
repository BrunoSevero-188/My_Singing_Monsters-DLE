import { todayKey, yesterdayKey } from './daily.js';

const KEY = 'msmdle:v1';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
  catch { return {}; }
}
function save(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
}

export function getState(modeId) {
  const data = load();
  const s = data.days?.[modeId];
  if (!s || s.date !== todayKey()) return { date: todayKey(), guesses: [], won: false };
  return s;
}

export function saveState(modeId, state) {
  const data = load();
  data.days = data.days || {};
  data.days[modeId] = state;
  save(data);
}

export function registerWin(modeId) {
  const data = load();
  data.stats = data.stats || {};
  const st = data.stats[modeId] || { wins: 0, streak: 0, lastWin: null };
  if (st.lastWin === todayKey()) return st;
  st.streak = st.lastWin === yesterdayKey() ? st.streak + 1 : 1;
  st.wins += 1;
  st.lastWin = todayKey();
  data.stats[modeId] = st;
  save(data);
  return st;
}

export function getStats(modeId) {
  const st = load().stats?.[modeId] || { wins: 0, streak: 0, lastWin: null };
  // streak quebrada se não ganhou ontem nem hoje
  if (st.lastWin !== todayKey() && st.lastWin !== yesterdayKey()) return { ...st, streak: 0 };
  return st;
}