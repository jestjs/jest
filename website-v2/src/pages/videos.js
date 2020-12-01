/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Layout from '@theme/Layout';

const {Container, MarkdownBlock} = {
  Container: props => <div {...props}></div>,
  GridBlock: props => <div {...props}></div>,
  MarkdownBlock: props => <div {...props}></div>,
};

const Translate = props => <div {...props}></div>;

class Video extends React.PureComponent {
  render() {
    const {videoTypes, url, type} = this.props;

    switch (type) {
      case videoTypes.YOUTUBE: {
        return (
          <iframe
            width="560"
            height="315"
            src={url}
            frameBorder="0"
            allowFullScreen
          />
        );
      }
      case videoTypes.IFRAME: {
        return <iframe src={url} />;
      }
      default: {
        return <iframe src={url} />;
      }
    }
  }
}

class Videos extends React.Component {
  render() {
    const {config: siteConfig} = this.props;
    const showcase = siteConfig.customFields.videos.map(
      ({title, description, type, url}, index) => {
        const textMarkup = (
          <div className="blockContent">
            <h2>
              <a href={url}>{title}</a>
            </h2>
            <div>
              <MarkdownBlock>{description}</MarkdownBlock>
            </div>
          </div>
        );
        const videoMarkup = (
          <div className="video">
            <Video
              videoTypes={siteConfig.customFields.videoTypes}
              url={url}
              type={type}
            />
          </div>
        );

        return (
          <Container key={url} padding={['bottom', 'top']}>
            <a className="hash-link" href={`#${title}`} />
            {index % 2 === 0 ? (
              <div className="blockElement imageAlignSide threeByGridBlock">
                {videoMarkup}
                {textMarkup}
              </div>
            ) : (
              <div className="blockElement imageAlignSide threeByGridBlock">
                {textMarkup}
                {videoMarkup}
              </div>
            )}
          </Container>
        );
      },
    );

    return (
      <div className="mainContainer">
        <Container padding={['bottom', 'top']}>
          <div className="showcaseSection">
            <div className="prose">
              <h1>
                <Translate>Talks & Videos</Translate>
              </h1>
              <p>
                <Translate>
                  We understand that reading through docs can be boring
                  sometimes. Here is a community curated list of talks & videos
                  around Jest.
                </Translate>
              </p>
            </div>
          </div>
          {showcase}
          <div style={{textAlign: 'center'}}>
            <a href={siteConfig.customFields.siteConfigUrl} className="button">
              <Translate>Add your favorite talk</Translate>
            </a>
          </div>
        </Container>
      </div>
    );
  }
}

export default props => (
  <Layout>
    <Videos {...props} />
  </Layout>
);
