import { createAutocomplete } from '../core/autocomplete.js';
import { startMode, winBanner, monsterImg } from '../core/mode-base.js';

const COLUMNS = [
  { key: 'islands', label: 'Ilha' },
  { key: 'type', label: 'Tipo' },
  { key: 'elements', label: 'Elemento' },
];

function compare(guess, answer, key) {
  const A = [].concat(guess[key]);
  const B = [].concat(answer[key]);
  const common = A.filter((x) => B.includes(x)).length;
  if (common === A.length && common === B.length) return 'correct';
  return common > 0 ? 'partial' : 'wrong';
}

export default {
  id: 'classic',
  label: 'Monstro do dia',
  description: 'Descubra o monstro secreto usando as dicas de cada palpite.',
  render(root) {
    const ctx = startMode('classic', 'classic');
    root.innerHTML = `
      <p class="desc">${this.description}</p>
      <div class="search"><input id="in" placeholder="Digite o nome de um monstro..." autocomplete="off" />
      <ul id="list" hidden></ul></div>
      <div id="result"></div>
      <div class="table-wrap"><table class="hints">
        <thead><tr><th>Monstro</th>${COLUMNS.map((c) => `<th>${c.label}</th>`).join('')}</tr></thead>
        <tbody id="rows"></tbody></table></div>`;

    const input = root.querySelector('#in');
    const rows = root.querySelector('#rows');
    const result = root.querySelector('#result');

    const addRow = (m, animate = true) => {
      const tr = document.createElement('tr');
      const first = document.createElement('td');
      first.append(monsterImg(m, 'thumb'));
      first.append(document.createTextNode(m.name));
      tr.append(first);
      COLUMNS.forEach((c, i) => {
        const td = document.createElement('td');
        td.className = compare(m, ctx.answer, c.key) + (animate ? ' flip' : '');
        td.style.animationDelay = `${i * 0.3}s`;
        td.textContent = [].concat(m[c.key]).join(', ');
        tr.append(td);
      });
      rows.prepend(tr);
    };

    const finish = () => {
      input.disabled = true;
      result.replaceChildren(winBanner(this.label, ctx));
    };

    ctx.state.guesses.forEach((id) => addRow(ctx.monsters.find((m) => m.id === id), false));
    if (ctx.state.won) finish();

    createAutocomplete({
      input,
      list: root.querySelector('#list'),
      getOptions: () => ctx.monsters.filter((m) => !ctx.state.guesses.includes(m.id)),
      onSelect: (m) => {
        addRow(m);
        const correct = m.id === ctx.answer.id;
        ctx.commit(m.id, correct);
        if (correct) setTimeout(finish, 1200);
      },
    });
  },
};