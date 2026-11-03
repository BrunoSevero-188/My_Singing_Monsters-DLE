import classic from './classic.js';
import egg from './egg.js';
import { createChoiceMode } from './choice.js';
import { getIslands, getTypes } from '../data/monsters.js';
import { CLUE_DEFS } from '../core/clue-defs.js';

// Nota: se o monstro vive em várias ilhas, qualquer uma delas conta como acerto.
// O modo funciona melhor quando há monstros de poucas ilhas (ex.: Mágicos, Etéreos).
const island = createChoiceMode({
  id: 'island',
  label: 'Ilha',
  description: 'Em qual ilha esse monstro vive?',
  question: (m) => `Em qual ilha vive o ${m.name}?`,
  field: 'islands',
  kind: 'island',
  pool: (m) => m.islands.length <= 3,
  options: getIslands,
  clues: CLUE_DEFS.island,
});

const type = createChoiceMode({
  id: 'type',
  label: 'Classe',
  description: 'Qual é a classe desse monstro?',
  question: (m) => `Qual é a classe do ${m.name}?`,
  field: 'type',
  kind: 'class',
  options: getTypes,
  clues: CLUE_DEFS.type,
});

// Para adicionar um modo novo: crie o arquivo em js/modes/ e coloque na lista abaixo
export const MODES = [classic, egg, island, type];
