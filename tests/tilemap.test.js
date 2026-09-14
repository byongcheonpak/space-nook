const test = require('node:test');
const assert = require('node:assert/strict');

global.window = global;
require('../js/tilemap.js');

test('stationMap has the declared dimensions', () => {
  assert.equal(Tilemap.stationMap.width, 20);
  assert.equal(Tilemap.stationMap.height, 15);
  assert.equal(Tilemap.stationMap.tiles.length, 15);
  for (const row of Tilemap.stationMap.tiles) {
    assert.equal(row.length, 20);
  }
});

test('the border is fully blocked and the interior is walkable', () => {
  const map = Tilemap.stationMap;
  assert.equal(Tilemap.isBlocked(map, 0, 0), true);
  assert.equal(Tilemap.isBlocked(map, 19, 14), true);
  assert.equal(Tilemap.isBlocked(map, 10, 7), false);
});

test('out-of-bounds coordinates count as blocked', () => {
  const map = Tilemap.stationMap;
  assert.equal(Tilemap.isBlocked(map, -1, 5), true);
  assert.equal(Tilemap.isBlocked(map, 5, 999), true);
});
