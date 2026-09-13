const test = require('node:test');
const assert = require('node:assert/strict');

global.window = global;
require('../js/tilemap.js');
require('../js/player.js');

function openMap() {
  return { width: 5, height: 5, tiles: [
    [1,1,1,1,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,1],
  ]};
}

test('create returns a player at the given position facing down', () => {
  const p = Player.create(64, 64);
  assert.equal(p.x, 64);
  assert.equal(p.y, 64);
  assert.equal(p.dir, 'down');
  assert.equal(p.moving, false);
});

test('move updates position and facing direction in open space', () => {
  const map = openMap();
  const p = Player.create(64, 64);
  Player.move(p, 1, 0, 0.1, map);
  assert.ok(p.x > 64);
  assert.equal(p.y, 64);
  assert.equal(p.dir, 'right');
  assert.equal(p.moving, true);
});

test('move does not cross a blocked tile', () => {
  const map = openMap();
  // one tile size away from the right wall (tile x=3 is the last open column, wall at x=4 -> pixel 128)
  const p = Player.create(120, 64);
  for (let i = 0; i < 50; i++) Player.move(p, 1, 0, 0.1, map);
  assert.ok(p.x < 128);
});

test('move with a zero vector leaves position unchanged and moving false', () => {
  const map = openMap();
  const p = Player.create(64, 64);
  Player.move(p, 0, 0, 1, map);
  assert.equal(p.x, 64);
  assert.equal(p.y, 64);
  assert.equal(p.moving, false);
});
