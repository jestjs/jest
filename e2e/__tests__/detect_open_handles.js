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
  return stderr.split('Ran all test suites.')[1].trim();
}

it('prints message about flag on slow tests', async () => {
  const {stderr} = await runJest.until(
    'detect-open-handles',
    [],
    'Jest did not exit one second after the test run has completed.',
  );
  const textAfterTest = getTextAfterTest(stderr);

  expect(textAfterTest).toMatchSnapshot();
});

it('prints message about flag on forceExit', async () => {
  const {stderr} = await runJest.until(
    'detect-open-handles',
    ['--forceExit'],
    'Force exiting Jest',
  );
  const textAfterTest = getTextAfterTest(stderr);

  expect(textAfterTest).toMatchSnapshot();
});

it('prints out info about open handlers', async () => {
  const {stderr} = await runJest.until(
    'detect-open-handles',
    ['--detectOpenHandles'],
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

      at Object.<anonymous> (server.js:7:5)
      at Object.<anonymous> (__tests__/test.js:1:1)
`.trim(),
  );
});
