window.Tilemap = (function () {
  var TILE_SIZE = 32;
  var WIDTH = 20;
  var HEIGHT = 15;

  function buildStationTiles() {
    var tiles = [];
    for (var y = 0; y < HEIGHT; y++) {
      var row = [];
      for (var x = 0; x < WIDTH; x++) {
        var border = x === 0 || y === 0 || x === WIDTH - 1 || y === HEIGHT - 1;
        row.push(border ? 1 : 0);
      }
      tiles.push(row);
    }
    return tiles;
  }

  var stationMap = { width: WIDTH, height: HEIGHT, tiles: buildStationTiles() };

  function isBlocked(map, tileX, tileY) {
    if (tileX < 0 || tileY < 0 || tileX >= map.width || tileY >= map.height) return true;
    return map.tiles[tileY][tileX] === 1;
  }

  return { TILE_SIZE: TILE_SIZE, stationMap: stationMap, isBlocked: isBlocked };
})();
