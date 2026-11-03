import { MODES } from '../modes/index.js';
import { MONSTERS } from '../data/monsters.js';
import { getState, getStats } from '../core/storage.js';
import { answerFor, yesterdayKey, dayNumber } from '../core/daily.js';
import { renderHero } from './hero.js';
import { renderStats } from './stats.js';
import { renderSettings } from './settings.js';

const ICONS = { classic: '🎯', inverted: '🌗', island: '🏝️', type: '🎼' };

export function renderHome(root, onOpen) {
  root.innerHTML = `
    <section class="box">
      <h2 class="box-title">Desafios de hoje · #${dayNumber()}</h2>
      <div class="tiles" id="tiles"></div>
    </section>
    <section class="box">
      <h2 class="box-title">Respostas de ontem</h2>
      <ul class="yesterday" id="yest"></ul>
    </section>
    <div id="stats"></div>
    <div id="settings"></div>`;
  root.prepend(renderHero());

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

    const pool = MONSTERS.filter(mode.pool ?? (() => true));
    const m = answerFor(pool.length < Math.min(5, MONSTERS.length) ? MONSTERS : pool, mode.id, yesterdayKey());
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

  renderStats(root.querySelector('#stats'));
  renderSettings(root.querySelector('#settings'));
}
