import { createAutocomplete } from '../core/autocomplete.js';
import { startMode, winBanner, yesterdayLine } from '../core/mode-base.js';
import { compare, fmtVersion, fmtYear, EMOJI } from '../core/compare.js';
import { CLUE_DEFS } from '../core/clue-defs.js';
import { createClues } from '../ui/clues.js';
import { chip } from '../ui/infobox.js';

// Colunas depois do monstro, na ordem em que aparecem
//   Ilhas / Classe / Elementos: verde (certo) · laranja (quase) · vermelho (errado)
//   Versão / Data (ano): verde (certo) ou vermelho (errado) com uma seta grande ao fundo:
//     ↑ o monstro do dia veio depois · ↓ o monstro do dia veio antes
const COLUMNS = [
  { key: 'islands', label: 'Ilhas' },
  { key: 'type', label: 'Classe' },
  { key: 'elements', label: 'Elementos' },
  { key: 'version', label: 'Versão' },
  { key: 'year', label: 'Data' },
];

const TIPS = {
  higher: 'O monstro do dia veio depois deste',
  lower: 'O monstro do dia veio antes deste',
};

// Conteúdo de cada célula (o texto fica por cima da seta do fundo)
function fillBody(body, m, key) {
  if (key === 'elements') body.replaceChildren(...[].concat(m.elements).map((v) => chip(v, 'element')));
  else if (key === 'type') body.replaceChildren(...[].concat(m.type).map((v) => chip(v, 'class')));
  else if (key === 'islands') body.textContent = m.islands.join(', ');
  else if (key === 'version') body.textContent = fmtVersion(m.version);
  else if (key === 'year') body.textContent = fmtYear(m.year);
}

// Célula "Monstro": ícone com borda verde (certo) ou vermelha (errado)
function monsterCell(m, result, animate) {
  const cell = document.createElement('div');
  cell.className = `cell mon-cell ${result}${animate ? ' flip' : ''}`;
  cell.title = m.name;

  const img = document.createElement('img');
  img.className = 'thumb';
  img.src = m.icon;
  img.alt = m.name;
  img.onerror = () => { img.remove(); cell.classList.add('noimg'); };

  const caption = document.createElement('span');
  caption.className = 'caption';
  caption.textContent = m.name;

  cell.append(img, caption);
  return cell;
}

export default {
  id: 'classic',
  label: 'Monstro do dia',
  description: 'Descubra o monstro secreto usando as dicas de cada palpite.',
  render(root) {
    const ctx = startMode('classic', 'classic');
    const visible = () => COLUMNS.filter((c) => !ctx.state.hidden.includes(c.key));
    const hasData = ctx.monsters.some((m) => m.version || m.year != null);

    root.innerHTML = `
      <p class="desc">${this.description}</p>
      <div id="yesterday"></div>
      <div class="search"><input id="in" placeholder="Digite o nome de um monstro..." autocomplete="off" />
      <ul id="list" hidden></ul></div>
      <div class="challenger" id="challenger"></div>
      <div class="classic-meta"><span id="count"></span><span id="pool"></span></div>
      <div class="legend">
        <span class="l-ok">Certo</span><span class="l-mid">Quase</span><span class="l-bad">Errado</span>
        <span>↑ veio depois</span><span>↓ veio antes</span>
      </div>
      <div id="clues"></div>
      <div id="result"></div>
      <div class="table-wrap"><table class="hints">
        <thead id="head"></thead><tbody id="rows"></tbody></table></div>
      <p class="scroll-hint">Role para o lado para ver mais →</p>
      <p class="dev-note" id="devnote" hidden></p>`;

    const q = (s) => root.querySelector(s);
    const input = q('#in'), head = q('#head'), rows = q('#rows'), result = q('#result');
    const countEl = q('#count'), poolEl = q('#pool'), chBox = q('#challenger');

    // Aviso só para quem está desenvolvendo (localhost)
    if (!hasData && ['localhost', '127.0.0.1'].includes(location.hostname)) {
      const note = q('#devnote');
      note.hidden = false;
      note.textContent = 'Aviso (só em localhost): nenhum monstro tem "versao" ou "data" em data/monsters.json, então essas colunas ficam cinza.';
    }

    q('#yesterday').append(yesterdayLine(ctx));
    const clues = createClues(CLUE_DEFS.classic, ctx);
    q('#clues').append(clues.el);

    const buildHead = () => {
      head.innerHTML = `<tr><th>Monstro</th>${visible().map((c) => `<th>${c.label}</th>`).join('')}</tr>`;
    };

    // Modo desafiante: esconder colunas antes do 1º palpite
    const renderChallenger = () => {
      chBox.hidden = ctx.state.guesses.length > 0;
      if (chBox.hidden) return;
      const title = document.createElement('span');
      title.textContent = '🔥 Modo desafiante (opcional): esconda colunas antes do 1º palpite ';
      chBox.replaceChildren(title, ...COLUMNS.map((c) => {
        const off = ctx.state.hidden.includes(c.key);
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'pill chip-toggle' + (off ? ' off' : '');
        b.textContent = c.label;
        b.onclick = () => {
          const next = off ? ctx.state.hidden.filter((k) => k !== c.key) : [...ctx.state.hidden, c.key];
          if (COLUMNS.length - next.length < 1) return; // mantém ao menos 1 coluna
          ctx.state.hidden = next;
          buildHead();
          renderChallenger();
        };
        return b;
      }));
    };

    const updateMeta = () => {
      const n = ctx.state.guesses.length;
      countEl.textContent = `Tentativas: ${n}`;
      poolEl.textContent = `${ctx.monsters.length - n} monstros na lista`;
      clues.update();
      renderChallenger();
    };

    const addRow = (m, animate = true) => {
      const tr = document.createElement('tr');

      const first = document.createElement('td');
      first.append(monsterCell(m, compare(m, ctx.answer, 'name'), animate));
      tr.append(first);

      visible().forEach((c, i) => {
        const td = document.createElement('td');
        const r = compare(m, ctx.answer, c.key);
        const cell = document.createElement('div');
        cell.className = `cell ${r}${c.key === 'islands' ? ' islands-cell' : ''}${animate ? ' flip' : ''}`;
        cell.style.animationDelay = `${(i + 1) * 0.3}s`;
        if (TIPS[r]) cell.title = TIPS[r];
        else if (c.key === 'islands') cell.title = m.islands.join(', ');
        const body = document.createElement('span');
        body.className = 'cell-body';
        fillBody(body, m, c.key);
        cell.append(body);
        td.append(cell);
        tr.append(td);
      });
      rows.prepend(tr);
    };

    // Grade de emojis para compartilhar (últimos 10 palpites)
    const buildGrid = () => {
      const ids = ctx.state.guesses;
      const lines = ids.slice(-10).map((id) => {
        const m = ctx.monsters.find((x) => x.id === id);
        return visible().map((c) => EMOJI[compare(m, ctx.answer, c.key)]).join('');
      });
      return (ids.length > 10 ? '…\n' : '') + lines.join('\n');
    };

    const finish = () => {
      input.disabled = true;
      result.replaceChildren(winBanner(this.label, ctx, {
        grid: buildGrid(),
        challenger: ctx.state.hidden.length > 0,
      }));
      updateMeta();
    };

    buildHead();
    ctx.state.guesses
      .map((id) => ctx.monsters.find((m) => m.id === id))
      .filter(Boolean)
      .forEach((m) => addRow(m, false));
    updateMeta();
    if (ctx.state.won) finish();

    createAutocomplete({
      input,
      list: q('#list'),
      getOptions: () => ctx.monsters.filter((m) => !ctx.state.guesses.includes(m.id)),
      onSelect: (m) => {
        addRow(m);
        const correct = m.id === ctx.answer.id;
        ctx.commit(m.id, correct);
        updateMeta();
        if (correct) setTimeout(finish, 1200);
      },
    });
  },
};
