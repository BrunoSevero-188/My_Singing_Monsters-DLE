export let MONSTERS = [];

export async function loadMonsters() {
  const res = await fetch('data/monsters.json');
  if (!res.ok) throw new Error('Não achei data/monsters.json. Rode "npm run sync" primeiro.');
  MONSTERS = await res.json();
}

const uniq = (arr) => [...new Set(arr)].sort();
export const getIslands = () => uniq(MONSTERS.flatMap((m) => m.islands));
export const getTypes = () => uniq(MONSTERS.map((m) => m.type));