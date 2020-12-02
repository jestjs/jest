/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable import/order */
/* eslint-disable import/no-unresolved */
import React from 'react';
import versions from '@site/versions.json';
import Layout from '@theme/Layout';

// TODO legacy Docusaurus v1 components
import Container from '@site/src/components/v1/Container';

class Versions extends React.Component {
  render() {
    const {config: siteConfig} = this.props;
    const latestVersion = versions[0];
    const {language} = this.props;
    return (
      <div className="docMainWrapper wrapperV1">
        <Container className="mainContainerV1 versionsContainer">
          <div className="post">
            <header className="postHeader">
              <h2>{siteConfig.title + ' Versions'}</h2>
            </header>
            <h3 id="latest">Current version (Stable)</h3>
            <p>Latest stable version of Jest</p>
            <table className="versions">
              <tbody>
                <tr>
                  <th>{latestVersion}</th>
                  <td>
                    <a
                      href={`${siteConfig.baseUrl}docs/${language}/getting-started.html`}
                    >
                      Documentation
                    </a>
                  </td>
                  <td>
                    <a href="https://github.com/facebook/jest/blob/master/CHANGELOG.md">
                      Release Notes
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
            <h3 id="rc">Latest version</h3>
            <p>
              Here you can find the latest unreleased documentation and code.
            </p>
            <table className="versions">
              <tbody>
                <tr>
                  <th>master</th>
                  <td>
                    <a
                      href={`${siteConfig.baseUrl}docs/${language}/next/getting-started.html`}
                    >
                      Documentation
                    </a>
                  </td>
                  <td>
                    <a href="https://github.com/facebook/jest">Source Code</a>
                  </td>
                </tr>
              </tbody>
            </table>
            <h3 id="archive">Past Versions</h3>
            <p>
              Here you can find documentation for previous versions of Jest.
            </p>
            <table className="versions">
              <tbody>
                {versions.map(
                  version =>
                    version !== latestVersion && (
                      <tr key={version}>
                        <th>{version}</th>
                        <td>
                          <a
                            href={`${siteConfig.baseUrl}docs/${language}/${version}/getting-started.html`}
                          >
                            Documentation
                          </a>
                        </td>
                      </tr>
                    ),
                )}
              </tbody>
            </table>
          </div>
        </Container>
      </div>
    );
  }
}

export default function VersionsPage(props) {
  return (
    <Layout>
      <Versions {...props} />
    </Layout>
  );
}
