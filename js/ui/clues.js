const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};

// defs: [{ id, label, after, reveal(monstro) }]
export function createClues(defs, ctx) {
  const wrap = el('div', 'clues');
  const bar = el('div', 'clues-bar');
  const panel = el('div', 'clues-panel');
  panel.hidden = true;
  wrap.append(bar, panel);
  let openId = null;

  function update() {
    const tries = ctx.state.guesses.length;
    bar.replaceChildren(...defs.map((d) => {
      const locked = !ctx.state.won && tries < d.after; // ao ganhar, tudo abre
      const b = el('button', 'clue ' + (locked ? 'locked' : 'unlocked') + (openId === d.id ? ' active' : ''));
      b.type = 'button';
      b.disabled = locked;
      b.textContent = locked ? `🔒 ${d.label} em ${d.after - tries} tentativa(s)` : `💡 ${d.label}`;
      b.onclick = () => { openId = openId === d.id ? null : d.id; update(); };
      return b;
    }));
    const cur = defs.find((d) => d.id === openId);
    panel.hidden = !cur;
    panel.textContent = cur ? cur.reveal(ctx.answer) : '';
  }

  update();
  return { el: wrap, update };
}
