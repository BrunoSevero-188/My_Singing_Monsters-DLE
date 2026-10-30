export const MONSTERS = [
  { id: 'noggin',    name: 'Noggin',    islands: ['Ilha das Plantas'], type: 'Natural', elements: ['Terra'] },
  { id: 'mammott',   name: 'Mammott',   islands: ['Ilha das Plantas'], type: 'Natural', elements: ['Frio'] },
  { id: 'toe-jammer',name: 'Toe Jammer',islands: ['Ilha das Plantas'], type: 'Natural', elements: ['Água'] },
  { id: 'potbelly',  name: 'Potbelly',  islands: ['Ilha das Plantas'], type: 'Natural', elements: ['Planta'] },
  { id: 'tweedle',   name: 'Tweedle',   islands: ['Ilha das Plantas'], type: 'Natural', elements: ['Ar'] },
  { id: 'pango',     name: 'Pango',     islands: ['Ilha Fria'],        type: 'Natural', elements: ['Frio'] },
  { id: 'bowgart',   name: 'Bowgart',   islands: ['Ilha Fria'],        type: 'Natural', elements: ['Frio'] },
];

export const ISLANDS = [...new Set(MONSTERS.flatMap((m) => m.islands))];
export const TYPES = [...new Set(MONSTERS.map((m) => m.type))];