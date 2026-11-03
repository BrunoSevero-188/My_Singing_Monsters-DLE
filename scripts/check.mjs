// Verifica os módulos do site e o arquivo data/monsters.json antes de publicar.
// Uso: npm run check
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { slug } from '../js/data/monsters.js';

let errors = 0;
let warnings = 0;
const ok = (m) => console.log('✔', m);
const err = (m) => { errors++; console.error('✖', m); };
const warn = (m) => { warnings++; console.warn('⚠', m); };

// Aceita AAAA-MM-DD (recomendado), AAAA-MM ou AAAA, e rejeita datas que não existem (ex.: 2020-02-31)
function validDate(s) {
  if (!/^\d{4}(-\d{2}(-\d{2})?)?$/.test(s)) return false;
  const full = s.length === 4 ? `${s}-01-01` : s.length === 7 ? `${s}-01` : s;
  const d = new Date(`${full}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(full);
}

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
    let noDate = 0;

    list.forEach((m, i) => {
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

      if (m.lancamento == null) noDate++;
      else if (!validDate(m.lancamento)) {
        err(`${where}: "lancamento" inválido ("${m.lancamento}"). Use AAAA-MM-DD.`);
      }
    });

    if (noDate) warn(`${noDate} monstro(s) sem "lancamento". A coluna Lançamento fica cinza para eles.`);
    else ok('todos os monstros têm data de lançamento');

    // 3) Imagens (aviso, não erro)
    const files = new Set(await readdir('assets/monsters').catch(() => []));
    const noImage = list.filter((m) => m.nome && !files.has(path.basename(m.imagem ?? `assets/monsters/${slug(m.nome)}.png`)));
    if (noImage.length) warn(`${noImage.length} monstro(s) sem imagem em assets/monsters/ (ex.: ${slug(noImage[0].nome)}.png)`);
    else ok('todas as imagens existem');
  }
}

console.log(`\n${errors} erro(s), ${warnings} aviso(s).`);
process.exit(errors ? 1 : 0);
