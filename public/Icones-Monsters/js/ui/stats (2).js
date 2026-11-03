import { MODES } from '../modes/index.js';
import { getStats } from '../core/storage.js';

const BUCKETS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'];

export function renderStats(root) {
  root.innerHTML = `
    <section class="box">
      <h2 class="box-title">Estatísticas</h2>
      <select class="stats-select" aria-label="Modo"></select>
      <div class="stats-grid"></div>
      <div class="stats-dist"></div>
    </section>`;

  const sel = root.querySelector('.stats-select');
  const grid = root.querySelector('.stats-grid');
  const dist = root.querySelector('.stats-dist');
  MODES.forEach((m) => sel.append(new Option(m.label, m.id)));

  const draw = () => {
    const s = getStats(sel.value);
    grid.innerHTML = [
      ['Jogos ganhos', s.wins],
      ['Média de tentativas', s.tracked ? s.average.toFixed(1) : '–'],
      ['De primeira', s.oneShots],
      ['Sequência atual', s.streak],
      ['Maior sequência', s.maxStreak],
    ].map(([l, v]) => `<div class="stat"><strong>${v}</strong><span>${l}</span></div>`).join('');

    const max = Math.max(1, ...BUCKETS.map((k) => s.dist[k] || 0));
    dist.innerHTML = '<h3>Tentativas por jogo</h3>' + BUCKETS.map((k) => {
      const v = s.dist[k] || 0;
      return `<div class="bar-row"><span>${k}</span><div class="bar" style="width:${Math.max(6, (v / max) * 100)}%">${v}</div></div>`;
    }).join('');
  };

  sel.onchange = draw;
  draw();
}
