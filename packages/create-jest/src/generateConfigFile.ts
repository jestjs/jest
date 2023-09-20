/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Config} from '@jest/types';
import {defaults, descriptions} from 'jest-config';
import type {PromptsResults} from './types';

const stringifyOption = (
  option: keyof Config.InitialOptions,
  map: Partial<Config.InitialOptions>,
  linePrefix = '',
): string => {
  const description = descriptions[option];
  const optionDescription =
    description != null && description.length > 0 ? `  // ${description}` : '';
  const stringifiedObject = `${option}: ${JSON.stringify(
    map[option],
    null,
    2,
  )}`;

  return `${optionDescription}\n${stringifiedObject
    .split('\n')
    .map(line => `  ${linePrefix}${line}`)
    .join('\n')},`;
};

const generateConfigFile = (
  results: PromptsResults,
  generateEsm = false,
): string => {
  const {useTypescript, coverage, coverageProvider, clearMocks, environment} =
    results;

  const overrides: Record<string, unknown> = {};

  if (coverage) {
    Object.assign(overrides, {
      collectCoverage: true,
      coverageDirectory: 'coverage',
    });
  }

  if (coverageProvider === 'v8') {
    Object.assign(overrides, {
      coverageProvider: 'v8',
    });
  }

  if (environment === 'jsdom') {
    Object.assign(overrides, {
      testEnvironment: 'jsdom',
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

  const configHeaderMessage = `/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */
`;

  const jsDeclaration = `/** @type {import('jest').Config} */
const config = {`;

  const tsDeclaration = `import type {Config} from 'jest';

const config: Config = {`;

  const cjsExport = 'module.exports = config;';
  const esmExport = 'export default config;';

  return [
    configHeaderMessage,
    useTypescript ? tsDeclaration : jsDeclaration,
    properties.join('\n\n'),
    '};\n',
    useTypescript || generateEsm ? esmExport : cjsExport,
    '',
  ].join('\n');
};

export default generateConfigFile;
