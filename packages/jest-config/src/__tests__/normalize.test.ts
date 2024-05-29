/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {createHash} from 'crypto';
import * as path from 'path';
import semver = require('semver');
import type {Config} from '@jest/types';
import {escapeStrForRegex} from 'jest-regex-util';
import Defaults from '../Defaults';
import {DEFAULT_JS_PATTERN} from '../constants';
import normalize, {type AllOptions} from '../normalize';

const DEFAULT_CSS_PATTERN = '\\.(css)$';

jest
  .mock('path', () => jest.requireActual<typeof import('path')>('path').posix)
  .mock('graceful-fs', () => {
    const realFs = jest.requireActual<typeof import('fs')>('fs');

    return {
      ...realFs,
      statSync: () => ({isDirectory: () => true}),
    };
  });

let root: string;
let expectedPathFooBar: string;
let expectedPathFooQux: string;
let expectedPathAbs: string;
let expectedPathAbsAnother: string;

let virtualModuleRegexes: Array<RegExp>;
beforeEach(() => {
  virtualModuleRegexes = [/jest-circus/, /babel-jest/];
});
const findNodeModule = jest.fn((name: string) => {
  if (virtualModuleRegexes.some(regex => regex.test(name))) {
    return name;
  }
  return null;
});

// Windows uses backslashes for path separators, which need to be escaped in
// regular expressions. This little helper function helps us generate the
// expected strings for checking path patterns.
function joinForPattern(...args: Array<string>) {
  return args.join(escapeStrForRegex(path.sep));
}

beforeEach(() => {
  root = path.resolve('/');
  expectedPathFooBar = path.join(root, 'root', 'path', 'foo', 'bar', 'baz');
  expectedPathFooQux = path.join(root, 'root', 'path', 'foo', 'qux', 'quux');
  expectedPathAbs = path.join(root, 'an', 'abs', 'path');
  expectedPathAbsAnother = path.join(root, 'another', 'abs', 'path');

  (
    require('jest-resolve') as typeof import('jest-resolve')
  ).default.findNodeModule = findNodeModule;

  jest.spyOn(console, 'warn');
});

afterEach(() => {
  jest.mocked(console.warn).mockRestore();
});

it('picks an id based on the rootDir', async () => {
  const rootDir = '/root/path/foo';
  const expected = createHash('sha1')
    .update('/root/path/foo')
    .update(String(Number.POSITIVE_INFINITY))
    .digest('hex')
    .slice(0, 32);
  const {options} = await normalize(
    {
      rootDir,
    },
    {} as Config.Argv,
  );
  expect(options.id).toBe(expected);
});

it('keeps custom project id based on the projects rootDir', async () => {
  const id = 'test';
  const {options} = await normalize(
    {
      projects: [{id, rootDir: '/path/to/foo'}],
      rootDir: '/root/path/baz',
    },
    {} as Config.Argv,
  );

  expect((options.projects as Array<Config.InitialProjectOptions>)[0].id).toBe(
    id,
  );
});

it('validation warning occurs when options not for projects is set', async () => {
  const mockWarn = jest.mocked(console.warn).mockImplementation(() => {});
  const rootDir = '/root/path/foo';
  await normalize(
    {
      bail: true, // an option not for projects
      rootDir,
    },
    {} as Config.Argv,
    rootDir,
    1,
    true, // isProjectOptions
  );

  expect(mockWarn).toHaveBeenCalledTimes(1);
});

it('keeps custom ids based on the rootDir', async () => {
  const {options} = await normalize(
    {
      id: 'custom-id',
      rootDir: '/root/path/foo',
    },
    {} as Config.Argv,
  );

  expect(options.id).toBe('custom-id');
});

it('minimal config is stable across runs', async () => {
  const firstNormalization = await normalize({rootDir: '/root/path/foo'}, {
    seed: 55_555,
  } as Config.Argv);
  const secondNormalization = await normalize({rootDir: '/root/path/foo'}, {
    seed: 55_555,
  } as Config.Argv);

  expect(firstNormalization).toEqual(secondNormalization);
  expect(JSON.stringify(firstNormalization)).toBe(
    JSON.stringify(secondNormalization),
  );
});

it('sets coverageReporters correctly when argv.json is set', async () => {
  const {options} = await normalize(
    {
      rootDir: '/root/path/foo',
    },
    {
      json: true,
    } as Config.Argv,
  );

  expect(options.coverageReporters).toEqual(['json', 'lcov', 'clover']);
});

describe('rootDir', () => {
  it('throws if the options is missing a rootDir property', async () => {
    expect.assertions(1);

    await expect(
      normalize({}, {} as Config.Argv),
    ).rejects.toThrowErrorMatchingSnapshot();
  });
});

describe('automock', () => {
  it('falsy automock is not overwritten', async () => {
    jest.mocked(console.warn).mockImplementation(() => {});
    const {options} = await normalize(
      {
        automock: false,
        rootDir: '/root/path/foo',
      },
      {} as Config.Argv,
    );

    expect(options.automock).toBe(false);
  });
});

describe('collectCoverageFrom', () => {
  it('ignores <rootDir> tokens', async () => {
    const barBaz = 'bar/baz';
    const quxQuux = 'qux/quux/';
    const notQuxQuux = `!${quxQuux}`;

    const {options} = await normalize(
      {
        collectCoverageFrom: [
          barBaz,
          notQuxQuux,
          `<rootDir>/${barBaz}`,
          `!<rootDir>/${quxQuux}`,
        ],
        rootDir: '/root/path/foo/',
      },
      {} as Config.Argv,
    );

    const expected = [barBaz, notQuxQuux, barBaz, notQuxQuux];

    expect(options.collectCoverageFrom).toEqual(expected);
  });
});

describe('findRelatedTests', () => {
  it('it generates --coverageCoverageFrom patterns when needed', async () => {
    const sourceFile = 'file1.js';

    const {options} = await normalize(
      {
        collectCoverage: true,
        rootDir: '/root/path/foo/',
      },
      {
        _: [
          `/root/path/${sourceFile}`,
          sourceFile,
          `<rootDir>/bar/${sourceFile}`,
        ],
        findRelatedTests: true,
      } as Config.Argv,
    );

    const expected = [`../${sourceFile}`, `${sourceFile}`, `bar/${sourceFile}`];

    expect(options.collectCoverageFrom).toEqual(expected);
  });
});

function testPathArray(key: keyof AllOptions) {
  it('normalizes all paths relative to rootDir', async () => {
    const {options} = await normalize(
      {
        [key]: ['bar/baz', 'qux/quux/'],
        rootDir: '/root/path/foo',
      },
      {} as Config.Argv,
    );

    expect(options[key]).toEqual([expectedPathFooBar, expectedPathFooQux]);
  });

  it('does not change absolute paths', async () => {
    const {options} = await normalize(
      {
        [key]: ['/an/abs/path', '/another/abs/path'],
        rootDir: '/root/path/foo',
      },
      {} as Config.Argv,
    );

    expect(options[key]).toEqual([expectedPathAbs, expectedPathAbsAnother]);
  });

  it('substitutes <rootDir> tokens', async () => {
    const {options} = await normalize(
      {
        [key]: ['<rootDir>/bar/baz'],
        rootDir: '/root/path/foo',
      },
      {} as Config.Argv,
    );

    expect(options[key]).toEqual([expectedPathFooBar]);
  });
}

describe('roots', () => {
  testPathArray('roots');
});

describe('reporters', () => {
  let Resolver: typeof import('jest-resolve').default;
  beforeEach(() => {
    Resolver = (require('jest-resolve') as typeof import('jest-resolve'))
      .default;
    Resolver.findNodeModule = jest.fn((name: string) => name);
  });

  it('allows empty list', async () => {
    const {options} = await normalize(
      {
        reporters: [],
        rootDir: '/root/',
      },
      {} as Config.Argv,
    );

    expect(options.reporters).toEqual([]);
  });

  it('normalizes the path and options object', async () => {
    const {options} = await normalize(
      {
        reporters: [
          'default',
          'github-actions',
          '<rootDir>/custom-reporter.js',
          ['<rootDir>/custom-reporter.js', {banana: 'yes', pineapple: 'no'}],
          ['jest-junit', {outputName: 'report.xml'}],
        ],
        rootDir: '/root/',
      },
      {} as Config.Argv,
    );

    expect(options.reporters).toEqual([
      ['default', {}],
      ['github-actions', {}],
      ['/root/custom-reporter.js', {}],
      ['/root/custom-reporter.js', {banana: 'yes', pineapple: 'no'}],
      ['jest-junit', {outputName: 'report.xml'}],
    ]);
  });

  it('throws an error if value is neither string nor array', async () => {
    expect.assertions(1);
    await expect(
      normalize(
        {
          // @ts-expect-error: Testing runtime error
          reporters: [123],
          rootDir: '/root/',
        },
        {} as Config.Argv,
      ),
    ).rejects.toThrowErrorMatchingSnapshot();
  });

  it('throws an error if first value in the tuple is not a string', async () => {
    expect.assertions(1);
    await expect(
      normalize(
        {
          // @ts-expect-error: Testing runtime error
          reporters: [[123]],
          rootDir: '/root/',
        },
        {} as Config.Argv,
      ),
    ).rejects.toThrowErrorMatchingSnapshot();
  });

  it('throws an error if second value is missing in the tuple', async () => {
    expect.assertions(1);
    await expect(
      normalize(
        {
          // @ts-expect-error: Testing runtime error
          reporters: [['some-reporter']],
          rootDir: '/root/',
        },
        {} as Config.Argv,
      ),
    ).rejects.toThrowErrorMatchingSnapshot();
  });

  it('throws an error if second value in the tuple is not an object', async () => {
    expect.assertions(1);
    await expect(
      normalize(
        {
          // @ts-expect-error: Testing runtime error
          reporters: [['some-reporter', true]],
          rootDir: '/root/',
        },
        {} as Config.Argv,
      ),
    ).rejects.toThrowErrorMatchingSnapshot();
  });
});

describe('transform', () => {
  let Resolver: typeof import('jest-resolve').default;
  beforeEach(() => {
    Resolver = (require('jest-resolve') as typeof import('jest-resolve'))
      .default;
    Resolver.findNodeModule = jest.fn((name: string) => name);
  });

  it('normalizes the path', async () => {
    const {options} = await normalize(
      {
        rootDir: '/root/',
        transform: {
          [DEFAULT_CSS_PATTERN]: '<rootDir>/node_modules/jest-regex-util',
          [DEFAULT_JS_PATTERN]: 'babel-jest',
          'abs-path': '/qux/quux',
        },
      },
      {} as Config.Argv,
    );

    expect(options.transform).toEqual([
      [DEFAULT_CSS_PATTERN, '/root/node_modules/jest-regex-util', {}],
      [DEFAULT_JS_PATTERN, require.resolve('babel-jest'), {}],
      ['abs-path', '/qux/quux', {}],
    ]);
  });
  it("pulls in config if it's passed as an array, and defaults to empty object", async () => {
    const {options} = await normalize(
      {
        rootDir: '/root/',
        transform: {
          [DEFAULT_CSS_PATTERN]: '<rootDir>/node_modules/jest-regex-util',
          [DEFAULT_JS_PATTERN]: ['babel-jest', {rootMode: 'upward'}],
          'abs-path': '/qux/quux',
        },
      },
      {} as Config.Argv,
    );
    expect(options.transform).toEqual([
      [DEFAULT_CSS_PATTERN, '/root/node_modules/jest-regex-util', {}],
      [DEFAULT_JS_PATTERN, require.resolve('babel-jest'), {rootMode: 'upward'}],
      ['abs-path', '/qux/quux', {}],
    ]);
  });
});

describe('haste', () => {
  let Resolver: typeof import('jest-resolve').default;
  beforeEach(() => {
    Resolver = (require('jest-resolve') as typeof import('jest-resolve'))
      .default;
    Resolver.findNodeModule = jest.fn((name: string) => name);
  });

  it('normalizes the path for hasteImplModulePath', async () => {
    const {options} = await normalize(
      {
        haste: {
          hasteImplModulePath: '<rootDir>/haste_impl.js',
        },
        rootDir: '/root/',
      },
      {} as Config.Argv,
    );

    expect(options.haste).toEqual({
      hasteImplModulePath: '/root/haste_impl.js',
    });
  });
});

describe('setupFilesAfterEnv', () => {
  let Resolver: typeof import('jest-resolve').default;
  beforeEach(() => {
    Resolver = (require('jest-resolve') as typeof import('jest-resolve'))
      .default;
    Resolver.findNodeModule = jest.fn((name: string) =>
      name.startsWith('/') ? name : `/root/path/foo${path.sep}${name}`,
    );
  });

  it('normalizes the path according to rootDir', async () => {
    const {options} = await normalize(
      {
        rootDir: '/root/path/foo',
        setupFilesAfterEnv: ['bar/baz'],
      },
      {} as Config.Argv,
    );

    expect(options.setupFilesAfterEnv).toEqual([expectedPathFooBar]);
  });

  it('does not change absolute paths', async () => {
    const {options} = await normalize(
      {
        rootDir: '/root/path/foo',
        setupFilesAfterEnv: ['/an/abs/path'],
      },
      {} as Config.Argv,
    );

    expect(options.setupFilesAfterEnv).toEqual([expectedPathAbs]);
  });

  it('substitutes <rootDir> tokens', async () => {
    const {options} = await normalize(
      {
        rootDir: '/root/path/foo',
        setupFilesAfterEnv: ['<rootDir>/bar/baz'],
      },
      {} as Config.Argv,
    );

    expect(options.setupFilesAfterEnv).toEqual([expectedPathFooBar]);
  });
});

describe('coveragePathIgnorePatterns', () => {
  it('does not normalize paths relative to rootDir', async () => {
    // This is a list of patterns, so we can't assume any of them are
    // directories
    const {options} = await normalize(
      {
        coveragePathIgnorePatterns: ['bar/baz', 'qux/quux'],
        rootDir: '/root/path/foo',
      },
      {} as Config.Argv,
    );

    expect(options.coveragePathIgnorePatterns).toEqual([
      joinForPattern('bar', 'baz'),
      joinForPattern('qux', 'quux'),
    ]);
  });

  it('does not normalize trailing slashes', async () => {
    // This is a list of patterns, so we can't assume any of them are
    // directories
    const {options} = await normalize(
      {
        coveragePathIgnorePatterns: ['bar/baz', 'qux/quux/'],
        rootDir: '/root/path/foo',
      },
      {} as Config.Argv,
    );

    expect(options.coveragePathIgnorePatterns).toEqual([
      joinForPattern('bar', 'baz'),
      joinForPattern('qux', 'quux', ''),
    ]);
  });

  it('substitutes <rootDir> tokens', async () => {
    const {options} = await normalize(
      {
        coveragePathIgnorePatterns: ['hasNoToken', '<rootDir>/hasAToken'],
        rootDir: '/root/path/foo',
      },
      {} as Config.Argv,
    );

    expect(options.coveragePathIgnorePatterns).toEqual([
      'hasNoToken',
      joinForPattern('', 'root', 'path', 'foo', 'hasAToken'),
    ]);
  });
});

describe('watchPathIgnorePatterns', () => {
  it('does not normalize paths relative to rootDir', async () => {
    // This is a list of patterns, so we can't assume any of them are
    // directories
    const {options} = await normalize(
      {
        rootDir: '/root/path/foo',
        watchPathIgnorePatterns: ['bar/baz', 'qux/quux'],
      },
      {} as Config.Argv,
    );

    expect(options.watchPathIgnorePatterns).toEqual([
      joinForPattern('bar', 'baz'),
      joinForPattern('qux', 'quux'),
    ]);
  });

  it('does not normalize trailing slashes', async () => {
    // This is a list of patterns, so we can't assume any of them are
    // directories
    const {options} = await normalize(
      {
        rootDir: '/root/path/foo',
        watchPathIgnorePatterns: ['bar/baz', 'qux/quux/'],
      },
      {} as Config.Argv,
    );

    expect(options.watchPathIgnorePatterns).toEqual([
      joinForPattern('bar', 'baz'),
      joinForPattern('qux', 'quux', ''),
    ]);
  });

  it('substitutes <rootDir> tokens', async () => {
    const {options} = await normalize(
      {
        rootDir: '/root/path/foo',
        watchPathIgnorePatterns: ['hasNoToken', '<rootDir>/hasAToken'],
      },
      {} as Config.Argv,
    );

    expect(options.watchPathIgnorePatterns).toEqual([
      'hasNoToken',
      joinForPattern('', 'root', 'path', 'foo', 'hasAToken'),
    ]);
  });
});

describe('testPathIgnorePatterns', () => {
  it('does not normalize paths relative to rootDir', async () => {
    // This is a list of patterns, so we can't assume any of them are
    // directories
    const {options} = await normalize(
      {
        rootDir: '/root/path/foo',
        testPathIgnorePatterns: ['bar/baz', 'qux/quux'],
      },
      {} as Config.Argv,
    );

    expect(options.testPathIgnorePatterns).toEqual([
      joinForPattern('bar', 'baz'),
      joinForPattern('qux', 'quux'),
    ]);
  });

  it('does not normalize trailing slashes', async () => {
    // This is a list of patterns, so we can't assume any of them are
    // directories
    const {options} = await normalize(
      {
        rootDir: '/root/path/foo',
        testPathIgnorePatterns: ['bar/baz', 'qux/quux/'],
      },
      {} as Config.Argv,
    );

    expect(options.testPathIgnorePatterns).toEqual([
      joinForPattern('bar', 'baz'),
      joinForPattern('qux', 'quux', ''),
    ]);
  });

  it('substitutes <rootDir> tokens', async () => {
    const {options} = await normalize(
      {
        rootDir: '/root/path/foo',
        testPathIgnorePatterns: ['hasNoToken', '<rootDir>/hasAToken'],
      },
      {} as Config.Argv,
    );

    expect(options.testPathIgnorePatterns).toEqual([
      'hasNoToken',
      joinForPattern('', 'root', 'path', 'foo', 'hasAToken'),
    ]);
  });
});

describe('modulePathIgnorePatterns', () => {
  it('does not normalize paths relative to rootDir', async () => {
    // This is a list of patterns, so we can't assume any of them are
    // directories
    const {options} = await normalize(
      {
        modulePathIgnorePatterns: ['bar/baz', 'qux/quux'],
        rootDir: '/root/path/foo',
      },
      {} as Config.Argv,
    );

    expect(options.modulePathIgnorePatterns).toEqual([
      joinForPattern('bar', 'baz'),
      joinForPattern('qux', 'quux'),
    ]);
  });

  it('does not normalize trailing slashes', async () => {
    // This is a list of patterns, so we can't assume any of them are
    // directories
    const {options} = await normalize(
      {
        modulePathIgnorePatterns: ['bar/baz', 'qux/quux/'],
        rootDir: '/root/path/foo',
      },
      {} as Config.Argv,
    );

    expect(options.modulePathIgnorePatterns).toEqual([
      joinForPattern('bar', 'baz'),
      joinForPattern('qux', 'quux', ''),
    ]);
  });

  it('substitutes <rootDir> tokens', async () => {
    const {options} = await normalize(
      {
        modulePathIgnorePatterns: ['hasNoToken', '<rootDir>/hasAToken'],
        rootDir: '/root/path/foo',
      },
      {} as Config.Argv,
    );

    expect(options.modulePathIgnorePatterns).toEqual([
      'hasNoToken',
      joinForPattern('', 'root', 'path', 'foo', 'hasAToken'),
    ]);
  });
});

describe('testRunner', () => {
  it('defaults to Circus', async () => {
    const {options} = await normalize(
      {
        rootDir: '/root/path/foo',
      },
      {} as Config.Argv,
    );

    expect(options.testRunner).toMatch('jest-circus');
  });

  it('resolves jasmine', async () => {
    const Resolver = (require('jest-resolve') as typeof import('jest-resolve'))
      .default;
    Resolver.findNodeModule = jest.fn((name: string) => name);
    const {options} = await normalize(
      {
        rootDir: '/root/path/foo',
      },
      {
        testRunner: 'jasmine2',
      } as Config.Argv,
    );

    expect(options.testRunner).toMatch('jest-jasmine2');
  });

  it('is overwritten by argv', async () => {
    const Resolver = (require('jest-resolve') as typeof import('jest-resolve'))
      .default;
    Resolver.findNodeModule = jest.fn((name: string) => name);
    const {options} = await normalize(
      {
        rootDir: '/root/path/foo',
      },
      {
        testRunner: 'mocha',
      } as Config.Argv,
    );

    expect(options.testRunner).toBe('mocha');
  });
});

describe('coverageDirectory', () => {
  it('defaults to <rootDir>/coverage', async () => {
    const {options} = await normalize(
      {
        rootDir: '/root/path/foo',
      },
      {} as Config.Argv,
    );

    expect(options.coverageDirectory).toBe('/root/path/foo/coverage');
  });
});

describe('testEnvironment', () => {
  let Resolver: typeof import('jest-resolve').default;
  beforeEach(() => {
    Resolver = (require('jest-resolve') as typeof import('jest-resolve'))
      .default;
    Resolver.findNodeModule = jest.fn((name: string) => {
      if (['jsdom', 'jest-environment-jsdom'].includes(name)) {
        return `node_modules/${name}`;
      }
      if (name.startsWith('/root')) {
        return name;
      }
      return findNodeModule(name);
    });
  });

  it('resolves to an environment and prefers jest-environment-`name`', async () => {
    const {options} = await normalize(
      {
        rootDir: '/root',
        testEnvironment: 'jsdom',
      },
      {} as Config.Argv,
    );

    expect(options.testEnvironment).toBe('node_modules/jest-environment-jsdom');
  });

  it('resolves to node environment by default', async () => {
    const {options} = await normalize(
      {
        rootDir: '/root',
      },
      {} as Config.Argv,
    );

    expect(options.testEnvironment).toEqual(
      require.resolve('jest-environment-node'),
    );
  });

  it('throws on invalid environment names', async () => {
    await expect(
      normalize(
        {
          rootDir: '/root',
          testEnvironment: 'phantom',
        },
        {} as Config.Argv,
      ),
    ).rejects.toThrowErrorMatchingSnapshot();
  });

  it('works with rootDir', async () => {
    const {options} = await normalize(
      {
        rootDir: '/root',
        testEnvironment: '<rootDir>/testEnvironment.js',
      },
      {} as Config.Argv,
    );

    expect(options.testEnvironment).toBe('/root/testEnvironment.js');
  });
});

describe('babel-jest', () => {
  let Resolver: typeof import('jest-resolve').default;
  beforeEach(() => {
    Resolver = (require('jest-resolve') as typeof import('jest-resolve'))
      .default;
    Resolver.findNodeModule = jest.fn((name: string) =>
      name.includes('babel-jest')
        ? name
        : `${path.sep}node_modules${path.sep}${name}`,
    );
  });

  it('correctly identifies and uses babel-jest', async () => {
    const {options} = await normalize(
      {
        rootDir: '/root',
      },
      {} as Config.Argv,
    );

    expect(options.transform[0][0]).toBe(DEFAULT_JS_PATTERN);
    expect(options.transform[0][1]).toEqual(require.resolve('babel-jest'));
  });

  it('uses babel-jest if babel-jest is explicitly specified in a custom transform options', async () => {
    const customJSPattern = '\\.js$';
    const {options} = await normalize(
      {
        rootDir: '/root',
        transform: {
          [customJSPattern]: 'babel-jest',
        },
      },
      {} as Config.Argv,
    );

    expect(options.transform[0][0]).toBe(customJSPattern);
    expect(options.transform[0][1]).toEqual(require.resolve('babel-jest'));
  });
});

describe('testRegex', () => {
  it('testRegex empty string is mapped to empty array', async () => {
    const {options} = await normalize(
      {
        rootDir: '/root',
        testRegex: '',
      },
      {} as Config.Argv,
    );

    expect(options.testRegex).toEqual([]);
  });
  it('testRegex string is mapped to an array', async () => {
    const {options} = await normalize(
      {
        rootDir: '/root',
        testRegex: '.*',
      },
      {} as Config.Argv,
    );

    expect(options.testRegex).toEqual(['.*']);
  });
  it('testRegex array is preserved', async () => {
    const {options} = await normalize(
      {
        rootDir: '/root',
        testRegex: ['.*', 'foo\\.bar'],
      },
      {} as Config.Argv,
    );

    expect(options.testRegex).toEqual(['.*', 'foo\\.bar']);
  });
});

describe('testMatch', () => {
  it('testMatch default not applied if testRegex is set', async () => {
    const {options} = await normalize(
      {
        rootDir: '/root',
        testRegex: '.*',
      },
      {} as Config.Argv,
    );

    expect(options.testMatch).toHaveLength(0);
  });

  it('testRegex default not applied if testMatch is set', async () => {
    const {options} = await normalize(
      {
        rootDir: '/root',
        testMatch: ['**/*.js'],
      },
      {} as Config.Argv,
    );

    expect(options.testRegex).toEqual([]);
  });

  it('throws if testRegex and testMatch are both specified', async () => {
    await expect(
      normalize(
        {
          rootDir: '/root',
          testMatch: ['**/*.js'],
          testRegex: '.*',
        },
        {} as Config.Argv,
      ),
    ).rejects.toThrowErrorMatchingSnapshot();
  });

  it('normalizes testMatch', async () => {
    const {options} = await normalize(
      {
        rootDir: '/root',
        testMatch: ['<rootDir>/**/*.js'],
      },
      {} as Config.Argv,
    );

    expect(options.testMatch).toEqual(['/root/**/*.js']);
  });
});

describe('moduleDirectories', () => {
  it('defaults to node_modules', async () => {
    const {options} = await normalize({rootDir: '/root'}, {} as Config.Argv);

    expect(options.moduleDirectories).toEqual(['node_modules']);
  });

  it('normalizes moduleDirectories', async () => {
    const {options} = await normalize(
      {
        moduleDirectories: ['<rootDir>/src', '<rootDir>/node_modules'],
        rootDir: '/root',
      },
      {} as Config.Argv,
    );

    expect(options.moduleDirectories).toEqual([
      '/root/src',
      '/root/node_modules',
    ]);
  });
});

describe('preset', () => {
  beforeEach(() => {
    const Resolver = (require('jest-resolve') as typeof import('jest-resolve'))
      .default;
    Resolver.findNodeModule = jest.fn((name: string) => {
      if (name === 'react-native/jest-preset') {
        return '/node_modules/react-native/jest-preset.json';
      }

      if (name === 'react-native-js-preset/jest-preset') {
        return '/node_modules/react-native-js-preset/jest-preset.js';
      }

      if (name === 'cjs-preset/jest-preset') {
        return '/node_modules/cjs-preset/jest-preset.cjs';
      }

      if (name === 'mjs-preset/jest-preset') {
        return '/node_modules/mjs-preset/jest-preset.mjs';
      }

      if (name.includes('doesnt-exist')) {
        return null;
      }

      return `/node_modules/${name}`;
    });
    jest.doMock(
      '/node_modules/react-native/jest-preset.json',
      () => ({
        moduleNameMapper: {b: 'b'},
        modulePathIgnorePatterns: ['b'],
        setupFiles: ['b'],
        setupFilesAfterEnv: ['b'],
        transform: {b: 'b'},
      }),
      {virtual: true},
    );
    jest.doMock(
      '/node_modules/react-native-js-preset/jest-preset.js',
      () => ({
        moduleNameMapper: {
          json: true,
        },
      }),
      {virtual: true},
    );
    jest.doMock(
      '/node_modules/cjs-preset/jest-preset.cjs',
      () => ({
        moduleNameMapper: {
          cjs: true,
        },
      }),
      {virtual: true},
    );
    jest.doMock(
      '/node_modules/mjs-preset/jest-preset.mjs',
      () => ({
        moduleNameMapper: {
          mjs: true,
        },
      }),
      {virtual: true},
    );
  });

  afterEach(() => {
    jest.dontMock('/node_modules/react-native/jest-preset.json');
    jest.dontMock('/node_modules/react-native-js-preset/jest-preset.js');
    jest.dontMock('/node_modules/cjs-preset/jest-preset.cjs');
    jest.dontMock('/node_modules/mjs-preset/jest-preset.mjs');
  });

  test('throws when preset not found', async () => {
    await expect(
      normalize(
        {
          preset: 'doesnt-exist',
          rootDir: '/root/path/foo',
        },
        {} as Config.Argv,
      ),
    ).rejects.toThrowErrorMatchingSnapshot();
  });

  test('throws when module was found but no "jest-preset.js" or "jest-preset.json" files', async () => {
    await expect(
      normalize(
        {
          preset: 'exist-but-no-jest-preset',
          rootDir: '/root/path/foo',
        },
        {} as Config.Argv,
      ),
    ).rejects.toThrowErrorMatchingSnapshot();
  });

  test('throws when a dependency is missing in the preset', async () => {
    jest.doMock(
      '/node_modules/react-native-js-preset/jest-preset.js',
      () => {
        require('library-that-is-not-installed');
        return {
          transform: {} as Config.Argv,
        };
      },
      {virtual: true},
    );

    await expect(
      normalize(
        {
          preset: 'react-native-js-preset',
          rootDir: '/root/path/foo',
        },
        {} as Config.Argv,
      ),
    ).rejects.toThrow(/Cannot find module 'library-that-is-not-installed'/);
  });

  test('throws when preset is invalid', async () => {
    jest.doMock('/node_modules/react-native/jest-preset.json', () =>
      jest.requireActual('./jest-preset.json'),
    );

    const errorMessage = semver.satisfies(process.versions.node, '<19.0.0')
      ? /Unexpected token } in JSON at position (104|110)[\S\s]* at /
      : 'SyntaxError: Expected double-quoted property name in JSON at position 104';

    await expect(
      normalize(
        {
          preset: 'react-native',
          rootDir: '/root/path/foo',
        },
        {} as Config.Argv,
      ),
    ).rejects.toThrow(errorMessage);
  });

  test('throws when preset evaluation throws type error', async () => {
    jest.doMock(
      '/node_modules/react-native-js-preset/jest-preset.js',
      () => ({
        // @ts-expect-error: Testing runtime error
        // eslint-disable-next-line unicorn/prefer-prototype-methods
        transform: {}.nonExistingProp.call(),
      }),
      {virtual: true},
    );

    const errorMessage = semver.satisfies(process.versions.node, '<16.9.1')
      ? /TypeError: Cannot read property 'call' of undefined[\S\s]* at /
      : "TypeError: Cannot read properties of undefined (reading 'call')";

    await expect(
      normalize(
        {
          preset: 'react-native-js-preset',
          rootDir: '/root/path/foo',
        },
        {} as Config.Argv,
      ),
    ).rejects.toThrow(errorMessage);
  });

  test('works with "react-native"', async () => {
    await expect(
      normalize(
        {
          preset: 'react-native',
          rootDir: '/root/path/foo',
        },
        {} as Config.Argv,
      ),
    ).resolves.not.toThrow();
  });

  test.each(['react-native-js-preset', 'cjs-preset'])(
    'works with cjs preset',
    async preset => {
      await expect(
        normalize(
          {
            preset,
            rootDir: '/root/path/foo',
          },
          {} as Config.Argv,
        ),
      ).resolves.not.toThrow();
    },
  );

  test('works with esm preset', async () => {
    await expect(
      normalize(
        {
          preset: 'mjs-preset',
          rootDir: '/root/path/foo',
        },
        {} as Config.Argv,
      ),
    ).resolves.not.toThrow();
  });

  test('searches for .json, .js, .cjs, .mjs preset files', async () => {
    const Resolver = (require('jest-resolve') as typeof import('jest-resolve'))
      .default;

    await normalize(
      {
        preset: 'react-native',
        rootDir: '/root/path/foo',
      },
      {} as Config.Argv,
    );

    const options = jest.mocked(Resolver.findNodeModule).mock.calls[0][1];
    expect(options.extensions).toEqual(['.json', '.js', '.cjs', '.mjs']);
  });

  test('merges with options', async () => {
    const {options} = await normalize(
      {
        moduleNameMapper: {a: 'a'},
        modulePathIgnorePatterns: ['a'],
        preset: 'react-native',
        rootDir: '/root/path/foo',
        setupFiles: ['a'],
        setupFilesAfterEnv: ['a'],
        transform: {a: 'a'},
      },
      {} as Config.Argv,
    );

    expect(options.moduleNameMapper).toEqual([
      ['a', 'a'],
      ['b', 'b'],
    ]);
    expect(options.modulePathIgnorePatterns).toEqual(['b', 'a']);
    expect(options.setupFiles.sort()).toEqual([
      '/node_modules/a',
      '/node_modules/b',
    ]);
    expect(options.setupFilesAfterEnv.sort()).toEqual([
      '/node_modules/a',
      '/node_modules/b',
    ]);
    expect(options.transform).toEqual([
      ['a', '/node_modules/a', {}],
      ['b', '/node_modules/b', {}],
    ]);
  });

  test('merges with options and moduleNameMapper preset is overridden by options', async () => {
    // Object initializer not used for properties as a workaround for
    //  sort-keys eslint rule while specifying properties in
    //  non-alphabetical order for a better test
    const moduleNameMapper = {} as Record<string, string>;
    moduleNameMapper.e = 'ee';
    moduleNameMapper.b = 'bb';
    moduleNameMapper.c = 'cc';
    moduleNameMapper.a = 'aa';
    const {options} = await normalize(
      {
        moduleNameMapper,
        preset: 'react-native',
        rootDir: '/root/path/foo',
      },
      {} as Config.Argv,
    );

    expect(options.moduleNameMapper).toEqual([
      ['e', 'ee'],
      ['b', 'bb'],
      ['c', 'cc'],
      ['a', 'aa'],
    ]);
  });

  test('merges with options and transform preset is overridden by options', async () => {
    /* eslint-disable sort-keys */
    const transform = {
      e: 'ee',
      b: 'bb',
      c: 'cc',
      a: 'aa',
    };
    /* eslint-enable */
    const {options} = await normalize(
      {
        preset: 'react-native',
        rootDir: '/root/path/foo',
        transform,
      },
      {} as Config.Argv,
    );

    expect(options.transform).toEqual([
      ['e', '/node_modules/ee', {}],
      ['b', '/node_modules/bb', {}],
      ['c', '/node_modules/cc', {}],
      ['a', '/node_modules/aa', {}],
    ]);
  });

  test('extracts setupFilesAfterEnv from preset', async () => {
    const {options} = await normalize(
      {
        preset: 'react-native',
        rootDir: '/root/path/foo',
      },
      {} as Config.Argv,
    );

    expect(options.setupFilesAfterEnv).toEqual(['/node_modules/b']);
  });
});

describe('preset with globals', () => {
  beforeEach(() => {
    const Resolver = (require('jest-resolve') as typeof import('jest-resolve'))
      .default;
    Resolver.findNodeModule = jest.fn((name: string) => {
      if (name === 'global-foo/jest-preset') {
        return '/node_modules/global-foo/jest-preset.json';
      }

      return `/node_modules/${name}`;
    });
    jest.doMock(
      '/node_modules/global-foo/jest-preset.json',
      () => ({
        globals: {
          __DEV__: false,
          config: {
            hereToStay: 'This should stay here',
          },
          myString: 'hello world',
        },
      }),
      {virtual: true},
    );
  });

  afterEach(() => {
    jest.dontMock('/node_modules/global-foo/jest-preset.json');
  });

  test('should merge the globals preset correctly', async () => {
    const {options} = await normalize(
      {
        globals: {
          __DEV__: true,
          config: {
            sideBySide: 'This should also live another day',
          },
          myString: 'hello sunshine',
          textValue: 'This is just text',
        },
        preset: 'global-foo',
        rootDir: '/root/path/foo',
      },
      {} as Config.Argv,
    );

    expect(options.globals).toEqual({
      __DEV__: true,
      config: {
        hereToStay: 'This should stay here',
        sideBySide: 'This should also live another day',
      },
      myString: 'hello sunshine',
      textValue: 'This is just text',
    });
  });
});

describe.each(['setupFiles', 'setupFilesAfterEnv'] as const)(
  'preset without %s',
  configKey => {
    let Resolver;
    beforeEach(() => {
      Resolver = (require('jest-resolve') as typeof import('jest-resolve'))
        .default;
      Resolver.findNodeModule = jest.fn(
        name => `${path.sep}node_modules${path.sep}${name}`,
      );
    });

    beforeAll(() => {
      jest.doMock(
        '/node_modules/react-foo/jest-preset',
        () => ({
          moduleNameMapper: {b: 'b'},
          modulePathIgnorePatterns: ['b'],
        }),
        {virtual: true},
      );
    });

    afterAll(() => {
      jest.dontMock('/node_modules/react-foo/jest-preset');
    });

    it(`should normalize ${configKey} correctly`, async () => {
      const {options} = await normalize(
        {
          [configKey]: ['a'],
          preset: 'react-foo',
          rootDir: '/root/path/foo',
        },
        {} as Config.Argv,
      );

      expect(options).toEqual(
        expect.objectContaining({[configKey]: ['/node_modules/a']}),
      );
    });
  },
);

describe("preset with 'reporters' option", () => {
  beforeEach(() => {
    const Resolver = (require('jest-resolve') as typeof import('jest-resolve'))
      .default;
    Resolver.findNodeModule = jest.fn((name: string) => {
      if (name === 'with-reporters/jest-preset') {
        return '/node_modules/with-reporters/jest-preset.json';
      }

      return `/node_modules/${name}`;
    });
    jest.doMock(
      '/node_modules/with-reporters/jest-preset.json',
      () => ({
        reporters: ['default'],
      }),
      {virtual: true},
    );
  });

  afterEach(() => {
    jest.dontMock('/node_modules/with-reporters/jest-preset.json');
  });

  test("normalizes 'reporters' option defined in preset", async () => {
    const {options} = await normalize(
      {
        preset: 'with-reporters',
        rootDir: '/root/',
      },
      {} as Config.Argv,
    );

    expect(options.reporters).toEqual([['default', {}]]);
  });

  test("overrides 'reporters' option defined in preset", async () => {
    const {options} = await normalize(
      {
        preset: 'with-reporters',
        reporters: ['summary'],
        rootDir: '/root/',
      },
      {} as Config.Argv,
    );

    expect(options.reporters).toEqual([['summary', {}]]);
  });
});

describe('runner', () => {
  let Resolver: typeof import('jest-resolve').default;
  beforeEach(() => {
    Resolver = (require('jest-resolve') as typeof import('jest-resolve'))
      .default;
    Resolver.findNodeModule = jest.fn((name: string) => {
      if (['eslint', 'jest-runner-eslint', 'my-runner-foo'].includes(name)) {
        return `node_modules/${name}`;
      }
      if (name.startsWith('/root')) {
        return name;
      }
      return findNodeModule(name);
    });
  });

  it('defaults to `jest-runner`', async () => {
    const {options} = await normalize({rootDir: '/root'}, {} as Config.Argv);

    expect(options.runner).toBe(require.resolve('jest-runner'));
  });

  it('resolves to runners that do not have the prefix', async () => {
    const {options} = await normalize(
      {
        rootDir: '/root/',
        runner: 'my-runner-foo',
      },
      {} as Config.Argv,
    );

    expect(options.runner).toBe('node_modules/my-runner-foo');
  });

  it('resolves to runners and prefers jest-runner-`name`', async () => {
    const {options} = await normalize(
      {
        rootDir: '/root/',
        runner: 'eslint',
      },
      {} as Config.Argv,
    );

    expect(options.runner).toBe('node_modules/jest-runner-eslint');
  });

  it('throw error when a runner is not found', async () => {
    await expect(
      normalize(
        {
          rootDir: '/root/',
          runner: 'missing-runner',
        },
        {} as Config.Argv,
      ),
    ).rejects.toThrowErrorMatchingSnapshot();
  });
});

describe('watchPlugins', () => {
  let Resolver: typeof import('jest-resolve').default;
  beforeEach(() => {
    Resolver = (require('jest-resolve') as typeof import('jest-resolve'))
      .default;
    Resolver.findNodeModule = jest.fn((name: string) => {
      if (
        ['typeahead', 'jest-watch-typeahead', 'my-watch-plugin'].includes(name)
      ) {
        return `node_modules/${name}`;
      }

      if (name.startsWith('/root')) {
        return name;
      }
      return findNodeModule(name);
    });
  });

  it('defaults to undefined', async () => {
    const {options} = await normalize({rootDir: '/root'}, {} as Config.Argv);

    expect(options.watchPlugins).toBeUndefined();
  });

  it('resolves to watch plugins and prefers jest-watch-`name`', async () => {
    const {options} = await normalize(
      {
        rootDir: '/root/',
        watchPlugins: ['typeahead'],
      },
      {} as Config.Argv,
    );

    expect(options.watchPlugins).toEqual([
      {config: {} as Config.Argv, path: 'node_modules/jest-watch-typeahead'},
    ]);
  });

  it('resolves watch plugins that do not have the prefix', async () => {
    const {options} = await normalize(
      {
        rootDir: '/root/',
        watchPlugins: ['my-watch-plugin'],
      },
      {} as Config.Argv,
    );

    expect(options.watchPlugins).toEqual([
      {config: {} as Config.Argv, path: 'node_modules/my-watch-plugin'},
    ]);
  });

  it('normalizes multiple watchPlugins', async () => {
    const {options} = await normalize(
      {
        rootDir: '/root/',
        watchPlugins: ['jest-watch-typeahead', '<rootDir>/path/to/plugin'],
      },
      {} as Config.Argv,
    );

    expect(options.watchPlugins).toEqual([
      {config: {} as Config.Argv, path: 'node_modules/jest-watch-typeahead'},
      {config: {} as Config.Argv, path: '/root/path/to/plugin'},
    ]);
  });

  it('throw error when a watch plugin is not found', async () => {
    await expect(
      normalize(
        {
          rootDir: '/root/',
          watchPlugins: ['missing-plugin'],
        },
        {} as Config.Argv,
      ),
    ).rejects.toThrowErrorMatchingSnapshot();
  });
});

describe('testPathPatterns', () => {
  const initialOptions = {rootDir: '/root'};
  const consoleLog = console.log;

  beforeEach(() => {
    console.log = jest.fn();
  });

  afterEach(() => {
    console.log = consoleLog;
  });

  it('defaults to empty', async () => {
    const {options} = await normalize(initialOptions, {} as Config.Argv);

    expect(options.testPathPatterns.patterns).toEqual([]);
  });

  const cliOptions = [
    {name: '--testPathPatterns', property: 'testPathPatterns'},
    {name: '<regexForTestFiles>', property: '_'},
  ];
  for (const opt of cliOptions) {
    describe(opt.name, () => {
      it(`uses ${opt.name} if set`, async () => {
        const argv = {[opt.property]: ['a/b']} as Config.Argv;
        const {options} = await normalize(initialOptions, argv);

        expect(options.testPathPatterns.patterns).toEqual(['a/b']);
      });

      it('ignores invalid regular expressions and logs a warning', async () => {
        const argv = {[opt.property]: ['a(']} as Config.Argv;
        const {options} = await normalize(initialOptions, argv);

        expect(options.testPathPatterns.patterns).toEqual([]);
        expect(jest.mocked(console.log).mock.calls[0][0]).toMatchSnapshot();
      });

      it(`joins multiple ${opt.name} if set`, async () => {
        const argv = {[opt.property]: ['a/b', 'c/d']} as Config.Argv;
        const {options} = await normalize(initialOptions, argv);

        expect(options.testPathPatterns.patterns).toEqual(['a/b', 'c/d']);
      });
    });
  }

  it('coerces <regexForTestFiles> patterns to strings', async () => {
    const argv = {_: [1]} as Config.Argv;
    const {options} = await normalize(initialOptions, argv);

    expect(options.testPathPatterns.patterns).toEqual(['1']);
  });

  it('joins multiple --testPathPatterns and <regexForTestFiles>', async () => {
    const {options} = await normalize(initialOptions, {
      _: ['a', 'b'],
      testPathPatterns: ['c', 'd'],
    } as Config.Argv);
    expect(options.testPathPatterns.patterns).toEqual(['a', 'b', 'c', 'd']);
  });

  it('gives precedence to --all', async () => {
    const {options} = await normalize(initialOptions, {
      all: true,
      onlyChanged: true,
    } as Config.Argv);

    expect(options.onlyChanged).toBe(false);
  });
});

describe('moduleFileExtensions', () => {
  it('defaults to something useful', async () => {
    const {options} = await normalize({rootDir: '/root'}, {} as Config.Argv);

    expect(options.moduleFileExtensions).toEqual([
      'js',
      'mjs',
      'cjs',
      'jsx',
      'ts',
      'mts',
      'cts',
      'tsx',
      'json',
      'node',
    ]);
  });

  it.each([undefined, 'jest-runner'] as const)(
    'throws if missing `js` but using jest-runner',
    async runner => {
      await expect(
        normalize(
          {
            moduleFileExtensions: ['json', 'jsx'],
            rootDir: '/root/',
            runner,
          },
          {} as Config.Argv,
        ),
      ).rejects.toThrow("moduleFileExtensions must include 'js'");
    },
  );

  it('does not throw if missing `js` with a custom runner', async () => {
    await expect(
      normalize(
        {
          moduleFileExtensions: ['json', 'jsx'],
          rootDir: '/root/',
          runner: './', // does not need to be a valid runner for this validation
        },
        {} as Config.Argv,
      ),
    ).resolves.not.toThrow();
  });
});

describe('cwd', () => {
  it('is set to process.cwd', async () => {
    const {options} = await normalize({rootDir: '/root/'}, {} as Config.Argv);
    expect(options.cwd).toBe(process.cwd());
  });

  it('is not lost if the config has its own cwd property', async () => {
    jest.mocked(console.warn).mockImplementation(() => {});
    const {options} = await normalize(
      {
        cwd: '/tmp/config-sets-cwd-itself',
        rootDir: '/root/',
      } as Config.InitialOptions,
      {} as Config.Argv,
    );
    expect(options.cwd).toBe(process.cwd());
    expect(console.warn).toHaveBeenCalled();
  });
});

describe('Defaults', () => {
  it('should be accepted by normalize', async () => {
    await normalize({...Defaults, rootDir: '/root'}, {} as Config.Argv);

    expect(console.warn).not.toHaveBeenCalled();
  });
});

describe('displayName', () => {
  test.each<{displayName: Config.DisplayName; description: string}>`
    displayName             | description
    ${{}}                   | ${'is an empty object'}
    ${{name: 'hello'}}      | ${'missing color'}
    ${{color: 'green'}}     | ${'missing name'}
    ${{color: 2, name: []}} | ${'using invalid values'}
  `(
    'should throw an error when displayName is $description',
    async ({displayName}) => {
      await expect(
        normalize(
          {
            displayName,
            rootDir: '/root/',
          },
          {} as Config.Argv,
        ),
      ).rejects.toThrowErrorMatchingSnapshot();
    },
  );

  it.each([
    undefined,
    'jest-runner',
    'jest-runner-eslint',
    'jest-runner-tslint',
    'jest-runner-tsc',
  ])('generates a default color for the runner %s', async runner => {
    virtualModuleRegexes.push(/jest-runner-.+/);
    const {
      options: {displayName},
    } = await normalize(
      {
        displayName: 'project',
        rootDir: '/root/',
        runner,
      },
      {} as Config.Argv,
    );
    expect(displayName!.name).toBe('project');
    expect(displayName!.color).toMatchSnapshot();
  });
});

describe('testTimeout', () => {
  it('should return timeout value if defined', async () => {
    jest.mocked(console.warn).mockImplementation(() => {});
    const {options} = await normalize(
      {rootDir: '/root/', testTimeout: 1000},
      {} as Config.Argv,
    );

    expect(options.testTimeout).toBe(1000);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('should throw an error if timeout is a negative number', async () => {
    await expect(
      normalize({rootDir: '/root/', testTimeout: -1}, {} as Config.Argv),
    ).rejects.toThrowErrorMatchingSnapshot();
  });
});

describe('extensionsToTreatAsEsm', () => {
  async function matchErrorSnapshot(callback: {
    (): Promise<{
      hasDeprecationWarnings: boolean;
      options: Config.ProjectConfig & Config.GlobalConfig;
    }>;
    (): Promise<{
      hasDeprecationWarnings: boolean;
      options: Config.ProjectConfig & Config.GlobalConfig;
    }>;
    (): any;
  }) {
    await expect(callback()).rejects.toThrowErrorMatchingSnapshot();
  }

  it('should pass valid config through', async () => {
    const {options} = await normalize(
      {extensionsToTreatAsEsm: ['.ts'], rootDir: '/root/'},
      {} as Config.Argv,
    );

    expect(options.extensionsToTreatAsEsm).toEqual(['.ts']);
  });

  it('should enforce leading dots', async () => {
    await matchErrorSnapshot(async () =>
      normalize(
        {extensionsToTreatAsEsm: ['ts'], rootDir: '/root/'},
        {} as Config.Argv,
      ),
    );
  });

  it.each(['.js', '.mjs', '.cjs'])('throws on %s', async ext => {
    await matchErrorSnapshot(async () =>
      normalize(
        {extensionsToTreatAsEsm: [ext], rootDir: '/root/'},
        {} as Config.Argv,
      ),
    );
  });
});

describe('haste.enableSymlinks', () => {
  it('should throw if watchman is not disabled', async () => {
    await expect(
      normalize(
        {haste: {enableSymlinks: true}, rootDir: '/root/'},
        {} as Config.Argv,
      ),
    ).rejects.toThrow('haste.enableSymlinks is incompatible with watchman');

    await expect(
      normalize(
        {haste: {enableSymlinks: true}, rootDir: '/root/', watchman: true},
        {} as Config.Argv,
      ),
    ).rejects.toThrow('haste.enableSymlinks is incompatible with watchman');

    const {options} = await normalize(
      {haste: {enableSymlinks: true}, rootDir: '/root/', watchman: false},
      {} as Config.Argv,
    );

    expect(options.haste.enableSymlinks).toBe(true);
    expect(options.watchman).toBe(false);
  });
});

describe('haste.forceNodeFilesystemAPI', () => {
  it('should pass option through', async () => {
    const {options} = await normalize(
      {haste: {forceNodeFilesystemAPI: true}, rootDir: '/root/'},
      {} as Config.Argv,
    );

    expect(options.haste.forceNodeFilesystemAPI).toBe(true);
    expect(console.warn).not.toHaveBeenCalled();
  });
});

describe('updateSnapshot', () => {
  it('should be all if updateSnapshot is true', async () => {
    const {options} = await normalize({rootDir: '/root/'}, {
      updateSnapshot: true,
    } as Config.Argv);
    expect(options.updateSnapshot).toBe('all');
  });
  it('should be new if updateSnapshot is falsy', async () => {
    {
      const {options} = await normalize(
        {ci: false, rootDir: '/root/'},
        {} as Config.Argv,
      );
      expect(options.updateSnapshot).toBe('new');
    }
    {
      const {options} = await normalize({ci: false, rootDir: '/root/'}, {
        updateSnapshot: false,
      } as Config.Argv);
      expect(options.updateSnapshot).toBe('new');
    }
  });
  it('should be none if updateSnapshot is falsy and ci mode is true', async () => {
    const defaultCiConfig = Defaults.ci;
    {
      Defaults.ci = false;
      const {options} = await normalize({rootDir: '/root/'}, {
        ci: true,
      } as Config.Argv);
      expect(options.updateSnapshot).toBe('none');
    }
    {
      Defaults.ci = true;
      const {options} = await normalize({rootDir: '/root/'}, {} as Config.Argv);
      expect(options.updateSnapshot).toBe('none');
    }
    Defaults.ci = defaultCiConfig;
  });
});

describe('shards', () => {
  it('should be object if defined', async () => {
    const {options} = await normalize({rootDir: '/root/'}, {
      shard: '1/2',
    } as Config.Argv);

    expect(options.shard).toEqual({shardCount: 2, shardIndex: 1});
  });
});

describe('logs a deprecation warning', () => {
  beforeEach(() => {
    jest.mocked(console.warn).mockImplementation(() => {});
  });

  test("when 'browser' option is passed", async () => {
    await normalize(
      {
        // @ts-expect-error: Testing deprecated option
        browser: true,
        rootDir: '/root/',
      },
      {} as Config.Argv,
    );

    expect(console.warn).toMatchSnapshot();
  });

  test("when 'collectCoverageOnlyFrom' option is passed", async () => {
    await normalize(
      {
        // @ts-expect-error: Testing deprecated option
        collectCoverageOnlyFrom: {
          '<rootDir>/this-directory-is-covered/Covered.js': true,
        },
        rootDir: '/root/',
      },
      {} as Config.Argv,
    );

    expect(console.warn).toMatchSnapshot();
  });

  test("when 'extraGlobals' option is passed", async () => {
    await normalize(
      {
        // @ts-expect-error: Testing deprecated option
        extraGlobals: ['Math'],
        rootDir: '/root/',
      },
      {} as Config.Argv,
    );

    expect(console.warn).toMatchSnapshot();
  });

  test("when 'moduleLoader' option is passed", async () => {
    await normalize(
      {
        // @ts-expect-error: Testing deprecated option
        moduleLoader: '<rootDir>/runtime.js',
        rootDir: '/root/',
      },
      {} as Config.Argv,
    );

    expect(console.warn).toMatchSnapshot();
  });

  test("when 'preprocessorIgnorePatterns' option is passed", async () => {
    await normalize(
      {
        // @ts-expect-error: Testing deprecated option
        preprocessorIgnorePatterns: ['/node_modules/'],
        rootDir: '/root/',
      },
      {} as Config.Argv,
    );

    expect(console.warn).toMatchSnapshot();
  });

  test("when 'scriptPreprocessor' option is passed", async () => {
    await normalize(
      {
        rootDir: '/root/',
        // @ts-expect-error: Testing deprecated option
        scriptPreprocessor: 'preprocessor.js',
      },
      {} as Config.Argv,
    );

    expect(console.warn).toMatchSnapshot();
  });

  test("when 'setupTestFrameworkScriptFile' option is passed", async () => {
    await normalize(
      {
        rootDir: '/root/',
        // @ts-expect-error: Testing deprecated option
        setupTestFrameworkScriptFile: 'setup.js',
      },
      {} as Config.Argv,
    );

    expect(console.warn).toMatchSnapshot();
  });

  test("when 'testPathDirs' option is passed", async () => {
    await normalize(
      {
        rootDir: '/root/',
        // @ts-expect-error: Testing deprecated option
        testPathDirs: ['<rootDir>'],
      },
      {} as Config.Argv,
    );

    expect(console.warn).toMatchSnapshot();
  });

  test("when 'testURL' option is passed", async () => {
    await normalize(
      {
        rootDir: '/root/',
        // @ts-expect-error: Testing deprecated option
        testURL: 'https://jestjs.io',
      },
      {} as Config.Argv,
    );

    expect(console.warn).toMatchSnapshot();
  });

  test("when 'timers' option is passed", async () => {
    await normalize(
      {
        rootDir: '/root/',
        // @ts-expect-error: Testing deprecated option
        timers: 'real',
      },
      {} as Config.Argv,
    );

    expect(console.warn).toMatchSnapshot();
  });
});

it('parses workerIdleMemoryLimit', async () => {
  const {options} = await normalize(
    {
      rootDir: '/root/',
      workerIdleMemoryLimit: '45MiB',
    },
    {} as Config.Argv,
  );

  expect(options.workerIdleMemoryLimit).toBe(47_185_920);
});

describe('seed', () => {
  it('generates seed when not specified', async () => {
    const {options} = await normalize({rootDir: '/root/'}, {} as Config.Argv);
    expect(options.seed).toEqual(expect.any(Number));
  });

  it('uses seed specified', async () => {
    const {options} = await normalize({rootDir: '/root/'}, {
      seed: 4321,
    } as Config.Argv);
    expect(options.seed).toBe(4321);
  });

  it('throws if seed is too large or too small', async () => {
    await expect(
      normalize({rootDir: '/root/'}, {
        seed: 2 ** 33,
      } as Config.Argv),
    ).rejects.toThrow(
      'seed value must be between `-0x80000000` and `0x7fffffff` inclusive - instead it is 8589934592',
    );
    await expect(
      normalize({rootDir: '/root/'}, {
        seed: -(2 ** 33),
      } as Config.Argv),
    ).rejects.toThrow(
      'seed value must be between `-0x80000000` and `0x7fffffff` inclusive - instead it is -8589934592',
    );
  });
});

describe('showSeed', () => {
  test('showSeed is set when argv flag is set', async () => {
    const {options} = await normalize({rootDir: '/root/'}, {
      showSeed: true,
    } as Config.Argv);
    expect(options.showSeed).toBe(true);
  });

  test('showSeed is set when the config is set', async () => {
    const {options} = await normalize(
      {rootDir: '/root/', showSeed: true},
      {} as Config.Argv,
    );
    expect(options.showSeed).toBe(true);
  });

  test('showSeed is false when neither is set', async () => {
    const {options} = await normalize({rootDir: '/root/'}, {} as Config.Argv);
    expect(options.showSeed).toBeFalsy();
  });

  test('showSeed is true when randomize is set', async () => {
    const {options} = await normalize(
      {randomize: true, rootDir: '/root/'},
      {} as Config.Argv,
    );
    expect(options.showSeed).toBe(true);
  });
});

describe('randomize', () => {
  test('randomize is set when argv flag is set', async () => {
    const {options} = await normalize({rootDir: '/root/'}, {
      randomize: true,
    } as Config.Argv);
    expect(options.randomize).toBe(true);
  });

  test('randomize is set when the config is set', async () => {
    const {options} = await normalize(
      {randomize: true, rootDir: '/root/'},
      {} as Config.Argv,
    );
    expect(options.randomize).toBe(true);
  });

  test('randomize is false when neither is set', async () => {
    const {options} = await normalize({rootDir: '/root/'}, {} as Config.Argv);
    expect(options.randomize).toBeFalsy();
  });
});

describe('runInBand', () => {
  test('always set it', async () => {
    const {options} = await normalize({rootDir: '/root/'}, {} as Config.Argv);
    expect(options.runInBand).toBe(false);
  });

  test('respect argv', async () => {
    const {options} = await normalize({rootDir: '/root/'}, {
      runInBand: true,
    } as Config.Argv);
    expect(options.runInBand).toBe(true);
  });
});
