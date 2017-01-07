/**
 * @jsx React.DOM
 */

const React = require('React');
const Site = require('Site');
const Prism = require('Prism');
const Marked = require('Marked');
const unindent = require('unindent');

const Container = require('Container');
const HomeSplash = require('HomeSplash');
const GridBlock = require('GridBlock');

const siteConfig = require('../../siteConfig.js');
const gettingStartedContent = require('./docs/getting-started.js').content;
const blog = require('MetadataBlog');

const index = React.createClass({
  render: function() {
    const users = [
      {
        infoLink: 'https://code.facebook.com',
        caption: 'Facebook',
        image: 'img/logos/facebook.png',
      },
      {
        infoLink: 'https://www.oculus.com/',
        caption: 'Oculus',
        image: 'img/logos/oculus.png',
      },
      {
        infoLink: 'https://www.instagram.com/',
        caption: 'Instagram',
        image: 'img/logos/instagram.png',
      },
      {
        infoLink: 'https://www.twitter.com',
        caption: 'Twitter',
        image: 'img/logos/twitter.png',
      },
      {
        infoLink: 'https://www.pinterest.com',
        caption: 'Pinterest',
        image: 'img/logos/pinterest.png',
      },
      {
        infoLink: 'http://www.nytimes.com/',
        caption: 'The New York Times',
        image: 'img/logos/nyt.png',
      },
      {
        infoLink: 'http://www.ibm.com/',
        caption: 'IBM',
        image: 'img/logos/ibm.png',
      },
      {
        infoLink: 'http://www.ebay.com/',
        caption: 'ebay',
        image: 'img/logos/ebay.png',
      },
      {
        infoLink: 'https://www.paypal.com',
        caption: 'PayPal',
        image: 'img/logos/paypal.png',
      },
      {
        infoLink: 'https://www.spotify.com',
        caption: 'Spotify',
        image: 'img/logos/spotify.png',
      },
      {
        infoLink: 'http://www.target.com',
        caption: 'Target',
        image: 'img/logos/target.png',
      },
      {
        infoLink: 'https://www.intuit.com/',
        caption: 'Intuit',
        image: 'img/logos/intuit.png',
      },
      {
        infoLink: 'http://www.cisco.com/',
        caption: 'Cisco',
        image: 'img/logos/cisco.png',
      },
      {
        infoLink: 'https://www.artsy.net/',
        caption: 'Artsy',
        image: 'img/logos/artsy.png',
      },
      {
        infoLink: 'https://automattic.com/',
        caption: 'Automattic',
        image: 'img/logos/automattic.png',
      },
      {
        infoLink: 'https://www.coinbase.com/',
        caption: 'Coinbase',
        image: 'img/logos/coinbase.png',
      },
      {
        infoLink: 'https://discordapp.com/',
        caption: 'Discord',
        image: 'img/logos/discord.png',
      },
      {
        infoLink: 'https://egghead.io/',
        caption: 'Egghead',
        image: 'img/logos/egghead.png',
      },
      {
        infoLink: 'https://www.elastic.co/',
        caption: 'Elastic',
        image: 'img/logos/elastic.png',
      },
      {
        infoLink: 'http://formidable.com/',
        caption: 'Formidable',
        image: 'img/logos/formidablelabs.png',
      },
      {
        infoLink: 'http://www.globo.com/',
        caption: 'Globo',
        image: 'img/logos/globo.png',
      },
      {
        infoLink: 'https://www.intercom.com/',
        caption: 'Intercom',
        image: 'img/logos/intercom.png',
      },
      {
        infoLink: 'https://www.klm.com/',
        caption: 'KLM Royal Dutch Airlines',
        image: 'img/logos/klm.png',
      },
      {
        infoLink: 'https://www.quiqup.com/',
        caption: 'Quiqup',
        image: 'img/logos/quiqup.png',
      },
      {
        infoLink: 'https://www.reddit.com/',
        caption: 'Reddit',
        image: 'img/logos/reddit.png',
      },
      {
        infoLink: 'https://seatgeek.com/',
        caption: 'SeatGeek',
        image: 'img/logos/seatgeek.png',
      },
      {
        infoLink: 'https://soundcloud.com/',
        caption: 'SoundCloud',
        image: 'img/logos/soundcloud.png',
      },
      {
        infoLink: 'http://www.trivago.com/',
        caption: 'Trivago',
        image: 'img/logos/trivago.png',
      },
      {
        infoLink: 'https://www.xing.com/',
        caption: 'Xing',
        image: 'img/logos/xing.png',
      },
      {
        infoLink: 'https://wowair.com/',
        caption: 'WOW air',
        image: 'img/logos/wowair.png',
      },
    ];

    const showcase = users.map((user) => {
      return <a href={user.infoLink}><img src={user.image} title={user.caption}/></a>;
    });

    return (
      <Site>
        <div className="mainContainer">
          <Container padding={["bottom","top"]}>
            <div className="showcaseSection">
              <div className="prose">
                <h1>Who's Using Jest?</h1>
                <p>Jest is used by teams of all sizes to test websites, mobile apps, and APIs.</p>
                <p>Is your company using Jest?<br/>Edit this page with a <a href="https://github.com/facebook/jest/edit/website/src/jest/users.js">Pull Request</a> to add your logo.</p>
              </div>
              <div className="logos">
                {showcase}
              </div>
            </div>
          </Container>
        </div>
      </Site>
    );
  }
});

module.exports = index;
