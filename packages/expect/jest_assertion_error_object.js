class JestAssertionError extends Error {
  constructor(...params) {
    super(...params);
  }
}

module.exports = JestAssertionError;
