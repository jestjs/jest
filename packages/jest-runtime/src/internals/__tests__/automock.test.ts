/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {ModuleMocker} from 'jest-mock';
import {generateMock} from '../automock';
import type MockState from '../MockState';
import type ModuleRegistries from '../ModuleRegistries';
import type Resolution from '../Resolution';

type Stubs = {
  resolution: jest.Mocked<Resolution>;
  mockState: jest.Mocked<MockState>;
  moduleMocker: jest.Mocked<ModuleMocker>;
  registries: jest.Mocked<ModuleRegistries>;
  requireModule: jest.MockedFunction<(from: string, name: string) => unknown>;
};

function makeStubs(over: Partial<Stubs> = {}): Stubs {
  const stubs = {
    mockState: {
      getMockMetadata: jest.fn(() => ({})),
      hasMockMetadata: jest.fn(() => false),
      notifyMockGenerated: jest.fn(<T>(_path: string, mock: T): T => mock),
      setMockMetadata: jest.fn(),
    } as unknown as jest.Mocked<MockState>,
    moduleMocker: {
      generateFromMetadata: jest.fn(() => ({generated: true})),
      getMetadata: jest.fn(() => ({type: 'object'})),
    } as unknown as jest.Mocked<ModuleMocker>,
    registries: {
      withScratchRegistries: jest.fn(<T>(fn: () => T): T => fn()),
    } as unknown as jest.Mocked<ModuleRegistries>,
    requireModule: jest.fn(() => ({real: 'export'})) as jest.MockedFunction<
      (from: string, name: string) => unknown
    >,
    resolution: {
      resolveCjs: jest.fn(() => '/resolved.js'),
      resolveCjsStub: jest.fn(() => null),
    } as unknown as jest.Mocked<Resolution>,
    ...over,
  };
  return stubs;
}

describe('automock.generateMock', () => {
  test('uses resolveCjsStub when available, falling back to resolveCjs', () => {
    const stubs = makeStubs({
      resolution: {
        resolveCjs: jest.fn(),
        resolveCjsStub: jest.fn(() => '/stub.js'),
      } as unknown as jest.Mocked<Resolution>,
    });
    generateMock('/from.js', 'foo', stubs);
    expect(stubs.resolution.resolveCjsStub).toHaveBeenCalledWith(
      '/from.js',
      'foo',
    );
    expect(stubs.resolution.resolveCjs).not.toHaveBeenCalled();
  });

  test('seeds metadata before requiring (handles circular auto-mocks)', () => {
    const stubs = makeStubs();
    const order: Array<string> = [];
    stubs.mockState.setMockMetadata = jest.fn(() => {
      order.push('setMeta');
    });
    stubs.requireModule = jest.fn(() => {
      order.push('require');
      return {};
    }) as never;

    generateMock('/from.js', 'foo', stubs);
    // First setMockMetadata (the empty seed) runs before requireModule.
    expect(order[0]).toBe('setMeta');
    expect(order.indexOf('require')).toBeGreaterThan(0);
  });

  test('runs requireModule inside scratch registries', () => {
    const stubs = makeStubs();
    generateMock('/from.js', 'foo', stubs);
    expect(stubs.registries.withScratchRegistries).toHaveBeenCalledTimes(1);
    expect(stubs.requireModule).toHaveBeenCalledWith('/from.js', 'foo');
  });

  test('skips re-running when metadata is already cached', () => {
    const stubs = makeStubs();
    stubs.mockState.hasMockMetadata = jest.fn(() => true) as never;
    generateMock('/from.js', 'foo', stubs);
    expect(stubs.requireModule).not.toHaveBeenCalled();
    expect(stubs.registries.withScratchRegistries).not.toHaveBeenCalled();
  });

  test('throws when getMetadata returns null on the loaded exports', () => {
    const stubs = makeStubs();
    // First call (seed) returns metadata; second (on real exports) returns null.
    let count = 0;
    stubs.moduleMocker.getMetadata = jest.fn(() =>
      ++count === 1 ? ({type: 'object'} as never) : null,
    );
    expect(() => generateMock('/from.js', 'foo', stubs)).toThrow(
      /Failed to get mock metadata/,
    );
  });

  test('returns the result of notifyMockGenerated', () => {
    const sentinel = {sentinel: true};
    const stubs = makeStubs();
    stubs.mockState.notifyMockGenerated = jest.fn(() => sentinel) as never;
    expect(generateMock('/from.js', 'foo', stubs)).toBe(sentinel);
  });
});
