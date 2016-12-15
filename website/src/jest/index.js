/**
 * @jsx React.DOM
 */

var React = require('React');
var Site = require('Site');
var Prism = require('Prism');
var Marked = require('Marked');
var unindent = require('unindent');

var Container = require('Container');
var HomeSplash = require('HomeSplash');
var GridBlock = require('GridBlock');

var siteConfig = require('../../siteConfig.js');
var gettingStartedContent = require('./docs/getting-started.js').content;
var blog = require('MetadataBlog');

var index = React.createClass({
  render: function() {
    var whyJest = [
      {content: 'Fast interactive mode with `--watch`.'},
      {content: 'Create coverage reports with `--coverage`. No additional setup or libraries needed!'},
      {content: 'Automatically find tests related to changed files to execute in your project with `-o`.'},
      {content: 'Error messages are helpful and color coded. Stack traces point to the source of problems quickly.'},
      {content: 'Jest runs previously failed tests first. Together with `--bail` it provides useful signal quickly.'},
      {content: 'Sandboxed test files and automatic global state resets for every test.'},
      {content: 'Integrated support for testing with [promises and async/await](/jest/docs/tutorial-async.html)'},
      {content: 'Run your tests within a fake DOM implementation (via [jsdom](https://github.com/tmpvar/jsdom)) on the command line.'},
      {content: 'Run tests in parallel processes to minimize test runtime.'},
      {content: 'Jest works with any compile-to-JS language and integrates seamlessly with [Babel](https://babeljs.io).'},
      {content: 'Integrated [manual mocking library](/jest/docs/mock-functions.html).'},
      {content: 'Can run [asynchronous code synchronously](/jest/docs/timer-mocks.html).'},
    ];

    return (
      <Site>
        <HomeSplash mostRecentPost={blog.files[0]} />
        <div className="mainContainer">
          <Container background="light" padding={["bottom","top"]}>
            <GridBlock align="center" contents={siteConfig.features} layout="fourColumn" />
          </Container>
          <Container padding={["bottom","top"]}>
            <h2>Jest's Testing Features</h2>
            <GridBlock className="responsiveList testingFeatures" contents={whyJest} layout="threeColumn" />
          </Container>
          <Container padding={["bottom"]}>
            <h2>
              <a className="anchor" name="getting-started"></a>
              Getting Started
              <a className="hash-link" href="#getting-started"></a>
            </h2>
            <Marked>{gettingStartedContent}</Marked>
          </Container>
        </div>
      </Site>
    );
  }
});

module.exports = index;
