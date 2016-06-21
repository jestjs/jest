class EmptySuiteError extends Error {
  constructor() {
    super();
    this.name = 'EmptySuiteError';
    this.message = 'Your test suite must contain at least one test';
  }
}

module.exports = EmptySuiteError;
