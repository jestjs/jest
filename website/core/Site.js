/**
 * @providesModule Site
 * @jsx React.DOM
 */

var React = require('React');
var HeaderLinks = require('HeaderLinks');

var Site = React.createClass({
  render: function() {
    return (
      <html>
        <head>
          <meta charSet="utf-8" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge,chrome=1" />
          <title>Jest | Painless JavaScript Unit Testing</title>
          <meta name="viewport" content="width=device-width" />
          <meta property="og:title" content="Jest | Painless JavaScript Unit Testing" />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="http://facebook.github.io/jest/index.html" />
          <meta property="og:image" content="http://facebook.github.io/jest/img/opengraph.png" />
          <meta property="og:description" content="Painless JavaScript Unit Testing" />

          <link rel="shortcut icon" href="/jest/img/favicon.png" />
          <link rel="stylesheet" href="/jest/css/jest.css" />

          <script type="text/javascript" src="//use.typekit.net/vqa1hcx.js"></script>
          <script type="text/javascript">{'try{Typekit.load();}catch(e){}'}</script>
        </head>
        <body>

          <div className="container">
            <div className="nav-main">
              <div className="wrap">
                <a className="nav-home" href="/jest/">
                  <img src="/jest/img/jest_logo_nav.png" />
                  Jest
                </a>
                <HeaderLinks section={this.props.section} />
              </div>
            </div>

            {this.props.children}

            <footer className="wrap">
              <div className="right">© 2015 Facebook Inc.</div>
            </footer>
          </div>

          <div id="fb-root" />
          <script dangerouslySetInnerHTML={{__html: `
            (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
            (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
            m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
            })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
            ga('create', 'UA-387204-10', 'facebook.github.io');
            ga('send', 'pageview');

            !function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)
            ){js=d.createElement(s);js.id=id;js.src="https://platform.twitter.com/widgets.js";
            fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");
          `}} />
        </body>
      </html>
    );
  }
});

module.exports = Site;
