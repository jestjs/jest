/**
 * @jsx React.DOM
 */

/* eslint-disable max-len */

const React = require('React');
const Site = require('Site');
const Marked = require('Marked');

const Container = require('Container');
const HomeSplash = require('HomeSplash');
const GridBlock = require('GridBlock');

const siteConfig = require('../../siteConfig.js');
const gettingStartedContent = require('./docs/getting-started.js').content.split('<!--truncate-->')[0];
const blog = require('MetadataBlog');

const index = React.createClass({
  render() {
    const whyJest = [
      {content: 'Fast interactive mode with `--watch`.'},
      {content: 'Create coverage reports with `--coverage`. No additional setup or libraries needed!'},
      {content: 'Automatically find tests related to changed files to execute in your project with `--onlyChanged`.'},
      {content: 'Error messages are helpful and color coded. Stack traces point to the source of problems quickly.'},
      {content: 'Jest runs previously failed tests first. Together with `--bail` it provides useful signal quickly.'},
      {content: 'Sandboxed test files and automatic global state resets for every test.'},
      {content: 'Integrated support for testing with [promises and async/await](/jest/docs/tutorial-async.html)'},
      {content: 'Run your tests within a fake DOM implementation (via [jsdom](https://github.com/tmpvar/jsdom)) on the command line.'},
      {content: 'Run tests in parallel processes to minimize test runtime.'},
      {content: 'Jest works with any compile-to-JS language and integrates seamlessly with [Babel](https://babeljs.io).'},
      {content: 'Integrated [manual mocking library](/jest/docs/mock-functions.html).'},
      {content: 'Can run [asynchronous code synchronously](/jest/docs/asynchronous.html).'},
    ];

    const users = [
      {
        infoLink: 'https://code.facebook.com',
        caption: 'Facebook',
        image: 'img/logos/facebook.png',
      },
      {
        infoLink: 'https://www.oculus.com/',
        caption: 'Oculus',
        image: 'img/logos/oculus.png',
      },
      {
        infoLink: 'https://www.instagram.com/',
        caption: 'Instagram',
        image: 'img/logos/instagram.png',
      },
      {
        infoLink: 'https://www.twitter.com',
        caption: 'Twitter',
        image: 'img/logos/twitter.png',
      },
      {
        infoLink: 'https://www.pinterest.com',
        caption: 'Pinterest',
        image: 'img/logos/pinterest.png',
      },
      {
        infoLink: 'http://www.nytimes.com/',
        caption: 'The New York Times',
        image: 'img/logos/nyt.png',
      },
    ];

    const showcase = users.map((user) => {
      return <a href={user.infoLink}><img src={user.image} title={user.caption}/></a>;
    });

    return (
      <Site>
        <HomeSplash mostRecentPost={blog.files[0]} />
        <div className="mainContainer">
          <Container background="light" padding={['bottom', 'top']}>
            <GridBlock align="center" contents={siteConfig.features} layout="fourColumn" />
          </Container>
          <Container padding={['bottom', 'top']}>
            <h2>Jest's Testing Features</h2>
            <GridBlock className="responsiveList testingFeatures" contents={whyJest} layout="threeColumn" />
          </Container>
          <Container padding={['bottom', 'top']}>
            <h2>
              <a className="anchor" name="use"></a>
              Try Jest
              <a className="hash-link" href="#use"></a>
            </h2>
            <Marked>You can try out a real version of Jest through [repl.it](https://repl.it). Just edit your test and hit the run button!</Marked>
            <iframe className="jest-repl" src="https://repl.it/languages/jest?lite=true"></iframe>

            <Marked>...or watch a video to get started with Jest:</Marked>
            <div className="video">
              <iframe src="https://fast.wistia.net/embed/iframe/78j73pyz17"></iframe>
            </div>
            <div className="video-shoutout">
              <a href="https://egghead.io/lessons/javascript-test-javascript-with-jest">Video</a> by <a href="https://twitter.com/kentcdodds">Kent C. Dodds</a> hosted by <a href="https://egghead.io">Egghead</a>.
            </div>
            <h2>
              <a className="anchor" name="getting-started"></a>
              Getting Started
              <a className="hash-link" href="#getting-started"></a>
            </h2>
            <Marked>{gettingStartedContent}</Marked>
            <Marked>Refer to [Additional Configuration](/jest/docs/getting-started.html#additional-configuration) to learn how to use Jest with Babel, webpack, or TypeScript.</Marked>
          </Container>
          <Container padding={['bottom']}>
          <div className="miniShowcaseSection">
              <h2>Who's Using Jest?</h2>
              <p>Jest is used by <a href="/jests/users.html">teams of all sizes</a> to test websites, mobile apps, and APIs.</p>
            <div className="logos">
              {showcase}
            </div>
          </div>
          </Container>
        </div>
      </Site>
    );
  },
});

module.exports = index;
