/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {build} = require('@jridgewell/build-mapping');
const Handlebars = require('handlebars/dist/cjs/handlebars.js');
const dedent = require('string-dedent');

exports.process = (code, filename) => {
  const pc = Handlebars.precompile(code, {srcName: filename});
  return dedent(build)`
    const Handlebars = require("handlebars/dist/cjs/handlebars.runtime.js");
    module.exports = Handlebars.template(${pc});
  `;
};
