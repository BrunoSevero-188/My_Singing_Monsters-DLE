import classic from './classic.js';
import inverted from './inverted.js';
import { createChoiceMode } from './choice.js';
import { getIslands, getTypes } from '../data/monsters.js';

const island = createChoiceMode({
  id: 'island',
  label: 'Ilha',
  description: 'Em qual ilha esse monstro vive?',
  question: (m) => `Em qual ilha vive o ${m.name}?`,
  field: 'islands',
  options: () => getIslands,
});

const type = createChoiceMode({
  id: 'type',
  label: 'Tipo',
  description: 'Qual é o tipo desse monstro?',
  question: (m) => `Qual é o tipo do ${m.name}?`,
  field: 'type',
  options: () => getTypes,
});

export const MODES = [classic, inverted, island, type];