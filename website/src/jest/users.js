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
var blog = require('MetadataBlog');

var index = React.createClass({
  render: function() {
    var users = [
      {
        image: 'img/logos/pinterest.png',
        content: '',
      },
      {
        image: 'img/logos/twitter.png',
        content: '',
      },
      {
        image: 'img/logos/paypal.png',
        content: '',
      },
      {
        image: 'img/logos/facebook.png',
        content: '',
      },
      {
        image: 'img/logos/oculus.png',
        content: '',
      },
      {
        image: 'img/logos/instagram.png',
        content: '',
      },
      {
        image: 'img/logos/target.png',
        content: '',
      },
      {
        image: 'img/logos/nyt.png',
        content: '',
      },
      {
        image: 'img/logos/spotify.png',
        content: '',
      },
      {
        image: 'img/logos/discord.png',
        content: '',
      },
      {
        image: 'img/logos/formidablelabs.png',
        content: '',
      },
      {
        image: 'img/logos/ibm.png',
        content: '',
      },
      {
        image: 'img/logos/klm.png',
        content: '',
      },
      {
        image: 'img/logos/xing.png',
        content: '',
      },
      {
        image: 'img/logos/automattic.png',
        content: '',
      },
      {
        image: 'img/logos/soundcloud.png',
        content: '',
      },
      {
        image: 'img/logos/ebay.png',
        content: '',
      },
      {
        image: 'img/logos/trivago.png',
        content: '',
      },
      {
        image: 'img/logos/coinbase.png',
        content: '',
      },
      {
        image: 'img/logos/intuit.png',
        content: '',
      },
      {
        image: 'img/logos/reddit.png',
        content: '',
      },
      {
        image: 'img/logos/egghead.png',
        content: '',
      },
      {
        image: 'img/logos/elastic.png',
        content: '',
      },
      {
        image: 'img/logos/quiqup.png',
        content: '',
      },
      {
        image: 'img/logos/cisco.png',
        content: '',
      },
      {
        image: 'img/logos/globo.png',
        content: '',
      },
      {
        image: 'img/logos/artsy.png',
        content: '',
      },
      {
        image: 'img/logos/intercom.png',
        content: '',
      },
      {
        image: 'img/logos/seatgeek.png',
        content: '',
      },
      {
        image: 'img/logos/wowair.png',
        content: '',
      },
    ];

    return (
      <Site>
        <div className="mainContainer">
          <Container padding={["bottom","top"]}>
            <h2>Who's Using Jest?</h2>
            <GridBlock className="responsiveList threeByGridBlock" contents={users} layout="threeColumn" />
            <p>Is your company using Jest? Edit this page with a <a href="https://github.com/facebook/jest/edit/website/src/jest/users.js">Pull Request</a> to add your logo.</p>
          </Container>
        </div>
      </Site>
    );
  }
});

module.exports = index;
