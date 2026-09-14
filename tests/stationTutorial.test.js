// tests/stationTutorial.test.js
const test = require('node:test');
const assert = require('node:assert/strict');

global.window = global;
require('../js/stationTutorial.js');

test('initialStep depends on tutorialComplete', () => {
  assert.equal(StationTutorial.initialStep(false), StationTutorial.STEPS.MOVE);
  assert.equal(StationTutorial.initialStep(true), StationTutorial.STEPS.DONE);
});

test('onPlayerMoved advances MOVE to SEEK_AURORA and nothing else', () => {
  assert.equal(StationTutorial.onPlayerMoved(StationTutorial.STEPS.MOVE), StationTutorial.STEPS.SEEK_AURORA);
  assert.equal(StationTutorial.onPlayerMoved(StationTutorial.STEPS.DONE), StationTutorial.STEPS.DONE);
});

test('onInteractPressed advances SEEK_AURORA to TALKING only when near', () => {
  const step = StationTutorial.STEPS.SEEK_AURORA;
  assert.equal(StationTutorial.onInteractPressed(step, true), StationTutorial.STEPS.TALKING);
  assert.equal(StationTutorial.onInteractPressed(step, false), StationTutorial.STEPS.SEEK_AURORA);
});

test('onDialogueComplete advances TALKING to DONE and nothing else', () => {
  assert.equal(StationTutorial.onDialogueComplete(StationTutorial.STEPS.TALKING), StationTutorial.STEPS.DONE);
  assert.equal(StationTutorial.onDialogueComplete(StationTutorial.STEPS.MOVE), StationTutorial.STEPS.MOVE);
});
