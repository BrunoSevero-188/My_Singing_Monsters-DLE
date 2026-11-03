import { label } from '../i18n.js';
import { fmtDate } from '../core/compare.js';

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};

const key = (s) => String(s).toLowerCase().replace(/[^a-z]/g, '');

// Chip colorido. A cor vem do valor original (inglês); o texto vem traduzido (kind: element | class | island)
export function chip(value, kind) {
  const s = el('span', 'chip', label(kind, value));
  s.dataset.k = key(value);
  return s;
}

const row = (name, ...nodes) => {
  const r = el('div', 'infobox-row');
  const v = el('span', 'infobox-value');
  v.append(...nodes);
  r.append(el('span', 'infobox-label', name), v);
  return r;
};

// Cartão no estilo da infobox da wiki
export function infobox(m) {
  const box = el('aside', 'infobox');

  const head = el('div', 'infobox-head', m.name);
  head.dataset.k = key([].concat(m.type)[0]);

  const img = document.createElement('img');
  img.src = m.gif || m.icon || m.image;
  img.alt = m.name;
  img.title = m.name;
  img.className = 'infobox-img';
  img.onerror = () => {
    if (img.src !== m.icon && (m.icon || m.image)) img.src = m.icon || m.image;
    else img.style.visibility = 'hidden';
  };

  box.append(
    head, img,
    row('Classe', ...[].concat(m.type).map((v) => chip(v, 'class'))),
    row('Elementos', ...m.elements.map((v) => chip(v, 'element'))),
    row('Ilhas', ...m.islands.map((v) => chip(v, 'island'))),
  );
  if (m.releaseDate) box.append(row('Lançamento', document.createTextNode(fmtDate(m.releaseDate))));

  const a = el('a', 'infobox-link', 'Ver na wiki ↗');
  a.href = m.wiki;
  a.target = '_blank';
  a.rel = 'noopener';
  box.append(a);
  return box;
}
