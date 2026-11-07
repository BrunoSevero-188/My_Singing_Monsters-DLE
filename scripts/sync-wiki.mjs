import { mkdir, writeFile } from 'node:fs/promises';

const WIKI = 'https://mysingingmonsters.fandom.com/pt-br/wiki/My_Singing_Monsters_Wiki';
const API = `${WIKI}/api.php`;

// ===== AJUSTE AQUI depois de rodar `npm run inspect` =====
const CONFIG = {
  // categoria da wiki -> classe do monstro (categorias vazias aparecem como aviso)
  categories: {
    'Natural Monsters': 'Natural',
    'Fire Monsters': 'Fire',
    'Magical Monsters': 'Magical',
    'Ethereal Monsters': 'Ethereal',
    'Mythical Monsters': 'Mythical',
    'Seasonal Monsters': 'Seasonal',
    'Wublin Monsters': 'Wublin',
    'Celestial Monsters': 'Celestial',
    'Amber Monsters': 'Amber',
  },
  // nomes possíveis dos campos no infobox (em minúsculas)
  fields: {
    elements: ['elements', 'element'],
    islands: ['islands', 'island', 'native islands', 'native island'],
    level: ['level', 'level available', 'levelavailable'],
  },
  skipTitle: /^(Rare|Epic|Legendary)\s|\/|\(/, // ignora variantes e subpáginas
};
// ========================================================

const UA = { 'User-Agent': 'msmdle-sync/1.0 (projeto de fã, sem fins comerciais)' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(params) {
  const url = new URL(API);
  const all = { format: 'json', formatversion: '2', ...params };
  for (const [k, v] of Object.entries(all)) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
  return res.json();
}

async function categoryMembers(cat) {
  const out = [];
  let cont;
  do {
    const r = await api({
      action: 'query', list: 'categorymembers', cmtitle: `Category:${cat}`,
      cmlimit: '500', cmnamespace: '0', ...(cont ? { cmcontinue: cont } : {}),
    });
    out.push(...(r.query?.categorymembers ?? []).map((m) => m.title));
    cont = r.continue?.cmcontinue;
  } while (cont);
  return out;
}

async function getWikitext(title) {
  const r = await api({ action: 'parse', page: title, prop: 'wikitext', redirects: '1' });
  return r.parse?.wikitext ?? '';
}

// Lê o primeiro template cujo nome contém "infobox" e devolve {campo: valor}
function parseInfobox(wt) {
  const m = /\{\{\s*[^|}\n]*infobox[^|}\n]*/i.exec(wt);
  if (!m) return {};
  let depth = 0, end = -1;
  for (let i = m.index; i < wt.length - 1; i++) {
    const two = wt.slice(i, i + 2);
    if (two === '{{') { depth++; i++; }
    else if (two === '}}') { depth--; i++; if (depth === 0) { end = i + 1; break; } }
  }
  if (end < 0) return {};
  const body = wt.slice(m.index + 2, end - 2);
  const parts = [];
  let cur = '', d = 0;
  for (let j = 0; j < body.length; j++) {
    const two = body.slice(j, j + 2);
    if (two === '{{' || two === '[[') { d++; cur += two; j++; continue; }
    if (two === '}}' || two === ']]') { d--; cur += two; j++; continue; }
    if (body[j] === '|' && d === 0) { parts.push(cur); cur = ''; continue; }
    cur += body[j];
  }
  parts.push(cur);
  const [name, ...params] = parts;
  const map = { _template: name.trim() };
  for (const p of params) {
    const eq = p.indexOf('=');
    if (eq > 0) map[p.slice(0, eq).trim().toLowerCase()] = p.slice(eq + 1).trim();
  }
  return map;
}

function clean(v) {
  return v
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\{\{[^|}]*\|([^}|]*)[^}]*\}\}/g, '$1')
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/<br\s*\/?>/gi, ',')
    .replace(/<[^>]+>/g, '')
    .replace(/\{\{|\}\}/g, '')
    .trim();
}

const pick = (info, keys) => {
  const k = keys.find((x) => info[x]);
  return k ? clean(info[k]) : '';
};
const toList = (s) => [...new Set(s.split(/[,;\n]/).map((x) => x.replace(/\s+(Element|Island)$/i, '').trim()).filter(Boolean))];

const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

async function inspect(title) {
  const wt = await getWikitext(title);
  console.log('--- Infobox encontrado ---');
  console.log(parseInfobox(wt));
  console.log('\n--- Primeiros 800 caracteres do wikitext ---');
  console.log(wt.slice(0, 800));
}

async function fetchImages(titles) {
  const map = {};
  for (let i = 0; i < titles.length; i += 40) {
    const chunk = titles.slice(i, i + 40);
    const r = await api({
      action: 'query', prop: 'pageimages', piprop: 'original', pilimit: '50',
      titles: chunk.join('|'), redirects: '1',
    });
    for (const p of r.query?.pages ?? []) if (p.original?.source) map[p.title] = p.original.source;
    // redirects: mapeia o título original para o final
    for (const rd of r.query?.redirects ?? []) if (map[rd.to]) map[rd.from] = map[rd.to];
  }
  return map;
}

async function fetchFacts(titles) {
  const facts = {};
  for (let i = 0; i < titles.length; i += 20) {
    try {
      const r = await api({
        action: 'query', prop: 'extracts', exintro: '1', explaintext: '1',
        exsentences: '2', exlimit: '20', titles: titles.slice(i, i + 20).join('|'), redirects: '1',
      });
      for (const p of r.query?.pages ?? []) if (p.extract) facts[p.title] = p.extract.trim();
      for (const rd of r.query?.redirects ?? []) if (facts[rd.to]) facts[rd.from] = facts[rd.to];
    } catch { /* extensão indisponível: segue sem curiosidades */ }
  }
  return facts;
}

async function download(url, file) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  await writeFile(file, Buffer.from(await res.arrayBuffer()));
}

async function main() {
  const entries = new Map(); // título -> classe
  for (const [cat, cls] of Object.entries(CONFIG.categories)) {
    const titles = await categoryMembers(cat);
    if (!titles.length) console.warn(`⚠ Categoria vazia/inexistente: ${cat}`);
    for (const t of titles) if (!CONFIG.skipTitle.test(t) && !entries.has(t)) entries.set(t, cls);
    console.log(`${cat}: ${titles.length} páginas`);
  }

  const titles = [...entries.keys()];
  const images = await fetchImages(titles);
  await mkdir('assets/monsters', { recursive: true });
  await mkdir('data', { recursive: true });

  const monsters = [];
  for (let i = 0; i < titles.length; i += 5) {
    await Promise.all(titles.slice(i, i + 5).map(async (title) => {
      try {
        const info = parseInfobox(await getWikitext(title));
        const elements = toList(pick(info, CONFIG.fields.elements));
        const islands = toList(pick(info, CONFIG.fields.islands));
        const level = parseInt(pick(info, CONFIG.fields.level), 10);
        const id = slug(title);

        let image = null;
        if (images[title]) {
          const ext = (images[title].match(/\.(png|jpe?g|webp|gif)/i)?.[1] ?? 'png').toLowerCase();
          image = `assets/monsters/${id}.${ext}`;
          await download(images[title], image).catch((e) => { console.warn(`⚠ imagem ${title}: ${e.message}`); image = null; });
        }

        if (!elements.length || !islands.length) console.warn(`⚠ ${title}: dados incompletos (elementos=${elements.length}, ilhas=${islands.length})`);
        monsters.push({
          id, name: title, type: entries.get(title), elements, islands,
          level: Number.isNaN(level) ? null : level, image,
          wiki: `${WIKI}/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
        });
      } catch (e) {
        console.warn(`⚠ ${title}: ${e.message}`);
      }
    }));
    await sleep(300);
    process.stdout.write(`\r${Math.min(i + 5, titles.length)}/${titles.length}`);
  }

  // só entram monstros completos o bastante para o jogo
  const valid = monsters.filter((m) => m.image && m.elements.length && m.islands.length).sort((a, b) => a.id.localeCompare(b.id));
  await writeFile('data/monsters.json', JSON.stringify(valid, null, 2));
  console.log(`\n✔ ${valid.length} monstros salvos (${monsters.length - valid.length} descartados por dados incompletos).`);
}

const [flag, arg] = process.argv.slice(2);
(flag === '--inspect' ? inspect(arg ?? 'Noggin') : main()).catch((e) => { console.error(e); process.exit(1); });