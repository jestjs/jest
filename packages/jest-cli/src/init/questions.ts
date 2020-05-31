/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {PromptObject} from 'prompts';

const defaultQuestions: Array<PromptObject> = [
  {
    choices: [
      {title: 'node', value: 'node'},
      {title: 'jsdom (browser-like)', value: 'jsdom'},
    ],
    initial: 0,
    message: 'Choose the test environment that will be used for testing',
    name: 'environment',
    type: 'select',
  },
  {
    initial: false,
    message: 'Do you want Jest to add coverage reports?',
    name: 'coverage',
    type: 'confirm',
  },
  {
    choices: [
      {title: 'v8', value: 'v8'},
      {title: 'babel', value: 'babel'},
    ],
    initial: 0,
    message: 'Which provider should be used to instrument code for coverage?',
    name: 'coverageProvider',
    type: 'select',
  },
  {
    initial: false,
    message: 'Automatically clear mock calls and instances between every test?',
    name: 'clearMocks',
    type: 'confirm',
  },
];

export default defaultQuestions;

export const testScriptQuestion: PromptObject = {
  initial: true,
  message:
    'Would you like to use Jest when running "test" script in "package.json"?',
  name: 'scripts',
  type: 'confirm',
};
