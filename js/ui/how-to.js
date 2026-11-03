import { CLUE_DEFS } from '../core/clue-defs.js';

// Tutorial de cada modo, mostrado em "Dica de Jogo" (botão "?").
// Por enquanto só o modo clássico. Para incluir outro modo, adicione um item na lista.
const [c1, c2] = CLUE_DEFS.classic;

export const HOW_TO = [
  {
    id: 'classic',
    icon: '🎯',
    title: 'Monstro do dia',
    items: [
      'Digite o nome de um monstro e escolha na lista para dar um palpite.',
      'Cada palpite vira uma linha na tabela, comparando o monstro escolhido com o monstro do dia.',
      'Cores: verde = certo · laranja = quase (têm algo em comum) · vermelho = errado.',
      'Monstro: o ícone ganha borda verde se você acertou e vermelha se errou. Passe o mouse (ou toque) no ícone para ver o nome.',
      'Versão e Ano: a seta ↑ mostra que o monstro do dia veio depois do seu palpite; a seta ↓, que veio antes.',
      `Dicas: depois de ${c1.after} tentativas você descobre quantos elementos o monstro tem. Depois de ${c2.after}, aparecem combinações para obtê-lo, como [(Monstro) + (Monstro)], ou [(Comprado)] se ele só puder ser comprado.`,
      'Ao acertar, aparece o gif do monstro e o botão "Pesquisar mais", que abre uma busca no seu navegador.',
      'Um monstro novo a cada dia, à meia-noite (horário de Brasília).',
    ],
  },
];
