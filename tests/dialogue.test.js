const test = require('node:test');
const assert = require('node:assert/strict');

global.window = global;
require('../js/dialogue.js');

test('show activates and exposes the first line', () => {
  DialogueBox.show(['line1', 'line2']);
  assert.equal(DialogueBox.isActive(), true);
  assert.equal(DialogueBox.currentLine(), 'line1');
});

test('advance moves through lines and deactivates after the last', () => {
  DialogueBox.show(['a', 'b']);
  DialogueBox.advance();
  assert.equal(DialogueBox.isActive(), true);
  assert.equal(DialogueBox.currentLine(), 'b');
  DialogueBox.advance();
  assert.equal(DialogueBox.isActive(), false);
  assert.equal(DialogueBox.currentLine(), null);
});

test('onComplete fires exactly once when the queue finishes', () => {
  let calls = 0;
  DialogueBox.show(['only'], () => { calls += 1; });
  DialogueBox.advance();
  assert.equal(calls, 1);
  DialogueBox.advance();
  assert.equal(calls, 1);
});

test('show with an empty array is immediately inactive', () => {
  DialogueBox.show([]);
  assert.equal(DialogueBox.isActive(), false);
});
