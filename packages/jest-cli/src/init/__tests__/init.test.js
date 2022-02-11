/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-eval */
import * as path from 'path';
import * as fs from 'graceful-fs';
import prompts from 'prompts';
import {constants} from 'jest-config';
import init from '../';

const {JEST_CONFIG_EXT_ORDER} = constants;

jest.mock('prompts');
jest.mock(
  '../../../../jest-config/build/getCacheDirectory',
  () => () => '/tmp/jest',
);
jest.mock('path', () => ({...jest.requireActual('path'), sep: '/'}));
jest.mock('graceful-fs', () => ({
  ...jest.requireActual('fs'),
  writeFileSync: jest.fn(),
}));

const resolveFromFixture = relativePath =>
  path.resolve(__dirname, 'fixtures', relativePath);

const consoleLog = console.log;

describe('init', () => {
  beforeEach(() => {
    console.log = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    console.log = consoleLog;
  });

  describe('project with package.json and no jest config', () => {
    describe('all questions answered with answer: "No"', () => {
      it('should return the default configuration (an empty config)', async () => {
        prompts.mockReturnValueOnce({});

        await init(resolveFromFixture('only-package-json'));

        const writtenJestConfig = fs.writeFileSync.mock.calls[0][1];

        expect(writtenJestConfig).toMatchSnapshot();

        const evaluatedConfig = eval(writtenJestConfig);

        expect(evaluatedConfig).toEqual({});
      });

      it('should generate empty config with mjs extension', async () => {
        prompts.mockReturnValueOnce({});

        await init(resolveFromFixture('type-module'));

        const writtenJestConfigFilename = fs.writeFileSync.mock.calls[0][0];
        const writtenJestConfig = fs.writeFileSync.mock.calls[0][1];

        expect(path.basename(writtenJestConfigFilename)).toBe(
          'jest.config.mjs',
        );

        expect(typeof writtenJestConfig).toBe('string');
        expect(writtenJestConfig.split('\n')[5]).toBe('export default {');
      });
    });

    describe('some questions answered with answer: "Yes"', () => {
      it('should create configuration for {clearMocks: true}', async () => {
        prompts.mockReturnValueOnce({clearMocks: true});

        await init(resolveFromFixture('only-package-json'));

        const writtenJestConfig = fs.writeFileSync.mock.calls[0][1];
        const evaluatedConfig = eval(writtenJestConfig);

        expect(evaluatedConfig).toEqual({clearMocks: true});
      });

      it('should create configuration for {coverage: true}', async () => {
        prompts.mockReturnValueOnce({coverage: true});

        await init(resolveFromFixture('only-package-json'));

        const writtenJestConfig = fs.writeFileSync.mock.calls[0][1];
        const evaluatedConfig = eval(writtenJestConfig);

        expect(evaluatedConfig).toEqual({
          collectCoverage: true,
          coverageDirectory: 'coverage',
        });
      });

      it('should create configuration for {coverageProvider: "babel"}', async () => {
        prompts.mockReturnValueOnce({coverageProvider: 'babel'});

        await init(resolveFromFixture('only-package-json'));

        const writtenJestConfig = fs.writeFileSync.mock.calls[0][1];
        const evaluatedConfig = eval(writtenJestConfig);
        // should modify when the default coverageProvider will be changed to "v8"
        expect(evaluatedConfig).toEqual({});
      });

      it('should create configuration for {coverageProvider: "v8"}', async () => {
        prompts.mockReturnValueOnce({coverageProvider: 'v8'});

        await init(resolveFromFixture('only-package-json'));

        const writtenJestConfig = fs.writeFileSync.mock.calls[0][1];
        const evaluatedConfig = eval(writtenJestConfig);
        // should modify when the default coverageProvider will be changed to "v8"
        expect(evaluatedConfig).toEqual({coverageProvider: 'v8'});
      });

      it('should create configuration for {environment: "jsdom"}', async () => {
        prompts.mockReturnValueOnce({environment: 'jsdom'});

        await init(resolveFromFixture('only-package-json'));

        const writtenJestConfig = fs.writeFileSync.mock.calls[0][1];
        const evaluatedConfig = eval(writtenJestConfig);
        expect(evaluatedConfig).toEqual({testEnvironment: 'jsdom'});
      });

      it('should create configuration for {environment: "node"}', async () => {
        prompts.mockReturnValueOnce({environment: 'node'});

        await init(resolveFromFixture('only-package-json'));

        const writtenJestConfig = fs.writeFileSync.mock.calls[0][1];
        const evaluatedConfig = eval(writtenJestConfig);
        expect(evaluatedConfig).toEqual({});
      });

      it('should create package.json with configured test command when {scripts: true}', async () => {
        prompts.mockReturnValueOnce({scripts: true});

        await init(resolveFromFixture('only-package-json'));

        const writtenPackageJson = fs.writeFileSync.mock.calls[0][1];

        expect(writtenPackageJson).toMatchSnapshot();
        expect(JSON.parse(writtenPackageJson).scripts.test).toEqual('jest');
      });
    });
  });

  describe('no package json', () => {
    it('should throw an error if there is no package.json file', async () => {
      expect.assertions(1);

      try {
        await init(resolveFromFixture('no-package-json'));
      } catch (error) {
        expect(error.message).toMatch(
          'Could not find a "package.json" file in',
        );
      }
    });
  });

  describe.each(JEST_CONFIG_EXT_ORDER.map(e => e.substring(1)))(
    'has-jest-config-file-%s',
    extension => {
      describe('ask the user whether to override config or not', () => {
        it('user answered with "Yes"', async () => {
          prompts.mockReturnValueOnce({continue: true}).mockReturnValueOnce({});

          await init(resolveFromFixture(`has-jest-config-file-${extension}`));

          expect(prompts.mock.calls[0][0]).toMatchSnapshot();

          const jestConfigFileName = fs.writeFileSync.mock.calls[0][0];
          const writtenJestConfig = fs.writeFileSync.mock.calls[0][1];

          expect(jestConfigFileName).toBe(`jest.config.${extension}`);
          expect(writtenJestConfig).toBeDefined();
        });

        it('user answered with "No"', async () => {
          prompts.mockReturnValueOnce({continue: false});

          await init(resolveFromFixture(`has-jest-config-file-${extension}`));
          // return after first prompt
          expect(prompts).toHaveBeenCalledTimes(1);
        });
      });
    },
  );

  describe('project using jest.config.ts', () => {
    describe('ask the user whether he wants to use Typescript or not', () => {
      it('user answered with "Yes"', async () => {
        prompts.mockReturnValueOnce({useTypescript: true});

        await init(resolveFromFixture('test-generated-jest-config-ts'));

        expect(prompts.mock.calls[0][0]).toMatchSnapshot();

        const jestConfigFileName = fs.writeFileSync.mock.calls[0][0];
        const writtenJestConfig = fs.writeFileSync.mock.calls[0][1];

        expect(path.basename(jestConfigFileName)).toBe('jest.config.ts');
        expect(writtenJestConfig.split('\n')[5]).toBe('export default {');
      });

      it('user answered with "No"', async () => {
        prompts.mockReturnValueOnce({useTypescript: false});

        await init(resolveFromFixture('test-generated-jest-config-ts'));

        const jestConfigFileName = fs.writeFileSync.mock.calls[0][0];

        expect(path.basename(jestConfigFileName)).not.toBe('jest.config.ts');
      });
    });
  });

  describe('has jest config in package.json', () => {
    it('should ask the user whether to override config or not', async () => {
      prompts.mockReturnValueOnce({continue: true}).mockReturnValueOnce({});

      await init(resolveFromFixture('has-jest-config-in-package-json'));

      expect(prompts.mock.calls[0][0]).toMatchSnapshot();

      const writtenJestConfig = fs.writeFileSync.mock.calls[0][1];

      expect(writtenJestConfig).toBeDefined();
    });
  });

  describe('already has "jest" in packageJson.scripts.test', () => {
    it('should not ask "test script question"', async () => {
      prompts.mockReturnValueOnce({});

      await init(resolveFromFixture('test-script-configured'));

      const questionsNames = prompts.mock.calls[0][0].map(
        question => question.name,
      );

      expect(questionsNames).not.toContain('scripts');
    });
  });
});
