// Tradução apenas de EXIBIÇÃO. Os valores do JSON continuam em inglês (como na wiki)
// e a comparação é feita sobre eles. O que não estiver aqui aparece como está no JSON.
const DICT = {
  element: { Air: 'Ar', Plant: 'Planta', Earth: 'Terra', Water: 'Água', Cold: 'Frio' },
  class: { Natural: 'Natural' },
  island: {},
  rarity: { comum: 'Comum', raro: 'Raro', epico: 'Épico' },
};

export const label = (kind, value) => DICT[kind]?.[value] ?? value;
