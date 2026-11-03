import { WIKI_BASE } from '../config.js';

export const DATA_URL = 'data/monsters.json';
export let MONSTERS = [];

export const slug = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// JSON em português -> formato interno usado pelo jogo
function normalize(raw) {
  return {
    id: raw.id,
    name: raw.nome,
    islands: raw.ilhas ?? [],
    type: raw.classe,
    elements: raw.elementos ?? [],
    releaseDate: raw.lancamento ?? null, // "AAAA-MM-DD"
    image: raw.imagem ?? `assets/monsters/${slug(raw.nome)}.png`,
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
