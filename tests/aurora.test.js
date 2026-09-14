const test = require('node:test');
const assert = require('node:assert/strict');

global.window = global;
require('../js/aurora.js');

test('create returns an aurora at the given position', () => {
  const a = Aurora.create(100, 200);
  assert.deepEqual(a, { x: 100, y: 200 });
});

test('isPlayerNear is true within radius and false outside it', () => {
  const a = Aurora.create(0, 0);
  const near = { x: 10, y: 0 };
  const far = { x: 1000, y: 0 };
  assert.equal(Aurora.isPlayerNear(near, a, 40), true);
  assert.equal(Aurora.isPlayerNear(far, a, 40), false);
});

test('isPlayerNear treats the boundary as near (<=)', () => {
  const a = Aurora.create(0, 0);
  const onEdge = { x: 40, y: 0 };
  assert.equal(Aurora.isPlayerNear(onEdge, a, 40), true);
});

test('TUTORIAL_LINES is a non-empty array of strings', () => {
  assert.ok(Array.isArray(Aurora.TUTORIAL_LINES));
  assert.ok(Aurora.TUTORIAL_LINES.length > 0);
  for (const line of Aurora.TUTORIAL_LINES) assert.equal(typeof line, 'string');
});
