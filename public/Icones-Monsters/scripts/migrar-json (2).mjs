// Converte o seu data/monsters.json para o formato novo, SEM perder o que você já preencheu.
//   lancamento  ->  data (só o ano)        imagem  ->  icone
//   novos campos: versao (null), gif (null)
// Faz uma cópia de segurança em data/monsters.backup.json antes de gravar.
// Uso: npm run migrar
import { readFile, writeFile, access } from 'node:fs/promises';
import { slug } from '../js/data/monsters.js';

const FILE = 'data/monsters.json';
const exists = (p) => access(p).then(() => true, () => false);

const list = JSON.parse(await readFile(FILE, 'utf8'));
if (!Array.isArray(list)) throw new Error(`${FILE} precisa ser uma lista de monstros.`);

// cópia de segurança (nunca sobrescreve uma cópia que já exista)
let backup = 'data/monsters.backup.json';
if (await exists(backup)) backup = `data/monsters.backup-${Date.now()}.json`;
await writeFile(backup, JSON.stringify(list, null, 2));

const year = (v) => {
  if (v == null || v === '') return null;
  const n = Number(String(v).slice(0, 4));
  return Number.isInteger(n) ? n : null;
};

const out = list.map((m) => {
  const { id, nome, ilhas, classe, elementos, versao, data, icone, gif, lancamento, imagem, ...resto } = m;
  return {
    id, nome, ilhas, classe, elementos,
    versao: versao ?? null,                              // ex.: "1.0.0" (versão do jogo em que foi lançado)
    data: data ?? year(lancamento),                      // ex.: 2012 (ano de lançamento)
    icone: icone ?? imagem ?? `assets/monsters/${slug(nome)}.png`,
    gif: gif ?? null,                                    // link do gif mostrado quando o jogador acerta
    ...resto,                                            // qualquer outro campo seu é mantido
  };
});

await writeFile(FILE, JSON.stringify(out, null, 2) + '\n');

const falta = (k) => out.filter((m) => m[k] == null).length;
console.log(`✔ ${out.length} monstros migrados para o formato novo.`);
console.log(`  Cópia de segurança: ${backup}`);
console.log(`  Faltam preencher: versao (${falta('versao')}), data (${falta('data')}), gif (${falta('gif')})`);
