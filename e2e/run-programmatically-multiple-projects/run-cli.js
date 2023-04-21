/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {runCLI} = require('jest');

const config = {
  projects: [
    {testEnvironment: 'jsdom', testMatch: ['<rootDir>/client/**/*.test.js']},
    {testEnvironment: 'node', testMatch: ['<rootDir>/server/**/*.test.js']},
  ],
};

runCLI({config: JSON.stringify(config)}, [process.cwd()])
  .then(() =>
    console.log('run-programmatically-cli-multiple-projects completed'),
  )
  .catch(err => {
    console.error(err);
    process.exitCode = 1;
  });
