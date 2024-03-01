/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-eval */
import * as path from 'path';
import {writeFileSync} from 'graceful-fs';
import * as prompts from 'prompts';
import {constants} from 'jest-config';
import {runCreate} from '../runCreate';

const {JEST_CONFIG_EXT_ORDER} = constants;

jest.mock('prompts');
jest.mock('path', () => ({
  ...jest.requireActual<typeof import('path')>('path'),
  sep: '/',
}));
jest.mock('graceful-fs', () => ({
  ...jest.requireActual<typeof import('graceful-fs')>('graceful-fs'),
  writeFileSync: jest.fn(),
}));

const resolveFromFixture = (relativePath: string) =>
  path.resolve(__dirname, '__fixtures__', relativePath);

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
        jest.mocked(prompts).mockResolvedValueOnce({});

        await runCreate(resolveFromFixture('only-package-json'));

        const writtenJestConfigFilename =
          jest.mocked(writeFileSync).mock.calls[0][0];
        const writtenJestConfig = jest.mocked(writeFileSync).mock.calls[0][1];

        expect(path.basename(writtenJestConfigFilename as string)).toBe(
          'jest.config.js',
        );
        expect(
          (writtenJestConfig as string).replace(
            /\/\/ cacheDirectory: .*,/,
            '// cacheDirectory: "/tmp/jest",',
          ),
        ).toMatchSnapshot();

        const evaluatedConfig = eval(writtenJestConfig as string) as Record<
          string,
          unknown
        >;

        expect(evaluatedConfig).toEqual({});
      });

      it('should generate empty config with mjs extension', async () => {
        jest.mocked(prompts).mockResolvedValueOnce({});

        await runCreate(resolveFromFixture('type-module'));

        const writtenJestConfigFilename =
          jest.mocked(writeFileSync).mock.calls[0][0];
        const writtenJestConfig = jest.mocked(writeFileSync).mock.calls[0][1];

        expect(path.basename(writtenJestConfigFilename as string)).toBe(
          'jest.config.mjs',
        );
        expect(
          (writtenJestConfig as string).replace(
            /\/\/ cacheDirectory: .*,/,
            '// cacheDirectory: "/tmp/jest",',
          ),
        ).toMatchSnapshot();
      });
    });

    describe('some questions answered with answer: "Yes"', () => {
      it('should create configuration for {clearMocks: true}', async () => {
        jest.mocked(prompts).mockResolvedValueOnce({clearMocks: true});

        await runCreate(resolveFromFixture('only-package-json'));

        const writtenJestConfig = jest.mocked(writeFileSync).mock.calls[0][1];
        const evaluatedConfig = eval(writtenJestConfig as string) as Record<
          string,
          unknown
        >;

        expect(evaluatedConfig).toEqual({clearMocks: true});
      });

      it('should create configuration for {coverage: true}', async () => {
        jest.mocked(prompts).mockResolvedValueOnce({coverage: true});

        await runCreate(resolveFromFixture('only-package-json'));

        const writtenJestConfig = jest.mocked(writeFileSync).mock.calls[0][1];
        const evaluatedConfig = eval(writtenJestConfig as string) as Record<
          string,
          unknown
        >;

        expect(evaluatedConfig).toEqual({
          collectCoverage: true,
          coverageDirectory: 'coverage',
        });
      });

      it('should create configuration for {coverageProvider: "babel"}', async () => {
        jest.mocked(prompts).mockResolvedValueOnce({coverageProvider: 'babel'});

        await runCreate(resolveFromFixture('only-package-json'));

        const writtenJestConfig = jest.mocked(writeFileSync).mock.calls[0][1];
        const evaluatedConfig = eval(writtenJestConfig as string) as Record<
          string,
          unknown
        >;
        // should modify when the default coverageProvider will be changed to "v8"
        expect(evaluatedConfig).toEqual({});
      });

      it('should create configuration for {coverageProvider: "v8"}', async () => {
        jest.mocked(prompts).mockResolvedValueOnce({coverageProvider: 'v8'});

        await runCreate(resolveFromFixture('only-package-json'));

        const writtenJestConfig = jest.mocked(writeFileSync).mock.calls[0][1];
        const evaluatedConfig = eval(writtenJestConfig as string) as Record<
          string,
          unknown
        >;
        // should modify when the default coverageProvider will be changed to "v8"
        expect(evaluatedConfig).toEqual({coverageProvider: 'v8'});
      });

      it('should create configuration for {environment: "jsdom"}', async () => {
        jest.mocked(prompts).mockResolvedValueOnce({environment: 'jsdom'});

        await runCreate(resolveFromFixture('only-package-json'));

        const writtenJestConfig = jest.mocked(writeFileSync).mock.calls[0][1];
        const evaluatedConfig = eval(writtenJestConfig as string) as Record<
          string,
          unknown
        >;
        expect(evaluatedConfig).toEqual({testEnvironment: 'jsdom'});
      });

      it('should create configuration for {environment: "node"}', async () => {
        jest.mocked(prompts).mockResolvedValueOnce({environment: 'node'});

        await runCreate(resolveFromFixture('only-package-json'));

        const writtenJestConfig = jest.mocked(writeFileSync).mock.calls[0][1];
        const evaluatedConfig = eval(writtenJestConfig as string) as Record<
          string,
          unknown
        >;
        expect(evaluatedConfig).toEqual({});
      });

      it('should create package.json with configured test command when {scripts: true}', async () => {
        jest.mocked(prompts).mockResolvedValueOnce({scripts: true});

        await runCreate(resolveFromFixture('only-package-json'));

        const writtenPackageJson = jest.mocked(writeFileSync).mock.calls[0][1];
        const parsedPackageJson = JSON.parse(writtenPackageJson as string) as {
          scripts: {test: string};
        };

        expect(writtenPackageJson).toMatchSnapshot();
        expect(parsedPackageJson.scripts.test).toBe('jest');
      });
    });
  });

  describe('no package json', () => {
    it('should throw an error if there is no package.json file', async () => {
      expect.assertions(1);

      try {
        await runCreate(resolveFromFixture('no-package-json'));
      } catch (error) {
        expect((error as Error).message).toMatch(
          'Could not find a "package.json" file in',
        );
      }
    });
  });

  describe.each(JEST_CONFIG_EXT_ORDER.map(e => e.slice(1)))(
    'has-jest-config-file-%s',
    extension => {
      describe('ask the user whether to override config or not', () => {
        it('user answered with "Yes"', async () => {
          jest
            .mocked(prompts)
            .mockResolvedValueOnce({continue: true})
            .mockResolvedValueOnce({});

          await runCreate(
            resolveFromFixture(`has-jest-config-file-${extension}`),
          );

          expect(jest.mocked(prompts).mock.calls[0][0]).toMatchSnapshot();

          const jestConfigFileName =
            jest.mocked(writeFileSync).mock.calls[0][0];
          const writtenJestConfig = jest.mocked(writeFileSync).mock.calls[0][1];

          expect(jestConfigFileName).toBe(`jest.config.${extension}`);
          expect(writtenJestConfig).toBeDefined();
        });

        it('user answered with "No"', async () => {
          jest.mocked(prompts).mockResolvedValueOnce({continue: false});

          await runCreate(
            resolveFromFixture(`has-jest-config-file-${extension}`),
          );
          // return after first prompt
          expect(prompts).toHaveBeenCalledTimes(1);
        });
      });
    },
  );

  describe('project using jest.config.ts', () => {
    describe('ask the user whether he wants to use Typescript or not', () => {
      it('user answered with "Yes"', async () => {
        jest.mocked(prompts).mockResolvedValueOnce({useTypescript: true});

        await runCreate(resolveFromFixture('test-generated-jest-config-ts'));

        expect(jest.mocked(prompts).mock.calls[0][0]).toMatchSnapshot();

        const jestConfigFileName = jest.mocked(writeFileSync).mock.calls[0][0];
        const writtenJestConfig = jest.mocked(writeFileSync).mock.calls[0][1];

        expect(path.basename(jestConfigFileName as string)).toBe(
          'jest.config.ts',
        );
        expect(
          (writtenJestConfig as string).replace(
            /\/\/ cacheDirectory: .*,/,
            '// cacheDirectory: "/tmp/jest",',
          ),
        ).toMatchSnapshot();
      });

      it('user answered with "No"', async () => {
        jest.mocked(prompts).mockResolvedValueOnce({useTypescript: false});

        await runCreate(resolveFromFixture('test-generated-jest-config-ts'));

        const jestConfigFileName = jest.mocked(writeFileSync).mock.calls[0][0];

        expect(path.basename(jestConfigFileName as string)).not.toBe(
          'jest.config.ts',
        );
      });
    });
  });

  describe('has jest config in package.json', () => {
    it('should ask the user whether to override config or not', async () => {
      jest
        .mocked(prompts)
        .mockResolvedValueOnce({continue: true})
        .mockResolvedValueOnce({});

      await runCreate(resolveFromFixture('has-jest-config-in-package-json'));

      expect(jest.mocked(prompts).mock.calls[0][0]).toMatchSnapshot();

      const writtenJestConfig = jest.mocked(writeFileSync).mock.calls[0][1];

      expect(writtenJestConfig).toBeDefined();
    });
  });

  describe('already has "jest" in packageJson.scripts.test', () => {
    it('should not ask "test script question"', async () => {
      jest.mocked(prompts).mockResolvedValueOnce({});

      await runCreate(resolveFromFixture('test-script-configured'));

      const questions = jest.mocked(prompts).mock.calls[0][0] as Array<
        prompts.PromptObject<string>
      >;
      const questionsNames = questions.map(question => question.name);

      expect(questionsNames).not.toContain('scripts');
    });
  });
});
