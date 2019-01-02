/**
 * Copyright (c) 2017-present, Facebook, Inc.
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
// const translation = require('../../server/translation.js');
const backers = require(process.cwd() + '/backers.json');

const siteConfig = require(process.cwd() + '/siteConfig.js');
// const idx = (target, path) =>
//   path.reduce((obj, key) => (obj && obj[key] ? obj[key] : null), target);

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
        <h3 className="rotate-left">
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
        <h3 className="rotate-left">
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
            document.addEventListener("DOMContentLoaded", function() {
              var hand = document.querySelector(".jest-hand");
              var cards = hand.querySelectorAll(".jest-card");
              function cardTransform(offset, handWidth) {
                var transform = "rotate(" + (offset * 4) + "deg) translateX(" + ((offset - (Math.abs(offset) *  offset/7)) * Math.min(140, handWidth / 8)) + "px)";
                return transform;
              }
              function positionCards() {
                var handWidth = hand.offsetWidth;
                cards.forEach(function(card) {
                  var offset = parseInt(card.dataset.index) - 2;
                  card.parentElement.style.transform = cardTransform(offset, handWidth);
                });
              }
              var results = [];
              var timeouts = [];
              function resolveRun(card, index, minTime) {
                minTime = minTime || 500;
                setTimeout(function() {
                  if (index === 2) {
                    results[index] = null;
                    card.classList.add("jest-card-run");
                  } else if (results[index]) {
                    card.classList.remove("jest-card-fail");
                    card.classList.add("jest-card-pass");
                    card.querySelectorAll(".jest-card-label").forEach(function(el) {
                      el.innerHTML = "PASS";
                    });
                  } else {
                    card.classList.remove("jest-card-pass");
                    card.classList.add("jest-card-fail");
                    card.querySelectorAll(".jest-card-label").forEach(function(el) {
                      el.innerHTML = "FAIL";
                    });
                  }
                }, minTime);
                if (timeouts[index]) {
                  clearTimeout(timeouts[index]);
                }
                timeouts[index] = setTimeout(function() {
                  card.classList.remove("jest-card-running");
                  card.classList.add("jest-card-popping");
                  setTimeout(function() {
                    results[index] = results[index] || null;
                    card.classList.remove("jest-card-popping");
                  }, 400);
                }, index === 2 ? 3000 + minTime : Math.random() * 3000 + minTime);
              }
              function forceRun(minTime) {
                cards.forEach(function(card, index) {
                  card.classList.add("jest-card-running");
                  results[index] = Math.random() > 0.4;
                  resolveRun(card, index, minTime);
                });
              }
              function runTest(card, index) {
                if (!card.classList.contains("jest-card-running") && !results[index]) {
                  if (index === 2) {
                    return forceRun(1000);
                  }
                  card.classList.add("jest-card-running");
                  if (results[index] == null) {
                    results[index] = Math.random() > 0.2;
                    resolveRun(card, index);
                  }
                }
              }
              hand.addEventListener("click", function(ev) {
                var card;
                if (ev.target.classList.contains("jest-card-hitslop")) {
                  card = ev.target.firstChild;
                } else if (ev.target.classList.contains("jest-card")) {
                  card = ev.target;
                } else if (ev.target.classList.contains("jest-card-front")) {
                  card = ev.target.parentElement;
                }
                var index = parseInt(card.dataset.index);
                runTest(card, index);
              });
              var resizeTimeout;
              window.addEventListener("resize", function() {
                if (!resizeTimeout) {
                  resizeTimeout = setTimeout(function() {
                    resizeTimeout = null;
                    positionCards();
                  }, 500);
                }
              });
              forceRun(4000);
              positionCards();
            });
          `,
          }}
        />
      </div>
    );
  }
}

class HeroInteractive extends React.Component {
  render() {
    return (
      <div className="jest-hero-interactive">
        <div className="hero-github-button-container">
          <a
            className="github-button"
            href={this.props.config.repoUrl}
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
          <Button
            href={
              siteConfig.baseUrl +
              'docs/' +
              this.props.language +
              '/getting-started.html'
            }
          >
            <translate>Get Started</translate>
          </Button>
          <Button href="#use">
            <translate>Try Out Jest</translate>
          </Button>
          <Button href={'#watch'}>
            <translate>Watch Talks</translate>
          </Button>
          <Button
            href={
              siteConfig.baseUrl +
              'docs/' +
              this.props.language +
              '/snapshot-testing.html'
            }
          >
            <translate>Learn More</translate>
          </Button>
        </div>
      </div>
    );
  }
}

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
        <div className="mainContainer">
          <Container padding={['bottom', 'top']} background="light">
            <GridBlock
              align="center"
              contents={[
                {
                  content: (
                    <translate>
                      Complete and ready to set-up JavaScript testing solution.
                      Works out of the box for any React project.
                    </translate>
                  ),
                  image: '/img/content/female-technologist.png',
                  imageAlign: 'top',
                  title: <translate>Developer Ready</translate>,
                },
                {
                  content: (
                    <translate>
                      Fast interactive watch mode runs only test files related
                      to changed files and is optimized to give signal quickly.
                    </translate>
                  ),
                  image: '/img/content/runner.png',
                  imageAlign: 'top',
                  title: <translate>Instant Feedback</translate>,
                },
                {
                  content: (
                    <translate>
                      Capture snapshots of React trees or other serializable
                      values to simplify testing and to analyze how state
                      changes over time.
                    </translate>
                  ),
                  image: '/img/content/camera-with-flash.png',
                  imageAlign: 'top',
                  title: <translate>Snapshot Testing</translate>,
                },
              ]}
              layout="fourColumn"
            />
          </Container>
          <Container padding={['bottom', 'top']}>
            <div
              className="productShowcaseSection paddingBottom"
              style={{textAlign: 'center'}}
            >
              <h2>
                <translate>Zero configuration testing platform</translate>
              </h2>
              <MarkdownBlock>
                <translate>
                  Jest is used by Facebook to test all JavaScript code including
                  React applications. One of Jest's philosophies is to provide
                  an integrated \"zero-configuration\" experience. We observed
                  that when engineers are provided with ready-to-use tools, they
                  end up writing more tests, which in turn results in more
                  stable and healthy code bases.
                </translate>
              </MarkdownBlock>
            </div>
          </Container>
          <Container padding={['bottom', 'top']} className="section-container">
            <GridBlock
              className="rotate-right"
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
              className="rotate-left"
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
              className="rotate-right"
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
              className="rotate-right"
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
          <Container padding={['bottom', 'top']} className="debu">
            <a className="anchor" name="watch" />
            <a className="hash-link" href="#watch" />
            <GridBlock
              className="rotate-left"
              contents={[
                {
                  image: true,
                  imageAlign: 'right',
                  title: <translate>Docs and talks</translate>,
                },
              ]}
            />
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
              <div className="gridBlock">
                <div className="blockContent rotate-right">
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
                <div className="blockContent rotate-left">
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
