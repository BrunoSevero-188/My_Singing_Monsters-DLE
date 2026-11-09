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

  if (typeof v === 'string') {
    return /^comprad/i.test(v.trim()) ? 'buy' : null;
  }

  if (!Array.isArray(v)) return null;
  if (!v.length) return 'buy';

  if (
    v.length === 1 &&
    typeof v[0] === 'string' &&
    /^comprad/i.test(v[0])
  ) {
    return 'buy';
  }

  const pairs = v.flatMap((item) => {
    if (Array.isArray(item) && item.length === 2) {
      return [item];
    }

    if (typeof item === 'string' && item.includes('+')) {
      const pair = item
        .split('+')
        .map((name) => name.trim())
        .filter(Boolean);
      return pair.length === 2 ? [pair] : [];
    }
    return [];
  });
  return pairs.length ? pairs : null;
}

function toDescription(value) {
  const values = Array.isArray(value) ? value : [value];

  return values
    .map((item) => text(item))
    .filter(Boolean)
    .join('\n') || null;
}

// Ícones opcionais de elementos e ilhas.
export let ELEMENT_ISLAND_ICONS = {
  elementos: [],
  ilhas: []
};

async function loadElementIslandIcons() {
  try {
    const res = await fetch('data/elementos-ilhas.json');

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    ELEMENT_ISLAND_ICONS = {
      elementos: Array.isArray(data.elementos)
        ? data.elementos
        : [],

      ilhas: Array.isArray(data.ilhas)
        ? data.ilhas
        : []
    };

  } catch (error) {
    console.warn(
      'Não foi possível carregar data/elementos-ilhas.json:',
      error
    );

    ELEMENT_ISLAND_ICONS = {
      elementos: [],
      ilhas: []
    };
  }
}

// JSON em português -> formato interno usado pelo jogo
function normalize(raw) {
  const icon = text(raw.icone) ?? text(raw.imagem);
  return {
    id: raw.id,
    name: raw.nome,
    description: toDescription(raw.descricao), // texto livre opcional fornecido em data/monsters.json
    islands: raw.ilhas ?? [],
    type: raw.classe,
    rarity: toRarity(raw.raridade),
    elements: raw.elementos ?? [],
    version: toVersion(raw.versao),
    year: toYear(raw.ano ?? raw.data ?? raw.lancamento),
    icon,
    gif: text(raw.gif),
    egg: text(raw.ovo),
    combo: toCombo(raw.combinacao),
    image: icon,
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
  await loadElementIslandIcons();
}

const uniq = (arr) => [...new Set(arr)].sort();
export const getIslands = () => uniq(MONSTERS.flatMap((m) => m.islands));
export const getTypes = () => uniq(MONSTERS.flatMap((m) => [].concat(m.type)));