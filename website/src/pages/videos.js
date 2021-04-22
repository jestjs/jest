/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Layout from '@theme/Layout';

import Translate from '@docusaurus/Translate';

// TODO legacy Docusaurus v1 components
import Container from '@site/src/components/v1/Container';
import MarkdownBlock from '@site/src/components/v1/MarkdownBlock';

import VideosJSON from '@site/videos.json';
import styles from './videos.module.css';

const VideoTypes = {
  YOUTUBE: 'youtube',
  IFRAME: 'iframe',
};

class Video extends React.PureComponent {
  render() {
    const {url, type} = this.props;
    switch (type) {
      case VideoTypes.YOUTUBE: {
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
      case VideoTypes.IFRAME: {
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
    const showcase = VideosJSON.videos.map(
      ({title, description, type, url}, index) => {
        const textMarkup = (
          <div className="blockContent padding-horiz--lg">
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
            <Video url={url} type={type} />
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
      }
    );

    return (
      <div className="mainContainerV1">
        <Container padding={['bottom', 'top']}>
          <div className={styles.showcaseSection}>
            <div className={styles.prose}>
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
            <a
              href={VideosJSON.editUrl}
              className="button button--primary button--outline"
            >
              <Translate>Add your favorite talk</Translate>
            </a>
          </div>
        </Container>
      </div>
    );
  }
}

export default function VideosPage(props) {
  return (
    <Layout>
      <Videos {...props} />
    </Layout>
  );
}
