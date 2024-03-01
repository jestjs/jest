/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const dedent = require('dedent');
const Handlebars = require('handlebars/dist/cjs/handlebars.js');

function makeOffset(code) {
  const lines = code.split('\n');

  const line = lines.length;
  const column = lines.at(-1).length;

  return {column, line};
}

exports.process = (inputCode, filename) => {
  const pc = Handlebars.precompile(inputCode, {srcName: filename});

  let code = dedent`
    const Handlebars = require("handlebars/dist/cjs/handlebars.runtime.js");
    module.exports = Handlebars.template(
  `;

  const sections = [
    {
      map: pc.map,
      offset: makeOffset(code),
    },
  ];

  code += pc.code;

  code += ');\n';

  const map = {
    sections,
    version: 3,
  };

  return {code, map};
};
