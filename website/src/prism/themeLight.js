/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {themes} = require('prism-react-renderer');
const baseTheme = themes.github;

const themeLight = [
  {
    types: ['function'],
    style: {
      color: '#6b2e85',
    },
  },
  {
    types: ['string'],
    style: {
      color: '#c21325',
    },
  },
  {
    types: ['property'],
    style: {
      color: '#82772c',
    },
  },
  {
    types: ['keyword', 'tag'],
    style: {
      color: '#297a29',
    },
  },
  {
    types: ['operator'],
    style: {
      color: '#888',
    },
  },
  {
    types: ['number', 'variable'],
    style: {
      color: '#1373c2',
    },
  },
  {
    types: ['inserted'],
    style: {
      color: '#397300',
      background: '#baeeba',
    },
  },
];

module.exports = {
  plain: Object.assign(baseTheme.plain, {backgroundColor: '#f6f6f6'}),
  styles: [...baseTheme.styles, ...themeLight],
};
