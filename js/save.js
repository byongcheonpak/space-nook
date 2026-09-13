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
