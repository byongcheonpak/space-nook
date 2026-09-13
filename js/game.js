(function () {
  var canvas = document.getElementById('game-canvas');
  var ctx = canvas.getContext('2d');
  var loadingScreen = document.getElementById('loading-screen');
  var lastTime = null;

  function update(dt) {
    // filled in by later tasks
  }

  function render(ctx) {
    ctx.fillStyle = '#0b1026';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function loop(timestamp) {
    if (lastTime === null) lastTime = timestamp;
    var dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    update(dt);
    render(ctx);

    if (!loadingScreen.classList.contains('hidden')) {
      loadingScreen.classList.add('hidden');
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
