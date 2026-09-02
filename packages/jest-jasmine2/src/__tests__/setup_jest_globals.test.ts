/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {makeGlobalConfig, makeProjectConfig} from '@jest/test-utils';
import type {Plugin} from 'pretty-format';
import {getSerializers} from 'jest-snapshot';
import setupJestGlobals from '../setup_jest_globals';

type GlobalWithJasmine = typeof globalThis & {
  jasmine?: {
    Spec: new (...args: Array<unknown>) => unknown;
  };
};

it('uses the preloaded snapshot setup', async () => {
  const jasmineGlobal = globalThis as GlobalWithJasmine;
  const originalJasmine = jasmineGlobal.jasmine;
  const serializer: Plugin = {
    serialize: () => '',
    test: () => false,
  };
  const resolveSnapshotPath = jest.fn((testPath: string) => `${testPath}.snap`);
  const testPath = '/project/example.test.js';

  jasmineGlobal.jasmine = {Spec: class {}};

  try {
    const snapshotState = await setupJestGlobals({
      config: makeProjectConfig({rootDir: '/project'}),
      globalConfig: makeGlobalConfig(),
      snapshotSetup: {
        resolver: {
          resolveSnapshotPath,
          resolveTestPath: snapshotPath => snapshotPath.slice(0, -5),
          testPathForConsistencyCheck: testPath,
        },
        serializers: [serializer],
      },
      testPath,
    });

    expect(resolveSnapshotPath).toHaveBeenCalledWith(testPath);
    expect(getSerializers()[0]).toBe(serializer);
    expect(expect.getState().snapshotState).toBe(snapshotState);
  } finally {
    const serializers = getSerializers();
    const serializerIndex = serializers.indexOf(serializer);
    if (serializerIndex !== -1) {
      serializers.splice(serializerIndex, 1);
    }

    if (originalJasmine) {
      jasmineGlobal.jasmine = originalJasmine;
    } else {
      delete jasmineGlobal.jasmine;
    }
  }
});
