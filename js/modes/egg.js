import { createAutocomplete } from '../core/autocomplete.js';
import { startMode, winBanner, mysteryImg, yesterdayLine } from '../core/mode-base.js';
import { MONSTERS } from '../data/monsters.js';
import { BLUR } from '../config.js';
import { getSettings } from '../core/settings.js';
import { CLUE_DEFS } from '../core/clue-defs.js';
import { createClues } from '../ui/clues.js';

// Ovo invertido: o jogador vê o ovo com as cores invertidas e adivinha de qual monstro ele é.
// Cada monstro precisa do campo "ovo" (URL da imagem do ovo) em data/monsters.json.
export default {
  id: 'egg',
  label: 'Ovo invertido',
  description: 'De qual monstro é este ovo? As cores da imagem estão invertidas.',
  pool: (m) => !!m.egg,
  minPool: 1, // nunca cai para monstros sem ovo
  render(root) {
    root.innerHTML = `<p class="desc">${this.description}</p>`;

    if (!MONSTERS.some((m) => m.egg)) {
      root.insertAdjacentHTML('beforeend',
        '<div class="box"><p class="desc">Este modo precisa do campo <code>ovo</code> (URL da imagem do ovo) em <code>data/monsters.json</code>. Nenhum monstro tem ovo cadastrado ainda.</p></div>');
      return;
    }

    const ctx = startMode('egg', 'egg', this.pool, this.minPool);
    root.insertAdjacentHTML('beforeend', `
      <div id="yesterday"></div>
      <div class="inverted-box" id="box"></div>
      <div class="search"><input id="in" placeholder="De qual monstro é este ovo?" autocomplete="off" />
      <ul id="list" hidden></ul></div>
      <div id="clues"></div>
      <ul class="wrong-list" id="wrong"></ul>
      <div id="result"></div>`);

    const q = (s) => root.querySelector(s);
    const input = q('#in');
    const wrongList = q('#wrong');
    const img = mysteryImg(ctx.answer.egg, 'mystery');
    q('#box').append(img);
    q('#yesterday').append(yesterdayLine(ctx));

    const clues = createClues(CLUE_DEFS.egg, ctx);
    q('#clues').append(clues.el);

    const wrongs = () => ctx.state.guesses.filter((id) => id !== ctx.answer.id);

    // Cores invertidas (+ desfoque opcional, veja BLUR em js/config.js). Ao acertar, mostra o ovo normal.
    const applyFilter = () => {
      if (ctx.state.won) { img.style.filter = 'none'; return; }
      const parts = ['invert(1)'];
      const blur = Math.max(BLUR.min, BLUR.start - wrongs().length * BLUR.step);
      if (BLUR.start > 0 && blur > 0) parts.push(`blur(${blur.toFixed(1)}px)`);
      if (getSettings().grey) parts.push('grayscale(1)');
      img.style.filter = parts.join(' ');
    };

    const renderWrong = () => {
      wrongList.innerHTML = '';
      wrongs().forEach((id) => {
        const m = ctx.monsters.find((x) => x.id === id);
        if (!m) return;
        const li = document.createElement('li');
        li.textContent = m.name;
        wrongList.prepend(li);
      });
    };

    const finish = () => {
      input.disabled = true;
      applyFilter();
      clues.update();
      q('#result').replaceChildren(winBanner(this.label, ctx));
    };

    applyFilter();
    renderWrong();
    if (ctx.state.won) finish();

    createAutocomplete({
      input,
      list: q('#list'),
      getOptions: () => ctx.monsters.filter((m) => !ctx.state.guesses.includes(m.id)),
      onSelect: (m) => {
        const correct = m.id === ctx.answer.id;
        ctx.commit(m.id, correct);
        renderWrong();
        applyFilter();
        clues.update();
        if (correct) finish();
      },
    });
  },
};
