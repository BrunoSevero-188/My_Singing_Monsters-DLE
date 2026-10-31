import { SCHEDULE } from '../data/monsters.js';

export function todayKey() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}

export function yesterdayKey() {
  const d = new Date(todayKey() + 'T12:00:00');
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Resposta de um dia específico (hoje ou ontem)
export function answerFor(list, salt, dayKey) {
  const id = SCHEDULE[salt]?.[dayKey];
  const scheduled = id && list.find((m) => m.id === id);
  return scheduled || list[hash(`${dayKey}|${salt}`) % list.length];
}

export function pickDaily(list, salt) {
  return answerFor(list, salt, todayKey());
}