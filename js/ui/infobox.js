const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};

const key = (s) => String(s).toLowerCase().replace(/[^a-z]/g, '');

// Chip colorido (a cor vem do CSS pelo data-k)
export function chip(text) {
  const s = el('span', 'chip', text);
  s.dataset.k = key(text);
  return s;
}

const row = (label, ...nodes) => {
  const r = el('div', 'infobox-row');
  const v = el('span', 'infobox-value');
  v.append(...nodes);
  r.append(el('span', 'infobox-label', label), v);
  return r;
};

// Cartão no estilo da infobox da wiki
export function infobox(m) {
  const box = el('aside', 'infobox');

  const head = el('div', 'infobox-head', m.name);
  head.dataset.k = key(m.type);

  const img = document.createElement('img');
  img.src = m.image;
  img.alt = m.name;
  img.className = 'infobox-img';
  img.onerror = () => { img.style.visibility = 'hidden'; };

  box.append(head, img, row('Classe', chip(m.type)), row('Elementos', ...m.elements.map(chip)), row('Ilhas', ...m.islands.map(chip)));
  if (m.level != null) box.append(row('Nível', document.createTextNode(String(m.level))));
  if (m.fact) box.append(el('p', 'infobox-fact', m.fact));

  const a = el('a', 'infobox-link', 'Ver na wiki ↗');
  a.href = m.wiki;
  a.target = '_blank';
  a.rel = 'noopener';
  box.append(a);
  return box;
}