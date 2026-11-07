import { WIKI_BASE } from '../config.js';
import { toRarity } from '../core/rarity.js';

export const DATA_URL = 'data/monsters.json';
export let MONSTERS = [];

export const slug = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const text = (v) => (v == null || String(v).trim() === '' ? null : String(v).trim());

// "2012" -> 2012 · "2012-09-04" -> 2012 · vazio/inválido -> null
function toYear(v) {
  if (v == null || v === '') return null;
  const n = Number(String(v).slice(0, 4));
  return Number.isInteger(n) ? n : null;
}

// "v1.2.0" -> "1.2.0" · vazio -> null
function toVersion(v) {
  const t = text(v);
  return t ? t.replace(/^v/i, '') : null;
}

// Combinação:
//   [["Noggin", "Mammott"], ["Tweedle", "Potbelly"]]  -> lista de pares (nomes ou IDs)
//   [] ou "Comprado"                                    -> 'buy' (só se obtém comprando)
//   ausente / null                                      -> null (ainda não cadastrada)
function toCombo(v) {
  if (v == null) return null;
  if (typeof v === 'string') return /^comprad/i.test(v.trim()) ? 'buy' : null;
  if (!Array.isArray(v)) return null;
  if (!v.length) return 'buy';
  if (v.length === 1 && typeof v[0] === 'string' && /^comprad/i.test(v[0])) return 'buy';
  const pairs = v.filter((p) => Array.isArray(p) && p.length === 2);
  return pairs.length ? pairs : null;
}

// JSON em português -> formato interno usado pelo jogo
function normalize(raw) {
  const icon = text(raw.icone) ?? text(raw.imagem);
  return {
    id: raw.id,
    name: raw.nome,
    islands: raw.ilhas ?? [],
    type: raw.classe,
    rarity: toRarity(raw.raridade),                          // 'comum' | 'raro' | 'epico' (ou null)
    elements: raw.elementos ?? [],
    version: toVersion(raw.versao),                          // versão do jogo em que foi lançado (ex.: "1.0.0")
    year: toYear(raw.ano ?? raw.data ?? raw.lancamento),     // ano de lançamento (aceita os campos antigos)
    icon,                                                    // URL do ícone: célula "Monstro" da tabela
    gif: text(raw.gif),                                      // URL do gif: aparece quando o jogador acerta
    egg: text(raw.ovo),                                      // URL do ovo: modo "Ovo invertido"
    combo: toCombo(raw.combinacao),                          // como obter o monstro (dica 2 do Monstro do dia)
    image: icon,                                             // alias usado pelos outros modos
    wiki: `${WIKI_BASE}/wiki/${encodeURIComponent(raw.nome.replace(/ /g, '_'))}`,
  };
}

export async function loadMonsters() {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`Não achei ${DATA_URL} (HTTP ${res.status}).`);
  const raw = await res.json();
  if (!Array.isArray(raw) || !raw.length) {
    throw new Error(`${DATA_URL} está vazio ou fora do formato (esperado: uma lista de monstros).`);
  }
  MONSTERS = raw.map(normalize);
}

const uniq = (arr) => [...new Set(arr)].sort();
export const getIslands = () => uniq(MONSTERS.flatMap((m) => m.islands));
export const getTypes = () => uniq(MONSTERS.flatMap((m) => [].concat(m.type)));
