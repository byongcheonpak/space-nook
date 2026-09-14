window.Aurora = (function () {
  function create(x, y) {
    return { x: x, y: y };
  }

  function isPlayerNear(player, aurora, radius) {
    var dx = player.x - aurora.x;
    var dy = player.y - aurora.y;
    return Math.sqrt(dx * dx + dy * dy) <= radius;
  }

  var TUTORIAL_LINES = [
    '오로라: 잘 오셨어요! 방금처럼 방향키나 WASD로 자유롭게 움직일 수 있어요.',
    '오로라: 차차 상점도, 제작대도, 우주선도 준비해 나갈 거예요.',
    '오로라: 아, 그리고 당신은 아직 집이 없죠. 여기 집 키트를 드릴게요.',
    '오로라: 나중에 주머니를 열어서 원하는 자리에 직접 설치할 수 있어요. 위치는 언제든 다시 옮길 수 있으니 편하게 골라보세요.',
    '오로라: 준비되면 편하게 정거장을 둘러보세요!',
  ];

  return { create: create, isPlayerNear: isPlayerNear, TUTORIAL_LINES: TUTORIAL_LINES };
})();
