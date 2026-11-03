import { createAutocomplete } from '../core/autocomplete.js';
import { startMode, winBanner, mysteryImg, yesterdayLine } from '../core/mode-base.js';
import { BLUR } from '../config.js';
import { getSettings } from '../core/settings.js';
import { CLUE_DEFS } from '../core/clue-defs.js';
import { createClues } from '../ui/clues.js';

export default {
  id: 'inverted',
  label: 'Monstro invertido',
  description: 'Quem é esse monstro? A imagem está com as cores invertidas e embaçada. A cada erro ela fica um pouco mais nítida.',
  render(root) {
    const ctx = startMode('inverted', 'inverted');
    root.innerHTML = `
      <p class="desc">${this.description}</p>
      <div id="yesterday"></div>
      <div class="inverted-box" id="box"></div>
      <div class="search"><input id="in" placeholder="Qual é o monstro?" autocomplete="off" />
      <ul id="list" hidden></ul></div>
      <div id="clues"></div>
      <ul class="wrong-list" id="wrong"></ul>
      <div id="result"></div>`;

    const q = (s) => root.querySelector(s);
    const input = q('#in');
    const wrongList = q('#wrong');
    const img = mysteryImg(ctx.answer, 'mystery');
    q('#box').append(img);
    q('#yesterday').append(yesterdayLine(ctx));

    const clues = createClues(CLUE_DEFS.inverted, ctx);
    q('#clues').append(clues.el);

    const wrongs = () => ctx.state.guesses.filter((id) => id !== ctx.answer.id);

    // Desfoque: começa em BLUR.start, perde BLUR.step por erro, nunca abaixo de BLUR.min até acertar
    const applyFilter = () => {
      if (ctx.state.won) { img.style.filter = 'none'; return; }
      const { keepBlur, grey } = getSettings();
      const blur = keepBlur ? BLUR.start : Math.max(BLUR.min, BLUR.start - wrongs().length * BLUR.step);
      img.style.filter = `invert(1) blur(${blur.toFixed(1)}px)${grey ? ' grayscale(1)' : ''}`;
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
