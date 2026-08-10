/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import clsx from 'clsx';
import MarkdownBlock from './MarkdownBlock';

export default function GridBlock(props) {
  function renderBlock(origBlock, i) {
    const blockDefaults = {
      imageAlign: 'left',
    };

    const block = {
      ...blockDefaults,
      ...origBlock,
    };

    const blockClasses = clsx('blockElement', props.className, {
      alignCenter: props.align === 'center',
      alignRight: props.align === 'right',
      fourByGridBlock: props.layout === 'fourColumn',
      imageAlignSide:
        block.image &&
        (block.imageAlign === 'left' || block.imageAlign === 'right'),
      imageAlignTop: block.image && block.imageAlign === 'top',
      imageAlignRight: block.image && block.imageAlign === 'right',
      imageAlignBottom: block.image && block.imageAlign === 'bottom',
      imageAlignLeft: block.image && block.imageAlign === 'left',
      threeByGridBlock: props.layout === 'threeColumn',
      twoByGridBlock: props.layout === 'twoColumn',
    });

    const topLeftImage =
      (block.imageAlign === 'top' || block.imageAlign === 'left') &&
      renderBlockImage(block.image, block.imageLink, block.imageAlt);

    const bottomRightImage =
      (block.imageAlign === 'bottom' || block.imageAlign === 'right') &&
      renderBlockImage(block.image, block.imageLink, block.imageAlt);

    return (
      <div className={blockClasses} key={i}>
        {topLeftImage}
        <div className="blockContent">
          {renderBlockTitle(block.title)}
          <MarkdownBlock>{block.content}</MarkdownBlock>
        </div>
        {bottomRightImage}
      </div>
    );
  }

  function renderBlockImage(image, imageLink, imageAlt) {
    if (!image) {
      return null;
    }

    return (
      <div className="blockImage">
        {imageLink ? (
          <a href={imageLink}>
            <img src={image} alt={imageAlt} />
          </a>
        ) : (
          <img src={image} alt={imageAlt} />
        )}
      </div>
    );
  }

  function renderBlockTitle(title) {
    if (!title) {
      return null;
    }

    return (
      <h2>
        <MarkdownBlock>{title}</MarkdownBlock>
      </h2>
    );
  }

  return <div className="gridBlockV1">{props.contents.map(renderBlock)}</div>;
}

GridBlock.defaultProps = {
  align: 'left',
  contents: [],
  layout: 'twoColumn',
};
