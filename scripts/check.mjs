// Verifica os módulos do site e o arquivo data/monsters.json antes de publicar.
// Uso: npm run check
import { readdir, readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { toRarity } from '../js/core/rarity.js';

let errors = 0;
let warnings = 0;
const ok = (m) => console.log('✔', m);
const err = (m) => { errors++; console.error('✖', m); };
const warn = (m) => { warnings++; console.warn('⚠', m); };

const validVersion = (v) => typeof v === 'string' && /^\d+(\.\d+){0,3}$/.test(v.trim());
const validYear = (y) => Number.isInteger(Number(y)) && Number(y) >= 1990 && Number(y) <= 2100;
const isHttp = (u) => /^https?:\/\//i.test(u);
const exists = (p) => access(p).then(() => true, () => false);
const isBuy = (v) => v === 'Comprado' || (Array.isArray(v) && v.length === 0);

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}

// 1) Módulos: acha arquivo inexistente, export faltando e erro de sintaxe
for (const file of await walk('js')) {
  if (file.endsWith('app.js')) continue; // usa o DOM ao carregar
  try {
    await import(pathToFileURL(path.resolve(file)).href);
    ok(file);
  } catch (e) {
    err(`${file}: ${e.message}`);
  }
}

// 2) Dados
let list;
try {
  list = JSON.parse(await readFile('data/monsters.json', 'utf8'));
} catch (e) {
  err(`data/monsters.json: ${e.message}`);
}

if (list) {
  if (!Array.isArray(list) || !list.length) {
    err('data/monsters.json precisa ser uma lista com pelo menos 1 monstro.');
  } else {
    ok(`data/monsters.json: ${list.length} monstros`);
    const ids = new Set();
    const names = new Set();
    for (const m of list) { if (Number.isInteger(m.id)) ids.add(m.id); if (m.nome) names.add(m.nome.toLowerCase()); }
    const seenIds = new Set();
    const seenNames = new Set();
    const count = { raridade: 0, versao: 0, ano: 0, icone: 0, gif: 0, ovo: 0, combinacao: 0, legacy: 0 };
    const missingFiles = [];

    for (const [i, m] of list.entries()) {
      const where = `#${i + 1} (${m?.nome ?? 'sem nome'})`;

      if (!Number.isInteger(m.id) || m.id < 1) err(`${where}: "id" precisa ser um número inteiro maior que 0.`);
      else if (seenIds.has(m.id)) err(`${where}: id ${m.id} repetido.`);
      else seenIds.add(m.id);

      if (!m.nome || typeof m.nome !== 'string') err(`${where}: falta "nome".`);
      else if (seenNames.has(m.nome.toLowerCase())) err(`${where}: nome repetido.`);
      else seenNames.add(m.nome.toLowerCase());

      if (!Array.isArray(m.ilhas) || !m.ilhas.length) err(`${where}: "ilhas" precisa ser uma lista com ao menos 1 item.`);
      if (!m.classe || (Array.isArray(m.classe) && !m.classe.length)) err(`${where}: falta "classe".`);
      if (!Array.isArray(m.elementos) || !m.elementos.length) err(`${where}: "elementos" precisa ser uma lista com ao menos 1 item.`);

      if (m.raridade == null || m.raridade === '') count.raridade++;
      else if (!toRarity(m.raridade)) err(`${where}: "raridade" inválida ("${m.raridade}"). Use comum, raro ou epico.`);

      if ('data' in m || 'lancamento' in m || 'imagem' in m) count.legacy++;

      if (m.versao == null || m.versao === '') count.versao++;
      else if (!validVersion(String(m.versao))) err(`${where}: "versao" inválida ("${m.versao}"). Use algo como 1.0.0.`);

      if (m.ano == null || m.ano === '') count.ano++;
      else if (!validYear(m.ano)) err(`${where}: "ano" inválido ("${m.ano}"). Use só o ano, ex.: 2012.`);

      for (const campo of ['icone', 'gif', 'ovo']) {
        const v = m[campo];
        if (v == null || v === '') { count[campo]++; continue; }
        if (typeof v !== 'string') { err(`${where}: "${campo}" precisa ser um texto (URL ou caminho).`); continue; }
        if (!isHttp(v) && !(await exists(v))) missingFiles.push(v); // links http não são verificados
      }

      // combinação: [["A","B"],["C","D"]] · [] ou "Comprado" (só se compra) · ausente/null (não cadastrada)
      const c = m.combinacao;
      if (c == null) count.combinacao++;
      else if (!isBuy(c)) {
        if (!Array.isArray(c) || !c.every((p) => Array.isArray(p) && p.length === 2)) {
          err(`${where}: "combinacao" precisa ser uma lista de pares [["A","B"]], [] ou "Comprado".`);
        } else {
          for (const [a, b] of c) {
            if (String(a).toLowerCase() === String(b).toLowerCase()) warn(`${where}: combinação com o mesmo monstro duas vezes (${a} + ${b}).`);
            for (const x of [a, b]) {
              const found = typeof x === 'number' ? ids.has(x) : names.has(String(x).toLowerCase());
              if (!found) warn(`${where}: combinação cita "${x}", que não existe no JSON.`);
            }
          }
        }
      }
    }

    if (count.legacy) warn(`${count.legacy} monstro(s) com campos antigos ("data"/"lancamento"/"imagem"). Rode "npm run migrar".`);
    const falta = (n, msg) => (n ? warn(`${n} monstro(s) sem ${msg}`) : null);
    falta(count.raridade, '"raridade" (comum, raro ou epico): não aparece no selo nem no filtro da Biblioteca.');
    falta(count.versao, '"versao" (a coluna Versão fica cinza para eles).');
    falta(count.ano, '"ano" (a coluna Ano fica cinza para eles).');
    falta(count.icone, '"icone" (a célula Monstro mostra só o nome).');
    falta(count.gif, '"gif" (ao acertar, o jogo mostra o ícone no lugar).');
    falta(count.ovo, '"ovo" (não entram no modo Ovo invertido).');
    falta(count.combinacao, '"combinacao" (a dica 2 do Monstro do dia fica sem resposta).');
    if (missingFiles.length) warn(`${missingFiles.length} arquivo(s) locais não encontrados (ex.: ${missingFiles[0]})`);
    else ok('arquivos locais de icone/gif/ovo conferidos (links http não são verificados)');
  }
}

console.log(`\n${errors} erro(s), ${warnings} aviso(s).`);
process.exit(errors ? 1 : 0);
