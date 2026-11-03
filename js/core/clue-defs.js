// Dicas de cada modo e quantas tentativas liberam cada uma (mude os números em "after").
// reveal(monstro, todosOsMonstros) devolve o texto da dica.

const nameOf = (v, all) => (typeof v === 'number' ? (all.find((x) => x.id === v)?.name ?? `#${v}`) : String(v));

// Até 2 combinações no formato [(Monstro) + (Monstro)]; ou [(Comprado)] se só se obtém comprando
export function comboText(m, all = []) {
  if (m.combo === 'buy') return '[(Comprado)]';
  if (!m.combo?.length) return 'A combinação deste monstro ainda não foi cadastrada.';
  return m.combo.slice(0, 2).map(([a, b]) => `[(${nameOf(a, all)}) + (${nameOf(b, all)})]`).join('\n');
}

const elements = {
  id: 'elements',
  label: 'Elementos',
  after: 3,
  reveal: (m) => m.elements.join(', '),
};

export const CLUE_DEFS = {
  classic: [
    { id: 'count', label: 'Elementos', after: 5,
      reveal: (m) => `Este monstro tem ${m.elements.length} elemento${m.elements.length === 1 ? '' : 's'}.` },
    { id: 'combo', label: 'Combinação', after: 10, reveal: comboText },
  ],
  egg: [
    { id: 'elements', label: 'Elementos', after: 5, reveal: (m) => m.elements.join(', ') },
    { id: 'type', label: 'Classe', after: 8, reveal: (m) => [].concat(m.type).join(', ') },
  ],
  island: [elements],
  type: [elements],
};
