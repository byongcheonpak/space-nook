// js/game.js
(function () {
  var canvas = document.getElementById('game-canvas');
  var ctx = canvas.getContext('2d');
  var loadingScreen = document.getElementById('loading-screen');
  var lastTime = null;

  Input.attach(window);

  SceneManager.register('title', TitleScene.scene);
  SceneManager.register('opening', OpeningScene.scene);
  SceneManager.register('controls', ControlsScene.scene);
  SceneManager.register('station', StationScene.scene);
  SceneManager.goto('title');

  function loop(timestamp) {
    if (lastTime === null) lastTime = timestamp;
    var dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    SceneManager.update(dt);
    SceneManager.render(ctx);
    Input.endFrame();

    if (!loadingScreen.classList.contains('hidden')) {
      loadingScreen.classList.add('hidden');
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
