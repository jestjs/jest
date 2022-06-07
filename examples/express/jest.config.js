const ts = require('ts-jest/jest-preset')
const merge = require('merge')

module.exports = merge.recursive(ts, {
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  transform: {
    '^.+\\.(js|jsx)?$': 'ts-jest'
  },
  testMatch: [
    '<rootDir>/**/*.test.ts',
  ],
});
