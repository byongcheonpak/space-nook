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
