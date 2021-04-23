const {runCLI} = require('@jest/core');

const config = {
  projects: [
    {testMatch: ['<rootDir>/client/**/*.test.js']},
    {testMatch: ['<rootDir>/server/**/*.test.js']},
  ],
};

runCLI({config: JSON.stringify(config)}, [process.cwd()])
  .then(() => console.log('✅ Done'))
  .catch(err => {
    console.error(err);
    process.exitCode = 1;
  });
