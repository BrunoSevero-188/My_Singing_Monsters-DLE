import { HOW_TO } from './how-to.js';

// Botão "?" (Dica de Jogo) no canto esquerdo do topo + janela com o tutorial de cada modo
export function mountHelp(slot) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'help-btn';
  btn.title = 'Dica de Jogo';
  btn.setAttribute('aria-label', 'Dica de Jogo');
  btn.innerHTML = '<span class="q" aria-hidden="true">?</span><span class="lbl">Dica de Jogo</span>';

  const dlg = document.createElement('dialog');
  dlg.className = 'help-dialog';
  dlg.innerHTML = '<h2>Dica de Jogo</h2><div class="help-body"></div><div class="win-actions"><button type="button" class="pill close">Fechar</button></div>';

  const body = dlg.querySelector('.help-body');
  HOW_TO.forEach((sec) => {
    const wrap = document.createElement('section');
    const h = document.createElement('h3');
    h.textContent = `${sec.icon} ${sec.title}`;
    const ul = document.createElement('ul');
    sec.items.forEach((t) => {
      const li = document.createElement('li');
      li.textContent = t;
      ul.append(li);
    });
    wrap.append(h, ul);
    body.append(wrap);
  });
  const soon = document.createElement('p');
  soon.className = 'help-soon';
  soon.textContent = 'As dicas dos outros modos entram em breve.';
  body.append(soon);

  btn.onclick = () => dlg.showModal();
  dlg.querySelector('.close').onclick = () => dlg.close();
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); }); // clique fora fecha

  slot.append(btn);
  document.body.append(dlg);
}
