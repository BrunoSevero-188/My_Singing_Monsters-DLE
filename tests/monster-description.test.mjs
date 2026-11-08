// Confirma que `descricao` aceita texto livre e é normalizado sem espaços externos.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as monsters from '../js/data/monsters.js';

test('loader lê descrição textual opcional dos monstros', async () => {
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => [
      { id: 1, nome: 'Monstro com descrição', descricao: '  Vive em uma ilha musical.  ', ilhas: ['Ilha'], classe: 'Natural', elementos: ['Ar'] },
      { id: 2, nome: 'Monstro sem descrição', ilhas: ['Ilha'], classe: 'Natural', elementos: ['Água'] },
      { id: 3, nome: 'Descrição não textual', descricao: 42, ilhas: ['Ilha'], classe: 'Natural', elementos: ['Terra'] },
    ],
  });

  await monsters.loadMonsters();
  assert.equal(monsters.MONSTERS[0].description, 'Vive em uma ilha musical.');
  assert.equal(monsters.MONSTERS[1].description, null);
  assert.equal(monsters.MONSTERS[2].description, '42');
});