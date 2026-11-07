import test from 'node:test';
import assert from 'node:assert/strict';
import { compare, parseVersion, fmtVersion } from '../js/core/compare.js';
import { answerFor } from '../js/core/daily.js';
import * as dados from '../js/data/monsters.js';
import { toRarity, rarityColor, RARITIES } from '../js/core/rarity.js';
import { comboText, CLUE_DEFS } from '../js/core/clue-defs.js';
import { searchLink } from '../js/config.js';
import {
  aplicarFiltro, filtrarPorElemento, filtrarPorRaridade, listaFiltrada, operadorPadrao, listaDeElementos, operadoresDoCampo,
  gradientColors, colorOf, dexNumber, numeros, acharMonstro, ELEMENT_COLORS,
} from '../js/core/library.js';

const m = (over) => ({ id: 1, islands: [], type: 'Natural', elements: [], version: null, year: null, ...over });

test('listas iguais são verde (correct)', () => {
  assert.equal(compare(m({ elements: ['Air'] }), m({ id: 2, elements: ['Air'] }), 'elements'), 'correct');
});
test('interseção parcial é laranja (partial)', () => {
  assert.equal(compare(m({ elements: ['Air', 'Plant'] }), m({ id: 2, elements: ['Air'] }), 'elements'), 'partial');
});
test('sem interseção é vermelho (wrong)', () => {
  assert.equal(compare(m({ islands: ['Plant Island'] }), m({ id: 2, islands: ['Cold Island'] }), 'islands'), 'wrong');
});
test('nome: verde só para o mesmo ID', () => {
  assert.equal(compare(m({ id: 5 }), m({ id: 5 }), 'name'), 'correct');
  assert.equal(compare(m({ id: 5 }), m({ id: 6 }), 'name'), 'wrong');
});
test('versão: igual = verde; resposta depois = seta para cima; antes = seta para baixo', () => {
  const guess = m({ version: '1.2.0' });
  assert.equal(compare(guess, m({ id: 2, version: '1.2.0' }), 'version'), 'correct');
  assert.equal(compare(guess, m({ id: 2, version: '2.0.1' }), 'version'), 'higher');
  assert.equal(compare(guess, m({ id: 2, version: '1.0.0' }), 'version'), 'lower');
});
test('versão: compara número a número (1.10 vem depois de 1.9) e aceita "v"', () => {
  assert.equal(compare(m({ version: '1.9' }), m({ id: 2, version: '1.10' }), 'version'), 'higher');
  assert.equal(compare(m({ version: 'v2.0' }), m({ id: 2, version: '2.0.0' }), 'version'), 'correct');
  assert.deepEqual(parseVersion('v1.2.3'), [1, 2, 3]);
  assert.equal(parseVersion('abc'), null);
  assert.equal(fmtVersion('v1.0.0'), '1.0.0');
});
test('data (ano): igual = verde; resposta depois = ↑; antes = ↓', () => {
  assert.equal(compare(m({ year: 2014 }), m({ id: 2, year: 2014 }), 'year'), 'correct');
  assert.equal(compare(m({ year: 2014 }), m({ id: 2, year: 2016 }), 'year'), 'higher');
  assert.equal(compare(m({ year: 2020 }), m({ id: 2, year: 2016 }), 'year'), 'lower');
});
test('versão ou ano ausente é cinza (unknown)', () => {
  assert.equal(compare(m(), m({ id: 2, version: '1.0.0' }), 'version'), 'unknown');
  assert.equal(compare(m({ year: 2012 }), m({ id: 2 }), 'year'), 'unknown');
  assert.equal(compare(m({ year: null }), m({ id: 2, year: 0 }), 'year'), 'unknown');
});

test('sorteio por ID: fixo no dia, sempre um ID existente, e cobre todos ao longo dos dias', () => {
  const list = [10, 20, 30, 40, 50].map((id) => m({ id }));
  assert.equal(answerFor(list, 'classic', '2026-11-02').id, answerFor(list, 'classic', '2026-11-02').id);
  const seen = new Set();
  for (let d = 1; d <= 300; d++) {
    const day = `2027-01-${String((d % 28) + 1).padStart(2, '0')}-${d}`;
    const pick = answerFor(list, 'classic', day);
    assert.ok(list.some((x) => x.id === pick.id));
    seen.add(pick.id);
  }
  assert.equal(seen.size, list.length);
});
test('sorteio por ID: lista vazia devolve undefined', () => {
  assert.equal(answerFor([], 'classic', '2026-11-02'), undefined);
});

test('carregador: lê o formato atual (versao, ano, icone, gif, ovo, combinacao) e os campos antigos', async () => {
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => [
      { id: 1, nome: 'Noggin', ilhas: ['A'], classe: 'Natural', elementos: ['Earth'],
        versao: 'v1.2.0', ano: '2012', icone: 'https://x/icone.png', gif: 'https://x/noggin.gif', ovo: 'https://x/ovo.png',
        combinacao: [['Mammott', 'Tweedle'], [1, 2]] },
      { id: 2, nome: 'Toe Jammer', ilhas: ['A'], classe: 'Natural', elementos: ['Water'], lancamento: '2014-05-10', combinacao: [] },
      { id: 3, nome: 'Mammott', ilhas: ['A'], classe: 'Natural', elementos: ['Cold'], data: 2016, combinacao: 'Comprado' },
      { id: 4, nome: 'Tweedle', ilhas: ['A'], classe: 'Natural', elementos: ['Air'] },
    ],
  });
  await dados.loadMonsters();
  const [a, b, c, d] = dados.MONSTERS;
  assert.equal(a.version, '1.2.0');
  assert.equal(a.year, 2012);
  assert.equal(a.icon, 'https://x/icone.png');
  assert.equal(a.gif, 'https://x/noggin.gif');
  assert.equal(a.egg, 'https://x/ovo.png');
  assert.equal(a.image, a.icon);
  assert.deepEqual(a.combo, [['Mammott', 'Tweedle'], [1, 2]]);
  assert.equal(b.year, 2014);          // campo antigo "lancamento"
  assert.equal(b.combo, 'buy');        // [] = só se compra
  assert.equal(c.year, 2016);          // campo antigo "data"
  assert.equal(c.combo, 'buy');        // "Comprado"
  assert.equal(d.icon, null);          // sem URL: não inventa caminho
  assert.equal(d.egg, null);
  assert.equal(d.combo, null);         // não cadastrada
});

test('Monstro do dia: dica 1 libera com 5 tentativas (elementos) e dica 2 com 10 (combinação)', () => {
  const [c1, c2] = CLUE_DEFS.classic;
  assert.equal(c1.after, 5);
  assert.equal(c2.after, 10);
  assert.equal(c1.reveal({ elements: ['Air', 'Plant'] }), 'Este monstro tem 2 elementos.');
  assert.equal(c1.reveal({ elements: ['Air'] }), 'Este monstro tem 1 elemento.');
});

test('combinação: até 2 no formato [(A) + (B)], resolve IDs, [(Comprado)] e não cadastrada', () => {
  const all = [{ id: 1, name: 'Noggin' }, { id: 2, name: 'Mammott' }];
  const m = { combo: [['Noggin', 'Mammott'], [2, 1], ['X', 'Y']] };
  assert.equal(comboText(m, all), '[(Noggin) + (Mammott)]\n[(Mammott) + (Noggin)]');
  assert.equal(comboText({ combo: 'buy' }, all), '[(Comprado)]');
  assert.match(comboText({ combo: null }, all), /ainda não foi cadastrada/);
});

test('Pesquisar mais: busca "My Singing Monsters, <nome>" com o nome codificado', () => {
  const url = searchLink('Toe Jammer');
  assert.ok(url.startsWith('https://www.google.com/search?q='));
  assert.equal(decodeURIComponent(url.split('q=')[1]), 'My Singing Monsters, Toe Jammer');
});

// ---------------- Biblioteca (pokédex) ----------------
const dex = [
  { id: 1, name: 'Noggin', rarity: 'comum', type: 'Natural', elements: ['Earth'], islands: ['Plant Island', 'Air Island'], year: 2012, version: '1.0.0' },
  { id: 2, name: 'Mammott', rarity: 'raro', type: 'Natural', elements: ['Cold'], islands: ['Cold Island'], year: 2013, version: '1.10.0' },
  { id: 3, name: 'Toe Jammer', rarity: 'epico', type: 'Natural', elements: ['Water', 'Air'], islands: ['Water Island'], year: 2013, version: '1.9.0' },
  { id: 4, name: 'Árvore', type: 'Mágico', elements: ['Plant'], islands: ['Magical Sanctum'], year: null, version: null },
];
const ids = (l) => l.map((m) => m.id);

test('Biblioteca: número no formato #003', () => {
  assert.equal(dexNumber(3), '003');
  assert.equal(dexNumber(120), '120');
});

test('Biblioteca: pesquisa por nome (igual, diferente, contém) ignora acento e maiúsculas', () => {
  assert.deepEqual(ids(aplicarFiltro(dex, 'nome', 'contem', 'NOG')), [1]);
  assert.deepEqual(ids(aplicarFiltro(dex, 'nome', 'contem', 'arvore')), [4]);
  assert.deepEqual(ids(aplicarFiltro(dex, 'nome', 'igual', 'mammott')), [2]);
  assert.deepEqual(ids(aplicarFiltro(dex, 'nome', 'diferente', 'mammott')), [1, 3, 4]);
});

test('Biblioteca: pesquisa por Nº com as 6 condições', () => {
  assert.deepEqual(ids(aplicarFiltro(dex, 'id', 'igual', '2')), [2]);
  assert.deepEqual(ids(aplicarFiltro(dex, 'id', 'diferente', '2')), [1, 3, 4]);
  assert.deepEqual(ids(aplicarFiltro(dex, 'id', 'maior', '2')), [3, 4]);
  assert.deepEqual(ids(aplicarFiltro(dex, 'id', 'menor', '2')), [1]);
  assert.deepEqual(ids(aplicarFiltro(dex, 'id', 'maior_igual', '2')), [2, 3, 4]);
  assert.deepEqual(ids(aplicarFiltro(dex, 'id', 'menor_igual', '2')), [1, 2]);
  assert.deepEqual(ids(aplicarFiltro(dex, 'id', 'igual', 'abc')), []); // texto no campo numérico
});

test('Biblioteca: pesquisa por ano e por versão (1.10 vem depois de 1.9); sem dado não aparece', () => {
  assert.deepEqual(ids(aplicarFiltro(dex, 'ano', 'igual', '2013')), [2, 3]);
  assert.deepEqual(ids(aplicarFiltro(dex, 'ano', 'maior', '2012')), [2, 3]);
  assert.deepEqual(ids(aplicarFiltro(dex, 'ano', 'diferente', '2012')), [2, 3]); // Árvore (sem ano) fica de fora
  assert.deepEqual(ids(aplicarFiltro(dex, 'versao', 'maior', '1.9')), [2]);
  assert.deepEqual(ids(aplicarFiltro(dex, 'versao', 'menor_igual', '1.9.0')), [1, 3]);
});

test('Biblioteca: elemento, classe e ilha aceitam o valor do JSON e a tradução', () => {
  assert.deepEqual(ids(aplicarFiltro(dex, 'elemento', 'igual', 'water')), [3]);
  assert.deepEqual(ids(aplicarFiltro(dex, 'elemento', 'igual', 'água')), [3]);
  assert.deepEqual(ids(aplicarFiltro(dex, 'elemento', 'contem', 'agu')), [3]);       // "Água" (Water)
  assert.deepEqual(ids(aplicarFiltro(dex, 'elemento', 'contem', 'ar')), [1, 3]);     // "Ar" (Air) e "Earth"
  assert.deepEqual(ids(aplicarFiltro(dex, 'elemento', 'diferente', 'air')), [1, 2, 4]);
  assert.deepEqual(ids(aplicarFiltro(dex, 'classe', 'igual', 'Mágico')), [4]);
  assert.deepEqual(ids(aplicarFiltro(dex, 'ilha', 'contem', 'plant')), [1]);
});

test('Biblioteca: texto vazio não filtra; cada campo tem as suas condições', () => {
  assert.equal(aplicarFiltro(dex, 'nome', 'contem', '   ').length, 4);
  assert.equal(operadoresDoCampo('id').length, 6);
  assert.equal(operadoresDoCampo('nome').length, 3);
  assert.deepEqual(operadoresDoCampo('elemento').map((o) => o.value), ['igual', 'diferente', 'contem']);
});

test('Biblioteca: botão de elemento + pesquisa juntos, sempre ordenado pelo número', () => {
  assert.deepEqual(ids(filtrarPorElemento(dex, 'AIR')), [3]);
  assert.equal(filtrarPorElemento(dex, '').length, 4);
  assert.deepEqual(ids(listaFiltrada([...dex].reverse(), { elemento: 'Water', campo: 'nome', operador: 'contem', texto: 'toe' })), [3]);
  assert.deepEqual(ids(listaFiltrada([...dex].reverse())), [1, 2, 3, 4]);
  assert.deepEqual(listaDeElementos(dex), ['Earth', 'Cold', 'Water', 'Air', 'Plant']);
});

test('Biblioteca: degradê do cartão vai da cor do 1º ao 2º elemento', () => {
  assert.deepEqual(gradientColors(dex[2]), [ELEMENT_COLORS.water, ELEMENT_COLORS.air]);
  assert.deepEqual(gradientColors(dex[0]), [ELEMENT_COLORS.earth, ELEMENT_COLORS.earth]);
  assert.equal(colorOf('Elemento Novo'), '#6b6591'); // desconhecido tem cor padrão
});

test('Biblioteca: "Em números" e busca de monstros citados em combinações', () => {
  const [el, ilhas] = numeros(dex[2], dex);
  assert.deepEqual([el.valor, el.max], [2, 5]);
  assert.equal(ilhas.valor, 1);
  assert.equal(ilhas.max, 5); // 5 ilhas diferentes no JSON de teste
  assert.equal(acharMonstro('noggin', dex).id, 1);
  assert.equal(acharMonstro(3, dex).name, 'Toe Jammer');
  assert.equal(acharMonstro('Inexistente', dex), undefined);
});

test('raridade: aceita comum, raro e épico (com ou sem acento, maiúsculas, inglês); inválido vira null', () => {
  assert.deepEqual(RARITIES, ['comum', 'raro', 'epico']);
  assert.equal(toRarity('Épico'), 'epico');
  assert.equal(toRarity(' RARO '), 'raro');
  assert.equal(toRarity('common'), 'comum');
  assert.equal(toRarity('epic'), 'epico');
  assert.equal(toRarity('lendário'), null);
  assert.equal(toRarity(''), null);
  assert.equal(toRarity(undefined), null);
  assert.notEqual(rarityColor('epico'), rarityColor('comum'));
});

test('raridade: o carregador lê o campo "raridade"', async () => {
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => [
      { id: 1, nome: 'A', ilhas: ['X'], classe: 'Natural', raridade: 'Épico', elementos: ['Air'] },
      { id: 2, nome: 'B', ilhas: ['X'], classe: 'Natural', raridade: 'raro', elementos: ['Air'] },
      { id: 3, nome: 'C', ilhas: ['X'], classe: 'Natural', elementos: ['Air'] },
    ],
  });
  await dados.loadMonsters();
  assert.deepEqual(dados.MONSTERS.map((m) => m.rarity), ['epico', 'raro', null]);
});

test('Biblioteca: pesquisa por raridade (valor do JSON ou texto exibido) e botões de raridade', () => {
  assert.deepEqual(ids(aplicarFiltro(dex, 'raridade', 'igual', 'raro')), [2]);
  assert.deepEqual(ids(aplicarFiltro(dex, 'raridade', 'igual', 'Épico')), [3]);
  assert.deepEqual(ids(aplicarFiltro(dex, 'raridade', 'igual', 'epico')), [3]);
  assert.deepEqual(ids(aplicarFiltro(dex, 'raridade', 'contem', 'com')), [1]);
  assert.deepEqual(ids(aplicarFiltro(dex, 'raridade', 'diferente', 'raro')), [1, 3, 4]); // sem raridade também aparece
  assert.deepEqual(operadoresDoCampo('raridade').map((o) => o.value), ['igual', 'diferente', 'contem']);
  assert.deepEqual(ids(filtrarPorRaridade(dex, 'epico')), [3]);
  assert.equal(filtrarPorRaridade(dex, '').length, 4);
  assert.deepEqual(ids(listaFiltrada(dex, { raridade: 'comum', elemento: 'Earth' })), [1]);
  assert.deepEqual(ids(listaFiltrada(dex, { raridade: 'raro', elemento: 'Earth' })), []);
});

test('Biblioteca: condição inicial é "Contém" nos campos de texto e "Igual" nos numéricos', () => {
  for (const c of ['nome', 'elemento', 'classe', 'raridade', 'ilha']) assert.equal(operadorPadrao(c), 'contem');
  for (const c of ['id', 'versao', 'ano']) assert.equal(operadorPadrao(c), 'igual');
});
