/**
 * @providesModule HomeSplash
 * @jsx React.DOM
 */

const React = require('React');

const Button = require('Button');

const siteConfig = require('../../siteConfig.js');

class HomeSplash extends React.Component {
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
                <small>{siteConfig[this.props.language].tagline}</small>
              </h2>
              <div className="section promoSection">
                <div className="promoRow">
                  <div className="pluginRowBlock">
                    <Button href="#use">
                      {siteConfig[this.props.language].promo.try}
                    </Button>
                    <Button
                      href={
                        '/jest/docs/' +
                          this.props.language +
                          '/getting-started.html'
                      }
                    >
                      {siteConfig[this.props.language].promo.get}
                    </Button>
                    <Button
                      href={
                        '/jest/docs/' +
                          this.props.language +
                          '/snapshot-testing.html'
                      }
                    >
                      {siteConfig[this.props.language].promo.learn}
                    </Button>
                  </div>
                </div>
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
