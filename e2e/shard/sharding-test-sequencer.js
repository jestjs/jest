module.exports = class NoShardingSequencer {
  shard(tests) {
    return [tests[2]];
  }
  sort(tests) {
    return tests;
  }
};
