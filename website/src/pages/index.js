/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useEffect} from 'react';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import backers from '@site/backers.json';
import Translate from '@docusaurus/Translate';
import LiteYouTubeEmbed from 'react-lite-youtube-embed';

import {setupLandingAnimation} from '@site/src/pages/animations/_landingAnimation';

// TODO legacy Docusaurus v1 components
import Container from '@site/src/components/v1/Container';
import GridBlock from '@site/src/components/v1/GridBlock';
import MarkdownBlock from '@site/src/components/v1/MarkdownBlock';

import UsersJSON from '@site/users.json';

import styles from './index.module.css';

import GitHubButton from 'react-github-btn';

function TwitterButton() {
  return (
    <a
      href="https://twitter.com/intent/follow?screen_name=jestjs_&region=follow_link"
      target="_blank"
      className={styles['twitter-follow-button']}
    >
      <div className={styles['twitter-follow-button--icon']} />
      Follow @jestjs_
    </a>
  );
}

function GitHubStarButton() {
  return (
    <div className="github-button">
      <GitHubButton
        href="https://github.com/jestjs/jest"
        data-icon="octicon-star"
        data-size="large"
        aria-label="Star facebook/jest on GitHub"
      >
        Star
      </GitHubButton>
    </div>
  );
}

class Button extends React.Component {
  render() {
    return (
      <Link
        className="jest-button"
        to={this.props.href}
        target={this.props.target}
      >
        {this.props.children}
      </Link>
    );
  }
}

const Sponsor = ({
  fromAccount: {name, slug, website, imageUrl},
  totalDonations,
}) => (
  <a
    key={slug}
    className="sponsor-item"
    title={`$${totalDonations.value} by ${name || slug}`}
    target="_blank"
    rel="nofollow noopener"
    href={website || `https://opencollective.com/${slug}`}
  >
    {
      <img
        className="sponsor-avatar"
        src={imageUrl}
        alt={name || slug ? `${name || slug}'s avatar` : 'avatar'}
      />
    }
  </a>
);

const Backer = ({
  fromAccount: {name, slug, website, imageUrl},
  totalDonations,
}) => (
  <a
    key={slug}
    className="backer-item"
    title={`$${totalDonations.value} by ${name || slug}`}
    target="_blank"
    rel="nofollow noopener"
    href={website || `https://opencollective.com/${slug}`}
  >
    {
      <img
        className="backer-avatar"
        src={imageUrl}
        alt={name || slug ? `${name || slug}'s avatar` : 'avatar'}
      />
    }
  </a>
);

class Contributors extends React.Component {
  render() {
    return (
      <div className="opencollective">
        <h3>
          <Translate>Sponsors</Translate>
        </h3>
        <p>
          <Translate>
            Sponsors are those who contribute $100 or more per month to Jest
          </Translate>
        </p>
        <div className="opencollective-avatars">
          {backers
            .filter(b => b.tier && b.tier.slug === 'sponsor')
            .map(Sponsor)}
        </div>
        <h3>
          <Translate>Backers</Translate>
        </h3>
        <p>
          <Translate>
            Backers are those who contribute $2 or more per month to Jest
          </Translate>
        </p>
        <div className="opencollective-avatars">
          {backers
            .filter(
              b =>
                b.tier &&
                b.tier.slug === 'backer' &&
                !b.fromAccount.slug.includes('adult')
            )
            .map(Backer)}
        </div>
      </div>
    );
  }
}

class Card extends React.Component {
  render() {
    const {index} = this.props;
    return (
      <div key={index} className="jest-card-hitslop">
        <div className="jest-card jest-card-running" data-index={index}>
          <div className="jest-card-front">
            <div className="jest-card-label">JEST</div>
            <div className="jest-card-logo-container">
              <div className="jest-card-logo" />
            </div>
            <div className="jest-card-label jest-card-label-reverse">JEST</div>
          </div>
          <div className="jest-card-back">
            <svg viewBox="0 0 200 200" style={{height: 150, width: 150}}>
              <defs>
                <path
                  d="M100 100 m -75 0 a75 75 0 1 0 150 0 a 75 75 0 1 0 -150 0"
                  id="runs-path"
                />
              </defs>
              <circle
                cx="100"
                cy="100"
                r="88"
                stroke="#fff"
                strokeWidth="8"
                fill="#C2A813"
              />
              <g className="run-circle">
                <circle cx="100" cy="100" r="50" fill="#fff" />
                <circle
                  cx="100"
                  cy="100"
                  r="45"
                  fill="#C2A813"
                  className="run-circle"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="35"
                  fill="#fff"
                  className="run-circle"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="25"
                  fill="#C2A813"
                  className="run-circle"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="15"
                  fill="#fff"
                  className="run-circle"
                />
              </g>
              <g
                fill="#fff"
                fontWeight="bold"
                fontSize={26}
                letterSpacing="0.2em"
                className="run-text"
              >
                <text>
                  <textPath xlinkHref="#runs-path" href="#runs-path">
                    RUNS
                  </textPath>
                </text>
                <text transform="rotate(90,100,100)">
                  <textPath xlinkHref="#runs-path" href="#runs-path">
                    RUNS
                  </textPath>
                </text>
                <text transform="rotate(180,100,100)">
                  <textPath xlinkHref="#runs-path" href="#runs-path">
                    RUNS
                  </textPath>
                </text>
                <text transform="rotate(270,100,100)">
                  <textPath xlinkHref="#runs-path" href="#runs-path">
                    RUNS
                  </textPath>
                </text>
              </g>
            </svg>
          </div>
        </div>
      </div>
    );
  }
}

class Hand extends React.Component {
  render() {
    const cards = [0, 1, 2, 3, 4].map(i => <Card key={i} index={i} />);
    return <div className="jest-hand">{cards}</div>;
  }
}

const HeroInteractive = () => (
  <div className="wrapperV1">
    <div className="jest-hero-interactive">
      <div className={styles.socialLinks}>
        <TwitterButton />
        <GitHubStarButton />
      </div>
      <Hand />
      <div className="jest-button-container">
        <Button href={'/docs/getting-started'}>
          <Translate>Get Started</Translate>
        </Button>
        <Button href={'/docs/getting-started'}>
          <Translate>Docs</Translate>
        </Button>
        <Button href={'/docs/configuration'}>
          <Translate>Config</Translate>
        </Button>
        <Button href={'/help'}>
          <Translate>Get help</Translate>
        </Button>
      </div>
    </div>
  </div>
);

class Index extends React.Component {
  render() {
    const {config: siteConfig} = this.props;
    const showcase = UsersJSON.users.map((user, i) => (
      <a href={user.infoLink} key={i}>
        <img src={user.image} title={user.caption} alt={user.caption} />
      </a>
    ));

    return (
      <div>
        <Head>
          <title>
            {siteConfig.title} {siteConfig.titleDelimiter} {siteConfig.tagline}
          </title>
        </Head>
        <HeroInteractive config={siteConfig} />
        <div className="mainContainerV1" style={{padding: 0}}>
          <Container
            padding={['bottom', 'top']}
            background="light"
            className="intro"
          >
            <p>
              <Translate>
                Jest is a delightful JavaScript Testing Framework with a focus
                on simplicity.
              </Translate>
            </p>
            <p>
              <MarkdownBlock>
                <Translate>
                  It works with projects using: [Babel](https://babeljs.io/),
                  [TypeScript](https://www.typescriptlang.org/),
                  [Node](https://nodejs.org/), [React](https://reactjs.org),
                  [Angular](https://angular.io), [Vue](https://vuejs.org) and
                  more!
                </Translate>
              </MarkdownBlock>
            </p>
          </Container>
          <Container padding={['bottom', 'top']} className="features">
            <GridBlock
              align="center"
              className="yellow"
              contents={[
                {
                  content: (
                    <Translate>
                      Jest aims to work out of the box, config free, on most
                      JavaScript projects.
                    </Translate>
                  ),
                  title: <Translate>Zero config</Translate>,
                },
                {
                  content: (
                    <Translate>
                      Make tests which keep track of large objects with ease.
                      Snapshots live either alongside your tests, or embedded
                      inline.
                    </Translate>
                  ),
                  title: <Translate>Snapshots</Translate>,
                },
                {
                  content: (
                    <Translate>
                      Tests are parallelized by running them in their own
                      processes to maximize performance.
                    </Translate>
                  ),
                  title: <Translate>Isolated</Translate>,
                },
                {
                  content: (
                    <Translate>
                      From `it` to `expect` - Jest has the entire toolkit in one
                      place. Well documented, well maintained, well good.
                    </Translate>
                  ),
                  title: <Translate>Great api</Translate>,
                },
              ]}
              layout="fourColumn"
            />
          </Container>

          <Container
            padding={['bottom', 'top']}
            className="section-container lightBackground"
          >
            <GridBlock
              className="green"
              contents={[
                {
                  content: (
                    <Translate>
                      By ensuring your tests have unique global state, Jest can
                      reliably run tests in parallel. To make things quick, Jest
                      runs previously failed tests first and re-organizes runs
                      based on how long test files take.
                    </Translate>
                  ),
                  image: '/img/content/feature-fast.png',
                  imageAlign: 'left',
                  title: <Translate>Fast and safe</Translate>,
                },
              ]}
            />
            {/* Wondering where the image + buttons come from? That's  client-side code in landing.js */}
          </Container>
          <Container padding={['bottom', 'top']} className="section-container">
            <GridBlock
              className="yellow"
              contents={[
                {
                  content: (
                    <Translate>
                      Generate code coverage by adding the flag
                      [`--coverage`](/docs/cli#--coverageboolean). No additional
                      setup needed. Jest can collect code coverage information
                      from entire projects, including untested files.
                    </Translate>
                  ),
                  image: '/img/content/feature-coverage.png',
                  imageAlign: 'right',
                  title: <Translate>Code coverage</Translate>,
                },
              ]}
            />
          </Container>
          <Container
            padding={['bottom', 'top']}
            className="section-container lightBackground"
          >
            <GridBlock
              className="red"
              contents={[
                {
                  content: (
                    <Translate>
                      Jest uses a custom resolver for imports in your tests,
                      making it simple to mock any object outside of your test’s
                      scope. You can use mocked imports with the rich [Mock
                      Functions](/docs/mock-functions) API to spy on function
                      calls with readable test syntax.
                    </Translate>
                  ),
                  image: '/img/content/feature-mocking.png',
                  imageAlign: 'left',
                  title: <Translate>Easy Mocking</Translate>,
                },
              ]}
            />
          </Container>
          <Container padding={['bottom', 'top']} className="section-container">
            <GridBlock
              className="green matchers"
              contents={[
                {
                  content: (
                    <Translate>
                      Tests fail—when they do, Jest provides rich context why.
                      Here are some examples:
                    </Translate>
                  ),
                  image: '/img/content/matchers/toBe.png',
                  imageAlign: 'right',
                  title: <Translate>Great Exceptions</Translate>,
                },
              ]}
            />
          </Container>
          <Container
            padding={['bottom', 'top']}
            background="light"
            className="section-container philosophy"
          >
            <div className="blockElement yellow">
              <div className="blockContent">
                <h2>
                  <Translate>Philosophy</Translate>
                </h2>
              </div>
            </div>
            <div className="blockElement imageAlignSide gridBlock threeByGridBlock bottom-margin philosophy">
              <div className="blockContent">
                <MarkdownBlock>
                  <Translate>
                    Jest is a JavaScript testing framework designed to ensure
                    correctness of any JavaScript codebase. It allows you to
                    write tests with an approachable, familiar and feature-rich
                    API that gives you results quickly.
                  </Translate>
                </MarkdownBlock>
              </div>
              <div className="blockContent">
                <MarkdownBlock>
                  <Translate>
                    Jest is well-documented, requires little configuration and
                    can be extended to match your requirements.
                  </Translate>
                </MarkdownBlock>
                <MarkdownBlock>
                  <Translate>Jest makes testing delightful.</Translate>
                </MarkdownBlock>
                <div className="show-small">
                  <p style={{fontFamily: 'Monaco, Courier, monospace'}}>
                    <Translate>- Jest Core Team</Translate>
                  </p>
                </div>
              </div>
              <div className="blockContent flex-end hide-small">
                <p style={{fontFamily: 'Monaco, Courier, monospace'}}>
                  <Translate>- Jest Core Team</Translate>
                </p>
              </div>
            </div>
          </Container>
          <Container
            padding={['bottom', 'top']}
            className="section-container bottom-margin docs"
          >
            <div className="blockElement imageAlignSide gridBlock video-block">
              <div className="blockContent">
                <div className="video">
                  <LiteYouTubeEmbed id="cAKYQpTC7MA" />
                </div>
              </div>
            </div>
            <div className="blockElement red bottom-margin">
              <div className="blockContent">
                <h2>
                  <Translate>Docs and talks</Translate>
                </h2>
                <MarkdownBlock>
                  <Translate>
                    The Jest core team and contributors regularly speak about
                    [Jest and Delightful JavaScript
                    Testing](https://www.youtube.com/watch?v=cAKYQpTC7MA). Check
                    out our talk about [Building High-Quality JavaScript
                    Tools](https://www.youtube.com/watch?v=PvabBs_utr8) at
                    jsconf.eu 2017 and our talk about [Jest as a
                    Platform](https://www.youtube.com/watch?v=NtjyeojAOBs) at
                    ReactiveConf 2017.
                  </Translate>
                </MarkdownBlock>
              </div>
            </div>
          </Container>
          <Container
            padding={['bottom', 'top']}
            background="light"
            className="section-container community imageAlignSide twoByGridBlock"
          >
            <div className="gridBlockV1 yellow">
              <div className="blockContent">
                <h2>
                  <Translate>Open Collective</Translate>
                </h2>
                <MarkdownBlock>
                  <Translate>
                    With so many users, the core team of Jest uses an [Open
                    Collective](https://opencollective.com/jest) for
                    non-Facebook contributors.
                  </Translate>
                </MarkdownBlock>
                <Contributors />
              </div>
              <div className="blockContent yellow">
                <h2>
                  <Translate>Who uses Jest?</Translate>
                </h2>
                <MarkdownBlock>
                  <Translate>
                    A lot of people! With
                    [93m](https://www.npmjs.com/package/jest) downloads in the
                    last month, and used on over
                    [8,756,000](https://github.com/jestjs/jest/network/dependents)
                    public repos on GitHub. Jest is used extensively at these
                    companies:
                  </Translate>
                </MarkdownBlock>
                <div className="gridBlockV1 logos">
                  {showcase}
                  <p className="others">And many others</p>
                </div>
              </div>
            </div>
          </Container>
        </div>
      </div>
    );
  }
}

export default function IndexPage(props) {
  useEffect(setupLandingAnimation, []);
  return (
    <Layout>
      <Index {...props} />
    </Layout>
  );
}
