/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'node:path';
import chalk from 'chalk';
import exit from 'exit-x';
import * as fs from 'graceful-fs';
import prompts from 'prompts';
import {constants} from 'jest-config';
import {clearLine, tryRealpath} from 'jest-util';
import {MalformedPackageJsonError, NotFoundPackageJsonError} from './errors';
import generateConfigFile from './generateConfigFile';
import modifyPackageJson from './modifyPackageJson';
import defaultQuestions, {testScriptQuestion} from './questions';
import type {ProjectPackageJson, PromptsResults} from './types';

const {
  JEST_CONFIG_BASE_NAME,
  JEST_CONFIG_EXT_MJS,
  JEST_CONFIG_EXT_JS,
  JEST_CONFIG_EXT_TS,
  JEST_CONFIG_SEARCH_PLACES,
  PACKAGE_JSON,
} = constants;

const getConfigFilename = (ext: string) => JEST_CONFIG_BASE_NAME + ext;

export async function runCLI(): Promise<void> {
  try {
    const rootDir = process.argv[2];
    await runCreate(rootDir);
  } catch (error: unknown) {
    clearLine(process.stderr);
    clearLine(process.stdout);
    if (error instanceof Error && Boolean(error?.stack)) {
      console.error(chalk.red(error.stack));
    } else {
      console.error(chalk.red(error));
    }

    exit(1);
    throw error;
  }
}

export async function runCreate(rootDir = process.cwd()): Promise<void> {
  rootDir = tryRealpath(rootDir);
  // prerequisite checks
  const projectPackageJsonPath = path.join(rootDir, PACKAGE_JSON);

  if (!fs.existsSync(projectPackageJsonPath)) {
    throw new NotFoundPackageJsonError(rootDir);
  }

  const questions = [...defaultQuestions];
  let hasJestProperty = false;
  let projectPackageJson: ProjectPackageJson;

  try {
    projectPackageJson = JSON.parse(
      fs.readFileSync(projectPackageJsonPath, 'utf8'),
    ) as ProjectPackageJson;
  } catch {
    throw new MalformedPackageJsonError(projectPackageJsonPath);
  }

  if (projectPackageJson.jest) {
    hasJestProperty = true;
  }

  const existingJestConfigPlaces = JEST_CONFIG_SEARCH_PLACES.filter(
    place => place !== PACKAGE_JSON && fs.existsSync(path.join(rootDir, place)),
  );

  if (hasJestProperty || existingJestConfigPlaces.length > 0) {
    const result: {continue: boolean} = await prompts({
      initial: true,
      message:
        'It seems that you already have a jest configuration, do you want to override it?',
      name: 'continue',
      type: 'confirm',
    });

    if (!result.continue) {
      console.log();
      console.log('Aborting...');
      return;
    }
  }

  // Add test script installation only if needed
  if (projectPackageJson.scripts?.test !== 'jest') {
    questions.unshift(testScriptQuestion);
  }

  // Start the init process
  console.log();
  console.log(
    chalk.underline(
      'The following questions will help Jest to create a suitable configuration for your project\n',
    ),
  );

  let promptAborted = false;

  const results = (await prompts(questions, {
    onCancel: () => {
      promptAborted = true;
    },
  })) as PromptsResults;

  if (promptAborted) {
    console.log();
    console.log('Aborting...');
    return;
  }

  // Determine if Jest should use JS or TS for the config file
  const jestConfigFileExt = results.useTypescript
    ? JEST_CONFIG_EXT_TS
    : projectPackageJson.type === 'module'
      ? JEST_CONFIG_EXT_MJS
      : JEST_CONFIG_EXT_JS;

  // Determine Jest config path
  const generatedConfigPath = path.join(
    rootDir,
    getConfigFilename(jestConfigFileExt),
  );
  const existingJestConfigPaths = existingJestConfigPlaces.map(place =>
    path.join(rootDir, place),
  );
  const jestConfigPath = generatedConfigPath;

  const shouldModifyScripts = results.scripts;

  if (shouldModifyScripts || hasJestProperty) {
    const modifiedPackageJson = modifyPackageJson({
      projectPackageJson,
      shouldModifyScripts,
    });

    fs.writeFileSync(projectPackageJsonPath, modifiedPackageJson);

    console.log('');
    console.log(`✏️  Modified ${chalk.cyan(projectPackageJsonPath)}`);
  }

  const generatedConfig = generateConfigFile(
    results,
    projectPackageJson.type === 'module' ||
      jestConfigPath.endsWith(JEST_CONFIG_EXT_MJS),
  );

  fs.writeFileSync(jestConfigPath, generatedConfig);

  for (const existingConfigPath of existingJestConfigPaths) {
    if (existingConfigPath !== jestConfigPath) {
      fs.unlinkSync(existingConfigPath);
    }
  }

  console.log('');
  console.log(
    `📝  Configuration file created at ${chalk.cyan(jestConfigPath)}`,
  );
}
