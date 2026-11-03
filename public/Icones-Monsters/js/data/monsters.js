import { WIKI_BASE } from '../config.js';

export const DATA_URL = 'data/monsters.json';
export let MONSTERS = [];

export const slug = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function normalize(raw) {
  const icon = raw.icone || raw.imagem || `assets/monsters/${slug(raw.nome)}.png`;
  return {
    id: raw.id,
    name: raw.nome,
    islands: raw.ilhas ?? [],
    type: raw.classe,
    elements: raw.elementos ?? [],
    version: toVersion(raw.versao),
    year: toYear(raw.data ?? raw.lancamento),
    icon,
    gif: raw.gif || null,
    image: icon,
    combinacao: Array.isArray(raw.combinacao) ? raw.combinacao : [],
    wiki: `${WIKI_BASE}/wiki/${encodeURIComponent(raw.nome.replace(/ /g, '_'))}`,
  };
}

function toYear(value) {
  if (value == null || value === '') return null;
  const year = Number(String(value).slice(0, 4));
  return Number.isInteger(year) ? year : null;
}

function toVersion(value) {
  if (value == null || String(value).trim() === '') return null;
  return String(value).trim().replace(/^v/i, '');
}

function findCombinations(monster, monsters) {
  if (monster.combinacao.length) return monster.combinacao.slice(0, 2);
  const target = new Set(monster.elements);
  const matches = [];
  for (let i = 0; i < monsters.length; i++) {
    const first = monsters[i];
    if (first.id === monster.id || first.elements.length >= target.size) continue;
    for (let j = i + 1; j < monsters.length; j++) {
      const second = monsters[j];
      if (second.id === monster.id || second.elements.length >= target.size) continue;
      const union = new Set([...first.elements, ...second.elements]);
      if (union.size === target.size && [...target].every((element) => union.has(element))) {
        matches.push(`${first.name} + ${second.name}`);
      }
    }
  }
  if (!matches.length && target.size === 1) matches.push(`${monster.name} + ${monster.name}`);
  return matches.slice(0, 2);
}

export async function loadMonsters() {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`Não achei ${DATA_URL} (HTTP ${res.status}).`);
  const raw = await res.json();
  if (!Array.isArray(raw) || !raw.length) throw new Error(`${DATA_URL} está vazio ou fora do formato (esperado: uma lista de monstros).`);
  MONSTERS = raw.map(normalize);
  MONSTERS.forEach((monster) => {
    monster.combinacao = findCombinations(monster, MONSTERS);
    monster.combination = monster.combinacao;
  });
}

const uniq = (arr) => [...new Set(arr)].sort();
export const getIslands = () => uniq(MONSTERS.flatMap((m) => m.islands));
export const getTypes = () => uniq(MONSTERS.flatMap((m) => [].concat(m.type)));
