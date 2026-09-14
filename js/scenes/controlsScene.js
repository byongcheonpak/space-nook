// js/scenes/controlsScene.js
window.ControlsScene = (function () {
  var CONTROL_ROWS = [
    ['이동', '방향키 또는 W/A/S/D'],
    ['상호작용 / 채집 / 전투', 'Space'],
    ['주머니 열기', '추후 시스템 준비 중'],
    ['옷 갈아입기', '추후 시스템 준비 중'],
    ['우주선 조종', '추후 시스템 준비 중'],
  ];

  var scene = {
    update: function () {
      if (Input.wasPressed('Space')) SceneManager.goto('station');
    },
    render: function (ctx) {
      ctx.fillStyle = '#0b1026';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      ctx.fillStyle = '#ffe27a';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('조작법', 40, 50);

      ctx.font = '14px sans-serif';
      CONTROL_ROWS.forEach(function (row, i) {
        var y = 90 + i * 30;
        ctx.fillStyle = '#fff';
        ctx.fillText(row[0], 40, y);
        ctx.fillStyle = '#c9d6f2';
        ctx.fillText(row[1], 260, y);
      });

      ctx.fillStyle = '#c9d6f2';
      ctx.font = '12px sans-serif';
      ctx.fillText('Space로 계속', 40, ctx.canvas.height - 30);
    },
  };

  return { CONTROL_ROWS: CONTROL_ROWS, scene: scene };
})();
