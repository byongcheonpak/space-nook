# 스페이스 넉 — 오프닝 + 튜토리얼 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the playable skeleton of Space Nook up through the tutorial: title screen → opening story → controls guide → station hub with a walkable cat player and Aurora, ending in a short guided tutorial (move → talk to Aurora) that is saved to `localStorage` so it isn't replayed on reload.

**Architecture:** Pure HTML/CSS/JS, no build step, no npm dependencies. All game files are loaded via plain `<script>` tags (no ES module `import`/`export`) into a shared global namespace, because `file://` blocks ES module loading via CORS and the spec requires double-clicking `index.html` to work. Each subsystem is a self-contained global object (`window.Save`, `window.SceneManager`, etc.) exposing a small function API. Logic-heavy modules (state machines, collision math, save serialization) are pure functions with no DOM/canvas access, so they can be unit-tested under plain Node using the built-in `node:test` + `node:assert/strict` — no test framework install. DOM/canvas-dependent code (rendering, actual key listeners, scene wiring) has no automated test and is verified manually by opening `index.html` in a browser, per the steps in each task.

**Tech Stack:** Vanilla HTML5 Canvas 2D API, vanilla JS (global scripts, no modules), `localStorage`, Node.js built-in test runner (`node --test`) for logic unit tests only.

**Spec:** `docs/superpowers/specs/2026-09-13-space-nook-design.md`

## Global Constraints

- No build tools, no bundler, no npm dependencies for the game itself — `index.html` must run by double-clicking the file (`file://`).
- No ES module `import`/`export`. Every JS file attaches its API to `window` (e.g. `window.Save = (function(){...})()`) and is loaded via `<script src="...">` tags in dependency order.
- Content data (dialogue, maps) is written as JS object literals, not JSON files.
- Progress persists automatically via `localStorage` (spec: "저장은 브라우저 localStorage에 자동으로 이루어진다").
- In-game text is Korean, matching the design doc.
- Automated tests use Node's built-in `node:test` and `node:assert/strict` only, run via `node --test <file>`. They cover pure logic modules only; canvas/DOM code is verified manually (documented per-task).
- This plan's scope ends at the tutorial hand-off into station free-roam. Inventory, wardrobe, crafting, planets, combat, shop, stock, ship travel, and the fuel/gas station are explicitly out of scope for this plan (later plans) — the controls screen may *describe* them (per spec) but nothing here implements them.
- Per the updated spec, the player does **not** start with a house. Aurora's tutorial ends by narratively handing over a "집 키트" (house kit) and this plan records that as a `hasHouseKit: true` save flag, but the inventory UI and the actual place/move/upgrade-house mechanic are a separate follow-up plan — there is no pocket/inventory panel in this plan to place it from yet.
- Sprites are placeholder canvas shapes (rectangles/circles), not final pixel art — a later plan handles art.

## File Structure

```
index.html                      # canvas, loading screen markup, script tags in load order
css/style.css                   # page layout, loading screen styling
js/tilemap.js                   # station map data + collision lookup (pure)
js/save.js                      # localStorage load/write/default state (pure, storage injectable)
js/dialogue.js                  # dialogue box queue state machine (pure)
js/sceneManager.js              # scene registration/switching (pure)
js/input.js                     # keyboard state tracker + move-vector helper (pure core, DOM attach wrapper)
js/player.js                    # player entity + movement/collision (pure, depends on Tilemap)
js/aurora.js                    # Aurora NPC data + proximity check (pure)
js/stationTutorial.js           # tutorial step reducer (pure)
js/renderer.js                  # canvas drawing: tilemap, player, aurora, HUD (manual-verify)
js/scenes/titleScene.js         # title screen scene + next-scene decision (pure decision fn + manual-verify render)
js/scenes/openingScene.js       # opening narrative scene (manual-verify)
js/scenes/controlsScene.js      # controls guide scene (manual-verify)
js/scenes/stationScene.js       # station hub scene wiring tutorial flow (manual-verify)
js/game.js                      # bootstrap: canvas ctx, loading screen, scene registration, main loop
tests/save.test.js
tests/dialogue.test.js
tests/sceneManager.test.js
tests/input.test.js
tests/tilemap.test.js
tests/player.test.js
tests/aurora.test.js
tests/stationTutorial.test.js
tests/titleScene.test.js
```

Every test file starts with `global.window = global;` before `require`-ing the module under test, since the modules attach themselves to `window` and Node has no `window` — this makes `global.window === global`, so `window.Save = ...` becomes directly accessible as `Save` in the test.

---

## Task 1: Project scaffold, loading screen, and game loop

**Files:**
- Create: `index.html`
- Create: `css/style.css`
- Create: `js/game.js`

**Interfaces:**
- Produces: `index.html` with `<canvas id="game-canvas" width="640" height="480">`, `<div id="loading-screen">`, and script tags (only `js/game.js` for now — later tasks add more `<script>` tags above it in dependency order).
- Produces: `js/game.js` running a `requestAnimationFrame` loop that computes `dt` in seconds and calls a (currently empty) `update(dt)`/`render(ctx)` pair, and hides `#loading-screen` once the first frame runs.

No automated test for this task (pure DOM/canvas scaffold, no logic to unit test). Verify manually.

- [ ] **Step 1: Write `index.html`**

```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>스페이스 넉</title>
<link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div id="loading-screen">
    <div id="loading-aurora-silhouette"></div>
    <p>로딩 중...</p>
  </div>

  <div id="game-container">
    <canvas id="game-canvas" width="640" height="480"></canvas>
  </div>

  <script src="js/game.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write `css/style.css`**

```css
* { box-sizing: border-box; }

html, body {
  margin: 0;
  height: 100%;
  background: #0b1026;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: sans-serif;
  overflow: hidden;
}

#game-container {
  position: relative;
}

#game-canvas {
  background: #0b1026;
  image-rendering: pixelated;
  display: block;
}

#loading-screen {
  position: fixed;
  inset: 0;
  background: #05070f;
  color: #ffe27a;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  z-index: 100;
}

#loading-aurora-silhouette {
  width: 80px;
  height: 120px;
  border-radius: 50% 50% 40% 40%;
  background: radial-gradient(circle at 50% 35%, #7c5cff 0%, #2a1f66 70%);
  opacity: 0.85;
}

#loading-screen.hidden {
  display: none;
}
```

- [ ] **Step 3: Write `js/game.js`**

```js
(function () {
  var canvas = document.getElementById('game-canvas');
  var ctx = canvas.getContext('2d');
  var loadingScreen = document.getElementById('loading-screen');
  var lastTime = null;

  function update(dt) {
    // filled in by later tasks
  }

  function render(ctx) {
    ctx.fillStyle = '#0b1026';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function loop(timestamp) {
    if (lastTime === null) lastTime = timestamp;
    var dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    update(dt);
    render(ctx);

    if (!loadingScreen.classList.contains('hidden')) {
      loadingScreen.classList.add('hidden');
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
```

- [ ] **Step 4: Manually verify**

Open `index.html` directly in a browser (double-click the file, no server). Expected:
- Briefly see the loading screen (dark background, purple silhouette blob, "로딩 중..." text).
- It disappears within one frame, leaving a dark navy 640x480 canvas centered on the page.
- No console errors.

- [ ] **Step 5: Commit**

```bash
git add index.html css/style.css js/game.js
git commit -m "feat: add project scaffold, loading screen, and game loop"
```

---

## Task 2: Save module

**Files:**
- Create: `js/save.js`
- Test: `tests/save.test.js`

**Interfaces:**
- Produces: `window.Save.getDefault()` → `{ tutorialComplete: false, hasHouseKit: false, health: 5, gold: 0 }`
- Produces: `window.Save.load(storage?)` → merged state object (defaults + whatever is saved), reads from `storage` if given else `window.localStorage`.
- Produces: `window.Save.write(state, storage?)` → serializes `state` as JSON to `storage.setItem(Save.KEY, ...)`.
- Produces: `window.Save.KEY` → `'spaceNookSave'`.

- [ ] **Step 1: Write the failing test**

```js
// tests/save.test.js
const test = require('node:test');
const assert = require('node:assert/strict');

global.window = global;
require('../js/save.js');

function fakeStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, v),
  };
}

test('getDefault returns the default state', () => {
  assert.deepEqual(Save.getDefault(), { tutorialComplete: false, hasHouseKit: false, health: 5, gold: 0 });
});

test('load returns defaults when storage is empty', () => {
  const storage = fakeStorage();
  assert.deepEqual(Save.load(storage), Save.getDefault());
});

test('write then load round-trips saved state', () => {
  const storage = fakeStorage();
  Save.write({ tutorialComplete: true, hasHouseKit: true, health: 3, gold: 50 }, storage);
  assert.deepEqual(Save.load(storage), { tutorialComplete: true, hasHouseKit: true, health: 3, gold: 50 });
});

test('load falls back to defaults on corrupt JSON', () => {
  const storage = fakeStorage();
  storage.setItem(Save.KEY, 'not json');
  assert.deepEqual(Save.load(storage), Save.getDefault());
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/save.test.js`
Expected: FAIL — `Save is not defined` (module doesn't exist yet).

- [ ] **Step 3: Write minimal implementation**

```js
// js/save.js
window.Save = (function () {
  var KEY = 'spaceNookSave';

  function getDefault() {
    return { tutorialComplete: false, hasHouseKit: false, health: 5, gold: 0 };
  }

  function load(storage) {
    storage = storage || window.localStorage;
    var raw = storage.getItem(KEY);
    if (!raw) return getDefault();
    try {
      var parsed = JSON.parse(raw);
      return Object.assign(getDefault(), parsed);
    } catch (e) {
      return getDefault();
    }
  }

  function write(state, storage) {
    storage = storage || window.localStorage;
    storage.setItem(KEY, JSON.stringify(state));
  }

  return { KEY: KEY, getDefault: getDefault, load: load, write: write };
})();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/save.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add js/save.js tests/save.test.js
git commit -m "feat: add localStorage save module"
```

---

## Task 3: Dialogue box module

**Files:**
- Create: `js/dialogue.js`
- Test: `tests/dialogue.test.js`

**Interfaces:**
- Produces: `window.DialogueBox.show(lines: string[], onComplete?: () => void)`
- Produces: `window.DialogueBox.advance()` — moves to next line; calls `onComplete` and deactivates after the last line.
- Produces: `window.DialogueBox.isActive()` → boolean
- Produces: `window.DialogueBox.currentLine()` → string or `null` when inactive

- [ ] **Step 1: Write the failing test**

```js
// tests/dialogue.test.js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/dialogue.test.js`
Expected: FAIL — `DialogueBox is not defined`.

- [ ] **Step 3: Write minimal implementation**

```js
// js/dialogue.js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/dialogue.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add js/dialogue.js tests/dialogue.test.js
git commit -m "feat: add dialogue box queue state machine"
```

---

## Task 4: Scene manager module

**Files:**
- Create: `js/sceneManager.js`
- Test: `tests/sceneManager.test.js`

**Interfaces:**
- Produces: `window.SceneManager.register(name: string, scene: { enter?, exit?, update?, render? })`
- Produces: `window.SceneManager.goto(name: string, params?: any)` — calls previous scene's `exit()`, then new scene's `enter(params)`.
- Produces: `window.SceneManager.update(dt: number)` — delegates to current scene's `update`.
- Produces: `window.SceneManager.render(ctx)` — delegates to current scene's `render`.
- Produces: `window.SceneManager.getCurrentName()` → string or `null`.
- Produces: `window.SceneManager.reset()` — clears all registered scenes (used by tests and by nothing else).

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/sceneManager.test.js`
Expected: FAIL — `SceneManager is not defined`.

- [ ] **Step 3: Write minimal implementation**

```js
// js/sceneManager.js
window.SceneManager = (function () {
  var scenes = {};
  var current = null;
  var currentName = null;

  function reset() {
    scenes = {};
    current = null;
    currentName = null;
  }

  function register(name, scene) {
    scenes[name] = scene;
  }

  function goto(name, params) {
    var next = scenes[name];
    if (!next) throw new Error('Unknown scene: ' + name);
    if (current && typeof current.exit === 'function') current.exit();
    current = next;
    currentName = name;
    if (typeof current.enter === 'function') current.enter(params);
  }

  function update(dt) {
    if (current && typeof current.update === 'function') current.update(dt);
  }

  function render(ctx) {
    if (current && typeof current.render === 'function') current.render(ctx);
  }

  function getCurrentName() { return currentName; }

  return {
    reset: reset,
    register: register,
    goto: goto,
    update: update,
    render: render,
    getCurrentName: getCurrentName,
  };
})();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/sceneManager.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add js/sceneManager.js tests/sceneManager.test.js
git commit -m "feat: add scene manager"
```

---

## Task 5: Input module

**Files:**
- Create: `js/input.js`
- Test: `tests/input.test.js`

**Interfaces:**
- Produces: `window.Input.handleKeyDown(code: string)`, `window.Input.handleKeyUp(code: string)` — pure state updates, callable directly in tests without real DOM events.
- Produces: `window.Input.isDown(code)` → boolean
- Produces: `window.Input.wasPressed(code)` → boolean, true only on the frame the key transitioned from up to down.
- Produces: `window.Input.endFrame()` — clears the "just pressed" set; call once per game loop iteration after reading input.
- Produces: `window.Input.getMoveVector()` → `{ dx, dy }` normalized to length 1 (or 0), reading `ArrowUp/ArrowDown/ArrowLeft/ArrowRight` and `KeyW/KeyA/KeyS/KeyD`.
- Produces: `window.Input.attach(target?)` — wires real `keydown`/`keyup` DOM listeners to the handlers above (not unit tested; manual-verify).
- Produces: `window.Input.reset()` — clears all state (used by tests).

- [ ] **Step 1: Write the failing test**

```js
// tests/input.test.js
const test = require('node:test');
const assert = require('node:assert/strict');

global.window = global;
require('../js/input.js');

test('isDown reflects handleKeyDown/handleKeyUp', () => {
  Input.reset();
  assert.equal(Input.isDown('KeyW'), false);
  Input.handleKeyDown('KeyW');
  assert.equal(Input.isDown('KeyW'), true);
  Input.handleKeyUp('KeyW');
  assert.equal(Input.isDown('KeyW'), false);
});

test('wasPressed is true only on the transition frame', () => {
  Input.reset();
  Input.handleKeyDown('Space');
  assert.equal(Input.wasPressed('Space'), true);
  Input.endFrame();
  assert.equal(Input.wasPressed('Space'), false);
});

test('wasPressed does not re-trigger while held without a key-up', () => {
  Input.reset();
  Input.handleKeyDown('Space');
  Input.endFrame();
  Input.handleKeyDown('Space');
  assert.equal(Input.wasPressed('Space'), false);
});

test('getMoveVector reflects arrow and WASD keys, normalized diagonally', () => {
  Input.reset();
  assert.deepEqual(Input.getMoveVector(), { dx: 0, dy: 0 });

  Input.handleKeyDown('ArrowRight');
  assert.deepEqual(Input.getMoveVector(), { dx: 1, dy: 0 });

  Input.handleKeyDown('KeyW');
  const v = Input.getMoveVector();
  assert.ok(Math.abs(v.dx - Math.SQRT1_2) < 1e-9);
  assert.ok(Math.abs(v.dy - (-Math.SQRT1_2)) < 1e-9);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/input.test.js`
Expected: FAIL — `Input is not defined`.

- [ ] **Step 3: Write minimal implementation**

```js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/input.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add js/input.js tests/input.test.js
git commit -m "feat: add keyboard input module"
```

---

## Task 6: Tilemap module

**Files:**
- Create: `js/tilemap.js`
- Test: `tests/tilemap.test.js`

**Interfaces:**
- Produces: `window.Tilemap.TILE_SIZE` → `32`
- Produces: `window.Tilemap.stationMap` → `{ width: 20, height: 15, tiles: number[][] }`, `1` = blocked, `0` = walkable, border fully blocked.
- Produces: `window.Tilemap.isBlocked(map, tileX, tileY)` → boolean; out-of-bounds counts as blocked.

- [ ] **Step 1: Write the failing test**

```js
// tests/tilemap.test.js
const test = require('node:test');
const assert = require('node:assert/strict');

global.window = global;
require('../js/tilemap.js');

test('stationMap has the declared dimensions', () => {
  assert.equal(Tilemap.stationMap.width, 20);
  assert.equal(Tilemap.stationMap.height, 15);
  assert.equal(Tilemap.stationMap.tiles.length, 15);
  for (const row of Tilemap.stationMap.tiles) {
    assert.equal(row.length, 20);
  }
});

test('the border is fully blocked and the interior is walkable', () => {
  const map = Tilemap.stationMap;
  assert.equal(Tilemap.isBlocked(map, 0, 0), true);
  assert.equal(Tilemap.isBlocked(map, 19, 14), true);
  assert.equal(Tilemap.isBlocked(map, 10, 7), false);
});

test('out-of-bounds coordinates count as blocked', () => {
  const map = Tilemap.stationMap;
  assert.equal(Tilemap.isBlocked(map, -1, 5), true);
  assert.equal(Tilemap.isBlocked(map, 5, 999), true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/tilemap.test.js`
Expected: FAIL — `Tilemap is not defined`.

- [ ] **Step 3: Write minimal implementation**

```js
// js/tilemap.js
window.Tilemap = (function () {
  var TILE_SIZE = 32;
  var WIDTH = 20;
  var HEIGHT = 15;

  function buildStationTiles() {
    var tiles = [];
    for (var y = 0; y < HEIGHT; y++) {
      var row = [];
      for (var x = 0; x < WIDTH; x++) {
        var border = x === 0 || y === 0 || x === WIDTH - 1 || y === HEIGHT - 1;
        row.push(border ? 1 : 0);
      }
      tiles.push(row);
    }
    return tiles;
  }

  var stationMap = { width: WIDTH, height: HEIGHT, tiles: buildStationTiles() };

  function isBlocked(map, tileX, tileY) {
    if (tileX < 0 || tileY < 0 || tileX >= map.width || tileY >= map.height) return true;
    return map.tiles[tileY][tileX] === 1;
  }

  return { TILE_SIZE: TILE_SIZE, stationMap: stationMap, isBlocked: isBlocked };
})();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/tilemap.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add js/tilemap.js tests/tilemap.test.js
git commit -m "feat: add station tilemap and collision lookup"
```

---

## Task 7: Player module

**Files:**
- Create: `js/player.js`
- Test: `tests/player.test.js`
- Depends on: `js/tilemap.js` (must be loaded first)

**Interfaces:**
- Consumes: `Tilemap.TILE_SIZE`, `Tilemap.isBlocked(map, tileX, tileY)` from Task 6.
- Produces: `window.Player.create(x, y)` → `{ x, y, dir: 'down', speed: 120, moving: false }`
- Produces: `window.Player.move(player, dx, dy, dt, map)` → mutates and returns `player`; `dx`/`dy` are the normalized vector from `Input.getMoveVector()`. Sets `dir` to one of `'up'|'down'|'left'|'right'` and `moving` to `dx !== 0 || dy !== 0`. Resolves X and Y axis collisions independently against `Tilemap.isBlocked` so sliding along walls works.

- [ ] **Step 1: Write the failing test**

```js
// tests/player.test.js
const test = require('node:test');
const assert = require('node:assert/strict');

global.window = global;
require('../js/tilemap.js');
require('../js/player.js');

function openMap() {
  return { width: 5, height: 5, tiles: [
    [1,1,1,1,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,1],
  ]};
}

test('create returns a player at the given position facing down', () => {
  const p = Player.create(64, 64);
  assert.equal(p.x, 64);
  assert.equal(p.y, 64);
  assert.equal(p.dir, 'down');
  assert.equal(p.moving, false);
});

test('move updates position and facing direction in open space', () => {
  const map = openMap();
  const p = Player.create(64, 64);
  Player.move(p, 1, 0, 1, map);
  assert.ok(p.x > 64);
  assert.equal(p.y, 64);
  assert.equal(p.dir, 'right');
  assert.equal(p.moving, true);
});

test('move does not cross a blocked tile', () => {
  const map = openMap();
  // one tile size away from the right wall (tile x=3 is the last open column, wall at x=4 -> pixel 128)
  const p = Player.create(120, 64);
  for (let i = 0; i < 50; i++) Player.move(p, 1, 0, 0.1, map);
  assert.ok(p.x < 128);
});

test('move with a zero vector leaves position unchanged and moving false', () => {
  const map = openMap();
  const p = Player.create(64, 64);
  Player.move(p, 0, 0, 1, map);
  assert.equal(p.x, 64);
  assert.equal(p.y, 64);
  assert.equal(p.moving, false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/player.test.js`
Expected: FAIL — `Player is not defined`.

- [ ] **Step 3: Write minimal implementation**

```js
// js/player.js
window.Player = (function () {
  function create(x, y) {
    return { x: x, y: y, dir: 'down', speed: 120, moving: false };
  }

  function move(player, dx, dy, dt, map) {
    player.moving = dx !== 0 || dy !== 0;
    if (dx > 0) player.dir = 'right';
    else if (dx < 0) player.dir = 'left';
    else if (dy > 0) player.dir = 'down';
    else if (dy < 0) player.dir = 'up';

    var dist = player.speed * dt;
    var nx = player.x + dx * dist;
    var ny = player.y + dy * dist;
    var size = Tilemap.TILE_SIZE;

    var tileYCur = Math.floor(player.y / size);
    var tileXNew = Math.floor(nx / size);
    if (!Tilemap.isBlocked(map, tileXNew, tileYCur)) {
      player.x = nx;
    }

    var tileXCur = Math.floor(player.x / size);
    var tileYNew = Math.floor(ny / size);
    if (!Tilemap.isBlocked(map, tileXCur, tileYNew)) {
      player.y = ny;
    }

    return player;
  }

  return { create: create, move: move };
})();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/player.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add js/player.js tests/player.test.js
git commit -m "feat: add player entity with tile collision"
```

---

## Task 8: Aurora module

**Files:**
- Create: `js/aurora.js`
- Test: `tests/aurora.test.js`

**Interfaces:**
- Produces: `window.Aurora.create(x, y)` → `{ x, y }`
- Produces: `window.Aurora.isPlayerNear(player, aurora, radius)` → boolean (Euclidean distance check).
- Produces: `window.Aurora.TUTORIAL_LINES` → `string[]` (Aurora's tutorial dialogue, see Task 13 for full opening/tutorial copy).

- [ ] **Step 1: Write the failing test**

```js
// tests/aurora.test.js
const test = require('node:test');
const assert = require('node:assert/strict');

global.window = global;
require('../js/aurora.js');

test('create returns an aurora at the given position', () => {
  const a = Aurora.create(100, 200);
  assert.deepEqual(a, { x: 100, y: 200 });
});

test('isPlayerNear is true within radius and false outside it', () => {
  const a = Aurora.create(0, 0);
  const near = { x: 10, y: 0 };
  const far = { x: 1000, y: 0 };
  assert.equal(Aurora.isPlayerNear(near, a, 40), true);
  assert.equal(Aurora.isPlayerNear(far, a, 40), false);
});

test('isPlayerNear treats the boundary as near (<=)', () => {
  const a = Aurora.create(0, 0);
  const onEdge = { x: 40, y: 0 };
  assert.equal(Aurora.isPlayerNear(onEdge, a, 40), true);
});

test('TUTORIAL_LINES is a non-empty array of strings', () => {
  assert.ok(Array.isArray(Aurora.TUTORIAL_LINES));
  assert.ok(Aurora.TUTORIAL_LINES.length > 0);
  for (const line of Aurora.TUTORIAL_LINES) assert.equal(typeof line, 'string');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/aurora.test.js`
Expected: FAIL — `Aurora is not defined`.

- [ ] **Step 3: Write minimal implementation**

```js
// js/aurora.js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/aurora.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add js/aurora.js tests/aurora.test.js
git commit -m "feat: add Aurora NPC data and proximity check"
```

---

## Task 9: Station tutorial reducer

**Files:**
- Create: `js/stationTutorial.js`
- Test: `tests/stationTutorial.test.js`

**Interfaces:**
- Produces: `window.StationTutorial.STEPS` → `{ MOVE: 'move', SEEK_AURORA: 'seek_aurora', TALKING: 'talking', DONE: 'done' }`
- Produces: `window.StationTutorial.initialStep(tutorialComplete: boolean)` → `STEPS.DONE` if `tutorialComplete`, else `STEPS.MOVE`.
- Produces: `window.StationTutorial.onPlayerMoved(step)` → advances `MOVE` → `SEEK_AURORA`; otherwise unchanged.
- Produces: `window.StationTutorial.onInteractPressed(step, nearAurora: boolean)` → advances `SEEK_AURORA` → `TALKING` only if `nearAurora`; otherwise unchanged.
- Produces: `window.StationTutorial.onDialogueComplete(step)` → advances `TALKING` → `DONE`; otherwise unchanged.

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/stationTutorial.test.js`
Expected: FAIL — `StationTutorial is not defined`.

- [ ] **Step 3: Write minimal implementation**

```js
// js/stationTutorial.js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/stationTutorial.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add js/stationTutorial.js tests/stationTutorial.test.js
git commit -m "feat: add station tutorial step reducer"
```

---

## Task 10: Renderer module

**Files:**
- Create: `js/renderer.js`
- Modify: `index.html` (add `<script src="js/tilemap.js">` ... through `<script src="js/renderer.js">` before `js/game.js`, in the dependency order from the File Structure section)

**Interfaces:**
- Consumes: `Tilemap.TILE_SIZE`, `Tilemap.isBlocked` (types from Task 6); `player`/`aurora` shape from Tasks 7–8.
- Produces: `window.Renderer.computeCamera(player, canvasWidth, canvasHeight, map)` → `{ x, y }` top-left camera offset in pixels, clamped so the map never shows outside its bounds.
- Produces: `window.Renderer.drawTilemap(ctx, map, camera)`
- Produces: `window.Renderer.drawPlayer(ctx, player, camera)` — placeholder: orange rounded rectangle body + small triangle indicating `dir`.
- Produces: `window.Renderer.drawAurora(ctx, aurora, camera)` — placeholder: translucent purple circle.
- Produces: `window.Renderer.drawHud(ctx, state)` — 5 heart icons (filled/empty based on `state.health`) top-left, gold amount top-right, drawn directly on canvas.

No automated test (canvas drawing). Verify manually.

- [ ] **Step 1: Write `js/renderer.js`**

```js
// js/renderer.js
window.Renderer = (function () {
  function computeCamera(player, canvasWidth, canvasHeight, map) {
    var mapPxW = map.width * Tilemap.TILE_SIZE;
    var mapPxH = map.height * Tilemap.TILE_SIZE;
    var x = player.x - canvasWidth / 2;
    var y = player.y - canvasHeight / 2;
    x = Math.max(0, Math.min(x, Math.max(0, mapPxW - canvasWidth)));
    y = Math.max(0, Math.min(y, Math.max(0, mapPxH - canvasHeight)));
    return { x: x, y: y };
  }

  function drawTilemap(ctx, map, camera) {
    var size = Tilemap.TILE_SIZE;
    for (var ty = 0; ty < map.height; ty++) {
      for (var tx = 0; tx < map.width; tx++) {
        var blocked = map.tiles[ty][tx] === 1;
        ctx.fillStyle = blocked ? '#3a2b52' : '#1c1440';
        ctx.fillRect(tx * size - camera.x, ty * size - camera.y, size, size);
      }
    }
  }

  function drawPlayer(ctx, player, camera) {
    var sx = player.x - camera.x;
    var sy = player.y - camera.y;
    ctx.fillStyle = '#ff9f6b';
    ctx.beginPath();
    ctx.roundRect(sx - 10, sy - 10, 20, 20, 4);
    ctx.fill();

    ctx.fillStyle = '#fff';
    var tip = { up: [0, -14], down: [0, 14], left: [-14, 0], right: [14, 0] }[player.dir];
    ctx.beginPath();
    ctx.arc(sx + tip[0], sy + tip[1], 3, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawAurora(ctx, aurora, camera) {
    var sx = aurora.x - camera.x;
    var sy = aurora.y - camera.y;
    ctx.fillStyle = 'rgba(124, 92, 255, 0.75)';
    ctx.beginPath();
    ctx.arc(sx, sy, 16, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawHud(ctx, state) {
    var i;
    for (i = 0; i < 5; i++) {
      ctx.fillStyle = i < state.health ? '#ff6b6b' : 'rgba(255,255,255,0.2)';
      ctx.beginPath();
      ctx.arc(16 + i * 18, 16, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffe27a';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('올돈: ' + state.gold, ctx.canvas.width - 12, 22);
    ctx.textAlign = 'left';
  }

  return {
    computeCamera: computeCamera,
    drawTilemap: drawTilemap,
    drawPlayer: drawPlayer,
    drawAurora: drawAurora,
    drawHud: drawHud,
  };
})();
```

- [ ] **Step 2: Add script tags to `index.html`**

Replace the single `<script src="js/game.js"></script>` line with, in this order:

```html
<script src="js/tilemap.js"></script>
<script src="js/save.js"></script>
<script src="js/dialogue.js"></script>
<script src="js/sceneManager.js"></script>
<script src="js/input.js"></script>
<script src="js/player.js"></script>
<script src="js/aurora.js"></script>
<script src="js/stationTutorial.js"></script>
<script src="js/renderer.js"></script>
<script src="js/game.js"></script>
```

- [ ] **Step 3: Manually verify**

Open `index.html`. Expected: still just the dark canvas (nothing calls `Renderer` yet), no console errors — this confirms all 9 scripts load and initialize without throwing.

- [ ] **Step 4: Commit**

```bash
git add js/renderer.js index.html
git commit -m "feat: add canvas renderer for tilemap, player, aurora, and hud"
```

---

## Task 11: Title scene

**Files:**
- Create: `js/scenes/titleScene.js`
- Test: `tests/titleScene.test.js`
- Modify: `index.html` (add `<script src="js/scenes/titleScene.js"></script>` before `js/game.js`)

**Interfaces:**
- Consumes: `Save` (Task 2).
- Produces: `window.TitleScene.decideNextScene(save)` → `'station'` if `save.tutorialComplete`, else `'opening'` (pure, tested).
- Produces: `window.TitleScene.scene` → `{ enter, exit, update, render }` object for `SceneManager.register('title', TitleScene.scene)`. `update` checks `Input.wasPressed('Space')` or `Input.wasPressed('Enter')`; on press, calls `SceneManager.goto(TitleScene.decideNextScene(Save.load()))`. `render` draws a starfield-simple background and the title text "스페이스 넉" plus "Space/Enter로 시작" prompt.

- [ ] **Step 1: Write the failing test**

```js
// tests/titleScene.test.js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/titleScene.test.js`
Expected: FAIL — `TitleScene is not defined`.

- [ ] **Step 3: Write minimal implementation**

```js
// js/scenes/titleScene.js
window.TitleScene = (function () {
  function decideNextScene(save) {
    return save && save.tutorialComplete ? 'station' : 'opening';
  }

  var scene = {
    update: function () {
      if (Input.wasPressed('Space') || Input.wasPressed('Enter')) {
        SceneManager.goto(decideNextScene(Save.load()));
      }
    },
    render: function (ctx) {
      ctx.fillStyle = '#0b1026';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      ctx.fillStyle = '#ffe27a';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('스페이스 넉', ctx.canvas.width / 2, ctx.canvas.height / 2 - 10);

      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#c9d6f2';
      ctx.fillText('Space 또는 Enter로 시작', ctx.canvas.width / 2, ctx.canvas.height / 2 + 30);
      ctx.textAlign = 'left';
    },
  };

  return { decideNextScene: decideNextScene, scene: scene };
})();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/titleScene.test.js`
Expected: PASS (2 tests).

- [ ] **Step 5: Add the script tag to `index.html`**

Insert `<script src="js/scenes/titleScene.js"></script>` immediately before `<script src="js/game.js"></script>`.

- [ ] **Step 6: Manually verify**

Open `index.html`. `TitleScene` is defined but not yet registered/started (Task 14 wires the boot sequence) — confirm no console errors after adding the script tag.

- [ ] **Step 7: Commit**

```bash
git add js/scenes/titleScene.js tests/titleScene.test.js index.html
git commit -m "feat: add title scene"
```

---

## Task 12: Opening and controls scenes

**Files:**
- Create: `js/scenes/openingScene.js`
- Create: `js/scenes/controlsScene.js`
- Modify: `index.html` (add both script tags before `js/game.js`)

**Interfaces:**
- Consumes: `DialogueBox` (Task 3), `SceneManager` (Task 4), `Input` (Task 5).
- Produces: `window.OpeningScene.scene` — on `enter`, calls `DialogueBox.show(OPENING_LINES, () => SceneManager.goto('controls'))`. `update` calls `DialogueBox.advance()` on `Input.wasPressed('Space')`. `render` draws a plain dark background plus the current `DialogueBox.currentLine()` in a text box at the bottom.
- Produces: `window.OpeningScene.OPENING_LINES` → the story lines below.
- Produces: `window.ControlsScene.scene` — `render` draws a static list of controls; `update` goes to `'stationTutorialEntry'` conceptually but per this plan's scope goes directly to `SceneManager.goto('station')` on `Input.wasPressed('Space')` (the station scene itself decides tutorial vs. free-roam via `StationTutorial.initialStep`, see Task 13).

No automated test (dialogue sequencing here is just `DialogueBox`, already tested in Task 3; these scenes are pure DOM/canvas wiring). Verify manually.

- [ ] **Step 1: Write `js/scenes/openingScene.js`**

```js
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

      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(20, ctx.canvas.height - 100, ctx.canvas.width - 40, 80);

      ctx.fillStyle = '#fff';
      ctx.font = '16px sans-serif';
      ctx.fillText(DialogueBox.currentLine() || '', 36, ctx.canvas.height - 60);

      ctx.fillStyle = '#c9d6f2';
      ctx.font = '12px sans-serif';
      ctx.fillText('Space로 계속', 36, ctx.canvas.height - 30);
    },
  };

  return { OPENING_LINES: OPENING_LINES, scene: scene };
})();
```

- [ ] **Step 2: Write `js/scenes/controlsScene.js`**

```js
// js/scenes/controlsScene.js
window.ControlsScene = (function () {
  var CONTROL_ROWS = [
    ['이동', '방향키 또는 W/A/S/D'],
    ['상호작용 / 채집 / 전투', 'Space'],
    ['주머니 열기', '추후 시스템 준비 중'],
    ['옷 갈아입기', '추후 시스템 준비 중'],
    ['우주선 조종', '추후 시스템 준비 중'],
  ];

  var scene = {
    update: function () {
      if (Input.wasPressed('Space')) SceneManager.goto('station');
    },
    render: function (ctx) {
      ctx.fillStyle = '#0b1026';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      ctx.fillStyle = '#ffe27a';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('조작법', 40, 50);

      ctx.font = '14px sans-serif';
      CONTROL_ROWS.forEach(function (row, i) {
        var y = 90 + i * 30;
        ctx.fillStyle = '#fff';
        ctx.fillText(row[0], 40, y);
        ctx.fillStyle = '#c9d6f2';
        ctx.fillText(row[1], 260, y);
      });

      ctx.fillStyle = '#c9d6f2';
      ctx.font = '12px sans-serif';
      ctx.fillText('Space로 계속', 40, ctx.canvas.height - 30);
    },
  };

  return { CONTROL_ROWS: CONTROL_ROWS, scene: scene };
})();
```

- [ ] **Step 3: Add script tags to `index.html`**

Insert both, after `titleScene.js` and before `js/game.js`:

```html
<script src="js/scenes/openingScene.js"></script>
<script src="js/scenes/controlsScene.js"></script>
```

- [ ] **Step 4: Manually verify**

Open `index.html`. Confirm no console errors after adding the two script tags (scenes aren't wired to `SceneManager` until Task 14, so nothing visible changes yet).

- [ ] **Step 5: Commit**

```bash
git add js/scenes/openingScene.js js/scenes/controlsScene.js index.html
git commit -m "feat: add opening story and controls guide scenes"
```

---

## Task 13: Station scene

**Files:**
- Create: `js/scenes/stationScene.js`
- Modify: `index.html` (add script tag before `js/game.js`)

**Interfaces:**
- Consumes: `Tilemap`, `Player`, `Aurora`, `StationTutorial`, `DialogueBox`, `Renderer`, `Input`, `Save`, `SceneManager`.
- Produces: `window.StationScene.scene` — on `enter`: loads `Save.load()`, creates `player = Player.create(320, 300)` (bottom-ish of the open interior) and `aurora = Aurora.create(320, 150)` (near top), sets `tutorialStep = StationTutorial.initialStep(save.tutorialComplete)`, and if the step is not `DONE`, kicks off `DialogueBox.show(['오로라: 방향키나 W/A/S/D로 움직여서 저에게 와 보세요!'])`.
- `update(dt)`: if `DialogueBox.isActive()`, only handles `Input.wasPressed('Space')` → `DialogueBox.advance()` and, when the dialogue that just closed was the Aurora tutorial line, calls `StationTutorial.onDialogueComplete` and `Save.write`. Otherwise reads `Input.getMoveVector()`, calls `Player.move`, and on the first movement while `tutorialStep === MOVE` calls `StationTutorial.onPlayerMoved` and shows the "가서 말을 걸어보세요" follow-up line only once (guard with a local flag). When `Input.wasPressed('Space')` and `tutorialStep === SEEK_AURORA` and `Aurora.isPlayerNear(player, aurora, 40)`, transitions to `TALKING` via `StationTutorial.onInteractPressed` and shows `Aurora.TUTORIAL_LINES` with an `onComplete` that sets `tutorialStep = StationTutorial.onDialogueComplete(tutorialStep)` and persists `Save.write(Object.assign(Save.load(), { tutorialComplete: true }))`.
- `render(ctx)`: computes camera via `Renderer.computeCamera`, draws tilemap, aurora, player (player last if overlapping), then `Renderer.drawHud`, then draws the active dialogue line (reuse the box styling from Task 12) if `DialogueBox.isActive()`.

This task is DOM/canvas + multi-module wiring with no new pure logic (all branching already lives in tested `StationTutorial`/`DialogueBox`/`Player`/`Aurora`). No automated test; verify manually end-to-end.

- [ ] **Step 1: Write `js/scenes/stationScene.js`**

```js
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
```

- [ ] **Step 2: Add the script tag to `index.html`**

Insert `<script src="js/scenes/stationScene.js"></script>` after `controlsScene.js` and before `js/game.js`.

- [ ] **Step 3: Manually verify**

Open `index.html`. Confirm no console errors after adding the script tag (not yet reachable — Task 14 wires the full boot flow).

- [ ] **Step 4: Commit**

```bash
git add js/scenes/stationScene.js index.html
git commit -m "feat: add station hub scene with guided tutorial flow"
```

---

## Task 14: Wire the full boot flow in game.js

**Files:**
- Modify: `js/game.js`

**Interfaces:**
- Produces: on load, `game.js` calls `Input.attach(window)`, registers all five scenes (`title`, `opening`, `controls`, `station`) with `SceneManager`, calls `SceneManager.goto('title')`, and the loop calls `Input.endFrame()` after `SceneManager.update(dt)` each frame (so `wasPressed` only fires once per press).

No automated test (top-level wiring). Verify manually with the full end-to-end flow below.

- [ ] **Step 1: Rewrite `js/game.js`**

```js
// js/game.js
(function () {
  var canvas = document.getElementById('game-canvas');
  var ctx = canvas.getContext('2d');
  var loadingScreen = document.getElementById('loading-screen');
  var lastTime = null;

  Input.attach(window);

  SceneManager.register('title', TitleScene.scene);
  SceneManager.register('opening', OpeningScene.scene);
  SceneManager.register('controls', ControlsScene.scene);
  SceneManager.register('station', StationScene.scene);
  SceneManager.goto('title');

  function loop(timestamp) {
    if (lastTime === null) lastTime = timestamp;
    var dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    SceneManager.update(dt);
    SceneManager.render(ctx);
    Input.endFrame();

    if (!loadingScreen.classList.contains('hidden')) {
      loadingScreen.classList.add('hidden');
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
```

- [ ] **Step 2: Manually verify the full flow**

Open `index.html` fresh (clear site data / use a private window first, since `localStorage` persists between runs):
1. Loading screen flashes, then the title screen shows "스페이스 넉" and "Space 또는 Enter로 시작".
2. Press Space → opening story lines appear one at a time in the bottom text box; pressing Space advances each line.
3. After the last line, the controls screen appears listing 이동/상호작용/주머니/옷/우주선 rows; press Space.
4. Station hub appears: navy tile floor, purple Aurora circle near the top, orange player square near the bottom, 5 red hearts top-left, "올돈: 0" top-right, and Aurora's first dialogue line ("방향키나 W/A/S/D로 움직여서...").
5. Press Space to dismiss it, then move with arrow keys/WASD — the player square moves and is blocked by the border walls. After the first movement, a new line appears prompting you to approach Aurora and press Space.
6. Walk next to the Aurora circle and press Space — Aurora's 5-line tutorial dialogue plays (ending with the house kit hand-off lines); advance through it with Space.
7. After the last line, dialogue closes and free movement continues with no further prompts.
8. Reload the page (`F5`): title screen appears again, but pressing Space this time skips straight to the station hub with no dialogue (because `Save.tutorialComplete` is now `true` in `localStorage`; `Save.hasHouseKit` is also `true`, ready for the follow-up plan's inventory/placement work).

If any step diverges, fix the relevant scene/module before committing.

- [ ] **Step 3: Run the full automated test suite one more time**

Run: `node --test tests/`
Expected: all tests across all 9 test files PASS.

- [ ] **Step 4: Commit**

```bash
git add js/game.js
git commit -m "feat: wire title, opening, controls, and station scenes into the boot flow"
```

---

## Self-Review Notes

- **Spec coverage:** title → opening story (고양이 주인공 고정, 오로라 등장, 세계관 요약) → 조작법 안내 (이동/상호작용/채집/전투/주머니/옷/우주선 항목 모두 나열) → 오로라 튜토리얼 미션 (이동 후 대화, 집 키트 전달) → 정거장 자유 이동, 체력 5칸/올돈 HUD 상시 표시, 로딩 화면(오로라 실루엣 + "로딩 중..."), localStorage 자동 저장 — all covered. Systems explicitly out of scope (상점/박물관/휴식공간/제작대/우주선 이동/전투/주식/옷장/주머니 패널 UI/집 키트 배치·이동·업그레이드/우주선 주유소/행성 주민 미션) are deferred to later plans per the Global Constraints and the user's chosen scope — this plan only records `Save.hasHouseKit = true` as the hook for the next plan to build on.
- **Placeholder scan:** no TBD/TODO markers; every step has runnable code or a concrete manual-verification script.
- **Type consistency:** `player` is always `{x, y, dir, speed, moving}` (Task 7) and is passed unchanged into `Renderer.drawPlayer`, `Aurora.isPlayerNear`, `StationTutorial.onPlayerMoved` gating. `map` is always `Tilemap.stationMap`'s `{width, height, tiles}` shape. `save` is always `Save`'s `{tutorialComplete, health, gold}` shape, consumed identically by `Renderer.drawHud` and `StationScene`.

---

**Plan complete and saved to `docs/superpowers/plans/2026-09-13-space-nook-opening-tutorial.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach?**
