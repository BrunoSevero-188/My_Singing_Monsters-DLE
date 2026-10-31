import { MODES } from '../modes/index.js';
import { MONSTERS } from '../data/monsters.js';
import { getState, getStats } from '../core/storage.js';
import { answerFor, yesterdayKey } from '../core/daily.js';

const ICONS = { classic: '🎯', inverted: '🌗', island: '🏝️', type: '🎼' };

export function renderHome(root, onOpen) {
  root.innerHTML = `
    <p class="desc">Desafios diários de My Singing Monsters. Um monstro novo por dia, em cada modo.</p>
    <section class="box">
      <h2 class="box-title">Desafios de hoje</h2>
      <div class="tiles" id="tiles"></div>
    </section>
    <section class="box">
      <h2 class="box-title">Respostas de ontem</h2>
      <ul class="yesterday" id="yest"></ul>
    </section>`;

  const tiles = root.querySelector('#tiles');
  const yest = root.querySelector('#yest');

  MODES.forEach((mode) => {
    const state = getState(mode.id);
    const stats = getStats(mode.id);

    const tile = document.createElement('button');
    tile.className = 'tile' + (state.won ? ' done' : '');
    tile.innerHTML = `
      <span class="tile-icon">${mode.icon ?? ICONS[mode.id] ?? '🎵'}</span>
      <strong>${mode.label}</strong>
      <small>${mode.description}</small>
      <span class="tile-status">${state.won ? `✔ Concluído em ${state.guesses.length}` : state.guesses.length ? `${state.guesses.length} tentativa(s)` : 'Não jogado'}${stats.streak ? ` · 🔥 ${stats.streak}` : ''}</span>`;
    tile.onclick = () => onOpen(mode.id);
    tiles.append(tile);

    // resposta de ontem (usa o mesmo pool do modo)
    const pool = MONSTERS.filter(mode.pool ?? (() => true));
    const list = pool.length ? pool : MONSTERS;
    const m = answerFor(list, mode.id, yesterdayKey());
    if (m) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = m.wiki;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = m.name;
      li.append(`${mode.label}: `, a);
      yest.append(li);
    }
  });
}