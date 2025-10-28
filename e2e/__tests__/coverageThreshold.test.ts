/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {cleanup, extractSummary, writeFiles} from '../Utils';
import runJest from '../runJest';

const DIR = path.resolve(__dirname, '../coverage-threshold');

beforeEach(() => cleanup(DIR));
afterAll(() => cleanup(DIR));

test('exits with 1 if coverage threshold is not met', () => {
  const pkgJson = {
    jest: {
      collectCoverage: true,
      collectCoverageFrom: ['**/*.js'],
      coverageThreshold: {
        global: {
          lines: 90,
        },
      },
    },
  };

  writeFiles(DIR, {
    '__tests__/a-banana.js': `
      require('../not-covered.js');
      test('banana', () => expect(1).toBe(1));
    `,
    'not-covered.js': `
      module.exports = () => {
        return 1 + 2;
      };
    `,
    'package.json': JSON.stringify(pkgJson, null, 2),
  });

  const {stdout, stderr, exitCode} = runJest(
    DIR,
    ['--coverage', '--ci=false'],
    {stripAnsi: true},
  );
  const {rest, summary} = extractSummary(stderr);

  expect(exitCode).toBe(1);
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
  expect(stdout).toMatchSnapshot('stdout');
});

test('exits with 1 if path threshold group is not found in coverage data', () => {
  const pkgJson = {
    jest: {
      collectCoverage: true,
      collectCoverageFrom: ['**/*.js'],
      coverageThreshold: {
        'apple.js': {
          lines: 100,
        },
      },
    },
  };

  writeFiles(DIR, {
    '__tests__/banana.test.js': `
      const banana = require('../banana.js');
      test('banana', () => expect(banana()).toBe(3));
    `,
    'banana.js': `
      module.exports = () => {
        return 1 + 2;
      };
    `,
    'package.json': JSON.stringify(pkgJson, null, 2),
  });

  const {stdout, stderr, exitCode} = runJest(
    DIR,
    ['--coverage', '--ci=false'],
    {stripAnsi: true},
  );
  const {rest, summary} = extractSummary(stderr);

  expect(exitCode).toBe(1);
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
  expect(stdout).toMatchSnapshot('stdout');
});

test('exits with 0 if global threshold group is not found in coverage data', () => {
  const pkgJson = {
    jest: {
      collectCoverage: true,
      collectCoverageFrom: ['**/*.js'],
      coverageThreshold: {
        'banana.js': {
          lines: 100,
        },
        global: {
          lines: 100,
        },
      },
    },
  };

  writeFiles(DIR, {
    '__tests__/banana.test.js': `
      const banana = require('../banana.js');
      test('banana', () => expect(banana()).toBe(3));
    `,
    'banana.js': `
      module.exports = () => {
        return 1 + 2;
      };
    `,
    'package.json': JSON.stringify(pkgJson, null, 2),
  });

  const {stdout, exitCode} = runJest(DIR, ['--coverage', '--ci=false'], {
    stripAnsi: true,
  });

  expect(exitCode).toBe(0);
  expect(stdout).toMatchSnapshot('stdout');
});

test('exists with 1 if coverage threshold of the rest of non matched paths is not met', () => {
  const pkgJson = {
    jest: {
      collectCoverage: true,
      collectCoverageFrom: ['**/*.js'],
      coverageThreshold: {
        '**/*.js': {
          branches: 50,
          functions: 50,
          lines: 50,
          statements: 50,
        },
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
      testRegex: '.*\\.test\\.js$',
    },
  };
  writeFiles(DIR, {
    'package.json': JSON.stringify(pkgJson, null, 2),
    'product.js': `
      function product(a, b) {
      // let's simulate a 50% code coverage
        if (a > 0) {
          return a * b;
        } else {
          return a * b;
        }
      }

      module.exports = product;
    `,
    'product.test.js': `
      test('multiplies 2 * 3 to equal 6', () => {
        const sum = require('./product');
        expect(sum(2, 3)).toBe(6);
      });
    `,
    'sum-01.js': `
      function sum(a, b) {
        return a + b;
      }

      module.exports = sum;
    `,
    'sum-01.test.js': `
      test('adds 1 + 2 to equal 3', () => {
        const sum = require('./sum-01');
        expect(sum(1, 2)).toBe(3);
      });
    `,
    'sum-02.js': `
      function sum(a, b) {
        return a + b;
      }

      module.exports = sum;
    `,
    'sum-02.test.js': `
      test('adds 1 + 2 to equal 3', () => {
        const sum = require('./sum-02');
        expect(sum(1, 2)).toBe(3);
      });
    `,
    'sum-03.js': `
      function sum(a, b) {
        return a + b;
      }

      module.exports = sum;
    `,
    'sum-03.test.js': `
      test('adds 1 + 2 to equal 3', () => {
        const sum = require('./sum-03');
        expect(sum(1, 2)).toBe(3);
      });
    `,
    'sum-04.js': `
      function sum(a, b) {
        return a + b;
      }

      module.exports = sum;
    `,
    'sum-04.test.js': `
      test('adds 1 + 2 to equal 3', () => {
        const sum = require('./sum-04');
        expect(sum(1, 2)).toBe(3);
      });
    `,
  });

  const {stdout, stderr, exitCode} = runJest(
    DIR,
    ['--coverage', '--ci=false'],
    {stripAnsi: true},
  );
  const {summary} = extractSummary(stderr);

  expect(exitCode).toBe(1);
  expect(summary).toMatchSnapshot();
  expect(stdout).toMatchSnapshot('stdout');
});

test('exists with 1 if coverage threshold of matched paths is not met independently from global threshold', () => {
  const pkgJson = {
    jest: {
      collectCoverage: true,
      collectCoverageFrom: ['**/*.js'],
      coverageThreshold: {
        global: {
          lines: 70,
        },
        'product.js': {
          lines: 80,
        },
      },
      testRegex: '.*\\.test\\.js$',
    },
  };
  writeFiles(DIR, {
    'package.json': JSON.stringify(pkgJson, null, 2),
    'product.js': `
      function product(a, b) {
      // let's simulate a 50% code coverage
        if (a > 0) {
          return a * b;
        } else {
          return a * b;
        }
      }

      module.exports = product;
    `,
    'product.test.js': `
      test('multiplies 2 * 3 to equal 6', () => {
        const sum = require('./product');
        expect(sum(2, 3)).toBe(6);
      });
    `,
  });

  const {stdout, stderr, exitCode} = runJest(
    DIR,
    ['--coverage', '--ci=false'],
    {stripAnsi: true},
  );
  const {summary} = extractSummary(stderr);

  expect(exitCode).toBe(1);
  expect(summary).toMatchSnapshot();
  expect(stdout).toMatchSnapshot('stdout');
});

test('file is matched by all path and glob threshold groups', () => {
  const pkgJson = {
    jest: {
      collectCoverage: true,
      collectCoverageFrom: ['**/*.js'],
      coverageThreshold: {
        './': {
          lines: 100,
        },
        './ban*.js': {
          lines: 100,
        },
        './banana.js': {
          lines: 100,
        },
      },
    },
  };

  writeFiles(DIR, {
    '__tests__/banana.test.js': `
      const banana = require('../banana.js');
      test('banana', () => expect(3).toBe(3));
    `,
    'banana.js': `
      module.exports = () => {
        return 1 + 2;
      };
    `,
    'package.json': JSON.stringify(pkgJson, null, 2),
  });

  const {stdout, stderr, exitCode} = runJest(
    DIR,
    ['--coverage', '--ci=false'],
    {stripAnsi: true},
  );
  const {rest, summary} = extractSummary(
    /* This test also runs on windows and when the glob fails it outputs
    the system specific absolute path to the test file. */
    stderr.replace(
      path.resolve(DIR, './banana.js'),
      '<<FULL_PATH_TO_BANANA_JS>>',
    ),
  );

  expect(exitCode).toBe(1);
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
  expect(stdout).toMatchSnapshot('stdout');
});
