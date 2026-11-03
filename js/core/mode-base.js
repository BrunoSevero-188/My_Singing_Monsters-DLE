import { MONSTERS } from '../data/monsters.js';
import { pickDaily, answerFor, yesterdayKey, dayNumber } from './daily.js';
import { getState, saveState, registerWin, getStats } from './storage.js';
import { infobox } from '../ui/infobox.js';
import { SITE_TZ } from '../config.js';

export function startMode(modeId, salt, pool = () => true) {
  let candidates = MONSTERS.filter(pool);
  if (!candidates.length) candidates = MONSTERS;

  const answer = pickDaily(candidates, salt);
  const yesterday = answerFor(candidates, salt, yesterdayKey());
  const state = getState(modeId);

  return {
    answer,
    yesterday,
    state,
    monsters: MONSTERS,
    stats: () => getStats(modeId),
    commit(guess, correct) {
      state.guesses.push(guess);
      if (correct) {
        state.won = true;
        registerWin(modeId, state.guesses.length);
      }
      saveState(modeId, state);
      if (correct) window.dispatchEvent(new CustomEvent('msmdle:won', { detail: { modeId } }));
    },
  };
}

export function yesterdayLine(ctx) {
  const p = document.createElement('p');
  p.className = 'yesterday-line';
  const m = ctx.yesterday;
  if (!m) return p;
  p.append('Ontem era: ');
  const a = document.createElement(m.wiki ? 'a' : 'strong');
  a.textContent = m.name;
  if (m.wiki) { a.href = m.wiki; a.target = '_blank'; a.rel = 'noopener'; }
  p.append(a);
  return p;
}

export function shareText(label, ctx, { grid = '', challenger = false } = {}) {
  const { state } = ctx;
  const n = state.guesses.length;
  return [
    `MSMdle #${dayNumber()} · ${label}${challenger ? ' 🔥 Desafiante' : ''}`,
    state.won ? (n === 1 ? 'Acertei de primeira! 🎯' : `Acertei em ${n} tentativas`) : `${n} tentativas`,
    grid || state.guesses.map((_, i) => (i === n - 1 && state.won ? '🟩' : '🟥')).join(''),
    location.origin + location.pathname,
  ].join('\n');
}

// Contagem até a meia-noite de Brasília
export function startCountdown(el) {
  const render = () => {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: SITE_TZ }));
    const next = new Date(now);
    next.setHours(24, 0, 0, 0);
    const s = Math.max(0, Math.floor((next - now) / 1000));
    const p = (n) => String(n).padStart(2, '0');
    el.textContent = `Próximo monstro em ${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}`;
  };
  const timer = setInterval(() => (el.isConnected ? render() : clearInterval(timer)), 1000);
  render();
}

export function winBanner(label, ctx, opts = {}) {
  const box = document.createElement('div');
  box.className = 'win';
  const st = ctx.stats();
  const n = ctx.state.guesses.length;
  box.innerHTML = `<h3>${n === 1 ? '🎯 De primeira!' : '🎉 Você acertou!'}</h3>
    <p>Tentativas: ${n} · Sequência: ${st.streak} · Vitórias: ${st.wins}</p>`;
  box.append(infobox(ctx.answer));

  const cd = document.createElement('p');
  cd.className = 'countdown';
  box.append(cd);
  startCountdown(cd);

  const row = document.createElement('div');
  row.className = 'win-actions';

  const share = document.createElement('button');
  share.className = 'pill';
  share.textContent = 'Compartilhar resultado';
  share.onclick = async () => {
    await navigator.clipboard.writeText(shareText(label, ctx, opts));
    share.textContent = 'Copiado!';
  };

  const next = document.createElement('button');
  next.className = 'pill';
  next.textContent = 'Próximo desafio →';
  next.onclick = () => window.dispatchEvent(new CustomEvent('msmdle:next'));

  row.append(share, next);
  box.append(row);
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
