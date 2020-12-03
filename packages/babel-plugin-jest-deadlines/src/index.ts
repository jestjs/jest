/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {PluginObj, types as babelTypes} from '@babel/core';
import type {Identifier} from '@babel/types';

export default ({
  types: t,
}: {
  types: typeof babelTypes;
}): PluginObj<{
  declareJestObjGetterIdentifier: () => Identifier;
  jestObjGetterIdentifier?: Identifier;
}> => ({
  visitor: {
    AwaitExpression(path) {
      const original = path.node.argument;

      if (!t.isCallExpression(original)) {
        return;
      }

      if (t.isMemberExpression(original.callee)) {
        const member = original.callee;
        if (
          t.isIdentifier(member.object, {name: 'expect'}) &&
          t.isIdentifier(member.property, {name: 'withinDeadline'})
        ) {
          return;
        }
      }

      path.replaceWith(
        t.awaitExpression(
          t.callExpression(
            t.memberExpression(
              t.identifier('expect'),
              t.identifier('withinDeadline'),
            ),
            [path.node.argument],
          ),
        ),
      );
    },
  },
});
