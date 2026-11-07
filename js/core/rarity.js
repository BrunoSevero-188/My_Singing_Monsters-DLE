// Raridade do monstro: comum, raro ou épico (campo "raridade" no data/monsters.json)
export const RARITIES = ['comum', 'raro', 'epico'];

// Cores usadas nos selos e nos botões de filtro da Biblioteca
export const RARITY_COLORS = { comum: '#8e9aaf', raro: '#3b82f6', epico: '#a855f7' };
export const rarityColor = (r) => RARITY_COLORS[r] ?? '#6b6591';

const ALIASES = { common: 'comum', rare: 'raro', epic: 'epico' };

// "Épico", "epico", " RARO ", "epic" -> 'epico' / 'raro' · vazio ou inválido -> null
export function toRarity(v) {
  if (v == null) return null;
  const k = String(v).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const r = ALIASES[k] ?? k;
  return RARITIES.includes(r) ? r : null;
}
