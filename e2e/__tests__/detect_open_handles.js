/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
'use strict';

const runJest = require('../runJest');

try {
  // $FlowFixMe: Node core
  require('async_hooks');
} catch (e) {
  if (e.code === 'MODULE_NOT_FOUND') {
    // eslint-disable-next-line jest/no-focused-tests
    fit('skip test for unsupported nodes', () => {
      console.warn('Skipping test for node ' + process.version);
    });
  } else {
    throw e;
  }
}

function getTextAfterTest(stderr) {
  return (stderr.split(/Ran all test suites(.*)\n/)[2] || '').trim();
}

it('prints message about flag on slow tests', async () => {
  const {stderr} = await runJest.until(
    'detect-open-handles',
    ['outside'],
    'Jest did not exit one second after the test run has completed.',
  );
  const textAfterTest = getTextAfterTest(stderr);

  expect(textAfterTest).toMatchSnapshot();
});

it('prints message about flag on forceExit', async () => {
  const {stderr} = await runJest.until(
    'detect-open-handles',
    ['outside', '--forceExit'],
    'Force exiting Jest',
  );
  const textAfterTest = getTextAfterTest(stderr);

  expect(textAfterTest).toMatchSnapshot();
});

it('prints out info about open handlers', async () => {
  const {stderr} = await runJest.until(
    'detect-open-handles',
    ['outside', '--detectOpenHandles'],
    'Jest has detected',
  );
  const textAfterTest = getTextAfterTest(stderr);

  expect(textAfterTest).toContain('Jest has detected the following');
  expect(textAfterTest).toContain(
    `
  ●  GETADDRINFOREQWRAP

      5 | const app = new http.Server();
      6 | 
    > 7 | app.listen({host: 'localhost', port: 0});
        |     ^
      8 | 

      at Object.listen (server.js:7:5)
      at Object.require (__tests__/outside.js:1:1)
`.trim(),
  );
});

it('does not report promises', () => {
  // The test here is basically that it exits cleanly without reporting anything (does not need `runJest.until`)
  const {stderr} = runJest('detect-open-handles', [
    'promise',
    '--detectOpenHandles',
  ]);
  const textAfterTest = getTextAfterTest(stderr);

  expect(textAfterTest).toBe('');
});

it('prints out info about open handlers from inside tests', async () => {
  const {stderr} = await runJest.until(
    'detect-open-handles',
    ['inside', '--detectOpenHandles'],
    'Jest has detected',
  );
  const textAfterTest = getTextAfterTest(stderr);

  expect(textAfterTest).toMatchSnapshot();
});
