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

var index = React.createClass({
  render: function() {
    var whyUseJest = [
      {
        content: "Jest automatically finds tests to execute in your repo",
      },
      {
        content: "It sandboxes test files, and resets state automatically for every test.",
      },
      {
        content: "Jest allows you to [test asynchronous code synchronously](/jest/docs/timer-mocks.html) as well as [Promises and async/await](/jest/docs/tutorial-async.html).",
      },
      {
        content: "Uses static analysis to find and only run relevant test files during local development.",
      },
      {
        content: "Runs your tests with a fake DOM implementation (via [jsdom](https://github.com/tmpvar/jsdom)) on the command line.",
      },
      {
        content: "Runs tests in parallel processes to minimize test runtime.",
      },
      {
        content: "It works with any compile-to-JS language and integrates seamlessly with [Babel](https://babeljs.io).",
      },
      {
        content: "Jest provides a [manual mocking library](/jest/docs/mock-functions.html). And it creates coverage reports.",
      },
    ];

    return (
      <Site>
        <HomeSplash />
        <div className="mainContainer">
          <Container background="light" padding={["bottom","top"]}>
            <GridBlock align="center" contents={siteConfig.features} layout="fourColumn" />
          </Container>
          <Container padding={["bottom","top"]}>
            <h2>Why use Jest?</h2>
            <GridBlock className="responsiveList" contents={whyUseJest} layout="fourColumn" />
          </Container>
          <Container padding={["bottom"]}>
            <h2>Getting Started</h2>
            <Marked>{gettingStartedContent}</Marked>
          </Container>
        </div>
      </Site>
    );
  }
});

module.exports = index;
