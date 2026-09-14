// tests/input.test.js
const test = require('node:test');
const assert = require('node:assert/strict');

global.window = global;
require('../js/input.js');

test('isDown reflects handleKeyDown/handleKeyUp', () => {
  Input.reset();
  assert.equal(Input.isDown('KeyW'), false);
  Input.handleKeyDown('KeyW');
  assert.equal(Input.isDown('KeyW'), true);
  Input.handleKeyUp('KeyW');
  assert.equal(Input.isDown('KeyW'), false);
});

test('wasPressed is true only on the transition frame', () => {
  Input.reset();
  Input.handleKeyDown('Space');
  assert.equal(Input.wasPressed('Space'), true);
  Input.endFrame();
  assert.equal(Input.wasPressed('Space'), false);
});

test('wasPressed does not re-trigger while held without a key-up', () => {
  Input.reset();
  Input.handleKeyDown('Space');
  Input.endFrame();
  Input.handleKeyDown('Space');
  assert.equal(Input.wasPressed('Space'), false);
});

test('getMoveVector reflects arrow and WASD keys, normalized diagonally', () => {
  Input.reset();
  assert.deepEqual(Input.getMoveVector(), { dx: 0, dy: 0 });

  Input.handleKeyDown('ArrowRight');
  assert.deepEqual(Input.getMoveVector(), { dx: 1, dy: 0 });

  Input.handleKeyDown('KeyW');
  const v = Input.getMoveVector();
  assert.ok(Math.abs(v.dx - Math.SQRT1_2) < 1e-9);
  assert.ok(Math.abs(v.dy - (-Math.SQRT1_2)) < 1e-9);
});
