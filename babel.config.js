module.exports = {
  plugins: [
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
  ],
};
