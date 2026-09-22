/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import Resolver from '../resolver';
import {
  resolveRunner,
  resolveSequencer,
  resolveTestEnvironment,
  resolveWatchPlugin,
} from '../utils';

const rootDir = path.resolve('/project');

const findNodeModule = jest.spyOn(Resolver, 'findNodeModule');

beforeEach(() => {
  jest.clearAllMocks();
  findNodeModule.mockReturnValue(null);
});

describe('resolveTestEnvironment', () => {
  test('resolves the prefixed name first', () => {
    findNodeModule.mockReturnValueOnce('/modules/jest-environment-foo.js');

    const resolved = resolveTestEnvironment({
      requireResolveFunction: jest.fn<(moduleName: string) => string>(),
      rootDir,
      testEnvironment: 'foo',
    });

    expect(resolved).toBe('/modules/jest-environment-foo.js');
    expect(findNodeModule).toHaveBeenCalledWith(
      'jest-environment-foo',
      expect.objectContaining({basedir: rootDir}),
    );
  });

  test('maps jsdom to jest-environment-jsdom', () => {
    findNodeModule
      // the prefixed rung double-prefixes the shorthand and misses
      .mockReturnValueOnce(null)
      .mockReturnValueOnce('/modules/jest-environment-jsdom.js');

    const resolved = resolveTestEnvironment({
      requireResolveFunction: jest.fn((moduleName: string) => {
        throw new Error(`Cannot find ${moduleName}`);
      }),
      rootDir,
      testEnvironment: 'jsdom',
    });

    expect(resolved).toBe('/modules/jest-environment-jsdom.js');
    expect(findNodeModule).toHaveBeenLastCalledWith(
      'jest-environment-jsdom',
      expect.objectContaining({basedir: rootDir}),
    );
  });

  test('falls back through requireResolve and the unprefixed name', () => {
    const requireResolveFunction = jest.fn((moduleName: string) => {
      if (moduleName === 'foo') return '/modules/foo.js';
      throw new Error(`Cannot find ${moduleName}`);
    });

    const resolved = resolveTestEnvironment({
      requireResolveFunction,
      rootDir,
      testEnvironment: 'foo',
    });

    expect(resolved).toBe('/modules/foo.js');
    expect(requireResolveFunction.mock.calls).toEqual([
      ['jest-environment-foo'],
      ['foo'],
    ]);
  });

  test('resolves the `node` shorthand from jest before the project', () => {
    findNodeModule.mockImplementation((name: string) =>
      name === 'jest-environment-node'
        ? '/decoy/jest-environment-node.js'
        : null,
    );

    const resolved = resolveTestEnvironment({
      requireResolveFunction: moduleName => {
        if (moduleName === 'jest-environment-node') {
          return '/jest/jest-environment-node.js';
        }
        throw new Error(`Cannot find ${moduleName}`);
      },
      rootDir,
      testEnvironment: 'node',
    });

    // a project-local copy must not shadow the environment jest is built against
    expect(resolved).toBe('/jest/jest-environment-node.js');
  });

  test('resolves the jsdom shorthand from jest before the project', () => {
    findNodeModule.mockImplementation((name: string) =>
      name === 'jest-environment-jsdom'
        ? '/decoy/jest-environment-jsdom.js'
        : null,
    );

    const resolved = resolveTestEnvironment({
      requireResolveFunction: moduleName => {
        if (moduleName === 'jest-environment-jsdom') {
          return '/jest/jest-environment-jsdom.js';
        }
        throw new Error(`Cannot find ${moduleName}`);
      },
      rootDir,
      testEnvironment: 'jsdom',
    });

    expect(resolved).toBe('/jest/jest-environment-jsdom.js');
  });

  test('prefers the project for a full package name', () => {
    findNodeModule.mockImplementation((name: string) =>
      name === 'jest-environment-node'
        ? '/decoy/jest-environment-node.js'
        : null,
    );

    const resolved = resolveTestEnvironment({
      requireResolveFunction: moduleName => {
        if (moduleName === 'jest-environment-node') {
          return '/jest/jest-environment-node.js';
        }
        throw new Error(`Cannot find ${moduleName}`);
      },
      rootDir,
      testEnvironment: 'jest-environment-node',
    });

    // an explicitly written package name is a user decision: a pinned version wins
    expect(resolved).toBe('/decoy/jest-environment-node.js');
  });

  test('prefers the project for a path', () => {
    const envPath = path.join(rootDir, 'env.js');
    findNodeModule.mockImplementation((name: string) =>
      name === envPath ? '/decoy/env.js' : null,
    );

    const resolved = resolveTestEnvironment({
      requireResolveFunction: moduleName => {
        if (moduleName === envPath) {
          return '/jest/env.js';
        }
        throw new Error(`Cannot find ${moduleName}`);
      },
      rootDir,
      testEnvironment: '<rootDir>/env.js',
    });

    expect(resolved).toBe('/decoy/env.js');
  });

  test('resolves the `node` shorthand to a real environment jest ships', () => {
    const resolved = resolveTestEnvironment({
      requireResolveFunction: moduleName => require.resolve(moduleName),
      rootDir,
      testEnvironment: 'node',
    });

    expect(resolved).toBe(require.resolve('jest-environment-node'));
  });

  test('replaces <rootDir> before resolving', () => {
    const envPath = path.join(rootDir, 'env.js');
    const requireResolveFunction = jest.fn((moduleName: string) => {
      if (moduleName === envPath) return envPath;
      throw new Error(`Cannot find ${moduleName}`);
    });

    const resolved = resolveTestEnvironment({
      requireResolveFunction,
      rootDir,
      testEnvironment: '<rootDir>/env.js',
    });

    expect(resolved).toBe(envPath);
  });

  test('throws a validation error naming the option when nothing resolves', () => {
    expect(() =>
      resolveTestEnvironment({
        requireResolveFunction: jest.fn((moduleName: string) => {
          throw new Error(`Cannot find ${moduleName}`);
        }),
        rootDir,
        testEnvironment: 'foo',
      }),
    ).toThrow(/Test environment.*foo.*cannot be found/s);
  });

  test('mentions the jsdom package split when jsdom cannot be found', () => {
    expect(() =>
      resolveTestEnvironment({
        requireResolveFunction: jest.fn((moduleName: string) => {
          throw new Error(`Cannot find ${moduleName}`);
        }),
        rootDir,
        testEnvironment: 'jsdom',
      }),
    ).toThrow('"jest-environment-jsdom" is no longer shipped by default');
  });
});

test('watch plugins keep resolving the prefixed name from the project first', () => {
  findNodeModule.mockReturnValue('/modules/jest-watch-foo.js');
  const requireResolveFunction = jest.fn<(moduleName: string) => string>();

  const resolved = resolveWatchPlugin(undefined, {
    filePath: 'foo',
    requireResolveFunction,
    rootDir,
  });

  // unlike test environments, jest does not ship watch plugins, so a bare name has to
  // keep resolving from the project first
  expect(resolved).toBe('/modules/jest-watch-foo.js');
  expect(requireResolveFunction).not.toHaveBeenCalled();
});

test.each([
  ['jest-watch-', resolveWatchPlugin],
  ['jest-runner-', resolveRunner],
  ['jest-sequencer-', resolveSequencer],
])('%s prefix is tried first', (prefix, resolveFunction) => {
  findNodeModule.mockReturnValueOnce(`/modules/${prefix}foo.js`);

  const resolved = resolveFunction(undefined, {
    filePath: 'foo',
    requireResolveFunction: jest.fn<(moduleName: string) => string>(),
    rootDir,
  });

  expect(resolved).toBe(`/modules/${prefix}foo.js`);
  expect(findNodeModule).toHaveBeenCalledWith(
    `${prefix}foo`,
    expect.objectContaining({basedir: rootDir}),
  );
});
