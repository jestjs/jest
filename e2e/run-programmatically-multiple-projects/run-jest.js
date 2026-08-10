/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {runCLI} = require('@jest/core');

const config = {
  projects: [
    {testMatch: ['<rootDir>/client/**/*.test.js']},
    {testMatch: ['<rootDir>/server/**/*.test.js']},
  ],
};

runCLI({config: JSON.stringify(config)}, [process.cwd()])
  .then(() => console.log('run-programmatically-mutiple-projects completed'))
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
