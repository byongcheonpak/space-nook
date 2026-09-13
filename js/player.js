window.Player = (function () {
  function create(x, y) {
    return { x: x, y: y, dir: 'down', speed: 120, moving: false };
  }

  function move(player, dx, dy, dt, map) {
    player.moving = dx !== 0 || dy !== 0;
    if (dx > 0) player.dir = 'right';
    else if (dx < 0) player.dir = 'left';
    else if (dy > 0) player.dir = 'down';
    else if (dy < 0) player.dir = 'up';

    var dist = player.speed * dt;
    var nx = player.x + dx * dist;
    var ny = player.y + dy * dist;
    var size = Tilemap.TILE_SIZE;

    var tileYCur = Math.floor(player.y / size);
    var tileXNew = Math.floor(nx / size);
    if (!Tilemap.isBlocked(map, tileXNew, tileYCur)) {
      player.x = nx;
    }

    var tileXCur = Math.floor(player.x / size);
    var tileYNew = Math.floor(ny / size);
    if (!Tilemap.isBlocked(map, tileXCur, tileYNew)) {
      player.y = ny;
    }

    return player;
  }

  return { create: create, move: move };
})();
