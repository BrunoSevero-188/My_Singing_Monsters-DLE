// Dicas de cada modo e quantas tentativas liberam cada uma (mude os números em "after")
const elements = {
  id: 'elements',
  label: 'Elementos',
  after: 3,
  reveal: (m) => m.elements.join(', '),
};

export const CLUE_DEFS = {
  classic: [
    { id: 'element-count', label: 'Quantidade de elementos', after: 3,
      reveal: (m) => `Este monstro possui ${m.elements.length} elemento(s).` },
    { id: 'combination', label: 'Combinação', after: 6,
      reveal: (m) => {
        const combinations = m.combinacao ?? m.combination ?? [];
        return combinations.length
          ? combinations.map((combination) => `[${combination}]`).join(' · ')
          : '[Comprado]';
      } },
  ],
  inverted: [
    { id: 'elements', label: 'Elementos', after: 5, reveal: (m) => m.elements.join(', ') },
    { id: 'type', label: 'Classe', after: 8, reveal: (m) => [].concat(m.type).join(', ') },
  ],
  island: [elements],
  type: [elements],
};
