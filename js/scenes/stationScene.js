// js/scenes/stationScene.js
window.StationScene = (function () {
  var player, aurora, map, tutorialStep, hasShownSeekLine, save;

  function startAuroraDialogue() {
    DialogueBox.show(Aurora.TUTORIAL_LINES, function () {
      tutorialStep = StationTutorial.onDialogueComplete(tutorialStep);
      save = Save.load();
      save.tutorialComplete = true;
      save.hasHouseKit = true;
      Save.write(save);
    });
  }

  var scene = {
    enter: function () {
      save = Save.load();
      map = Tilemap.stationMap;
      player = Player.create(320, 300);
      aurora = Aurora.create(320, 150);
      hasShownSeekLine = false;
      tutorialStep = StationTutorial.initialStep(save.tutorialComplete);

      if (tutorialStep === StationTutorial.STEPS.MOVE) {
        DialogueBox.show(['오로라: 방향키나 W/A/S/D로 움직여서 저에게 와 보세요!']);
      }
    },

    update: function (dt) {
      if (DialogueBox.isActive()) {
        if (Input.wasPressed('Space')) DialogueBox.advance();
        return;
      }

      var v = Input.getMoveVector();
      Player.move(player, v.dx, v.dy, dt, map);

      if (tutorialStep === StationTutorial.STEPS.MOVE && player.moving) {
        tutorialStep = StationTutorial.onPlayerMoved(tutorialStep);
      }

      if (tutorialStep === StationTutorial.STEPS.SEEK_AURORA && !hasShownSeekLine) {
        hasShownSeekLine = true;
        DialogueBox.show(['오로라: 좋아요! 이제 저에게 가까이 와서 Space를 눌러 말을 걸어보세요.']);
      }

      if (
        tutorialStep === StationTutorial.STEPS.SEEK_AURORA &&
        !DialogueBox.isActive() &&
        Input.wasPressed('Space') &&
        Aurora.isPlayerNear(player, aurora, 40)
      ) {
        tutorialStep = StationTutorial.onInteractPressed(tutorialStep, true);
        startAuroraDialogue();
      }
    },

    render: function (ctx) {
      var camera = Renderer.computeCamera(player, ctx.canvas.width, ctx.canvas.height, map);
      Renderer.drawTilemap(ctx, map, camera);
      Renderer.drawAurora(ctx, aurora, camera);
      Renderer.drawPlayer(ctx, player, camera);
      Renderer.drawHud(ctx, save);

      if (DialogueBox.isActive()) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(20, ctx.canvas.height - 100, ctx.canvas.width - 40, 80);
        ctx.fillStyle = '#fff';
        ctx.font = '16px sans-serif';
        ctx.fillText(DialogueBox.currentLine() || '', 36, ctx.canvas.height - 60);
        ctx.fillStyle = '#c9d6f2';
        ctx.font = '12px sans-serif';
        ctx.fillText('Space로 계속', 36, ctx.canvas.height - 30);
      }
    },
  };

  return { scene: scene };
})();
