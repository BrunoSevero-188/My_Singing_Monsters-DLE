// Converte o seu data/monsters.json para o formato atual, SEM perder o que você já preencheu.
//   data / lancamento  ->  ano (só o ano)      imagem  ->  icone
//   campos novos (vazios): versao, gif, ovo, combinacao
// Faz uma cópia de segurança em data/monsters.backup.json antes de gravar.
// Uso: npm run migrar
import { readFile, writeFile, access } from 'node:fs/promises';

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
  const { id, nome, ilhas, classe, elementos, versao, ano, data, icone, gif, ovo, combinacao, lancamento, imagem, ...resto } = m;
  return {
    id, nome, ilhas, classe, elementos,
    versao: versao ?? null,                    // ex.: "1.0.0": versão do jogo em que foi lançado
    ano: ano ?? year(data ?? lancamento),      // ex.: 2012: ano de lançamento
    icone: icone ?? imagem ?? null,            // URL do ícone (célula "Monstro")
    gif: gif ?? null,                          // URL do gif (mostrado ao acertar)
    ovo: ovo ?? null,                          // URL do ovo (modo "Ovo invertido")
    combinacao: combinacao ?? null,            // [["Noggin","Mammott"],["Tweedle","Potbelly"]] ou [] se só se compra
    ...resto,                                  // qualquer outro campo seu é mantido
  };
});

await writeFile(FILE, JSON.stringify(out, null, 2) + '\n');

const falta = (k) => out.filter((m) => m[k] == null).length;
console.log(`✔ ${out.length} monstros migrados para o formato atual.`);
console.log(`  Cópia de segurança: ${backup}`);
console.log(`  Faltam preencher: versao (${falta('versao')}), ano (${falta('ano')}), icone (${falta('icone')}), gif (${falta('gif')}), ovo (${falta('ovo')}), combinacao (${falta('combinacao')})`);
