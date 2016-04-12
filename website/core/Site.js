/**
 * @providesModule Site
 * @jsx React.DOM
 */

var React = require('React');
var HeaderLinks = require('HeaderLinks');

var Site = React.createClass({
  render: function() {
    var tagline = 'Painless JavaScript Unit Testing';
    var title = this.props.title
      ? this.props.title + ' · Jest'
      : 'Jest · ' + tagline;
    var description = this.props.description || tagline;
    var url =
      'https://facebook.github.io/jest/' + (this.props.url || 'index.html');

    return (
      <html>
        <head>
          <meta charSet="utf-8" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge,chrome=1" />
          <title>{title}</title>
          <meta name="viewport" content="width=device-width" />
          <meta property="og:title" content={title} />
          <meta property="og:type" content="website" />
          <meta property="og:url" content={url} />
          <meta property="og:image" content="https://facebook.github.io/jest/img/opengraph.png" />
          <meta property="og:description" content={description} />

          <link rel="shortcut icon" href="/jest/img/favicon.png" />
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/docsearch.js/1/docsearch.min.css" />
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
              <div className="right">© 2016 Facebook Inc.</div>
            </footer>
          </div>

          <div id="fb-root" />
          <script type="text/javascript" src="https://cdn.jsdelivr.net/docsearch.js/1/docsearch.min.js"></script>
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

            docsearch({
              apiKey: '833906d7486e4059359fa58823c4ef56',
              indexName: 'jest',
              inputSelector: '#algolia-doc-search'
            });
          `}} />
        </body>
      </html>
    );
  }
});

module.exports = Site;
