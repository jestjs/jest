/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';

const renderers = {
  link: ({node: _node, ...props}) => <Link {...props} />,
};

// TODO hacky temp solution
function getMarkdown(children) {
  if (children?.type === Translate) {
    return children?.props?.children;
  } else {
    return children;
  }
}

export default function MarkdownBlock({children}) {
  const markdown = getMarkdown(children);
  return (
    <div>
      <span>
        <ReactMarkdown renderers={renderers}>{markdown}</ReactMarkdown>
      </span>
    </div>
  );
}
