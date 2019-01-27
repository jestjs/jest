module.exports = {
  preset: require.resolve('react-native/jest-preset.json'),
  transform: {
    '^.+\\.js$': require.resolve('react-native/jest/preprocessor.js'),
  },
};
