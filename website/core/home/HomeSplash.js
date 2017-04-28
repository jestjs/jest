/**
 * @providesModule HomeSplash
 * @jsx React.DOM
 */

const React = require('React');

const siteConfig = require('../../siteConfig.js');

class HomeSplash extends React.Component {
  makePromoElements(promoEl, index) {
    return (
      <div className="promoRow" key={index}>
        {promoEl}
      </div>
    );
  }

  render() {
    return (
      <div className="homeContainer">
        <div className="homeSplashFade">
          <div className="wrapper homeWrapper">
            <div className="projectLogo">
              <img src="/jest/img/jest-outline.svg" alt="Jest" />
            </div>
            <div className="inner">
              <h2 className="projectTitle">
                {siteConfig.title}
                <small>{siteConfig.tagline}</small>
              </h2>
              <div className="section promoSection">
                {siteConfig.homepagePromos.map(this.makePromoElements, this)}
              </div>
              <div className="githubButton">{siteConfig.githubButton}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

module.exports = HomeSplash;
