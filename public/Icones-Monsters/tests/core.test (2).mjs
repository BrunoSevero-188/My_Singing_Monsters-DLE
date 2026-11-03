import test from 'node:test';
import assert from 'node:assert/strict';
import { compare, parseVersion, fmtVersion } from '../js/core/compare.js';
import { answerFor } from '../js/core/daily.js';
import * as dados from '../js/data/monsters.js';

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

test('carregador: lê o formato novo (versao, data, icone, gif) e aceita o campo antigo "lancamento"', async () => {
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => [
      { id: 1, nome: 'Noggin', ilhas: ['A'], classe: 'Natural', elementos: ['Earth'],
        versao: 'v1.2.0', data: '2012', icone: 'x/icone.png', gif: 'x/noggin.gif' },
      { id: 2, nome: 'Toe Jammer', ilhas: ['A'], classe: 'Natural', elementos: ['Water'], lancamento: '2014-05-10' },
    ],
  });
  await dados.loadMonsters();
  const [a, b] = dados.MONSTERS;
  assert.equal(a.version, '1.2.0');
  assert.equal(a.year, 2012);
  assert.equal(a.icon, 'x/icone.png');
  assert.equal(a.gif, 'x/noggin.gif');
  assert.equal(a.image, a.icon);
  assert.equal(b.year, 2014);
  assert.equal(b.version, null);
  assert.equal(b.icon, 'assets/monsters/toe-jammer.png');
  assert.equal(b.gif, null);
});
