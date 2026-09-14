window.DialogueBox = (function () {
  var lines = [];
  var index = 0;
  var active = false;
  var onComplete = null;

  function show(newLines, completeCallback) {
    lines = newLines.slice();
    index = 0;
    active = lines.length > 0;
    onComplete = completeCallback || null;
  }

  function advance() {
    if (!active) return;
    index += 1;
    if (index >= lines.length) {
      active = false;
      var cb = onComplete;
      onComplete = null;
      if (cb) cb();
    }
  }

  function isActive() { return active; }
  function currentLine() { return active ? lines[index] : null; }

  return { show: show, advance: advance, isActive: isActive, currentLine: currentLine };
})();
