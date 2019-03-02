/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {wrap} from 'jest-snapshot-serializer-raw';
import logDebugMessages from '../log_debug_messages';
import {makeGlobalConfig, makeProjectConfig} from '../../../../../TestUtils';

jest.mock('../../../package.json', () => ({version: 123}));

jest.mock('myRunner', () => ({name: 'My Runner'}), {virtual: true});

const getOutputStream = () =>
  ({
    write(message: string) {
      expect(wrap(message)).toMatchSnapshot();
    },
  } as NodeJS.WriteStream);

it('prints the jest version', () => {
  expect.assertions(1);
  logDebugMessages(
    makeGlobalConfig({watch: true}),
    makeProjectConfig({testRunner: 'myRunner'}),
    getOutputStream(),
  );
});

it('prints the test framework name', () => {
  expect.assertions(1);
  logDebugMessages(
    makeGlobalConfig({watch: true}),
    makeProjectConfig({testRunner: 'myRunner'}),
    getOutputStream(),
  );
});

it('prints the config object', () => {
  expect.assertions(1);
  const globalConfig = makeGlobalConfig({
    watch: true,
  });
  const config = makeProjectConfig({
    automock: false,
    rootDir: '/path/to/dir',
    roots: ['path/to/dir/test'],
    testRunner: 'myRunner',
  });
  logDebugMessages(globalConfig, config, getOutputStream());
});
