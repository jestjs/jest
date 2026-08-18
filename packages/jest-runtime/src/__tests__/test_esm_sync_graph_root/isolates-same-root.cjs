if (!globalThis.__cycleIsolationRan) {
  globalThis.__cycleIsolationRan = true;
  jest.isolateModules(() => {
    exports.isolated = require('./isolation-reentry-root.mjs');
  });
}
