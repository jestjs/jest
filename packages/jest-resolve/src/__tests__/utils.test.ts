/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Resolver from '../resolver';
import {resolveTestEnvironment} from '../utils';

describe('resolveTestEnvironment', () => {
  const findNodeModule = Resolver.findNodeModule;

  afterEach(() => {
    Resolver.findNodeModule = findNodeModule;
  });

  it('prefers Jest location over rootDir when both resolve', () => {
    // Simulate a package available both from rootDir (via findNodeModule)
    // and from Jest's own location (via requireResolveFunction)
    const jestLocationPath =
      '/jest/node_modules/jest-environment-node/index.js';
    const rootDirPath = '/project/node_modules/jest-environment-node';

    Resolver.findNodeModule = jest.fn(() => rootDirPath);

    const result = resolveTestEnvironment({
      requireResolveFunction: (name: string) => {
        if (name === 'jest-environment-node') {
          return jestLocationPath;
        }
        throw new Error(`Cannot find module '${name}'`);
      },
      rootDir: '/project',
      testEnvironment: 'node',
    });

    // Jest's own location should win (requireResolveFunction)
    expect(result).toBe(jestLocationPath);
  });

  it('falls back to rootDir when Jest location cannot resolve', () => {
    const rootDirPath = '/project/node_modules/jest-environment-custom';

    Resolver.findNodeModule = jest.fn((name: string) => {
      if (name === 'jest-environment-custom') {
        return rootDirPath;
      }
      return null;
    });

    const result = resolveTestEnvironment({
      requireResolveFunction: () => {
        throw new Error('Cannot find module');
      },
      rootDir: '/project',
      testEnvironment: 'custom',
    });

    // Falls back to rootDir resolution
    expect(result).toBe(rootDirPath);
  });

  it('resolves relative paths from rootDir first, not Jest location', () => {
    const rootDirPath = '/project/custom-env.js';

    Resolver.findNodeModule = jest.fn((name: string) => {
      if (name === './custom-env.js') {
        return rootDirPath;
      }
      return null;
    });

    const requireResolveFunction = jest.fn((): string => {
      return '/jest/node_modules/something-else.js';
    });

    const result = resolveTestEnvironment({
      requireResolveFunction,
      rootDir: '/project',
      testEnvironment: './custom-env.js',
    });

    // rootDir resolution should win for relative paths
    expect(result).toBe(rootDirPath);
    expect(requireResolveFunction).not.toHaveBeenCalled();
  });

  it('falls back to requireResolve for path-like inputs when rootDir fails', () => {
    Resolver.findNodeModule = jest.fn(() => null);

    const absolutePath = '/some/absolute/path/env.js';

    const result = resolveTestEnvironment({
      requireResolveFunction: (name: string) => {
        if (name === absolutePath) {
          return absolutePath;
        }
        throw new Error('Cannot find module');
      },
      rootDir: '/project',
      testEnvironment: absolutePath,
    });

    expect(result).toBe(absolutePath);
  });

  it('throws when neither location resolves', () => {
    Resolver.findNodeModule = jest.fn(() => null);

    expect(() =>
      resolveTestEnvironment({
        requireResolveFunction: () => {
          throw new Error('Cannot find module');
        },
        rootDir: '/project',
        testEnvironment: 'nonexistent',
      }),
    ).toThrow('cannot be found');
  });
});
