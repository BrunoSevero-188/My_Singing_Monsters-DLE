// Valida tipos e campos usados pelo jogo antes de publicar.
// Uso: npm run check
import { readdir, readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { toRarity } from '../js/core/rarity.js';

let errors = 0;
let warnings = 0;
const ok = (message) => console.log('✔', message);
const err = (message) => { errors++; console.error('✖', message); };
const warn = (message) => { warnings++; console.warn('⚠', message); };

const validVersion = (value) => typeof value === 'string' && /^\d+(\.\d+){0,3}$/.test(value.trim());
const validYear = (year) => Number.isInteger(Number(year)) && Number(year) >= 1990 && Number(year) <= 2100;
const isHttp = (url) => /^https?:\/\//i.test(url);
const exists = (file) => access(file).then(() => true, () => false);
const isBuy = (value) => value === 'Comprado' || (Array.isArray(value) && value.length === 0);

async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(file)));
    else if (entry.name.endsWith('.js')) files.push(file);
  }
  return files;
}

// 1) Módulos: encontra arquivo inexistente, export faltando e erro de sintaxe.
for (const file of await walk('js')) {
  if (file.endsWith('app.js')) continue; // depende do DOM
  try {
    await import(pathToFileURL(path.resolve(file)).href);
    ok(file);
  } catch (error) {
    err(`${file}: ${error.message}`);
  }
}

// 2) Dados
let monsters;
try {
  monsters = JSON.parse(await readFile('data/monsters.json', 'utf8'));
} catch (error) {
  err(`data/monsters.json: ${error.message}`);
}

if (monsters) {
  if (!Array.isArray(monsters) || !monsters.length) {
    err('data/monsters.json precisa ser uma lista com pelo menos 1 monstro.');
  } else {
    ok(`data/monsters.json: ${monsters.length} monstros`);
    const ids = new Set();
    const names = new Set();
    for (const monster of monsters) {
      if (Number.isInteger(monster.id)) ids.add(monster.id);
      if (monster.nome) names.add(monster.nome.toLowerCase());
    }
    const seenIds = new Set();
    const seenNames = new Set();
    const missing = { raridade: 0, versao: 0, ano: 0, icone: 0, gif: 0, ovo: 0, combinacao: 0 };
    const missingFiles = [];

    for (const [index, monster] of monsters.entries()) {
      const where = `#${index + 1} (${monster?.nome ?? 'sem nome'})`;
      if (!Number.isInteger(monster.id) || monster.id < 1) err(`${where}: "id" precisa ser um número inteiro maior que 0.`);
      else if (seenIds.has(monster.id)) err(`${where}: id ${monster.id} repetido.`);
      else seenIds.add(monster.id);

      if (!monster.nome || typeof monster.nome !== 'string') err(`${where}: falta "nome".`);
      else if (seenNames.has(monster.nome.toLowerCase())) err(`${where}: nome repetido.`);
      else seenNames.add(monster.nome.toLowerCase());

      if (!Array.isArray(monster.ilhas) || !monster.ilhas.length) err(`${where}: "ilhas" precisa ser uma lista com ao menos 1 item.`);
      if (!monster.classe || (Array.isArray(monster.classe) && !monster.classe.length)) err(`${where}: falta "classe".`);
      if (!Array.isArray(monster.elementos) || !monster.elementos.length) err(`${where}: "elementos" precisa ser uma lista com ao menos 1 item.`);

      if (monster.raridade == null || monster.raridade === '') missing.raridade++;
      else if (!toRarity(monster.raridade)) err(`${where}: "raridade" inválida ("${monster.raridade}"). Use comum, raro ou epico.`);

      if (monster.descricao != null && typeof monster.descricao !== 'string') {
        err(`${where}: "descricao" precisa ser um texto (string) ou null.`);
      }

      if (monster.versao == null || monster.versao === '') missing.versao++;
      else if (!validVersion(String(monster.versao))) err(`${where}: "versao" inválida ("${monster.versao}"). Use algo como 1.0.0.`);

      if (monster.ano == null || monster.ano === '') missing.ano++;
      else if (!validYear(monster.ano)) err(`${where}: "ano" inválido ("${monster.ano}"). Use só o ano, ex.: 2012.`);

      for (const field of ['icone', 'gif', 'ovo']) {
        const value = monster[field];
        if (value == null || value === '') { missing[field]++; continue; }
        if (typeof value !== 'string') { err(`${where}: "${field}" precisa ser um texto (URL ou caminho).`); continue; }
        if (!isHttp(value) && !(await exists(value))) missingFiles.push(value);
      }

      const combo = monster.combinacao;
      if (combo == null) missing.combinacao++;
      else if (!isBuy(combo)) {
        if (!Array.isArray(combo) || !combo.every((pair) => Array.isArray(pair) && pair.length === 2)) {
          err(`${where}: "combinacao" precisa ser uma lista de pares [["A","B"]], [] ou "Comprado".`);
        } else {
          for (const [first, second] of combo) {
            if (String(first).toLowerCase() === String(second).toLowerCase()) warn(`${where}: combinação com o mesmo monstro duas vezes (${first} + ${second}).`);
            for (const nameOrId of [first, second]) {
              const found = typeof nameOrId === 'number' ? ids.has(nameOrId) : names.has(String(nameOrId).toLowerCase());
              if (!found) warn(`${where}: combinação cita "${nameOrId}", que não existe no JSON.`);
            }
          }
        }
      }
    }

    const missingWarning = (count, message) => { if (count) warn(`${count} monstro(s) sem ${message}`); };
    missingWarning(missing.raridade, '"raridade" (comum, raro ou epico).');
    missingWarning(missing.versao, '"versao" (a coluna Versão fica cinza).');
    missingWarning(missing.ano, '"ano" (a coluna Ano fica cinza).');
    missingWarning(missing.icone, '"icone" (a célula Monstro mostra só o nome).');
    missingWarning(missing.gif, '"gif" (ao acertar, o jogo mostra o ícone no lugar).');
    missingWarning(missing.ovo, '"ovo" (não entram no modo Ovo invertido).');
    missingWarning(missing.combinacao, '"combinacao" (a dica de combinação não tem resposta cadastrada).');
    if (missingFiles.length) warn(`${missingFiles.length} arquivo(s) locais não encontrados (ex.: ${missingFiles[0]})`);
    else ok('arquivos locais de icone/gif/ovo conferidos (links HTTP não são verificados)');
  }
}

console.log(`\n${errors} erro(s), ${warnings} aviso(s).`);
process.exit(errors ? 1 : 0);