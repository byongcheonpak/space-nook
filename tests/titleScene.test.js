const test = require('node:test');
const assert = require('node:assert/strict');

global.window = global;
require('../js/save.js');
require('../js/sceneManager.js');
require('../js/input.js');
require('../js/scenes/titleScene.js');

test('decideNextScene sends fresh saves to opening', () => {
  assert.equal(TitleScene.decideNextScene(Save.getDefault()), 'opening');
});

test('decideNextScene sends completed saves straight to station', () => {
  assert.equal(TitleScene.decideNextScene({ tutorialComplete: true }), 'station');
});
