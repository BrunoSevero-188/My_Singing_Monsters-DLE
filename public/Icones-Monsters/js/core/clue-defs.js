// Dicas de cada modo e quantas tentativas liberam cada uma (mude os números em "after")
const elements = {
  id: 'elements',
  label: 'Elementos',
  after: 3,
  reveal: (m) => m.elements.join(', '),
};

export const CLUE_DEFS = {
  classic: [
    { id: 'letter', label: 'Nome', after: 6,
      reveal: (m) => `Começa com "${m.name[0]}" e tem ${m.name.length} caracteres.` },
    { id: 'counts', label: 'Números', after: 9,
      reveal: (m) => `Tem ${m.elements.length} elemento(s) e vive em ${m.islands.length} ilha(s).` },
  ],
  inverted: [
    { id: 'elements', label: 'Elementos', after: 5, reveal: (m) => m.elements.join(', ') },
    { id: 'type', label: 'Classe', after: 8, reveal: (m) => [].concat(m.type).join(', ') },
  ],
  island: [elements],
  type: [elements],
};
