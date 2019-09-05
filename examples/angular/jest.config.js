module.exports = {
  globals: {
    'ts-jest': {
      tsConfig: '<rootDir>/tsconfig.json',
    },
  },
  moduleFileExtensions: ['ts', 'html', 'js', 'json'],
  setupFilesAfterEnv: ['<rootDir>/setupJest.js'],
  transform: {
    '^.+\\.(ts|js|html)$': 'ts-jest',
  },
};
