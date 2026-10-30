import { MONSTERS } from '../data/monsters.js';
import { pickDaily } from './daily.js';
import { getState, saveState, registerWin, getStats } from './storage.js';

export const imgPath = (m) => `assets/monsters/${m.id}.png`;

export function startMode(modeId, salt) {
  const answer = pickDaily(MONSTERS, salt);
  const state = getState(modeId);

  return {
    answer,
    state,
    monsters: MONSTERS,
    stats: () => getStats(modeId),
    // guess = id do monstro (ou opção escolhida); correct = true/false
    commit(guess, correct) {
      state.guesses.push(guess);
      if (correct) {
        state.won = true;
        registerWin(modeId);
      }
      saveState(modeId, state);
    },
  };
}

export function shareText(label, state) {
  const squares = state.guesses.map((_, i) => (i === state.guesses.length - 1 && state.won ? '🟩' : '🟥')).join('');
  return `MSMdle - ${label}\n${squares} (${state.guesses.length} tentativa${state.guesses.length > 1 ? 's' : ''})\n${location.origin}`;
}

export function winBanner(label, ctx) {
  const box = document.createElement('div');
  box.className = 'win';
  const st = ctx.stats();
  box.innerHTML = `<h3>🎉 Você acertou: ${ctx.answer.name}!</h3>
    <p>Tentativas: ${ctx.state.guesses.length} · Sequência: ${st.streak} · Vitórias: ${st.wins}</p>`;
  const btn = document.createElement('button');
  btn.textContent = 'Compartilhar resultado';
  btn.onclick = async () => {
    await navigator.clipboard.writeText(shareText(label, ctx.state));
    btn.textContent = 'Copiado!';
  };
  box.appendChild(btn);
  return box;
}

export function monsterImg(m, cls = '') {
  const img = document.createElement('img');
  img.src = imgPath(m);
  img.alt = m.name;
  img.className = cls;
  img.onerror = () => { img.style.visibility = 'hidden'; };
  return img;
}