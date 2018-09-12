module.exports = {
  // babelrcRoots: ['.', 'packages/*', 'examples/*'],
  plugins: [
    // Required by some examples, like react-native. Without this plugin,
    // they will simply crash before relative configs can be found.
    // '@babel/plugin-proposal-class-properties',
    ['@babel/plugin-transform-modules-commonjs', {allowTopLevelThis: true}],
  ],
  presets: [
    [
      '@babel/preset-env',
      {
        shippedProposals: true,
        targets: {node: '6'},
        useBuiltIns: 'usage',
      },
    ],
    '@babel/preset-flow',
    // Some tests contain JSX
    '@babel/preset-react',
  ],
};
