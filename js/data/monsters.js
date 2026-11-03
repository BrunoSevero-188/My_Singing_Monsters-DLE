import { WIKI_BASE } from '../config.js';

export const DATA_URL = 'data/monsters.json';
export let MONSTERS = [];

export const slug = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// JSON em português -> formato interno usado pelo jogo. Ícone e GIF são fontes independentes.
function normalize(raw) {
  const icon = raw.icone || raw.imagem || `assets/monsters/${slug(raw.nome)}.png`;
  return {
    id: raw.id,
    name: raw.nome,
    islands: raw.ilhas ?? [],
    type: raw.classe,
    elements: raw.elementos ?? [],
    releaseDate: raw.lancamento ?? null,
    icon,
    gif: raw.gif || null,
    image: icon,
    combinacao: Array.isArray(raw.combinacao) ? raw.combinacao : [],
    wiki: `${WIKI_BASE}/wiki/${encodeURIComponent(raw.nome.replace(/ /g, '_'))}`,
  };
}

const elementKey = (monster) => [...new Set(monster.elements)].sort().join('|');

// Sugere combinações cujos elementos dos pais formam exatamente os do monstro.
// A lista é limitada a duas receitas para manter a dica simples.
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
      const combined = new Set([...first.elements, ...second.elements]);
      if (combined.size === target.size && [...target].every((element) => combined.has(element))) {
        matches.push(`${first.name} + ${second.name}`);
      }
    }
  }
  // Monstros de um elemento podem ser reproduzidos usando dois da mesma espécie.
  if (!matches.length && target.size === 1) matches.push(`${monster.name} + ${monster.name}`);
  return matches.slice(0, 2);
}

export async function loadMonsters() {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`Não achei ${DATA_URL} (HTTP ${res.status}).`);
  const raw = await res.json();
  if (!Array.isArray(raw) || !raw.length) {
    throw new Error(`${DATA_URL} está vazio ou fora do formato (esperado: uma lista de monstros).`);
  }
  MONSTERS = raw.map(normalize);
  MONSTERS.forEach((monster) => {
    monster.combinacao = findCombinations(monster, MONSTERS);
    // Mantém a forma singular usada no JSON e disponibiliza a lista para o jogo.
    monster.combination = monster.combinacao;
  });
}

const uniq = (arr) => [...new Set(arr)].sort();
export const getIslands = () => uniq(MONSTERS.flatMap((m) => m.islands));
export const getTypes = () => uniq(MONSTERS.flatMap((m) => [].concat(m.type)));
