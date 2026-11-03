import test from 'node:test';
import assert from 'node:assert/strict';
import { compare, fmtDate } from '../js/core/compare.js';
import { answerFor } from '../js/core/daily.js';

const m = (over) => ({ id: 1, islands: [], type: 'Natural', elements: [], releaseDate: null, ...over });

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
test('data: igual = verde; resposta depois = seta para cima; antes = seta para baixo', () => {
  const guess = m({ releaseDate: '2014-05-10' });
  assert.equal(compare(guess, m({ id: 2, releaseDate: '2014-05-10' }), 'releaseDate'), 'correct');
  assert.equal(compare(guess, m({ id: 2, releaseDate: '2016-01-01' }), 'releaseDate'), 'higher');
  assert.equal(compare(guess, m({ id: 2, releaseDate: '2012-09-04' }), 'releaseDate'), 'lower');
});
test('data: mesmo ano, mês diferente também compara', () => {
  assert.equal(compare(m({ releaseDate: '2020-03-01' }), m({ id: 2, releaseDate: '2020-11-01' }), 'releaseDate'), 'higher');
});
test('data ausente é cinza (unknown)', () => {
  assert.equal(compare(m(), m({ id: 2, releaseDate: '2020-01-01' }), 'releaseDate'), 'unknown');
});
test('fmtDate', () => {
  assert.equal(fmtDate('2012-09-04'), '04/09/2012');
  assert.equal(fmtDate('2012-09'), '09/2012');
  assert.equal(fmtDate(null), '—');
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
