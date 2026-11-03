import { WIKI_BASE } from '../config.js';

export const DATA_URL = 'data/monsters.json';
export let MONSTERS = [];

export const slug = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// "2012" -> 2012 · "2012-09-04" -> 2012 · vazio/inválido -> null
function toYear(v) {
  if (v == null || v === '') return null;
  const n = Number(String(v).slice(0, 4));
  return Number.isInteger(n) ? n : null;
}

// "v1.2.0" -> "1.2.0" · vazio -> null
function toVersion(v) {
  if (v == null || String(v).trim() === '') return null;
  return String(v).trim().replace(/^v/i, '');
}

// JSON em português -> formato interno usado pelo jogo
function normalize(raw) {
  const icon = raw.icone || raw.imagem || `assets/monsters/${slug(raw.nome)}.png`;
  return {
    id: raw.id,
    name: raw.nome,
    islands: raw.ilhas ?? [],
    type: raw.classe,
    elements: raw.elementos ?? [],
    version: toVersion(raw.versao),          // versão do jogo em que foi lançado (ex.: "1.0.0")
    year: toYear(raw.data ?? raw.lancamento), // ano de lançamento (aceita o campo antigo "lancamento")
    icon,                                     // ícone: aparece na célula "Monstro"
    gif: raw.gif || null,                     // gif: aparece quando o jogador acerta
    image: icon,                              // imagem estática usada nos outros modos
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
