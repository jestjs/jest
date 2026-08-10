/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import versions from '@site/versions.json';
import ArchivedVersions from '@site/archivedVersions.json';

// TODO legacy Docusaurus v1 components
import Container from '@site/src/components/v1/Container';

export default function VersionsPage() {
  const {siteConfig} = useDocusaurusContext();
  const latestVersion = versions[0];
  return (
    <Layout>
      <div className="wrapperV1">
        <Container className="mainContainerV1">
          <div>
            <header>
              <h2>{`${siteConfig.title} Versions`}</h2>
            </header>
            <h3 id="latest">Current version (Stable)</h3>
            <p>Latest stable version of Jest</p>
            <table>
              <tbody>
                <tr>
                  <th>{latestVersion}</th>
                  <td>
                    <Link to="/docs/getting-started">Documentation</Link>
                  </td>
                  <td>
                    <a href="https://github.com/jestjs/jest/blob/main/CHANGELOG.md">
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
            <table>
              <tbody>
                <tr>
                  <th>main</th>
                  <td>
                    <Link to="/docs/next/getting-started">Documentation</Link>
                  </td>
                  <td>
                    <a href="https://github.com/jestjs/jest">Source Code</a>
                  </td>
                </tr>
              </tbody>
            </table>
            <h3 id="archive">Past Versions</h3>
            <p>
              Here you can find documentation for previous versions of Jest.
            </p>
            <table>
              <tbody>
                {versions.map(
                  version =>
                    version !== latestVersion && (
                      <tr key={version}>
                        <th>{version}</th>
                        <td>
                          <Link to={`/docs/${version}/getting-started`}>
                            Documentation
                          </Link>
                        </td>
                      </tr>
                    )
                )}
              </tbody>
            </table>
            <h3 id="archive">Archived Versions</h3>
            <p>
              Here you can find archived documentation for older versions of
              Jest.
            </p>
            <table>
              <tbody>
                {Object.entries(ArchivedVersions).map(
                  ([version, versionUrl]) =>
                    version !== latestVersion && (
                      <tr key={version}>
                        <th>{version}</th>
                        <td>
                          <Link to={versionUrl}>Documentation</Link>
                        </td>
                      </tr>
                    )
                )}
              </tbody>
            </table>
          </div>
        </Container>
      </div>
    </Layout>
  );
}
