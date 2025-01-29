/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {tmpdir} from 'os';
import * as path from 'path';
import * as semver from 'semver';
import {onNodeVersions} from '@jest/test-utils';
import {cleanup, writeFiles} from '../Utils';
import runJest, {getConfig} from '../runJest';

const DIR = path.resolve(tmpdir(), 'typescript-config-file');
const useNativeTypeScript = semver.satisfies(process.versions.node, '>=23.6.0');
const importFileExtension = useNativeTypeScript ? '.ts' : '';

beforeEach(() => cleanup(DIR));
afterEach(() => cleanup(DIR));

test('works with single typescript config that imports something', () => {
  writeFiles(DIR, {
    '__tests__/mytest.alpha.js': "test('alpha', () => expect(1).toBe(1));",
    '__tests__/mytest.common.js': "test('common', () => expect(1).toBe(1));",
    'alpha.config.ts': `
    import commonRegex from './common${importFileExtension}';
    export default {
      testRegex: [ commonRegex, '__tests__/mytest.alpha.js' ]
    };`,
    'common.ts': "export default '__tests__/mytest.common.js$';",
  });

  const {stdout, stderr, exitCode} = runJest(
    DIR,
    ['--projects', 'alpha.config.ts'],
    {
      skipPkgJsonCheck: true,
    },
  );

  expect(stderr).toContain('PASS __tests__/mytest.alpha.js');
  expect(stderr).toContain('PASS __tests__/mytest.common.js');
  expect(stderr).toContain('Test Suites: 2 passed, 2 total');
  expect(exitCode).toBe(0);
  expect(stdout).toBe('');
});

test('works with multiple typescript configs', () => {
  writeFiles(DIR, {
    '__tests__/mytest.alpha.js': "test('alpha', () => expect(1).toBe(1));",
    '__tests__/mytest.beta.js': "test('beta', () => expect(1).toBe(1));",
    'alpha.config.ts': `
    export default {
      testRegex: '__tests__/mytest.alpha.js'
    };`,
    'beta.config.ts': `
    export default {
      testRegex: '__tests__/mytest.beta.js'
    };`,
  });

  const {stdout, stderr, exitCode} = runJest(
    DIR,
    ['--projects', 'alpha.config.ts', 'beta.config.ts'],
    {
      skipPkgJsonCheck: true,
    },
  );

  expect(stderr).toContain('PASS __tests__/mytest.alpha.js');
  expect(stderr).toContain('PASS __tests__/mytest.beta.js');
  expect(stderr).toContain('Test Suites: 2 passed, 2 total');
  expect(exitCode).toBe(0);
  expect(stdout).toBe('');
});

test('works with multiple typescript configs that import something', () => {
  writeFiles(DIR, {
    '__tests__/mytest.alpha.js': "test('alpha', () => expect(1).toBe(1));",
    '__tests__/mytest.beta.js': "test('beta', () => expect(1).toBe(1));",
    '__tests__/mytest.common.js': "test('common', () => expect(1).toBe(1));",
    'alpha.config.ts': `
    import commonRegex from './common${importFileExtension}';
    export default {
      testRegex: [ commonRegex, '__tests__/mytest.alpha.js' ]
    };`,
    'beta.config.ts': `
    import commonRegex from './common${importFileExtension}';
    export default {
      testRegex: [ commonRegex, '__tests__/mytest.beta.js' ]
    };`,
    'common.ts': "export default '__tests__/mytest.common.js$';",
  });

  const {stdout, stderr, exitCode} = runJest(
    DIR,
    ['--projects', 'alpha.config.ts', 'beta.config.ts'],
    {
      skipPkgJsonCheck: true,
    },
  );

  expect(stderr).toContain('PASS __tests__/mytest.alpha.js');
  expect(stderr).toContain('PASS __tests__/mytest.beta.js');
  expect(stderr).toContain('PASS __tests__/mytest.common.js');
  expect(stderr.replace('PASS __tests__/mytest.common.js', '')).toContain(
    'PASS __tests__/mytest.common.js',
  );
  expect(stderr).toContain('Test Suites: 4 passed, 4 total');
  expect(exitCode).toBe(0);
  expect(stdout).toBe('');
});

onNodeVersions('<23.6', () => {
  test("works with single typescript config that does not import anything with project's moduleResolution set to Node16", () => {
    const {configs} = getConfig(
      'typescript-config/modern-module-resolution',
      [],
      {
        skipPkgJsonCheck: true,
      },
    );

    expect(configs).toHaveLength(1);
    expect(configs[0].displayName).toEqual({
      color: 'white',
      name: 'Config from modern ts file',
    });
  });
});
