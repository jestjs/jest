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
                <h3>Familiar Approach</h3>
                <p>
                  Built on top of the Jasmine test framework, using familiar expect(value).toBe(other) assertions
                </p>
              </div>
              <div className="marketing-col">
                <h3>Mock by Default</h3>
                <p>
                  <a href="/jest/docs/automatic-mocking.html#content">Automatically mocks</a> CommonJS <a href="/jest/docs/common-js-testing.html#content">modules returned by require()</a>, making most existing code testable
                </p>
              </div>
              <div className="marketing-col">
                <h3>Short Feedback Loop</h3>
                <p>
                  DOM APIs are mocked and tests run in parallel via a small node.js command line utility
                </p>
              </div>
            </div>
          </section>
          <hr className="home-divider" />
          <section className="home-section home-why">
            <h3>Why not just use vanilla jasmine?</h3>

            <div className="blurb">
              Jest provides you with multiple layers on top of jasmine:
            </div>

            <div className="list">
              <ul>
                <li>Automatically finds tests to execute in your repo</li>
                <li><a href="/jest/docs/automatic-mocking.html">Automatically mocks dependencies for you when running your tests</a></li>
                <li><a href="/jest/docs/timer-mocks.html">Allows you to test asynchronous code synchronously</a></li>
                <li>Runs your tests with a fake DOM implementation (via <a href="https://github.com/tmpvar/jsdom" target="_blank">jsdom</a>) so that your tests can run on the command line</li>
                <li>Runs tests in parallel processes so that they finish sooner</li>
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
