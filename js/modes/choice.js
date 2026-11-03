import { startMode, winBanner, monsterImg, yesterdayLine } from '../core/mode-base.js';
import { createClues } from '../ui/clues.js';
import { label } from '../i18n.js';

// Fábrica de modos de múltipla escolha (ilha, classe...). Para criar outro, use createChoiceMode.
export function createChoiceMode({ id, label: modeLabel, description, question, field, options, pool, clues: clueDefs, kind }) {
  return {
    id,
    label: modeLabel,
    description,
    pool,
    render(root) {
      const ctx = startMode(id, id, pool);
      root.innerHTML = `
        <p class="desc">${description}</p>
        <div id="yesterday"></div>
        <div class="choice-card" id="card"></div>
        <div id="clues"></div>
        <div class="options" id="opts"></div>
        <div id="result"></div>`;

      root.querySelector('#yesterday').append(yesterdayLine(ctx));

      const card = root.querySelector('#card');
      card.append(monsterImg(ctx.answer, 'big'));
      const h = document.createElement('h2');
      h.textContent = question(ctx.answer);
      card.append(h);

      const clues = clueDefs ? createClues(clueDefs, ctx) : null;
      if (clues) root.querySelector('#clues').append(clues.el);

      const opts = root.querySelector('#opts');
      const isCorrect = (opt) => [].concat(ctx.answer[field]).includes(opt);

      const finish = () => {
        opts.querySelectorAll('button').forEach((b) => (b.disabled = true));
        clues?.update();
        root.querySelector('#result').replaceChildren(winBanner(modeLabel, ctx));
      };

      options().forEach((opt) => {
        const btn = document.createElement('button');
        btn.textContent = label(kind, opt);
        btn.className = 'opt';
        if (ctx.state.guesses.includes(opt)) {
          btn.disabled = true;
          btn.classList.add(isCorrect(opt) ? 'correct' : 'wrong');
        }
        btn.onclick = () => {
          const correct = isCorrect(opt);
          btn.disabled = true;
          btn.classList.add(correct ? 'correct' : 'wrong');
          ctx.commit(opt, correct);
          clues?.update();
          if (correct) finish();
        };
        opts.append(btn);
      });

      if (ctx.state.won) finish();
    },
  };
}
