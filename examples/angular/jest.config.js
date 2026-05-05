// eslint-disable-next-line import-x/no-extraneous-dependencies
const {createCjsPreset} = require('jest-preset-angular/presets');

module.exports = {
  ...createCjsPreset({
    diagnostics: {
      // https://github.com/kulshekhar/ts-jest/issues/3820
      ignoreCodes: [151_001],
    },
    tsconfig: '<rootDir>/tsconfig.json',
  }),
  setupFilesAfterEnv: ['<rootDir>/setupJest.js'],
};
