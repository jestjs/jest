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
import GridBlock from '@site/src/components/v1/GridBlock';

class Help extends React.Component {
  render() {
    const supportLinks = [
      {
        content: (
          <Translate>
            Find what you're looking for in our detailed documentation and
            guides.\n\n- Learn how to [get
            started](/docs/en/getting-started.html) with Jest.\n-
            [Troubleshoot](/docs/en/troubleshooting.html) problems with Jest.\n-
            Learn how to [configure Jest](/docs/en/configuration.html).\n- Look
            at the full [API Reference](/docs/en/api.html).
          </Translate>
        ),
        title: <Translate>Browse the docs</Translate>,
      },
      {
        content: (
          <Translate>
            Ask questions and find answers from other Jest users like you.\n\n-
            Join the `#testing` channel on
            [Reactiflux](https://www.reactiflux.com/), a Discord community.\n-
            Many members of the community use Stack Overflow. Read through the
            [existing
            questions](https://stackoverflow.com/questions/tagged/jestjs) tagged
            with **jestjs** or [ask your
            own](https://stackoverflow.com/questions/ask)!
          </Translate>
        ),
        title: <Translate>Join the community</Translate>,
      },
      {
        content: (
          <Translate>
            Find out what's new with Jest.\n\n- Follow
            [Jest](https://twitter.com/fbjest) on Twitter.\n- Subscribe to the
            [Jest blog](/blog/).\n- Look at the
            [changelog](https://github.com/facebook/jest/blob/master/CHANGELOG.md).
          </Translate>
        ),
        title: <Translate>Stay up to date</Translate>,
      },
    ];

    return (
      <div className="docMainWrapper wrapper">
        <Container className="mainContainer documentContainer postContainer">
          <div className="post">
            <header className="postHeader">
              <h2>
                <Translate>Need help?</Translate>
              </h2>
            </header>
            <p>
              <Translate>
                Jest is worked on full-time by Facebook's JavaScript Foundation
                team. Team members are often around and available for questions.
              </Translate>
            </p>
            <GridBlock contents={supportLinks} layout="threeColumn" />
          </div>
        </Container>
      </div>
    );
  }
}

export default function HelpPage(props) {
  return (
    <Layout wrapperClassName="mainContainerV1">
      <Help {...props} />
    </Layout>
  );
}
