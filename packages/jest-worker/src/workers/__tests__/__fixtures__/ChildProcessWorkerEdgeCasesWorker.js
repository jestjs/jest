let leakStore = '';

/**
 * This exists to force a memory leak in the worker tests.
 */
function leakMemory() {
  while (true) {
    leakStore += '#'.repeat(1000);
  }
}

function safeFunction() {
  // Doesn't do anything.
}

module.exports = {
  leakMemory,
  safeFunction,
};
