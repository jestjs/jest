/**
 * @providesModule HomeSplash
 * @jsx React.DOM
 */

var React = require('React');

var siteConfig = require('../../siteConfig.js');

class HomeSplash extends React.Component {
  makePromoElements(promoEl) {
    return (
      <div className="promoRow">
        {promoEl}
      </div>
    );
  }

  render() {
    return (
      <div className="homeContainer">
        <div className="homeSplashFade">
          <div className="wrapper homeWrapper">
            <div className="inner">
              <h2 className="projectTagline">{siteConfig.tagline}</h2>
              <div className="projectIntro">{siteConfig.description}</div>
              <div className="section promoSection">
                {siteConfig.homepagePromos.map(this.makePromoElements, this)}
              </div>
            </div>
            <div className="projectLogo"><img src="/jest/img/jest-outline.svg" alt="Jest" /></div>
          </div>
        </div>
      </div>
    );
  }
};

module.exports = HomeSplash;
