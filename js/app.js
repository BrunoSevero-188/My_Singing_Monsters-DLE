const nav = document.getElementById('nav');
const game = document.getElementById('game');

const LOADING = [
  'Chamando os monstros para o coral...',
  'Afinando as vozes...',
  'Procurando a ilha certa...',
  'Alimentando os monstros...',
];

// Erros aparecem na própria tela (útil no celular, sem abrir o console)
function fail(title, err) {
  console.error(err);
  game.innerHTML = `<div class="box"><h2 class="box-title">${title}</h2><pre class="errlog"></pre></div>`;
  game.querySelector('.errlog').textContent = (err && (err.stack || err.message)) || String(err);
}

window.addEventListener('error', (e) => fail('Erro no script', e.error || e.message));
window.addEventListener('unhandledrejection', (e) => fail('Erro assíncrono', e.reason));

async function init() {
  game.innerHTML = `<p class="desc">${LOADING[Math.floor(Math.random() * LOADING.length)]}</p>`;

  let monstersMod, MODES, homeMod, storage, base, daily, settings;
  try {
    settings = await import('./core/settings.js');
    settings.applySettings();
    monstersMod = await import('./data/monsters.js');
    ({ MODES } = await import('./modes/index.js'));
    homeMod = await import('./ui/home.js');
    storage = await import('./core/storage.js');
    base = await import('./core/mode-base.js');
    daily = await import('./core/daily.js');
  } catch (e) {
    return fail('Falha ao carregar os módulos', e);
  }

  // Botão "?" (Dica de Jogo): fica disponível mesmo se os dados falharem
  try { (await import('./ui/help.js')).mountHelp(document.getElementById('help-slot')); }
  catch (e) { console.warn('help.js indisponível:', e); }

  let libMod = null;
  try { libMod = await import('./ui/library.js'); }
  catch (e) { console.warn('library.js indisponível:', e); }

  let ready = false;

  // Rotas: home · <modo> · biblioteca · biblioteca/<id>
  let ignorar = 0; // hashchange causado pelo próprio show() não renderiza de novo

  function show(route) {
    if (!ready) return;
    const [nome, arg] = String(route).split('/');
    const mode = MODES.find((m) => m.id === nome);
    const isLib = nome === 'biblioteca' && !!libMod;
    const target = mode ? mode.id : isLib ? 'biblioteca' : 'home';
    const full = isLib && arg ? `biblioteca/${arg}` : target;
    if (location.hash.slice(1) !== full) { ignorar++; location.hash = full; }
    nav.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.id === target));
    game.innerHTML = '';
    try {
      if (mode) mode.render(game);
      else if (isLib) libMod.renderLibrary(game, arg);
      else homeMod.renderHome(game, show);
    } catch (e) {
      fail(`Erro ao abrir "${full}"`, e);
    }
    window.scrollTo({ top: 0 });
  }

  // Links como #biblioteca/3 e o botão "voltar" do navegador
  window.addEventListener('hashchange', () => {
    if (ignorar > 0) { ignorar--; return; }
    show(location.hash.slice(1));
  });

  function showAllDone() {
    if (document.querySelector('dialog.all-done')) return;
    const d = document.createElement('dialog');
    d.className = 'all-done';
    d.innerHTML = `<h2>🎉 Parabéns!</h2>
      <p>Você completou todos os desafios de hoje 🎶</p>
      <p class="countdown"></p>
      <div class="win-actions"><button class="pill share">Compartilhar</button><button class="pill close">Fechar</button></div>`;
    d.querySelector('.close').onclick = () => d.close();
    d.querySelector('.share').onclick = async (e) => {
      const text = [
        `MSMdle #${daily.dayNumber()} · completei todos os modos hoje:`,
        ...MODES.map((m) => `${m.label}: ${storage.getState(m.id).guesses.length}`),
        location.origin + location.pathname,
      ].join('\n');
      await navigator.clipboard.writeText(text);
      e.target.textContent = 'Copiado!';
    };
    document.body.append(d);
    base.startCountdown(d.querySelector('.countdown'));
    d.showModal();
  }

  window.addEventListener('msmdle:next', () => {
    const next = MODES.find((m) => !storage.getState(m.id).won);
    show(next ? next.id : 'home');
  });
  window.addEventListener('msmdle:won', () => {
    if (MODES.every((m) => storage.getState(m.id).won)) setTimeout(showAllDone, 1800);
  });

  // Os botões aparecem antes dos dados carregarem
  [{ id: 'home', label: 'Início' }, ...MODES, ...(libMod ? [{ id: 'biblioteca', label: 'Biblioteca' }] : [])].forEach((m) => {
    const b = document.createElement('button');
    b.textContent = m.label;
    b.dataset.id = m.id;
    b.onclick = () => show(m.id);
    nav.append(b);
  });

  try {
    await monstersMod.loadMonsters();
  } catch (e) {
    return fail('Falha ao carregar os dados', e);
  }
  ready = true;
  show(location.hash.slice(1));
}

init();
