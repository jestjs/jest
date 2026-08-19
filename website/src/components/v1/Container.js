/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import clsx from 'clsx';

export default function Container({
  background = null,
  padding = [],
  wrapper = true,
  ...props
}) {
  const containerClasses = clsx('containerV1', props.className, {
    darkBackground: background === 'dark',
    highlightBackground: background === 'highlight',
    lightBackground: background === 'light',
    paddingAll: padding.includes('all'),
    paddingBottom: padding.includes('bottom'),
    paddingLeft: padding.includes('left'),
    paddingRight: padding.includes('right'),
    paddingTop: padding.includes('top'),
  });
  let wrappedChildren;

  if (wrapper) {
    wrappedChildren = <div className="wrapperV1">{props.children}</div>;
  } else {
    wrappedChildren = props.children;
  }
  return (
    <div className={containerClasses} id={props.id}>
      {wrappedChildren}
    </div>
  );
}
