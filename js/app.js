import { MODES } from './modes/index.js';

const nav = document.getElementById('nav');
const game = document.getElementById('game');

function show(id) {
  const mode = MODES.find((m) => m.id === id) || MODES[0];
  location.hash = mode.id;
  nav.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.id === mode.id));
  game.innerHTML = '';
  mode.render(game);
}

MODES.forEach((m) => {
  const b = document.createElement('button');
  b.textContent = m.label;
  b.dataset.id = m.id;
  b.onclick = () => show(m.id);
  nav.append(b);
});

show(location.hash.slice(1));