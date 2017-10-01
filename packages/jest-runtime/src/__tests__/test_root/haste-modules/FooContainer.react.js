/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule FooContainer.react
 */

'use strict';

const Foo = require('Foo.react');

class FooContainer {
  render() {
    return `<div>${new Foo().render()}</div>`;
  }
}

module.exports = FooContainer;
