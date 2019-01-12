/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const React = require('react');

const CompLibrary = require('../../core/CompLibrary.js');
const MarkdownBlock = CompLibrary.MarkdownBlock; /* Used to read markdown */
const Container = CompLibrary.Container;
const GridBlock = CompLibrary.GridBlock;

const translate = require('../../server/translate.js').translate;
const backers = require(process.cwd() + '/backers.json');
const siteConfig = require(process.cwd() + '/siteConfig.js');
const getUrl = (url, language) => siteConfig.baseUrl + 'docs/' + language + url;

class Button extends React.Component {
  render() {
    return (
      <a
        className="jest-button"
        href={this.props.href}
        target={this.props.target}
      >
        {this.props.children}
      </a>
    );
  }
}

Button.defaultProps = {
  target: '_self',
};

class Contributors extends React.Component {
  render() {
    return (
      <div className="opencollective">
        <h3>
          <translate>Sponsors</translate>
        </h3>
        <p>
          <translate>
            Sponsors are those who contribute $100 or more per month to Jest
          </translate>
        </p>
        <div>
          {backers
            .filter(b => b.tier === 'sponsor')
            .map(b => (
              <a
                key={b.id}
                className="sponsor-item"
                title={`$${b.totalDonations / 100} by ${b.name || b.slug}`}
                target="_blank"
                href={b.website || `https://opencollective.com/${b.slug}`}
              >
                {
                  <img
                    className="sponsor-avatar"
                    src={b.avatar}
                    alt={
                      b.name || b.slug
                        ? `${b.name || b.slug}'s avatar`
                        : 'avatar'
                    }
                  />
                }
              </a>
            ))}
        </div>
        <h3>
          <translate>Backers</translate>
        </h3>
        <p>
          <translate>
            Backers are those who contribute $2 or more per month to Jest
          </translate>
        </p>
        <div>
          {backers
            .filter(b => b.tier === 'backer')
            .map(b => (
              <a
                key={b.id}
                className="backer-item"
                title={`$${b.totalDonations / 100} by ${b.name || b.slug}`}
                target="_blank"
                href={b.website || `https://opencollective.com/${b.slug}`}
              >
                {
                  <img
                    className="backer-avatar"
                    src={b.avatar}
                    alt={
                      b.name || b.slug
                        ? `${b.name || b.slug}'s avatar`
                        : 'avatar'
                    }
                  />
                }
              </a>
            ))}
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
    return (
      <div className="jest-hand">
        {cards}
        <script src="landing.js" />
      </div>
    );
  }
}

const HeroInteractive = ({config: {repoUrl}, language}) => (
  <div className="wrapper">
    <div className="jest-hero-interactive">
      <div className="hero-github-button-container">
        <a
          className="github-button"
          href={repoUrl}
          data-icon="octicon-star"
          data-count-href="/facebook/jest/stargazers"
          data-show-count={true}
          data-count-aria-label="# stargazers on GitHub"
          aria-label="Star facebook/jest on GitHub"
        >
          Star
        </a>
      </div>
      <Hand />
      <div className="jest-button-container">
        <Button href={getUrl('/getting-started.html', language)}>
          <translate>Get Started</translate>
        </Button>
        <Button href={getUrl('/getting-started.html', language)}>
          <translate>Docs</translate>
        </Button>
        <Button href={getUrl('/configuration', language)}>
          <translate>Config</translate>
        </Button>
        <Button href={getUrl('/help', language)}>
          <translate>Get help</translate>
        </Button>
      </div>
    </div>
  </div>
);

class Index extends React.Component {
  render() {
    const showcase = siteConfig.users.map((user, i) => (
      <a href={user.infoLink} key={i}>
        <img src={user.image} title={user.caption} />
      </a>
    ));

    return (
      <div>
        <HeroInteractive language={this.props.language} config={siteConfig} />
        <div className="mainContainer" style={{paddingTop: 0}}>
          <Container
            padding={['bottom', 'top']}
            background="light"
            className="intro"
          >
            <p>
              <translate>
                Jest is a delightful JavaScript Testing Framework with a focus
                on simplicity
              </translate>
            </p>
            <p>
              <MarkdownBlock>
                <translate>
                  It works with projects using: [Babel](https://babeljs.io/),
                  [TypeScript](https://www.typescriptlang.org/),
                  [Node](https://nodejs.org/en/), [React](https://reactjs.org),
                  [Angular](https://angularjs.org), [Vue](https://vuejs.org) and
                  more!
                </translate>
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
                    <translate>
                      Jest’s core design philosophy is to work out of the box,
                      config free, on most JavaScript projects.
                    </translate>
                  ),
                  title: <translate>Zero config</translate>,
                },
                {
                  content: (
                    <translate>
                      With a watch mode built into Jest, pressing save on a test
                      file can trigger a re-run of your dependent tests.
                    </translate>
                  ),
                  title: <translate>Blazing</translate>,
                },
                {
                  content: (
                    <translate>
                      Make tests which keep track of large objects with ease.
                      Snapshots live either alongside your tests, or embeddded
                      inline.
                    </translate>
                  ),
                  title: <translate>Snapshots</translate>,
                },
                {
                  content: (
                    <translate>
                      Tests runs parallel in their own processes to maximize
                      performance.
                    </translate>
                  ),
                  title: <translate>Isolated</translate>,
                },
                {
                  content: (
                    <translate>
                      From `it` to `expect` - Jest has the entire toolkit in one
                      place. Well documented, well maintained, well good.
                    </translate>
                  ),
                  title: <translate>Great api</translate>,
                },
              ]}
              layout="fourColumn"
            />
          </Container>
          <Container
            padding={['bottom', 'top']}
            background="light"
            className="section-container philosophy"
          >
            <div className="blockElement green">
              <div className="blockContent">
                <h2>
                  <translate>Philosophy</translate>
                </h2>
              </div>
            </div>
            <div className="blockElement imageAlignSide gridBlock threeByGridBlock">
              <div className="blockContent">
                <MarkdownBlock>
                  <translate>
                    Jest is a JavaScript testing framework designed to ensure
                    correctness of any JavaScript codebase. It allows you to
                    write tests with its approachable, familiar and feature-rich
                    APIs that give you results quickly.
                  </translate>
                </MarkdownBlock>
              </div>
              <div className="blockContent">
                <MarkdownBlock>
                  <translate>
                    Jest is extensively documented, requires little
                    configuration and can be extended to match your
                    requirements. Jest makes testing delightful.
                  </translate>
                </MarkdownBlock>
              </div>
              <div className="blockContent flex-end">
                <translate>- Jest Core Team</translate>
              </div>
            </div>
          </Container>
          <Container padding={['bottom', 'top']} className="section-container">
            <GridBlock
              className="yellow"
              contents={[
                {
                  content: (
                    <translate>
                      By ensuring your tests have unique global state, Jest can
                      reliably run tests in parallel. To make things quick, Jest
                      runs previously failed tests first and re-organizes runs
                      based on how long test files take.
                    </translate>
                  ),
                  image: '/img/content/feature-fast.png',
                  imageAlign: 'left',
                  title: <translate>Fast and safe</translate>,
                },
              ]}
            />
          </Container>
          <Container
            padding={['bottom', 'top']}
            background="light"
            className="section-container"
          >
            <GridBlock
              className="red"
              contents={[
                {
                  content: (
                    <translate>
                      Generate code coverage by adding the flag
                      [`--coverage`](https://jestjs.io/docs/en/cli.html#coverage).
                      No additional setup needed. Jest can collect code coverage
                      information from entire projects, including untested
                      files.
                    </translate>
                  ),
                  image: '/img/content/feature-coverage.png',
                  imageAlign: 'right',
                  title: <translate>Code coverage</translate>,
                },
              ]}
            />
          </Container>
          <Container padding={['bottom', 'top']} className="section-container">
            <GridBlock
              className="yellow"
              contents={[
                {
                  content: (
                    <translate>
                      Jest uses a custom resolver for imports in your tests
                      making it simple to mock any object outsided of your
                      test’s scope. You can use mocked imports with the rich
                      [Mock
                      Functions](https://jestjs.io/docs/en/mock-functions.html)
                      API to spy on function calls with readable test syntax.
                    </translate>
                  ),
                  image: '/img/content/feature-config-react.png',
                  imageAlign: 'left',
                  title: <translate>Mocking with ease</translate>,
                },
              ]}
            />
          </Container>
          <Container
            padding={['bottom', 'top']}
            background="light"
            className="section-container"
          >
            <GridBlock
              className="red"
              contents={[
                {
                  content: (
                    <translate>
                      When a test has failed, Jest puts in a lot of effort to
                      give you as much context as possible. here’s some examples
                    </translate>
                  ),
                  image: '/img/content/feature-mocking.png',
                  imageAlign: 'right',
                  title: <translate>Excellent exceptions</translate>,
                },
              ]}
            />
          </Container>
          <Container padding={['bottom', 'top']} className="section-container">
            <a className="anchor" name="watch" />
            <a className="hash-link" href="#watch" />
            <div className="blockElement green">
              <div className="blockContent">
                <h2>
                  <translate>Docs and talks</translate>
                </h2>
              </div>
            </div>
            <div className="blockElement imageAlignSide gridBlock threeByGridBlock">
              <div className="video">
                <iframe
                  width="560"
                  height="315"
                  src="https://www.youtube.com/embed/cAKYQpTC7MA"
                  frameBorder="0"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              </div>
              <div className="blockContent">
                <MarkdownBlock>
                  <translate>
                    The Jest core team and contributors regularly speak about
                    [Jest and Delightful JavaScript
                    Testing](https://www.youtube.com/watch?v=cAKYQpTC7MA). Check
                    out our talk about [Building High-Quality JavaScript
                    Tools](https://www.youtube.com/watch?v=PvabBs_utr8) at
                    jsconf.eu 2017 and our talk about [Jest as a
                    Platform](https://www.youtube.com/watch?v=NtjyeojAOBs) at
                    ReactiveConf 2017.
                  </translate>
                </MarkdownBlock>
              </div>
              <div className="blockContent">
                <div>
                  Cupiditate repellendus sit rerum est minus nam. Velit placeat
                  reiciendis placeat cumque. Sint et voluptatibus neque ad
                  dolore sunt. Esse est odio possimus nulla. Ipsam voluptate
                  maiores quo sed maiores excepturi. Quisquam sed sint incidunt
                  placeat est.
                </div>
              </div>
            </div>
          </Container>
          <div className="container section-container imageAlignSide lightBackground twoByGridBlock">
            <div className="wrapper">
              <div className="gridBlock yellow">
                <div className="blockContent">
                  <h2>
                    <translate>Open Collective</translate>
                  </h2>
                  <MarkdownBlock>
                    <translate>
                      With so many users, the core team of Jest uses an [Open
                      Collective](https://opencollective.com/jest) for
                      non-Facebook contributors.
                    </translate>
                  </MarkdownBlock>
                  <Contributors />
                </div>
                <div className="blockContent yellow">
                  <h2>
                    <translate>Who uses Jest?</translate>
                  </h2>
                  <MarkdownBlock>
                    <translate>
                      A lot of people! With
                      [8.5m](https://www.npmjs.com/package/jest) downloads in
                      the last 30 days, and used on over
                      [500,000](https://github.com/facebook/jest/network/dependents)
                      public repos on GitHub. Jest is used extensively at these
                      companies:
                    </translate>
                  </MarkdownBlock>
                  <div className="gridBlock logos">
                    {showcase}
                    <p>And many others</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

module.exports = Index;
