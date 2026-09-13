// tests/sceneManager.test.js
const test = require('node:test');
const assert = require('node:assert/strict');

global.window = global;
require('../js/sceneManager.js');

test('goto calls exit on the old scene and enter on the new one', () => {
  SceneManager.reset();
  const events = [];
  SceneManager.register('a', {
    enter: () => events.push('a-enter'),
    exit: () => events.push('a-exit'),
  });
  SceneManager.register('b', { enter: (p) => events.push('b-enter:' + p) });

  SceneManager.goto('a');
  SceneManager.goto('b', 42);

  assert.deepEqual(events, ['a-enter', 'a-exit', 'b-enter:42']);
  assert.equal(SceneManager.getCurrentName(), 'b');
});

test('update and render delegate to the current scene', () => {
  SceneManager.reset();
  let updated = null;
  let rendered = null;
  SceneManager.register('x', {
    update: (dt) => { updated = dt; },
    render: (ctx) => { rendered = ctx; },
  });
  SceneManager.goto('x');
  SceneManager.update(0.016);
  SceneManager.render('fake-ctx');
  assert.equal(updated, 0.016);
  assert.equal(rendered, 'fake-ctx');
});

test('goto throws for an unregistered scene name', () => {
  SceneManager.reset();
  assert.throws(() => SceneManager.goto('missing'));
});
