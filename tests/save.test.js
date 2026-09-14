const test = require('node:test');
const assert = require('node:assert/strict');

global.window = global;
require('../js/save.js');

function fakeStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, v),
  };
}

test('getDefault returns the default state', () => {
  assert.deepEqual(Save.getDefault(), { tutorialComplete: false, hasHouseKit: false, health: 5, gold: 0 });
});

test('load returns defaults when storage is empty', () => {
  const storage = fakeStorage();
  assert.deepEqual(Save.load(storage), Save.getDefault());
});

test('write then load round-trips saved state', () => {
  const storage = fakeStorage();
  Save.write({ tutorialComplete: true, hasHouseKit: true, health: 3, gold: 50 }, storage);
  assert.deepEqual(Save.load(storage), { tutorialComplete: true, hasHouseKit: true, health: 3, gold: 50 });
});

test('load falls back to defaults on corrupt JSON', () => {
  const storage = fakeStorage();
  storage.setItem(Save.KEY, 'not json');
  assert.deepEqual(Save.load(storage), Save.getDefault());
});
