import { startMode, winBanner, monsterImg } from '../core/mode-base.js';

export function createChoiceMode({ id, label, description, question, field, options }) {
  return {
    id,
    label,
    description,
    render(root) {
      const ctx = startMode(id, id);
      root.innerHTML = `
        <p class="desc">${description}</p>
        <div class="choice-card" id="card"></div>
        <div class="options" id="opts"></div>
        <div id="result"></div>`;

      const card = root.querySelector('#card');
      card.append(monsterImg(ctx.answer, 'big'));
      const q = document.createElement('h2');
      q.textContent = question(ctx.answer);
      card.append(q);

      const opts = root.querySelector('#opts');
      const isCorrect = (opt) => [].concat(ctx.answer[field]).includes(opt);

      const finish = () => {
        opts.querySelectorAll('button').forEach((b) => (b.disabled = true));
        root.querySelector('#result').replaceChildren(winBanner(label, ctx));
      };

      options().forEach((opt) => {
        const btn = document.createElement('button');
        btn.textContent = opt;
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
          if (correct) finish();
        };
        opts.append(btn);
      });

      if (ctx.state.won) finish();
    },
  };
}