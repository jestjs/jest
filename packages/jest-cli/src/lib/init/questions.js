/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

type Question = {
  intial?: boolean | number,
  message: string,
  name: string,
  type: string,
  choices?: Array<{title: string, value: string}>,
};

const defaultQuestions: Array<Question> = [
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
    initial: false,
    message: 'Automatically clear mock calls and instances between every test?',
    name: 'clearMocks',
    type: 'confirm',
  },
];

export default defaultQuestions;

export const testScriptQuestion: Question = {
  initial: true,
  message:
    'Would you like to use Jest when running "test" script in "package.json"?',
  name: 'scripts',
  type: 'confirm',
};

export const typescriptQuestion: Question = {
  initial: true,
  message: 'Typescript detected, would you like to setup Jest for Typescript?',
  name: 'typescript',
  type: 'confirm',
};
