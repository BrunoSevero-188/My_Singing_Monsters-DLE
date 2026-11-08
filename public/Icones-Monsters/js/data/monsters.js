import { WIKI_BASE } from '../config.js';
import { toRarity } from '../core/rarity.js';

export const DATA_URL = 'data/monsters.json';
export let MONSTERS = [];

export const slug = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const text = (v) => (v == null || String(v).trim() === '' ? null : String(v).trim());

function toYear(value) {
  if (value == null || value === '') return null;
  const year = Number(String(value).slice(0, 4));
  return Number.isInteger(year) ? year : null;
}

function toVersion(value) {
  const version = text(value);
  return version ? version.replace(/^v/i, '') : null;
}

function toCombo(value) {
  if (value == null) return null;
  if (typeof value === 'string') return /^comprad/i.test(value.trim()) ? 'buy' : null;
  if (!Array.isArray(value)) return null;
  if (!value.length) return 'buy';
  if (value.length === 1 && typeof value[0] === 'string' && /^comprad/i.test(value[0])) return 'buy';
  const pairs = value.filter((pair) => Array.isArray(pair) && pair.length === 2);
  return pairs.length ? pairs : null;
}

function normalize(raw) {
  const icon = text(raw.icone) ?? text(raw.imagem);
  const rarity = toRarity(raw.raridade) ?? 'comum';
  raw.raridade = rarity;
  return {
    id: raw.id,
    name: raw.nome,
    islands: raw.ilhas ?? [],
    type: raw.classe,
    rarity,
    elements: raw.elementos ?? [],
    version: toVersion(raw.versao),
    year: toYear(raw.ano ?? raw.data ?? raw.lancamento),
    icon,
    gif: text(raw.gif),
    egg: text(raw.ovo),
    combo: toCombo(raw.combinacao),
    image: icon,
    combinacao: Array.isArray(raw.combinacao) ? raw.combinacao : [],
    wiki: `${WIKI_BASE}/wiki/${encodeURIComponent(raw.nome.replace(/ /g, '_'))}`,
  };
}

export async function loadMonsters() {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`Não achei ${DATA_URL} (HTTP ${res.status}).`);
  const raw = await res.json();
  if (!Array.isArray(raw) || !raw.length) throw new Error(`${DATA_URL} está vazio ou fora do formato (esperado: uma lista de monstros).`);
  MONSTERS = raw.map(normalize);
}

const uniq = (arr) => [...new Set(arr)].sort();
export const getIslands = () => uniq(MONSTERS.flatMap((m) => m.islands));
export const getTypes = () => uniq(MONSTERS.flatMap((m) => [].concat(m.type)));
