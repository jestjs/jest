/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

function wrap(description: string) {
  const indent = '\n      ';
  return indent + description.split(' ').reduce((wrappedDesc, word) => {
    const lastLineIdx = wrappedDesc.length - 1;
    const lastLine = wrappedDesc[lastLineIdx];

    const appendedLastLine = lastLine === '' ? word : (lastLine + ' ' + word);

    if (appendedLastLine.length > 80) {
      wrappedDesc.push(word);
    } else {
      wrappedDesc[lastLineIdx] = appendedLastLine;
    }

    return wrappedDesc;
  }, ['']).join(indent);
}

const warnAboutUnrecognizedOptions = (argv: Object, options: Object) => {
  const yargsSpecialOptions = ['$0', '_'];
  const allowedOptions = Object.keys(options).reduce((acc, option) => (
    acc
      .add(option)
      .add(options[option].alias)
  ), new Set(yargsSpecialOptions));
  const unrecognizedOptions = Object.keys(argv).filter(arg => (
    !allowedOptions.has(arg)
  ));
  if (unrecognizedOptions.length) {
    console.warn(
      'Unrecognized options: ' + unrecognizedOptions.join(', ')
    );
  }
};

module.exports = {
  warnAboutUnrecognizedOptions,
  wrap,
};
