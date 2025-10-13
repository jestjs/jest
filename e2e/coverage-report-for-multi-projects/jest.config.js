export default {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['./**/index.js', '!./test-e2e/**/*.js'],
  coverageProvider: 'v8',
  coverageThreshold: {
    global: {statements: 80, branches: 80, functions: 80, lines: 80},
  },
  projects: [
    {
      displayName: 'Package 1',
      rootDir: '<rootDir>/packages/package-1',
      testMatch: ['<rootDir>/test-e2e/**/*.e2e.js'],
    },
    {
      displayName: 'Package 2',
      rootDir: '<rootDir>/packages/package-2',
      testMatch: ['<rootDir>/test-e2e/**/*.e2e.js'],
    },
    {
      displayName: 'Package 3',
      rootDir: '<rootDir>/packages/package-3',
      testMatch: ['<rootDir>/test-e2e/**/*.e2e.js'],
      collectCoverage: false,
    },
  ],
};
