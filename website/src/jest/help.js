/**
 * @jsx React.DOM
 */

/* eslint-disable sort-keys, max-len, no-multi-str */

const React = require('React');
const Site = require('Site');
const Container = require('Container');
const GridBlock = require('GridBlock');


const support = React.createClass({
  render() {

    const supportLinks = [
      {
        title: 'Browse the docs',
        content: 'Find what you\'re looking for in our detailed documentation and guides.\r\n\r\n\
- Learn how to [get started](/jest/docs/getting-started.html) with Jest.\r\n\
- [Troubleshoot](/jest/docs/troubleshooting.html) problems with Jest.\r\n\
- Learn how to [configure Jest](/jest/docs/configuration.html).\r\n\
- Look at the full [API Reference](/jest/docs/api.html).\r\n',
      },
      {
        title: 'Join the community',
        content: 'Ask questions and find answers from other Jest users like you.\r\n\r\n\
- Join the [#jest](https://discordapp.com/channels/102860784329052160/103622435865104384) channel on [Reactiflux](http://www.reactiflux.com/), a Discord community.\r\n\
- Many members of the community use Stack Overflow. Read through the [existing questions](https://stackoverflow.com/questions/tagged/jestjs) tagged with **jestjs** or [ask your own](https://stackoverflow.com/questions/ask)!',
      },
      {
        title: 'Stay up to date',
        content: 'Find out what\'s new with Jest.\r\n\r\n\
- Follow [Jest](https://twitter.com/fbjest) on Twitter.\r\n\
- Subscribe to the [Jest blog](/jest/blog/).\r\n\
- Look at the [changelog](https://github.com/facebook/jest/blob/master/CHANGELOG.md).',
      },
    ];

    return (
      <Site section="support">
        <div className="docMainWrapper wrapper">
          <Container className="mainContainer documentContainer postContainer">
            <div className="post">
              <header className="postHeader">
                <h2>Need help?</h2>
              </header>
              <p>
                Jest is worked on full-time by Facebook's
                JavaScript Tools team. Team members are often around
                and available for questions.
              </p>
              <GridBlock contents={supportLinks} layout="fourColumn" />
            </div>
          </Container>
        </div>

      </Site>
    );
  },
});

module.exports = support;
