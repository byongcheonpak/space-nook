// js/input.js
window.Input = (function () {
  var down = {};
  var pressedThisFrame = {};

  function reset() {
    down = {};
    pressedThisFrame = {};
  }

  function handleKeyDown(code) {
    if (!down[code]) pressedThisFrame[code] = true;
    down[code] = true;
  }

  function handleKeyUp(code) {
    down[code] = false;
  }

  function isDown(code) { return !!down[code]; }
  function wasPressed(code) { return !!pressedThisFrame[code]; }

  function endFrame() {
    pressedThisFrame = {};
  }

  function getMoveVector() {
    var dx = 0, dy = 0;
    if (isDown('ArrowLeft') || isDown('KeyA')) dx -= 1;
    if (isDown('ArrowRight') || isDown('KeyD')) dx += 1;
    if (isDown('ArrowUp') || isDown('KeyW')) dy -= 1;
    if (isDown('ArrowDown') || isDown('KeyS')) dy += 1;
    if (dx !== 0 && dy !== 0) {
      dx *= Math.SQRT1_2;
      dy *= Math.SQRT1_2;
    }
    return { dx: dx, dy: dy };
  }

  function attach(target) {
    target = target || window;
    target.addEventListener('keydown', function (e) { handleKeyDown(e.code); });
    target.addEventListener('keyup', function (e) { handleKeyUp(e.code); });
  }

  return {
    reset: reset,
    handleKeyDown: handleKeyDown,
    handleKeyUp: handleKeyUp,
    isDown: isDown,
    wasPressed: wasPressed,
    endFrame: endFrame,
    getMoveVector: getMoveVector,
    attach: attach,
  };
})();
