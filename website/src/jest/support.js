/**
 * @jsx React.DOM
 */

var React = require('React');
var Site = require('Site');
var center = require('center');
var H2 = require('H2');

var support = React.createClass({
  render: function() {
    return (
      <Site section="support">

        <section className="content wrap documentationContent nosidebar">
          <div className="inner-content">
            <h1>Need help?</h1>
            <div className="subHeader"></div>
            <p>
              <strong>Jest</strong> is worked on full-time by Facebook&#39;s
              product infrastructure engineering teams. They&#39;re often around
              and available for questions.
            </p>

            <H2>Stack Overflow</H2>
            <p>Many members of the community use Stack Overflow to ask questions. Read through the <a href="http://stackoverflow.com/questions/tagged/jestjs">existing questions</a> tagged with <strong>jestjs</strong> or <a href="http://stackoverflow.com/questions/ask">ask your own</a>!</p>
            <H2>Discord</H2>
            <p>Join <a href="https://discordapp.com/channels/102860784329052160/103622435865104384" target="_blank">the <strong>#jest</strong> channel</a> on <a href="http://www.reactiflux.com/">Reactiflux</a> to ask questions and find answers.</p>
          </div>
        </section>

      </Site>
    );
  }
});

module.exports = support;
