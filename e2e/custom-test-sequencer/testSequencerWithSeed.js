const Sequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends Sequencer {
  sort(tests) {
    const copyTests = Array.from(tests);
    const seed = this.globalConfig.seed;
    const sortedTests = copyTests.sort((testA, testB) =>
      testA.path > testB.path ? 1 : -1,
    );

    if (seed % 2 === 0) {
      return sortedTests;
    } else {
      return sortedTests.reverse();
    }
  }
}

module.exports = CustomSequencer;
