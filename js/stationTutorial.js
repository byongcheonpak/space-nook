window.StationTutorial = (function () {
  var STEPS = { MOVE: 'move', SEEK_AURORA: 'seek_aurora', TALKING: 'talking', DONE: 'done' };

  function initialStep(tutorialComplete) {
    return tutorialComplete ? STEPS.DONE : STEPS.MOVE;
  }

  function onPlayerMoved(step) {
    return step === STEPS.MOVE ? STEPS.SEEK_AURORA : step;
  }

  function onInteractPressed(step, nearAurora) {
    if (step === STEPS.SEEK_AURORA && nearAurora) return STEPS.TALKING;
    return step;
  }

  function onDialogueComplete(step) {
    return step === STEPS.TALKING ? STEPS.DONE : step;
  }

  return {
    STEPS: STEPS,
    initialStep: initialStep,
    onPlayerMoved: onPlayerMoved,
    onInteractPressed: onInteractPressed,
    onDialogueComplete: onDialogueComplete,
  };
})();
