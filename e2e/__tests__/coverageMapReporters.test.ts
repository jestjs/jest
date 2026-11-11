/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'node:path';
import runJest from '../runJest';

describe.each(['babel', 'v8'])(
  'coverageMap with %s coverage',
  coverageProvider => {
    test.each([false, true])(
      'is ready for custom reporters with default reporter first: %s',
      defaultFirst => {
        const customReporters = [
          ['<rootDir>/reporter.js', {name: 'first'}],
          ['<rootDir>/reporter.js', {name: 'second'}],
        ];
        const {exitCode, stdout} = runJest('coverage-map-reporters', [
          '--config',
          JSON.stringify({
            collectCoverage: true,
            collectCoverageFrom: ['<rootDir>/src/*.js'],
            coverageProvider,
            coverageReporters: [
              path.resolve(
                __dirname,
                '../coverage-map-reporters/coverage-reporter.js',
              ),
            ],
            reporters: defaultFirst
              ? ['default', ...customReporters]
              : [...customReporters, 'default'],
          }),
        ]);

        expect(exitCode).toBe(0);
        expect(
          stdout
            .trim()
            .split('\n')
            .map(line => JSON.parse(line)),
        ).toEqual([
          {event: 'start', name: 'first'},
          {event: 'start', name: 'second'},
          {
            event: 'complete',
            files: {'tested.js': 100, 'untested.js': 0},
            name: 'first',
          },
          {
            event: 'complete',
            files: {'tested.js': 100, 'untested.js': 0},
            name: 'second',
          },
          {event: 'coverage report'},
        ]);
      },
    );

    test('does not collect coverage when disabled', () => {
      const {exitCode, stdout} = runJest('coverage-map-reporters', [
        '--config',
        JSON.stringify({
          coverageProvider,
          reporters: [['<rootDir>/reporter.js', {name: 'custom'}]],
        }),
      ]);

      expect(exitCode).toBe(0);
      expect(
        stdout
          .trim()
          .split('\n')
          .map(line => JSON.parse(line)),
      ).toEqual([
        {event: 'start', name: 'custom'},
        {event: 'complete', files: null, name: 'custom'},
      ]);
    });
  },
);
