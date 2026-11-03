// Verifica os módulos do site e o arquivo data/monsters.json antes de publicar.
// Uso: npm run check
import { readdir, readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { slug } from '../js/data/monsters.js';

let errors = 0;
let warnings = 0;
const ok = (m) => console.log('✔', m);
const err = (m) => { errors++; console.error('✖', m); };
const warn = (m) => { warnings++; console.warn('⚠', m); };

const validVersion = (v) => typeof v === 'string' && /^\d+(\.\d+){0,3}$/.test(v.trim());
const validYear = (y) => Number.isInteger(Number(y)) && Number(y) >= 1990 && Number(y) <= 2100;
const isHttp = (u) => /^https?:\/\//i.test(u);
const exists = (p) => access(p).then(() => true, () => false);

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
    let noVersion = 0, noYear = 0, noGif = 0, legacy = 0;
    const missingFiles = [];

    for (const [i, m] of list.entries()) {
      const where = `#${i + 1} (${m?.nome ?? 'sem nome'})`;
      if (!Number.isInteger(m.id) || m.id < 1) err(`${where}: "id" precisa ser um número inteiro maior que 0.`);
      else if (ids.has(m.id)) err(`${where}: id ${m.id} repetido.`);
      else ids.add(m.id);

      if (!m.nome || typeof m.nome !== 'string') err(`${where}: falta "nome".`);
      else if (names.has(m.nome.toLowerCase())) err(`${where}: nome repetido.`);
      else names.add(m.nome.toLowerCase());

      if (!Array.isArray(m.ilhas) || !m.ilhas.length) err(`${where}: "ilhas" precisa ser uma lista com ao menos 1 item.`);
      if (!m.classe || (Array.isArray(m.classe) && !m.classe.length)) err(`${where}: falta "classe".`);
      if (!Array.isArray(m.elementos) || !m.elementos.length) err(`${where}: "elementos" precisa ser uma lista com ao menos 1 item.`);

      if ('lancamento' in m || 'imagem' in m) legacy++;

      if (m.versao == null || m.versao === '') noVersion++;
      else if (!validVersion(String(m.versao))) err(`${where}: "versao" inválida ("${m.versao}"). Use algo como 1.0.0.`);

      if (m.data == null || m.data === '') noYear++;
      else if (!validYear(m.data)) err(`${where}: "data" inválida ("${m.data}"). Use só o ano, ex.: 2012.`);

      if (m.gif == null || m.gif === '') noGif++;
      else if (typeof m.gif !== 'string') err(`${where}: "gif" precisa ser um texto (link ou caminho).`);

      // arquivos locais (links http não são verificados)
      const icone = m.icone || m.imagem || (m.nome ? `assets/monsters/${slug(m.nome)}.png` : null);
      for (const f of [icone, m.gif]) {
        if (typeof f === 'string' && f && !isHttp(f) && !(await exists(f))) missingFiles.push(f);
      }
    }

    if (legacy) warn(`${legacy} monstro(s) com campos antigos ("lancamento"/"imagem"). Rode "npm run migrar".`);
    noVersion ? warn(`${noVersion} monstro(s) sem "versao". A coluna Versão fica cinza para eles.`) : ok('todos os monstros têm "versao"');
    noYear ? warn(`${noYear} monstro(s) sem "data" (ano). A coluna Data fica cinza para eles.`) : ok('todos os monstros têm "data"');
    noGif ? warn(`${noGif} monstro(s) sem "gif". Ao acertar, o jogo mostra o ícone no lugar.`) : ok('todos os monstros têm "gif"');
    missingFiles.length
      ? warn(`${missingFiles.length} arquivo(s) de imagem não encontrados (ex.: ${missingFiles[0]})`)
      : ok('todos os arquivos locais de ícone/gif existem');
  }
}

console.log(`\n${errors} erro(s), ${warnings} aviso(s).`);
process.exit(errors ? 1 : 0);
