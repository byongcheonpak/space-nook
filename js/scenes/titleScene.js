window.TitleScene = (function () {
  function decideNextScene(save) {
    return save && save.tutorialComplete ? 'station' : 'opening';
  }

  var scene = {
    update: function () {
      if (Input.wasPressed('Space') || Input.wasPressed('Enter')) {
        SceneManager.goto(decideNextScene(Save.load()));
      }
    },
    render: function (ctx) {
      ctx.fillStyle = '#0b1026';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      ctx.fillStyle = '#ffe27a';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('스페이스 넉', ctx.canvas.width / 2, ctx.canvas.height / 2 - 10);

      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#c9d6f2';
      ctx.fillText('Space 또는 Enter로 시작', ctx.canvas.width / 2, ctx.canvas.height / 2 + 30);
      ctx.textAlign = 'left';
    },
  };

  return { decideNextScene: decideNextScene, scene: scene };
})();
