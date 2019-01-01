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
      <div>
        <h2>
          <translate>Sponsors</translate>
        </h2>
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
        <div className="support">
          <a
            className="support-button"
            href="https://opencollective.com/jest#support"
          >
            <translate>Become a sponsor</translate>
          </a>
        </div>
        <h2>
          <translate>Backers</translate>
        </h2>
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
          <div>
            <a
              className="support-button"
              href="https://opencollective.com/jest#support"
            >
              <translate>Become a backer</translate>
            </a>
          </div>
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
                var transform = "rotate(" + (offset * 4) + "deg) translateY(" + (offset * -2) + "px) translateX(" + ((offset - (Math.abs(offset) *  offset/7)) * Math.min(140, handWidth / 8)) + "px)";
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
          <Container padding={['bottom', 'top']} background="light">
            <GridBlock
              contents={[
                {
                  content: (
                    <translate>
                      Jest parallelizes test runs across workers to maximize
                      performance. Console messages are buffered and printed
                      together with test results. Sandboxed test files and
                      automatic global state resets for every test so no two
                      tests conflict with each other.
                    </translate>
                  ),
                  image: '/img/content/feature-fast.png',
                  imageAlign: 'right',
                  title: <translate>Fast and sandboxed</translate>,
                },
              ]}
            />
          </Container>
          <Container padding={['bottom', 'top']}>
            <GridBlock
              contents={[
                {
                  content: (
                    <translate>
                      Easily create code coverage reports using
                      [`--coverage`](https://jestjs.io/docs/en/cli.html#coverage).
                      No additional setup or libraries needed! Jest can collect
                      code coverage information from entire projects, including
                      untested files.
                    </translate>
                  ),
                  image: '/img/content/feature-coverage.png',
                  imageAlign: 'left',
                  title: <translate>Built-in code coverage reports</translate>,
                },
              ]}
            />
          </Container>
          <Container padding={['bottom', 'top']} background="light">
            <GridBlock
              contents={[
                {
                  content: (
                    <translate>
                      Jest is already configured when you use
                      [`create-react-app`](https://facebook.github.io/react/blog/2016/07/22/create-apps-with-no-configuration.html)
                      or [`react-native
                      init`](http://facebook.github.io/react-native/docs/getting-started.html)
                      to create your React and React Native projects. Place your
                      tests in a `__tests__` folder, or name your test files
                      with a `.spec.js` or `.test.js` extension. Whatever you
                      prefer, Jest will find and run your tests.
                    </translate>
                  ),
                  image: '/img/content/feature-config-react.png',
                  imageAlign: 'right',
                  title: <translate>Zero configuration</translate>,
                },
              ]}
            />
          </Container>
          <Container background="dark" padding={['bottom', 'top']}>
            <a className="anchor" name="use" />
            <a className="hash-link" href="#use" />
            <div className="blockElement imageAlignSide twoByGridBlock">
              <div className="blockContent">
                <h2>
                  <translate>Try it out!</translate>
                </h2>
                <div>
                  <MarkdownBlock>
                    <translate>
                      You can try out a real version of Jest using
                      [repl.it](https://repl.it/languages/jest). Consider a
                      function, `add()`, that adds two numbers. We can use a
                      basic test in `add-test.js` to verify that 1 + 2 equals 3.
                      Hit \"run\" to try it out!
                    </translate>
                  </MarkdownBlock>
                </div>
              </div>
              <div className="jest-repl">
                <iframe src="https://repl.it/@amasad/try-jest?lite=true" />
              </div>
            </div>
          </Container>

          <Container padding={['bottom', 'top']}>
            <GridBlock
              contents={[
                {
                  content: (
                    <translate>
                      Powerful [mocking library](/docs/en/mock-functions.html)
                      for functions and modules. Mock React Native components
                      using `jest-react-native`.
                    </translate>
                  ),
                  image: '/img/content/feature-mocking.png',
                  imageAlign: 'left',
                  title: <translate>Powerful mocking library</translate>,
                },
              ]}
            />
          </Container>

          <Container padding={['bottom', 'top']} background="light">
            <GridBlock
              contents={[
                {
                  content: (
                    <translate>
                      Jest works with any compile-to-JavaScript language and
                      integrates seamlessly with [Babel](https://babeljs.io)
                      which means you can write React, TypeScript and much more
                      without configuration
                    </translate>
                  ),
                  image: '/img/content/feature-typescript.png',
                  imageAlign: 'right',
                  title: <translate>Works with TypeScript</translate>,
                },
              ]}
            />
          </Container>

          <Container padding={['bottom', 'top']}>
            <a className="anchor" name="watch" />
            <a className="hash-link" href="#watch" />
            <div className="blockElement imageAlignSide twoByGridBlock">
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
                <h2>
                  <translate>Watch Talks about Jest</translate>
                </h2>
                <div>
                  <MarkdownBlock>
                    <translate>
                      The Jest core team and contributors regularly speak about
                      [Jest and Delightful JavaScript
                      Testing](https://www.youtube.com/watch?v=cAKYQpTC7MA).
                      Check out our talk about [Building High-Quality JavaScript
                      Tools](https://www.youtube.com/watch?v=PvabBs_utr8) at
                      jsconf.eu 2017 and our talk about [Jest as a
                      Platform](https://www.youtube.com/watch?v=NtjyeojAOBs) at
                      ReactiveConf 2017.
                    </translate>
                  </MarkdownBlock>
                </div>
              </div>
            </div>

            <div
              className="productShowcaseSection paddingTop"
              style={{textAlign: 'center'}}
            >
              <a
                className="button"
                href={siteConfig.baseUrl + this.props.language + '/videos.html'}
              >
                <translate>Watch more videos</translate>
              </a>
            </div>
          </Container>

          <div className="productShowcaseSection paddingBottom">
            <h2>
              <translate>Who's using Jest?</translate>
            </h2>
            <p>
              <translate>
                Jest is used by teams of all sizes to test web applications,
                node.js services, mobile apps, and APIs.
              </translate>
            </p>
            <div className="logos">{showcase}</div>
            <Contributors />
          </div>
        </div>
      </div>
    );
  }
}

module.exports = Index;
