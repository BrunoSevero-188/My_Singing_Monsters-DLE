// Biblioteca (pokédex de My Singing Monsters).
// Portada do projeto FlatlistPokedex: lista de cartões (index.tsx + PokemonItem), pesquisa por campo e condição
// (PesquisarPokemon), botões de filtro por elemento (ButtonandSelect) e tela de detalhes ([id].tsx).
// Rotas: #biblioteca (lista) e #biblioteca/<id> (detalhes).
import { MONSTERS } from '../data/monsters.js';
import { searchLink } from '../config.js';
import { label } from '../i18n.js';
import { RARITIES, rarityColor } from '../core/rarity.js';
import { fmtVersion, fmtYear } from '../core/compare.js';
import {
  CAMPOS, campoInfo, operadoresDoCampo, operadorPadrao, listaFiltrada, listaDeElementos, dexNumber,
  gradientColors, colorOf, numeros, acharMonstro, comparador,
} from '../core/library.js';

// Estado da pesquisa: fica guardado ao abrir um monstro e voltar para a lista
const state = { campo: 'nome', operador: 'contem', texto: '', elemento: '', raridade: '' };

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};

// Imagem do monstro (ou uma bolinha com a inicial se não houver link / se falhar)
function picture(src, name, cls) {
  const holder = el('span', `dex-pic ${cls}`);
  const placeholder = () => { holder.replaceChildren(el('span', 'dex-ph', name.charAt(0))); };
  if (!src) { placeholder(); return holder; }
  const img = document.createElement('img');
  img.src = src;
  img.alt = name;
  img.loading = 'lazy';
  img.referrerPolicy = 'no-referrer';
  img.onerror = placeholder;
  holder.append(img);
  return holder;
}

// Selo de elemento, colorido (como o typeBadge do cartão)
const badge = (element) => {
  const b = el('span', 'dex-badge', label('element', element));
  b.style.backgroundColor = colorOf(element);
  return b;
};

// Selo de raridade: Comum, Raro ou Épico
const rarityPill = (r) => {
  const p = el('span', 'dex-rarity', label('rarity', r));
  p.dataset.r = r;
  p.style.backgroundColor = rarityColor(r);
  return p;
};

// ============================ LISTA ============================
function card(m) {
  const [c1, c2] = gradientColors(m);
  const a = el('a', 'dex-card');
  a.href = `#biblioteca/${m.id}`;
  a.style.background = `linear-gradient(135deg, ${c1}, ${c2})`;
  a.setAttribute('aria-label', `${m.name}, número ${dexNumber(m.id)}`);

  a.append(picture(m.icon || m.gif, m.name, 'dex-circle'));
  if (m.rarity) a.append(rarityPill(m.rarity));
  const info = el('div', 'dex-card-info');
  info.append(el('span', 'dex-card-id', `#${dexNumber(m.id)}`), el('span', 'dex-card-name', m.name));
  const badges = el('div', 'dex-badges');
  badges.append(...(m.elements ?? []).map(badge));
  a.append(info, badges);
  return a;
}

function options(container, items, current, onPick) {
  container.replaceChildren(...items.map((it) => {
    const b = el('button', 'dex-option' + (it.value === current ? ' active' : ''), it.label);
    b.type = 'button';
    b.onclick = () => onPick(it.value);
    return b;
  }));
}

function renderList(root) {
  root.innerHTML = `
    <h2 class="dex-title">Biblioteca</h2>
    <p class="desc"></p>

    <section class="dex-search" aria-label="Pesquisar">
      <p class="dex-label">Pesquisar por</p>
      <div class="dex-options" id="campos"></div>
      <p class="dex-label">Condição</p>
      <div class="dex-options" id="ops"></div>
      <input id="termo" class="dex-input" type="search" autocomplete="off" />
    </section>

    <section class="dex-filter" aria-label="Filtrar por elemento">
      <p class="dex-label dex-label-big">Filtrar por elemento:</p>
      <div class="dex-types" id="elementos"></div>
    </section>

    <section class="dex-filter" aria-label="Filtrar por raridade">
      <p class="dex-label dex-label-big">Filtrar por raridade:</p>
      <div class="dex-types" id="raridades"></div>
    </section>

    <p class="dex-count" id="count" aria-live="polite"></p>
    <div class="dex-grid" id="grid"></div>`;

  const q = (s) => root.querySelector(s);
  const input = q('#termo');

  const drawGrid = () => {
    const lista = listaFiltrada(MONSTERS, state);
    q('#count').textContent = lista.length === MONSTERS.length
      ? `${lista.length} monstros`
      : `${lista.length} de ${MONSTERS.length} monstros`;
    if (!lista.length) q('#grid').replaceChildren(el('p', 'dex-empty', 'Nenhum monstro encontrado.'));
    else q('#grid').replaceChildren(...lista.map(card));
  };

  const drawControls = () => {
    options(q('#campos'), CAMPOS.map((c) => ({ value: c.value, label: c.label })), state.campo, (campo) => {
      state.campo = campo;
      state.operador = operadorPadrao(campo); // cada campo tem as suas condições
      state.texto = '';
      input.value = '';
      drawControls();
      drawGrid();
    });
    options(q('#ops'), operadoresDoCampo(state.campo), state.operador, (op) => {
      state.operador = op;
      drawControls();
      drawGrid();
    });
    const info = campoInfo(state.campo);
    input.placeholder = `Digite ${info.numerico ? 'o' : 'o'} ${info.label.toLowerCase()}...`;
    input.inputMode = ['id', 'ano'].includes(state.campo) ? 'numeric' : 'text';

    const botoes = [{ nome: '', rotulo: 'Todos', cor: null }, ...listaDeElementos(MONSTERS).map((e) => ({ nome: e, rotulo: label('element', e), cor: colorOf(e) }))];
    q('#elementos').replaceChildren(...botoes.map((b) => {
      const btn = el('button', 'dex-type' + (state.elemento.toLowerCase() === b.nome.toLowerCase() ? ' active' : ''), b.rotulo);
      btn.type = 'button';
      if (b.cor) btn.style.backgroundColor = b.cor;
      btn.onclick = () => { state.elemento = b.nome; drawControls(); drawGrid(); };
      return btn;
    }));

    const raridades = [{ nome: '', rotulo: 'Todas', cor: null }, ...RARITIES.map((r) => ({ nome: r, rotulo: label('rarity', r), cor: rarityColor(r) }))];
    q('#raridades').replaceChildren(...raridades.map((b) => {
      const btn = el('button', 'dex-type' + (state.raridade === b.nome ? ' active' : ''), b.rotulo);
      btn.type = 'button';
      if (b.cor) btn.style.backgroundColor = b.cor;
      btn.onclick = () => { state.raridade = b.nome; drawControls(); drawGrid(); };
      return btn;
    }));
  };

  input.value = state.texto;
  input.oninput = () => { state.texto = input.value; drawGrid(); };
  drawControls();
  drawGrid();
}

// ============================ DETALHES ============================
const section = (title) => el('h3', 'dex-section', title);

function infoCard(nome, valor) {
  const c = el('div', 'dex-info-card');
  c.append(el('span', 'dex-info-label', nome), el('span', 'dex-info-value', valor));
  return c;
}

// Uma combinação [(A) + (B)]: cada nome leva para o monstro, quando ele existe na Biblioteca
function comboCard(par) {
  const c = el('div', 'dex-combo');
  par.forEach((ref, i) => {
    if (i) c.append(el('span', 'dex-plus', '+'));
    const m = acharMonstro(ref, MONSTERS);
    if (m) { const a = el('a', 'dex-combo-link', m.name); a.href = `#biblioteca/${m.id}`; c.append(a); }
    else c.append(el('span', 'dex-combo-name', String(ref)));
  });
  return c;
}

function renderDetail(root, id) {
  const m = MONSTERS.find((x) => x.id === id);
  if (!m) {
    root.innerHTML = '<div class="box"><p class="desc">Monstro não encontrado.</p><p class="desc"><a href="#biblioteca">Voltar para a Biblioteca</a></p></div>';
    return;
  }
  const [c1, c2] = gradientColors(m);
  const sorted = [...MONSTERS].sort(comparador);
  const pos = sorted.findIndex((x) => x.id === m.id);

  // --- topo em degradê (header de [id].tsx)
  const hero = el('header', 'dex-hero');
  hero.style.background = `linear-gradient(135deg, ${c1}, ${c2})`;
  const back = el('a', 'dex-back', '← Voltar');
  back.href = '#biblioteca';
  const badges = el('div', 'dex-badges dex-badges-hero');
  badges.append(...(m.elements ?? []).map(badge));
  if (m.rarity) badges.append(rarityPill(m.rarity));
  hero.append(back, el('p', 'dex-hero-id', `#${dexNumber(m.id)}`), el('h2', 'dex-hero-name', m.name), badges,
    picture(m.gif || m.icon, m.name, 'dex-hero-img'));

  // --- corpo
  const body = el('div', 'dex-body');

  body.append(section('Informações gerais'));
  const grid = el('div', 'dex-info-grid');
  const rarityCard = infoCard('Raridade', m.rarity ? label('rarity', m.rarity) : '—');
  if (m.rarity) rarityCard.lastChild.style.color = rarityColor(m.rarity);
  grid.append(
    rarityCard,
    infoCard('Versão', fmtVersion(m.version)),
    infoCard('Ano', fmtYear(m.year)),
    infoCard('Classe', [].concat(m.type ?? []).map((t) => label('class', t)).join(', ') || '—'),
  );
  body.append(grid);

  body.append(section('Como obter'));
  const combos = el('div', 'dex-combos');
  if (m.combo === 'buy') {
    const c = el('div', 'dex-combo buy');
    c.append(el('span', 'dex-combo-name', 'Comprado'), el('small', 'dex-combo-note', 'Só pode ser obtido comprando'));
    combos.append(c);
  } else if (m.combo?.length) {
    combos.append(...m.combo.map(comboCard));
  } else {
    combos.append(el('div', 'dex-combo none', 'Combinação ainda não cadastrada'));
  }
  body.append(combos);

  body.append(section('Em números'));
  const stats = el('div', 'dex-stats');
  numeros(m, MONSTERS).forEach((n) => {
    const row = el('div', 'dex-stat');
    const bar = el('span', 'dex-bar');
    const fill = el('span', 'dex-bar-fill');
    fill.style.width = `${Math.min((n.valor / n.max) * 100, 100)}%`;
    fill.style.backgroundColor = c1;
    bar.append(fill);
    row.append(el('span', 'dex-stat-name', n.nome), el('span', 'dex-stat-value', `${n.valor}/${n.max}`), bar);
    stats.append(row);
  });
  body.append(stats);

  body.append(section('Ilhas'));
  const ilhas = el('div', 'dex-islands');
  (m.islands ?? []).forEach((i) => {
    const b = el('span', 'dex-island', label('island', i));
    b.style.borderColor = c1;
    b.style.color = c1;
    ilhas.append(b);
  });
  body.append(ilhas);

  if (m.egg) {
    body.append(section('Ovo'));
    body.append(picture(m.egg, `Ovo de ${m.name}`, 'dex-egg-pic'));
  }

  const more = el('a', 'pill dex-more', 'Pesquisar mais ↗');
  more.href = searchLink(m.name);
  more.target = '_blank';
  more.rel = 'noopener';

  // --- anterior / próximo
  const nav = el('nav', 'dex-pager');
  nav.setAttribute('aria-label', 'Navegar entre monstros');
  const link = (target, text) => {
    if (!target) return el('span', 'dex-pager-gap');
    const a = el('a', 'pill', text);
    a.href = `#biblioteca/${target.id}`;
    return a;
  };
  nav.append(link(sorted[pos - 1], `← #${sorted[pos - 1] ? dexNumber(sorted[pos - 1].id) : ''}`), more,
    link(sorted[pos + 1], `#${sorted[pos + 1] ? dexNumber(sorted[pos + 1].id) : ''} →`));
  body.append(nav);

  root.replaceChildren(hero, body);
}

// arg: undefined (lista) ou o número do monstro (detalhes)
export function renderLibrary(root, arg) {
  if (arg !== undefined && arg !== '') renderDetail(root, Number(arg));
  else renderList(root);
}
