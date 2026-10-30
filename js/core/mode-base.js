import { MONSTERS } from '../data/monsters.js';
import { pickDaily } from './daily.js';
import { getState, saveState, registerWin, getStats } from './storage.js';

// pool: filtro opcional de quais monstros podem ser sorteados neste modo
export function startMode(modeId, salt, pool = () => true) {
  let candidates = MONSTERS.filter(pool);
  if (!candidates.length) candidates = MONSTERS;
  const answer = pickDaily(candidates, salt);
  const state = getState(modeId);

  return {
    answer,
    state,
    monsters: MONSTERS,
    stats: () => getStats(modeId),
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
    <p>Tentativas: ${ctx.state.guesses.length} · Sequência: ${st.streak} · Vitórias: ${st.wins}</p>
    <p><a href="${ctx.answer.wiki}" target="_blank" rel="noopener">Ver ${ctx.answer.name} na wiki</a></p>`;
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
  img.src = m.image;
  img.alt = m.name;
  img.className = cls;
  img.onerror = () => { img.style.visibility = 'hidden'; };
  return img;
}

// Imagem do modo "invertido": carrega como blob para o src e o alt não entregarem o nome
export function mysteryImg(m, cls = '') {
  const img = document.createElement('img');
  img.alt = 'Monstro misterioso';
  img.className = cls;
  img.draggable = false;
  fetch(m.image)
    .then((r) => r.blob())
    .then((b) => { img.src = URL.createObjectURL(b); })
    .catch(() => { img.style.visibility = 'hidden'; });
  return img;
}