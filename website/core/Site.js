/**
 * @providesModule Site
 * @jsx React.DOM
 */

/* eslint-disable max-len */

const React = require('React');
const HeaderNav = require('HeaderNav');
const Head = require('Head');
const Footer = require('Footer');

const siteConfig = require('../siteConfig.js');

const Site = React.createClass({
  render() {
    const title = this.props.title
      ? this.props.title + ' · ' + siteConfig.title
      : siteConfig.title + ' · ' + siteConfig['en'].tagline;
    const description = this.props.description || siteConfig['en'].tagline;
    const url =
      siteConfig.url + siteConfig.baseUrl + (this.props.url || 'index.html');
    return (
      <html>
        <Head description={description} title={title} url={url} />
        <body className={this.props.className}>
          <HeaderNav
            baseUrl={siteConfig.baseUrl}
            section={this.props.section}
            title={siteConfig.title}
            language={this.props.language}
          />
          <div className="navPusher">
            {this.props.children}
            <Footer language={this.props.language} />
          </div>
          <div id="fb-root" />
          <script type="text/javascript" src="https://cdn.jsdelivr.net/docsearch.js/1/docsearch.min.js"></script>
          <script dangerouslySetInnerHTML={{__html: `
            (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
            (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
            m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
            })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

            ga('create', 'UA-44373548-17', 'auto');
            ga('send', 'pageview');

            !function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)
            ){js=d.createElement(s);js.id=id;js.src="https://platform.twitter.com/widgets.js";
            fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");

            docsearch({
              apiKey: '833906d7486e4059359fa58823c4ef56',
              indexName: 'jest',
              inputSelector: '#search_input_react'
            });
          `}} />
          <script async defer src="https://buttons.github.io/buttons.js"></script>
        </body>
      </html>
    );
  },
});

module.exports = Site;
