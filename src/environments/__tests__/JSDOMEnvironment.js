'use strict';

jest.autoMockOff();
const JSDOMEnvironment = require('../JSDOMEnvironment');

describe('JSDOMEnvironment', () => {
  it('uses the correct filename for stacktraces', () => {
    const env = new JSDOMEnvironment({});
    try {
      env.runSourceText('throw new Error("testerror")', 'abc.js');
    } catch (err) {
      expect(err.stack).toMatch(/Error: testerror\s+at .*abc.js:1:7/);
    }
  });
});
