import { LAUNCH_DATE, SITE_TZ } from '../config.js';

// Data de hoje no fuso de Brasília (AAAA-MM-DD)
export function todayKey() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: SITE_TZ }).format(new Date());
}

export function yesterdayKey() {
  return new Date(Date.parse(`${todayKey()}T12:00:00Z`) - 864e5).toISOString().slice(0, 10);
}

// Hash simples (FNV-1a): transforma texto em número
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Monstro de um dia, sorteado pelo ID:
//   1) analisa o JSON e junta os IDs
//   2) calcula quantos monstros existem
//   3) sorteia (de forma fixa para o dia) uma posição e devolve o monstro daquele ID
// O "salt" faz cada modo ter um monstro diferente no mesmo dia.
export function answerFor(list, salt, dayKey) {
  const ids = list.map((m) => m.id).sort((a, b) => a - b);
  const total = ids.length;
  if (!total) return undefined;
  const id = ids[hash(`${dayKey}|${salt}`) % total];
  return list.find((m) => m.id === id);
}

export const pickDaily = (list, salt) => answerFor(list, salt, todayKey());

// Número do dia (#1 no LAUNCH_DATE)
export function dayNumber() {
  const ms = Date.parse(`${todayKey()}T12:00:00Z`) - Date.parse(`${LAUNCH_DATE}T12:00:00Z`);
  return Math.max(1, Math.floor(ms / 864e5) + 1);
}
