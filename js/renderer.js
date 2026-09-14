// js/renderer.js
window.Renderer = (function () {
  function computeCamera(player, canvasWidth, canvasHeight, map) {
    var mapPxW = map.width * Tilemap.TILE_SIZE;
    var mapPxH = map.height * Tilemap.TILE_SIZE;
    var x = player.x - canvasWidth / 2;
    var y = player.y - canvasHeight / 2;
    x = Math.max(0, Math.min(x, Math.max(0, mapPxW - canvasWidth)));
    y = Math.max(0, Math.min(y, Math.max(0, mapPxH - canvasHeight)));
    return { x: x, y: y };
  }

  function drawTilemap(ctx, map, camera) {
    var size = Tilemap.TILE_SIZE;
    for (var ty = 0; ty < map.height; ty++) {
      for (var tx = 0; tx < map.width; tx++) {
        var blocked = map.tiles[ty][tx] === 1;
        ctx.fillStyle = blocked ? '#3a2b52' : '#1c1440';
        ctx.fillRect(tx * size - camera.x, ty * size - camera.y, size, size);
      }
    }
  }

  function drawPlayer(ctx, player, camera) {
    var sx = player.x - camera.x;
    var sy = player.y - camera.y;
    ctx.fillStyle = '#ff9f6b';
    ctx.beginPath();
    ctx.roundRect(sx - 10, sy - 10, 20, 20, 4);
    ctx.fill();

    ctx.fillStyle = '#fff';
    var tip = { up: [0, -14], down: [0, 14], left: [-14, 0], right: [14, 0] }[player.dir];
    ctx.beginPath();
    ctx.arc(sx + tip[0], sy + tip[1], 3, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawAurora(ctx, aurora, camera) {
    var sx = aurora.x - camera.x;
    var sy = aurora.y - camera.y;
    ctx.fillStyle = 'rgba(124, 92, 255, 0.75)';
    ctx.beginPath();
    ctx.arc(sx, sy, 16, 0, Math.PI * 2);
    ctx.fill();
  }

  function wrapLines(ctx, text, maxWidth) {
    var words = text.split(' ');
    var lines = [];
    var current = '';
    for (var i = 0; i < words.length; i++) {
      var word = words[i];
      var test = current ? current + ' ' + word : word;
      if (ctx.measureText(test).width <= maxWidth || !current) {
        current = test;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  function drawDialogue(ctx, line) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(20, ctx.canvas.height - 100, ctx.canvas.width - 40, 80);

    var left = 36;
    var maxWidth = ctx.canvas.width - 20 - left;

    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    var wrapped = wrapLines(ctx, line, maxWidth).slice(0, 3);
    var topY = ctx.canvas.height - 82;
    for (var i = 0; i < wrapped.length; i++) {
      ctx.fillText(wrapped[i], left, topY + i * 22);
    }

    ctx.fillStyle = '#c9d6f2';
    ctx.font = '12px sans-serif';
    ctx.fillText('Space로 계속', left, ctx.canvas.height - 30);
  }

  function drawHud(ctx, state) {
    var i;
    for (i = 0; i < 5; i++) {
      ctx.fillStyle = i < state.health ? '#ff6b6b' : 'rgba(255,255,255,0.2)';
      ctx.beginPath();
      ctx.arc(16 + i * 18, 16, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffe27a';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('올돈: ' + state.gold, ctx.canvas.width - 12, 22);
    ctx.textAlign = 'left';
  }

  return {
    computeCamera: computeCamera,
    drawTilemap: drawTilemap,
    drawPlayer: drawPlayer,
    drawAurora: drawAurora,
    drawHud: drawHud,
    drawDialogue: drawDialogue,
  };
})();
