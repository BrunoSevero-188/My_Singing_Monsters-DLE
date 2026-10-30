import { createAutocomplete } from '../core/autocomplete.js';
import { startMode, winBanner, monsterImg } from '../core/mode-base.js';

const MAX_BLUR = 16; // px
const STEP = 3;      // reduz o desfoque a cada erro

export default {
  id: 'inverted',
  label: 'Monstro invertido',
  description: 'Quem é esse monstro? A imagem está com as cores invertidas e embaçada. A cada erro ela fica mais nítida.',
  render(root) {
    const ctx = startMode('inverted', 'inverted');
    root.innerHTML = `
      <p class="desc">${this.description}</p>
      <div class="inverted-box" id="box"></div>
      <div class="search"><input id="in" placeholder="Qual é o monstro?" autocomplete="off" />
      <ul id="list" hidden></ul></div>
      <ul class="wrong-list" id="wrong"></ul>
      <div id="result"></div>`;

    const box = root.querySelector('#box');
    const input = root.querySelector('#in');
    const wrongList = root.querySelector('#wrong');
    const img = monsterImg(ctx.answer, 'mystery');
    box.append(img);

    const wrongs = () => ctx.state.guesses.filter((id) => id !== ctx.answer.id);

    const applyFilter = () => {
      if (ctx.state.won) { img.style.filter = 'none'; return; }
      const blur = Math.max(0, MAX_BLUR - wrongs().length * STEP);
      img.style.filter = `invert(1) blur(${blur}px)`;
    };

    const renderWrong = () => {
      wrongList.innerHTML = '';
      wrongs().forEach((id) => {
        const li = document.createElement('li');
        li.textContent = ctx.monsters.find((m) => m.id === id).name;
        wrongList.prepend(li);
      });
    };

    const finish = () => {
      input.disabled = true;
      applyFilter();
      root.querySelector('#result').replaceChildren(winBanner(this.label, ctx));
    };

    applyFilter();
    renderWrong();
    if (ctx.state.won) finish();

    createAutocomplete({
      input,
      list: root.querySelector('#list'),
      getOptions: () => ctx.monsters.filter((m) => !ctx.state.guesses.includes(m.id)),
      onSelect: (m) => {
        const correct = m.id === ctx.answer.id;
        ctx.commit(m.id, correct);
        renderWrong();
        applyFilter();
        if (correct) finish();
      },
    });
  },
};