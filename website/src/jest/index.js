/**
 * @jsx React.DOM
 */

var React = require('React');
var Site = require('Site');
var Prism = require('Prism');
var Marked = require('Marked');
var unindent = require('unindent');

var gettingStartedContent = require('./docs/getting-started.js').content;

var index = React.createClass({
  render: function() {
    return (
      <Site>
        <div className="hero">
          <div className="wrap">
            <div className="text"><strong>Jest</strong></div>
            <div className="minitext">
              Painless JavaScript Unit Testing
            </div>
          </div>
        </div>

        <section className="content wrap">
          <p></p>
          <section className="light home-section">
            <div className="marketing-row">
              <div className="marketing-col">
                <h3>Adaptable</h3>
                <p>
                  Jest uses Jasmine assertions by default and Jest is modular, extendible and configurable.
                </p>
              </div>
              <div className="marketing-col">
                <h3>Sandboxed and Fast</h3>
                <p>
                  Jest virtualizes JavaScript environments, provides browser mocks and runs tests in parallel across workers.
                </p>
              </div>
              <div className="marketing-col">
                <h3>Mock by Default</h3>
                <p>
                  Jest <a href="/jest/docs/automatic-mocking.html#content">automatically mocks</a> JavaScript <a href="/jest/docs/common-js-testing.html#content">modules</a>, making most existing code testable.
                </p>
              </div>
            </div>
          </section>
          <hr className="home-divider" />
          <section className="home-section home-why">
            <h3>Why use Jest?</h3>

            <div className="list">
              <ul>
                <li>Automatically finds tests to execute in your repo.</li>
                <li>Sandboxes test files and resets state automatically for every test.</li>
                <li><a href="/jest/docs/automatic-mocking.html">Automatically mocks</a> dependencies for you when running your tests.</li>
                <li>Allows you to <a href="/jest/docs/timer-mocks.html">test asynchronous code synchronously</a> as well as <a href="/jest/docs/tutorial-async.html">Promises and async/await.</a></li>
                <li>Uses static analysis to find and only run relevant test files during local development.</li>
                <li>Provides a <a href="/jest/docs/mock-functions.html">manual mocking library</a>.</li>
                <li>Runs your tests with a fake DOM implementation (via <a href="https://github.com/tmpvar/jsdom" target="_blank">jsdom</a>) on the command line.</li>
                <li>Runs tests in parallel processes to minimize test runtime.</li>
                <li>Works with any compile-to-JS language and integrates seamlessly with <a href="http://babeljs.io" target="_blank">Babel</a>.</li>
                <li>Creates coverage reports.</li>
              </ul>
            </div>

          </section>
          <hr className="home-divider" />
          <section className="home-section home-getting-started">

            <h3>Getting Started</h3>
            <Marked>{gettingStartedContent}</Marked>

          </section>
          <hr className="home-divider" />
          <section className="home-bottom-section">
            <div className="buttons-unit">
              <a href="docs/tutorial.html#content" className="button">Learn more about Jest</a>
            </div>
          </section>
          <p></p>
        </section>
      </Site>
    );
  }
});

module.exports = index;
