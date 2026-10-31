import { loadMonsters } from './data/monsters.js';
import { MODES } from './modes/index.js';
import { renderHome } from './ui/home.js';

const nav = document.getElementById('nav');
const game = document.getElementById('game');

function show(id) {
  const mode = MODES.find((m) => m.id === id);
  const target = mode ? mode.id : 'home';
  location.hash = target;
  nav.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.id === target));
  game.innerHTML = '';
  if (mode) mode.render(game);
  else renderHome(game, show);
}

async function init() {
  game.innerHTML = '<p class="desc">Carregando monstros...</p>';
  try {
    await loadMonsters();
  } catch (e) {
    game.innerHTML = `<p class="desc error">${e.message}</p>`;
    return;
  }
  [{ id: 'home', label: '🏠 Início' }, ...MODES].forEach((m) => {
    const b = document.createElement('button');
    b.textContent = m.label;
    b.dataset.id = m.id;
    b.onclick = () => show(m.id);
    nav.append(b);
  });
  show(location.hash.slice(1));
}

init();