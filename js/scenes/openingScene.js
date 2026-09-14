// js/scenes/openingScene.js
window.OpeningScene = (function () {
  var OPENING_LINES = [
    '정체불명의 신호가 도착했다...',
    "실종된 삼촌(이모)이 남긴 낡은 우주 정거장, '노바 정거장'으로 오라는 신호였다.",
    '고양이는 홀로 우주선을 몰아 노바 정거장에 도착한다.',
    '정거장은 오랫동안 방치되어 있었다. 그러나 희미한 불빛과 함께, 잠들어 있던 AI 홀로그램이 깨어난다.',
    "오로라: '...어서 오세요. 저는 정거장 관리 AI, 오로라입니다.'",
    "오로라: '드디어 오셨군요. 설명할 게 많아요.'",
    '오로라: 근처 100개의 행성들이 색과 생기를 잃어가고 있어요. 그곳 생물들은 뒤틀린 몬스터로 변하고 있고요.',
    '오로라: 배후에는 은하계의 악명 높은 사업가, 네뷸라 남작이 있다고 해요.',
    '오로라: 당신의 삼촌(이모)도 이걸 막으려다 소식이 끊겼어요...',
    '오로라: 이제부터 저와 함께 정거장을 재건하고, 행성들을 구하러 가요!',
  ];

  var scene = {
    enter: function () {
      DialogueBox.show(OPENING_LINES, function () {
        SceneManager.goto('controls');
      });
    },
    update: function () {
      if (Input.wasPressed('Space')) DialogueBox.advance();
    },
    render: function (ctx) {
      ctx.fillStyle = '#0b1026';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      if (DialogueBox.isActive()) {
        Renderer.drawDialogue(ctx, DialogueBox.currentLine() || '');
      }
    },
  };

  return { OPENING_LINES: OPENING_LINES, scene: scene };
})();
