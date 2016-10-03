/**
 * @jsx React.DOM
 */

var React = require('React');
var Site = require('Site');
var center = require('center');
var Container = require('Container');
var Header = require('Header');

var support = React.createClass({
  render: function() {
    return (
      <Site section="support">
        <div className="docMainWrapper wrapper">
          <Container className="mainContainer documentContainer postContainer">
            <div className="post">
              <header className="postHeader">
                <h2>Need help?</h2>
              </header>
              Jest is worked on full-time by Facebook's
              product infrastructure engineering teams. They're often around
              and available for questions.

              <Header level={4}>Troubleshooting</Header>
              <ul>
                <li>Read the <a href="/jest/docs/troubleshooting.html">Troubleshooting</a> documentation page.</li>
                <li><a href="/jest/docs/api.html">API Documentation</a>.</li>
                <li><a href="/jest/docs/configuration.html">Configuration</a>.</li>
              </ul>

              <Header level={4}>Discord</Header>
              <p>Join the <a href="https://discordapp.com/channels/102860784329052160/103622435865104384" target="_blank">#jest</a> channel on <a href="http://www.reactiflux.com/">Reactiflux</a> to ask questions and find answers.</p>
              <Header level={4}>Stack Overflow</Header>
              <p>Many members of the community use Stack Overflow to ask questions. Read through the <a href="https://stackoverflow.com/questions/tagged/jestjs">existing questions</a> tagged with <strong>jestjs</strong> or <a href="https://stackoverflow.com/questions/ask">ask your own</a>!</p>
            </div>
          </Container>
        </div>

      </Site>
    );
  }
});

module.exports = support;
