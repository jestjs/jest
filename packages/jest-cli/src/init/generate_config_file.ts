/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Config} from '@jest/types';
import {defaults, descriptions} from 'jest-config';

const stringifyOption = (
  option: keyof Config.InitialOptions,
  map: Partial<Config.InitialOptions>,
  linePrefix: string = '',
): string => {
  const optionDescription = `  // ${descriptions[option]}`;
  const stringifiedObject = `${option}: ${JSON.stringify(
    map[option],
    null,
    2,
  )}`;

  return (
    optionDescription +
    '\n' +
    stringifiedObject
      .split('\n')
      .map(line => '  ' + linePrefix + line)
      .join('\n') +
    ',\n'
  );
};

const generateConfigFile = (
  results: Record<string, unknown>,
  generateEsm = false,
): string => {
  const {coverage, coverageProvider, clearMocks, environment} = results;

  const overrides: Record<string, any> = {};

  if (coverage) {
    Object.assign(overrides, {
      coverageDirectory: 'coverage',
    });
  }

  if (coverageProvider === 'v8') {
    Object.assign(overrides, {
      coverageProvider: 'v8',
    });
  }

  if (environment === 'node') {
    Object.assign(overrides, {
      testEnvironment: 'node',
    });
  }

  if (clearMocks) {
    Object.assign(overrides, {
      clearMocks: true,
    });
  }

  const overrideKeys = Object.keys(overrides) as Array<
    keyof Config.InitialOptions
  >;

  const properties: Array<string> = [];

  for (const option in descriptions) {
    const opt = option as keyof typeof descriptions;

    if (overrideKeys.includes(opt)) {
      properties.push(stringifyOption(opt, overrides));
    } else {
      properties.push(
        stringifyOption(opt, defaults as Config.InitialOptions, '// '),
      );
    }
  }

  return (
    '// For a detailed explanation regarding each configuration property, visit:\n' +
    '// https://jestjs.io/docs/en/configuration.html\n\n' +
    (generateEsm ? 'export default {\n' : 'module.exports = {\n') +
    properties.join('\n') +
    '};\n'
  );
};

export default generateConfigFile;
