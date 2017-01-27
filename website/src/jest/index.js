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
const blog = require('MetadataBlog');

const index = React.createClass({
  render() {
    const showcase = siteConfig.users.filter(user => {
      return user.pinned;
    }).map(user => {
      return <a href={user.infoLink}><img src={user.image} title={user.caption}/></a>;
    });

    return (
      <Site>
        <HomeSplash mostRecentPost={blog.files[0]} />
        <div className="mainContainer">
          <Container padding={['bottom', 'top']}>
            <GridBlock align="center" contents={siteConfig.features} layout="fourColumn" />
          </Container>
          <div className="productShowcaseSection paddingTop paddingBottom" style={{textAlign: 'center'}}>
            <h2>Zero configuration testing platform</h2>
            <Marked>
              Jest is used by Facebook to test all JavaScript code including React applications. One of Jest's philosophies is to provide an integrated “zero-configuration” experience. We observed that when engineers are provided with ready-to-use tools, they end up writing more tests, which in turn results in stable and healthy code bases.
            </Marked>
          </div>

          <Container padding={['bottom', 'top']} background="light">
            <GridBlock contents={[
              {
                content: 'Sandboxed test files and automatic global state resets for every test. Jest parallelizes test runs across workers to maximize performance. Console messages are buffered and printed together with test results.',
                image: 'img/content/feature-snapshot-tests.png',
                imageAlign: 'right',
                title: 'Sandboxed and fast',
              },
            ]} />
          </Container>
          <Container padding={['bottom', 'top']}>
            <GridBlock contents={[
              {
                content: 'Easily create code coverage reports using `--coverage`. No additional setup or libraries needed! Jest can collect code coverage information from entire projects, including untested files.',
                image: '/jest/img/content/feature-pattern-mode.png',
                imageAlign: 'left',
                title: 'Built-in code coverage reports',
              },
            ]} />
          </Container>
          <Container padding={['bottom', 'top']} background="light">
            <GridBlock contents={[
              {
                content: 'Jest is already configured when you use [`create-react-app`](https://facebook.github.io/react/blog/2016/07/22/create-apps-with-no-configuration.html) or [`react-native init`](http://facebook.github.io/react-native/docs/getting-started.html) to create your React and React Native projects. Place your tests in a `__tests__` folder, or name your test files with a `.spec.js` or `.test.js` extension. Whatever you prefer, Jest will find and run your tests.',
                image: 'img/content/feature-snapshot-tests.png',
                imageAlign: 'right',
                title: 'Zero configuration',
              },
            ]} />
          </Container>

          <Container background="dark" padding={['bottom', 'top']}>
            <a className="anchor" name="use"></a>
            <a className="hash-link" href="#use"></a>
            <div className="blockElement imageAlignSide twoByGridBlock">
              <div className="blockContent">
                <h2>
                  Try it out!
                </h2>
                <div>
                  <Marked>You can try out a real version of Jest right here using [repl.it](https://repl.it/languages/jest). Consider a function, `add()`, that adds two numbers. We can use a basic test in `add-test.js` to verify that 1 + 2 equals 3. Hit "run" to try it out!</Marked>
                </div>
              </div>
              <div className="jest-repl">
                <iframe src="https://repl.it/languages/jest?lite=true"></iframe>
              </div>
            </div>
          </Container>

          <Container padding={['bottom', 'top']} background="light">
            <GridBlock contents={[
              {
                content: 'Powerful [mocking library](/jest/docs/mock-functions.html) for functions and modules. Mock React Native components using `jest-react-native`.',
                image: '/jest/img/content/feature-pattern-mode.png',
                imageAlign: 'left',
                title: 'Powerful mocking library',
              },
            ]} />
          </Container>
          <Container padding={['bottom', 'top']}>
            <GridBlock contents={[
              {
                content: 'Jest works with any compile-to-JavaScript language and integrates seamlessly with [Babel](https://babeljs.io).',
                image: '/jest/img/content/feature-snapshot-tests.png',
                imageAlign: 'right',
                title: 'Works with TypeScript',
              },
            ]} />
          </Container>
          <Container padding={['bottom', 'top']} background="light">
            <GridBlock contents={[
              {
                content: 'Run your tests within a [fake DOM implementation](https://github.com/tmpvar/jsdom) on the command line. Every DOM API that you call can be observed in the same way it would be observed in a browser.',
                image: 'img/content/feature-pattern-mode.png',
                imageAlign: 'left',
                title: 'Simulated DOM environment',
              },
            ]} />
          </Container>

          <Container padding={['bottom', 'top']}>
            <div className="blockElement imageAlignSide twoByGridBlock">
              <div className="video">
                <iframe src="https://fast.wistia.net/embed/iframe/78j73pyz17"></iframe>
              </div>
              <div className="blockContent">
                <h2>Learn how to test JavaScript with Jest</h2>
                <div>
                  <Marked>In this [video](https://egghead.io/lessons/javascript-test-javascript-with-jest) by [Kent C. Dodds](https://twitter.com/kentcdodds) you will learn how to install Jest and write your first unit test.</Marked>
                </div>
              </div>
            </div>
          </Container>

          <div className="productShowcaseSection paddingBottom">
              <h2>Who's using Jest?</h2>
              <p>Jest is used by teams of all sizes to test websites, mobile apps, and APIs.</p>
              <div className="logos">
                {showcase}
              </div>
              <div className="more-users">
                <a className="button" href="/jest/users.html" target="_self">More Jest Users</a>
              </div>
          </div>
        </div>
      </Site>
    );
  },
});

module.exports = index;
