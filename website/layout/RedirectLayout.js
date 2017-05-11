/**
 * @providesModule RedirectLayout
 * @jsx React.DOM
 */

const React = require('React');

class RedirectLayout extends React.Component {
  render() {
    const destinationUrl = this.props.metadata.destinationUrl;

    return (
      <html>
        <head>
          <meta charSet="utf-8" />
          <link rel="canonical" href={destinationUrl} />
          <meta httpEquiv="refresh" content={'0; url=' + destinationUrl} />
          <title>Redirecting...</title>
        </head>
        <body>
          <h1>Redirecting...</h1>
          <a href={destinationUrl}>Click here if you are not redirected.</a>
          <script
            dangerouslySetInnerHTML={{__html: 'location=' + destinationUrl}}
          />
        </body>
      </html>
    );
  }
}

module.exports = RedirectLayout;
