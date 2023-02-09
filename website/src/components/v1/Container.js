/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import clsx from 'clsx';

export default function Container(props) {
  const containerClasses = clsx('containerV1', props.className, {
    darkBackground: props.background === 'dark',
    highlightBackground: props.background === 'highlight',
    lightBackground: props.background === 'light',
    paddingAll: props.padding.indexOf('all') >= 0,
    paddingBottom: props.padding.indexOf('bottom') >= 0,
    paddingLeft: props.padding.indexOf('left') >= 0,
    paddingRight: props.padding.indexOf('right') >= 0,
    paddingTop: props.padding.indexOf('top') >= 0,
  });
  let wrappedChildren;

  if (props.wrapper) {
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

Container.defaultProps = {
  background: null,
  padding: [],
  wrapper: true,
};
