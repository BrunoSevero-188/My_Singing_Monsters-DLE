// Adiciona "raridade": "comum" a todos os registros atuais de monsters.json.
// Uso: node scripts/adicionar-raridade.mjs
import { readFile, writeFile } from 'node:fs/promises';

const file = 'data/monsters.json';
const monsters = JSON.parse(await readFile(file, 'utf8'));
if (!Array.isArray(monsters)) throw new Error(`${file} precisa conter uma lista de monstros.`);

const updated = monsters.map((monster) => ({ ...monster, raridade: 'comum' }));
await writeFile(file, `${JSON.stringify(updated, null, 2)}\n`);
console.log(`✔ Campo "raridade": "comum" adicionado a ${updated.length} monstros em ${file}.`);
